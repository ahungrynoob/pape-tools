'use strict';

const gulp = require('gulp');
const shelljs = require('shelljs');
const fs = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const path = require('path');
const webpack = require('webpack');
const jsx2example = require('gulp-jsx2example');
const ghPages = require('gh-pages');
const babel = require('gulp-babel');
const minify = require('gulp-babel-minify');
const through2 = require('through2');
const glob = require('glob');
const ts = require('gulp-typescript');
const merge2 = require('merge2');
const prettier = require('gulp-prettier');
const tsConfig = require('./getTSCommonConfig')();
const replaceLib = require('./replaceLib');
const getBabelCommonConfig = require('./getBabelCommonConfig');
const getWebpackConfig = require('./getWebpackConfig');
const { getNpmArgs, runCmd } = require('./util');
const resolveCwd = require('./resolveCwd');

const src = argv.src || 'src';
const pkg = require(resolveCwd('package.json'));
const tsDefaultReporter = ts.reporter.defaultReporter();
// misc
function printResult(stats) {
  if (stats.toJson) {
    stats = stats.toJson();
  }

  (stats.errors || []).forEach(err => {
    console.error('error', err);
  });

  stats.assets.forEach(item => {
    const size = `${(item.size / 1024.0).toFixed(2)}KB`;
    console.log('generated', item.name, size);
  });
}

function cleanCompile() {
  try {
    if (fs.existsSync(resolveCwd('lib'))) {
      shelljs.rm('-rf', resolveCwd('lib'));
    }
    if (fs.existsSync(resolveCwd('es'))) {
      shelljs.rm('-rf', resolveCwd('es'));
    }
    if (fs.existsSync(resolveCwd('assets'))) {
      shelljs.rm('-rf', resolveCwd('assets/*.css'));
    }
  } catch (err) {
    console.log('Clean up failed:', err);
    throw err;
  }
}

function cleanBuild() {
  if (fs.existsSync(resolveCwd('build'))) {
    shelljs.rm('-rf', resolveCwd('build'));
  }
}

function clean() {
  cleanCompile();
  cleanBuild();
}

gulp.task(
  'clean',
  gulp.series(done => {
    clean();
    done();
  })
);

gulp.task(
  'cleanCompile',
  gulp.series(done => {
    cleanCompile();
    done();
  })
);

gulp.task(
  'cleanBuild',
  gulp.series(done => {
    cleanBuild();
    done();
  })
);

gulp.task(
  'check-deps',
  gulp.series(done => {
    if (argv['check-deps'] !== false) {
      require('./checkDep')(done);
    }
  })
);

function reportError() {
  console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
  console.log(chalk.bgRed('!! `npm publish` is forbidden for this package. !!'));
  console.log(chalk.bgRed('!! Use `pape-tools run pub` instead.        !!'));
  console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
}

gulp.task(
  'guard',
  gulp.series(done => {
    const npmArgs = getNpmArgs();
    if (npmArgs) {
      for (let arg = npmArgs.shift(); arg; arg = npmArgs.shift()) {
        if (/^pu(b(l(i(sh?)?)?)?)?$/.test(arg) && npmArgs.indexOf('--with-pape-tools') < 0) {
          reportError();
          done(1);
          return;
        }
      }
    }
    done();
  })
);

// test
gulp.task('test', done => {
  let jestPath = require.resolve('jest');
  const cliRegex = /\/build\/jest\.js$/;
  if (!cliRegex.test(jestPath)) {
    console.log(chalk.red('Jest cli not found! Please reinstall or fire a issue for this'));
    done(1);
    return done(1);
  }

  jestPath = jestPath.replace(cliRegex, '/bin/jest.js');

  // Support args;
  const additionalArgs = process.argv.slice(3);
  const mergedArgs = [
    'npx',
    jestPath,
    '--config',
    path.join(__dirname, './tests/ts-jest.config.js'),
    '--colors',
  ]
    .concat(additionalArgs)
    .join(' ');
  if (argv.verbose) {
    console.log(chalk.yellow('Execute test: '), mergedArgs);
  }

  const ret = shelljs.exec(mergedArgs);
  if (ret.code) {
    process.exit(ret.code);
  }
  done(ret.code);
});

// build web
gulp.task(
  'webpack',
  gulp.series('cleanBuild', done => {
    try {
      if (fs.existsSync(resolveCwd('./examples/'))) {
        webpack(getWebpackConfig({ common: true }), (err, stats) => {
          if (err) {
            console.error('error', err);
          }
          printResult(stats);
          done(err);
        });
      } else {
        done();
      }
    } catch (error) {
      console.error('error', error);
      done(error);
    }
  })
);

gulp.task(
  'build',
  gulp.series('webpack', done => {
    if (fs.existsSync(resolveCwd('./examples/'))) {
      const dir = resolveCwd('./examples/');
      let files = fs.readdirSync(dir);
      files = files.filter(f => f[0] !== '~').map(f => path.join(dir, f));
      const filesMap = {};
      files.forEach(f => {filesMap[f] = 1});
      files.forEach(f => {
        if (f.match(/\.tsx?$/)) {
          let js = f.replace(/\.tsx?$/, '.js');
          if (filesMap[js]) {
            delete filesMap[js];
          }
          js = f.replace(/\.tsx?$/, '.jsx');
          if (filesMap[js]) {
            delete filesMap[js];
          }
        }
      });
      gulp
        .src(Object.keys(filesMap))
        .pipe(
          jsx2example({
            dest: 'build/examples',
          })
        )
        .pipe(gulp.dest('build/examples/'))
        .on('finish', done);
      return;
    }
    done();
  })
);

gulp.task(
  'gh-pages',
  gulp.series('build', done => {
    console.log('gh-paging');
    if (pkg.scripts['pre-gh-pages']) {
      shelljs.exec('npm run pre-gh-pages');
    }
    if (fs.existsSync(resolveCwd('./examples'))) {
      ghPages.publish(
        resolveCwd('build'),
        {
          depth: 1,
          logger(message) {
            console.log(message);
          },
        },
        () => {
          cleanBuild();
          console.log('gh-paged');
          done();
        }
      );
    } else {
      done();
    }
  })
);

// package
gulp.task('css', () => {
  const less = require('gulp-less');
  const postcss = require('gulp-postcss');
  return gulp
    .src('assets/*.less')
    .pipe(less())
    .pipe(postcss([require('./getAutoprefixer')()]))
    .pipe(gulp.dest('assets'));
});

function babelifyInternal(js, modules) {
  function replacer(_, m1, m2) {
    return `${m1}/assets/${m2}.css`;
  }
  const lessPath = new RegExp(`(["']${pkg.name})/assets/([^.'"]+).less`, 'g');
  const babelConfig = getBabelCommonConfig(modules);
  if (modules === false) {
    babelConfig.plugins.push(replaceLib);
  }
  let stream = js.pipe(babel(babelConfig));
  if (argv.compress) {
    stream = stream.pipe(minify());
  }
  return stream
    .pipe(
      through2.obj(function(file, encoding, next) {
        const contents = file.contents.toString(encoding).replace(lessPath, replacer);
        file.contents = Buffer.from(contents);
        this.push(file);
        next();
      })
    )
    .pipe(gulp.dest(modules !== false ? 'lib' : 'es'));
}

function babelify(modules) {
  const streams = [];
  const assets = gulp
    .src([`${src}/**/*.@(png|svg|less|.d.ts)`])
    .pipe(gulp.dest(modules === false ? 'es' : 'lib'));
  if (glob.sync('src/**/*.{ts,tsx}').length && !glob.sync('src/**/*.d.ts').length) {
    let error = 0;
    let reporter = tsDefaultReporter;
    if (argv['single-run']) {
      reporter = {
        error(e) {
          tsDefaultReporter.error(e);
          error = e;
        },
        finish: tsDefaultReporter.finish,
      };
    }

    const tsResult = gulp
      .src([`${src}/**/*.ts`, `${src}/**/*.tsx`, 'typings/**/*.d.ts'])
      .pipe(ts(tsConfig, reporter));

    const check = () => {
      if (error) {
        console.error('compile error', error);
        process.exit(1);
      }
    };
    tsResult.on('finish', check);
    tsResult.on('end', check);

    streams.push(tsResult.dts.pipe(gulp.dest(modules === false ? 'es' : 'lib')));
    streams.push(babelifyInternal(tsResult.js, modules));
  } else {
    streams.push(babelifyInternal(gulp.src([`${src}/**/*.js`, `${src}/**/*.jsx`]), modules));
  }
  return merge2(streams.concat([assets]));
}

gulp.task('js', () => {
  console.log('[Parallel] compile js...');
  return babelify();
});

gulp.task('es', () => {
  console.log('[Parallel] compile es...');
  return babelify(false);
});

gulp.task('compile', gulp.series('cleanCompile', gulp.parallel('js', 'es', 'css')));

// Code Style
gulp.task(
  'genPrettierrc',
  gulp.series(done => {
    const dir = resolveCwd('./');
    const prettierrc = path.join(__dirname, '../config/.prettierrc');
    const prettierrcContent = fs.readFileSync(prettierrc);
    fs.writeFileSync(path.join(dir, './.prettierrc'), prettierrcContent);
    done();
  })
);

gulp.task(
  'genEslint',
  gulp.series(done => {
    const dir = resolveCwd('./');
    const eslintConfig = path.join(__dirname, '../config/eslintrc.js');
    const eslintContent = fs.readFileSync(eslintConfig);
    fs.writeFileSync(path.join(dir, './.eslintrc.js'), eslintContent);
    done();
  })
);

gulp.task('genTslint', done => {
  const dir = resolveCwd('./');
  const tslintConfig = path.join(__dirname, '../config/tslint.json');
  const tslintContent = fs.readFileSync(tslintConfig);
  fs.writeFileSync(path.join(dir, './tslint.json'), tslintContent);

  const tsConfigPath = path.join(__dirname, '../config/tsconfig.json');
  const tsContent = fs.readFileSync(tsConfigPath);
  fs.writeFileSync(path.join(dir, './tsconfig.json'), tsContent);
  done();
});

gulp.task(
  'prettier',
  gulp.series(() => {
    let fileList = (argv._ || []).slice(1);
    if (!fileList.length) {
      fileList = [
        './src/**/*.{js,jsx}',
        './tests/**/*.{js,jsx}',
        './code/**/*.{js,jsx}',
        './storybook/**/*.{js,jsx}',
        './examples/**/*.{js,jsx}',
      ];
    } else {
      console.log(chalk.blue(`Prettier:\n${fileList.join('\n')}`));
    }

    const prettierrc = path.join(__dirname, '../config/.prettierrc');
    const prettierrcContent = fs.readFileSync(prettierrc, 'utf8');
    return gulp
      .src(fileList)
      .pipe(
        prettier(JSON.parse(prettierrcContent), {
          reporter: 'error',
        })
      )
      .pipe(gulp.dest(file => file.base));
  })
);

gulp.task('gen-lint-config', gulp.series('genPrettierrc', 'genEslint', 'genTslint'));

gulp.task(
  'js-lint',
  gulp.series('check-deps', done => {
    const fileList = (argv._ || []).slice(1);
    if (argv['js-lint'] === false) {
      return done();
    }
    const eslintBin = require.resolve('eslint/bin/eslint');
    let eslintConfig = path.join(__dirname, '../config/eslintrc.js');
    const projectEslint = resolveCwd('./.eslintrc');
    if (fs.existsSync(projectEslint)) {
      eslintConfig = projectEslint;
    }
    let args = [eslintBin, '-c', eslintConfig];
    if (fileList.length) {
      const regex = /\.jsx?$/i;
      const jsFiles = fileList.filter(file => regex.test(file));
      if (!jsFiles.length) {
        done();
        return;
      }
      args = args.concat(jsFiles);
    } else {
      args = args.concat(['--ext', '.js,.jsx']);

      // eslint v5 will exit when not file find. We have to check first
      [src, 'tests', 'examples'].forEach(testPath => {
        if (glob.sync(`${testPath}/**/*.{js,jsx}`).length) {
          args.push(testPath);
        }
      });
    }
    if (argv.fix) {
      args.push('--fix');
    }
    runCmd('node', args, done);
  })
);

gulp.task(
  'ts-lint',
  gulp.series('check-deps', done => {
    const fileList = (argv._ || []).slice(1);
    const tslintBin = require.resolve('tslint/bin/tslint');
    let tslintConfig = path.join(__dirname, '../config/tslint.json');
    const projectTslint = resolveCwd('./tslint.json');
    if (fs.existsSync(projectTslint)) {
      tslintConfig = projectTslint;
    }
    let args = [tslintBin, '-c', tslintConfig];
    if (fileList.length) {
      const regex = /\.tsx?$/i;
      const tsFileList = fileList.filter(file => regex.test(file));
      if (!tsFileList.length) {
        done();
        return;
      }
      args = args.concat(tsFileList);
    } else {
      args = args.concat([
        `${src}/**/*{.ts,.tsx}`,
        'tests/**/*{.ts,.tsx}',
        'examples/**/*{.ts,.tsx}',
      ]);
    }

    runCmd('node', args, done);
  })
);

gulp.task('lint', gulp.series('ts-lint', 'js-lint'));

// npm publish
gulp.task(
  'publish',
  gulp.series('compile', done => {
    if (!fs.existsSync(resolveCwd('lib')) || !fs.existsSync(resolveCwd('es'))) {
      return done('missing lib/es dir');
    }
    console.log('publishing');
    const npm = 'npm';
    const beta = !pkg.version.match(/^\d+\.\d+\.\d+$/);
    let args = [npm, 'publish', '--with-pape-tools'];
    if (beta) {
      args = args.concat(['--tag', 'beta']);
    } else if (argv.tag) {
      args = args.concat(['--tag', argv.tag]);
    }
    if (pkg.scripts['pre-publish']) {
      shelljs.exec(`npm run pre-publish`);
    }
    let ret = shelljs.exec(args.join(' ')).code;
    cleanCompile();
    console.log('published');
    if (!ret) {
      ret = undefined;
    }
    done(ret);
  })
);

gulp.task(
  'compile_watch',
  gulp.series('compile', done => {
    console.log('files changed');
    const outDir = argv['out-dir'];
    if (outDir) {
      fs.copySync(resolveCwd('lib'), path.join(outDir, 'lib'));
      fs.copySync(resolveCwd('es'), path.join(outDir, 'es'));
      if (fs.existsSync(resolveCwd('assets'))) {
        fs.copySync(resolveCwd('assets'), path.join(outDir, 'assets'));
      }
    }
    done();
  })
);

gulp.task('pre-commit', gulp.series('prettier', 'lint'));

gulp.task(
  'pub',
  gulp.series('publish', 'gh-pages', done => {
    console.log('tagging');
    const { version } = pkg;
    shelljs.cd(process.cwd());
    shelljs.exec(`git tag ${version}`);
    shelljs.exec(`git push origin ${version}:${version}`);
    shelljs.exec('git push origin master:master');
    console.log('tagged');
    done();
  })
);

// about storybook in dev mode
