#!/usr/bin/env node
const program = require("commander");
require("colorful").colorful();
program.on("--help", () => {
  console.log("  Usage:".to.bold.blue.color);
  console.log();
  console.log(
    "    $",
    "pape-tools run lint".to.magenta.color,
    "lint source within lib"
  );
  console.log(
    "    $",
    "pape-tools run pub".to.magenta.color,
    "publish component"
  );
  // todo
  //   console.log(
  //     "    $",
  //     "pape-tools run server".to.magenta.color,
  //     "start server"
  //   );
  console.log(
    "    $",
    "pape-tools run pretter".to.magenta.color,
    "pretter all code"
  );
  // todo
  //   console.log(
  //     "    $",
  //     "pape-tools run init-eslint".to.magenta.color,
  //     "generate eslint configuration file"
  //   );
  //   console.log(
  //     "    $",
  //     "pape-tools run init-tslint".to.magenta.color,
  //     "generate tslint configuration file"
  //   );
  //   console.log(
  //     "    $",
  //     "pape-tools run chrome-test".to.magenta.color,
  //     "run chrome tests"
  //   );
  console.log();
});

program.parse(process.argv);

function runTask(toRun) {
  const gulp = require("gulp");
  const metadata = { task: toRun };
  // Gulp >= 4.0.0 (doesn't support events)
  const taskInstance = gulp.task(toRun);
  if (taskInstance === undefined) {
    gulp.emit("task_not_found", metadata);
    return;
  }
  const start = process.hrtime();
  gulp.emit("task-start", metadata);
  try {
    taskInstance.apply(gulp);
    metadata.hrDuration = process.hrtime(start);
    gulp.emit("task_stop", metadata);
    gulp.emit("stop");
  } catch (err) {
    err.hrDuration = process.hrtime(start);
    err.task = metadata.task;
    gulp.emit("task_err", err);
  }
}

const task = program.args[0];

if (!task) {
  program.help();
} else {
  console.log("pape-tools run", task);
  require("../gulpfile");
  runTask(task);
}
