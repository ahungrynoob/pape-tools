# pape-tools

cli tools for react component developer based on storybook.

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
