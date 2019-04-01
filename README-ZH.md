# pape-tools

用于 react 组件的开发的命令行工具（基于 storybook）

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/pape-tools.svg?style=flat-square
[npm-url]: http://npmjs.org/package/pape-tools
[download-image]: https://img.shields.io/npm/dm/pape-tools.svg?style=flat-square
[download-url]: https://npmjs.org/package/pape-tools

## 用法

```
$ pape-tools run ${cli}
```

## Cli Api

### cleanCompile

将会删除工程目录下的`es`,`lib`,`assets`等目录。

### cleanBuild

将会删除工程目录下的`build`目录。

### clean

将会以顺序模式执行`pape-tools run cleanCompile`和`pape-tools run cleanCompile`;

### check-deps

将会根据`package.json`检查`${cwd}/src`目录下的源代码所使用的依赖。

### guard

将会阻止开发者使用自定义的`npm publish`，你应该使用`pape-tools run pub`。
<br />
提示：你最好在`package.json`中设置`"prepublish": "pape-tools run guard"`。

### test

将会执行工程目录下的单元测试用例（基于 jest）。

### webpack

将会使用`webpack`打包`${cwd}/examples`目录到`${cwd}/build`目录中。
<br/>如果你想使用`examples/sample.js`作为入口，你应该创建`examples/sample.html`这样一个空文件。

### build

将会在`${cwd}/build`生成 examples 的 html 文件，你可以将他们 push 到`gh-pages`分支上进行展示。

### gh-pages

将会`${cwd}/build`目录下的 examples 的文件至`gh-pages`分支。

### css

将会把`${cwd}/assets/*.less`文件转换成相应的 css 文件。

### js

将会使用 babel 工具，把`src/**/*.{ts,tsx,js,jsx}`这些文件以`commonJS`规范转译到`${cwd}/lib`目录中去。

### es

将会使用 babel 工具，把`src/**/*.{ts,tsx,js,jsx}`这些文件以`es`规范转译到`${cwd}/es`目录中去。

### compile

将会并行执行`pape-tools run css`，`pape-tools run js`，`pape-tools run es`。

### genPrettierrc

将会在 cwd 中生成`.prettierrc`文件。

### genEslint

将会在 cwd 中生成`.eslintrc.js`文件。

### genTslint

将会在 cwd 中生成`tslint.json` 和 `tsconfig.json`文件。

### gen-lint-config

将会并行执行`genPrettierrc`, `genEslint` 和 `genTslint`。

### prettier

将会美化`src`,`tests`,`code`,`storybook`,`examples`目录下的`.js`,`.jsx`的代码风格。

### js-lint

将会先检查依赖，然后 eslint`src`, `examples`,`tests`目录下的`.jsx`,`.js`文件。
<br />你可以在 cwd 中创建`.eslintc.js`来自定义你的 eslint 配置。

### ts-lint

将会先检查依赖，然后 tslint`src`, `examples`,`tests`目录下的`.tsx`,`.ts`文件。
<br />你可以在 cwd 中创建`tslint.json`来自定义你的 tslint 配置。

### lint

将会顺序执行`pape-tools run ts-lint` 和 `pape-tools run js-lint`。

### pre-commit

将会顺序执行`pape-tools run prettier` 和 `pape-tools run lint`。

### pub

将会顺序执行 `pape-tools run publish`, `pape-tools run gh-pages` 并根据`package.json`中的 version 打上 git 标签。

### storybook

开发模式下执行 storybook，可以在 storybook 模式中调试 React Component。

### storybook-build

生成 storybook 的静态文件。

## 最佳实践

### 目录规范：

```bash
. helloweb
├── package.json
├── index.js (React Component的入口文件，如果不存在，则会查找src/index.js)
├── assets (在这里放置css或者less文件)
├── examples (这里放置案例代码，案例代码样本见下方)
├── src (组件源码)
├── typings (.d.ts文件)
├── storybook (storybook的加载文件以.stories.js结尾)
└── tests (jest单元测试代码)
```

### pkg.json 中的 scripts 等配置

--babel-runtime 参数根据需求添加

```json
{
  "scripts": {
    "build": "pape-tools run storybook-build",
    "compile": "pape-tools run compile --babel-runtime",
    "start": "pape-tools run storybook",
    "pub": "pape-tools run pub --babel-runtime",
    "lint": "pape-tools run lint",
    "lint:fix": "pape-tools run lint --fix",
    "prettier": "pape-tools run prettier",
    "test": "pape-tools run test",
    "prepublish": "pape-tools run guard",
    "init-tslint": "pape-tools run gen-lint-config",
    "coverage": "pape-tools run test --coverage",
    "pre-commit": "pape-tools run pre-commit",
    "lint-staged": "lint-staged"
  },
  "devDependencies": {
    "pre-commit": "1.x"
  },
  "pre-commit": ["lint-staged"],
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["npm run pre-commit", "git add"]
  }
}
```

### examples/Sample.tsx 代码示范

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import Sample from '../src/index';
import './Sample.less';

interface SampleWrapperProps {}

const SampleWrapper: React.FunctionComponent<SampleWrapperProps> = props => {
  return <Sample />;
};

// You need to add this line, and create an empty `Sample.html` for this example.
ReactDOM.render(<SampleWrapper />, document.getElementById('__react-content'));
```
