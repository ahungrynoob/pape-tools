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

It will run uni tests you created in cwd.

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
