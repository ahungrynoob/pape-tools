const path = require('path');
const chalk = require('chalk');
const { createTransformer: babelTransformer } = require('babel-jest');
const { createTransformer: tsTransformer } = require('ts-jest');
const getBabelCommonConfig = require('../lib/getBabelCommonConfig');

const tsJest = tsTransformer({
  tsConfig: path.join(__dirname, '../lib/tests/tsconfig.test.json'),
});
const babelJest = babelTransformer(getBabelCommonConfig());

module.exports = {
  process(src, filePath) {
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
    const isJavaScript = filePath.endsWith('.js') || filePath.endsWith('.jsx');
    if (isTypeScript) {
      src = tsJest.process(src, filePath, { moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'] });
    } else if (isJavaScript) {
      src = babelJest.process(src, filePath, { moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'] });
    } else {
      console.log(chalk.red('File not match type:'), filePath);
      throw new Error(`File not match type:${filePath}`);
    }
    return src;
  },
};
