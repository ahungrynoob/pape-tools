# pape-tools

cli tools for react component developer based on storybook.

## Usage

```
$ pape-tools run ${cli}
```

## Cli Api

### cleanCompile

It will remove 'es','lib','assets' dirs in cwd.

### cleanBuild

It will remove 'build' dir in cwd.

### clean

It will execute `pape-tools run cleanCompile` and `pape-tools run cleanCompile` in series.

### check-deps

It will check dependencies in your source code under `${cwd}/src` dir with pkg.json.

### guard

It will restrain developers from using cutom-defined npm publish, they should use `pape-tools run pub`.
<br />
Tip: You'd better set `"prepublish": "pape-tools run guard"` in pkg.json's `scripts`;
