'use strict';

const gulp = require('gulp');
const shelljs = require('shelljs');
const fs = require('fs-extra');
const resolveCwd = require('./resolveCwd');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const { getNpmArgs } = require('./util');
const path = require('path');
const webpack = require('webpack');
const jsx2example = require('gulp-jsx2example');
const getWebpackConfig = require('./getWebpackConfig');
const getBabelCommonConfig = require('./getBabelCommonConfig');
const replaceLib = require('./replaceLib');
const ghPages = require('gh-pages');
const babel = require('gulp-babel');
const minify = require('gulp-babel-minify');
const through2 = require('through2');
const glob = require('glob');
const ts = require('gulp-typescript');
const merge2 = require('merge2');
const tsConfig = require('./getTSCommonConfig')();

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
    if (argv['check-deps']) {
      require('./checkDep')(done);
    }
  })
);

function reportError() {
  console.log(chalk.bgRed('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'));
  console.log(chalk.bgRed('!! `npm publish` is forbidden for this package. !!'));
  console.log(chalk.bgRed('!! Use `npm run pub` instead.        !!'));
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

  if (cliRegex.test(jestPath)) {
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
      files.forEach(f => (filesMap[f] = 1));
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
      through2.obj((file, encoding, next) => {
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
