"use strict";

const gulp = require("gulp");
const shelljs = require("shelljs");
const fs = require("fs-extra");
const resolveCwd = require("./resolveCwd");
const argv = require("minimist")(process.argv.slice(2));

// misc
function cleanCompile() {
  try {
    if (fs.existsSync(resolveCwd("lib"))) {
      shelljs.rm("-rf", resolveCwd("lib"));
    }
    if (fs.existsSync(resolveCwd("es"))) {
      shelljs.rm("-rf", resolveCwd("es"));
    }
    if (fs.existsSync(resolveCwd("assets"))) {
      shelljs.rm("-rf", resolveCwd("assets/*.css"));
    }
  } catch (err) {
    console.log("Clean up failed:", err);
    throw err;
  }
}

function cleanBuild() {
  if (fs.existsSync(resolveCwd("build"))) {
    shelljs.rm("-rf", resolveCwd("build"));
  }
}

function clean() {
  cleanCompile();
  cleanBuild();
}

gulp.task(
  "clean",
  gulp.series(done => {
    clean();
    done();
  })
);

gulp.task(
  "cleanCompile",
  gulp.series(done => {
    cleanCompile();
    done();
  })
);

gulp.task(
  "cleanBuild",
  gulp.series(done => {
    cleanBuild();
    done();
  })
);

gulp.task(
  "check-deps",
  gulp.series(done => {
    if (argv["check-deps"]) {
      require("./checkDep")(done);
    }
  })
);

function reportError() {
  console.log(
    chalk.bgRed("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  );
  console.log(
    chalk.bgRed("!! `npm publish` is forbidden for this package. !!")
  );
  console.log(chalk.bgRed("!! Use `npm run pub` instead.        !!"));
  console.log(
    chalk.bgRed("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
  );
}

gulp.task(
  "guard",
  gulp.series(done => {
    const npmArgs = getNpmArgs();
    if (npmArgs) {
      for (let arg = npmArgs.shift(); arg; arg = npmArgs.shift()) {
        if (
          /^pu(b(l(i(sh?)?)?)?)?$/.test(arg) &&
          npmArgs.indexOf("--with-pape-tools") < 0
        ) {
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
