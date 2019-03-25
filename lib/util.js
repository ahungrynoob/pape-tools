"use strict";

function getNpmArgs() {
  let npmArgv = null;

  try {
    npmArgv = JSON.parse(process.env.npm_config_argv);
  } catch (e) {
    return null;
  }

  if (
    typeof npmArgv !== "object" ||
    !npmArgv.cooked ||
    !Array.isArray(npmArgv.cooked)
  ) {
    return null;
  }

  return npmArgv.cooked;
}

module.exports = {
  getNpmArgs
};
