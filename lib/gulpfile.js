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
const ghPages = require('gh-pages');

const pkg = require(resolveCwd('package.json'));
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
