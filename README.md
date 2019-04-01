# pape-tools

cli tools for react component developer based on storybook.

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/pape-tools.svg?style=flat-square
[npm-url]: http://npmjs.org/package/pape-tools
[download-image]: https://img.shields.io/npm/dm/pape-tools.svg?style=flat-square
[download-url]: https://npmjs.org/package/pape-tools

## Install

`npm install pape-tools --save-dev`
`yarn add -D pape-tools`

## Usage

```
$ pape-tools run ${cli}
```

## Cli Api

### cleanCompile

It will remove `es`,`lib`,`assets` dirs in cwd.

### cleanBuild

It will remove `build` dir in cwd.

### clean

It will execute `pape-tools run cleanCompile` and `pape-tools run cleanCompile` in series.

### check-deps

It will check dependencies in your source code under `${cwd}/src` dir with pkg.json.

### guard

It will restrain developers from using cutom-defined npm publish, they should use `pape-tools run pub`.
<br />
Tip: You'd better set `"prepublish": "pape-tools run guard"` in pkg.json's `scripts`.

### test

It will run uni tests you created in cwd.(using jest)

### webpack

It will webpackify the files under `examples` dir into `build` dir in cwd.
<br/>**If you want to make a entry for `examples/sample.js`, you should create an empty `examples/sample.html` file.**

### build

It will generate the examples html file that you could push to your gh-pages branch to show.

### gh-pages

It will push the examples files under `build` dir to your gh-pages branch.

### css

It will transform `assets/*.less` into `assets/*.css`;

### js

It will babelify `src/**/*.{ts,tsx,js,jsx}` into `lib` dir as commonjs module.

### es

It will babelify `src/**/*.{ts,tsx,js,jsx}` into `es` dir as es module.

### compile

It will execute `pape-tools run css`, `pape-tools run js` and `pape-tools run es` in parallel.

### genPrettierrc

It will generate `.prettierrc` in cwd;

### genEslint

It will generate `.eslintrc.js` in cwd;

### genTslint

It will generate `tslint.json` and `tsconfig.json` in cwd;

### gen-lint-config

It will execute `genPrettierrc`, `genEslint` and `genTslint` in parallel.

### prettier

It will prettier `.js` and `.jsx` code style in `src`,`tests`,`code`,`storybook`,`examples` dirs;.

### js-lint

It will check dependencies first, then eslint your `.jsx` and `.js` code under `src`, `examples` and `tests` dirs.
<br /> **You can custom your own lint config by creating .eslintc.js in cwd.**

### ts-lint

It will check dependencies first, then tslint your `.tsx` and `.ts` code under `src`, `examples` and `tests` dirs.
<br /> **You can custom your own lint config by creating tslint.json in cwd.**

### lint

It will execute `pape-tools run ts-lint` and `pape-tools run js-lint` in series.

### pre-commit

It will execute `pape-tools run prettier` and `pape-tools run lint` in series.

### pub

It will excute `pape-tools run publish`, `pape-tools run gh-pages` and tag the version in pkg.json to git.

### storybook

Run Storybook in a dev mode.(You can use this cli to dev your react component)

### storybook-build

Build static version of Storybook.

## Best Practice

### project structure：

```bash
. helloweb
├── package.json
├── index.js (entry file for webpack, if not exists will look for src/index.js)
├── assets (put less or css file here)
├── examples (put example code here, there is demo code below.)
├── src (your source code)
├── typings (.d.ts file)
├── storybook (the config file for storybook, ending with .stories.js)
└── tests (jest uni test)
```

### scripts in pkg.json and some other config

--babel-runtime added on demand

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

### examples/Sample.tsx demo

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
