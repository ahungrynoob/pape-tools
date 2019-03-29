# pape-tools

cli tools for react component developer based on storybook.

## Usage

```
// some misc
$ pape-tools run cleanCompile: it will remove 'es','lib','assets' dirs in cwd;
$ pape-tools run cleanBuild: it will remove 'build' dir in cwd;
$ pape-tools run clean: it will execute `pape-tools run cleanCompile` and `pape-tools run cleanCompile` in series;
$ pape-tools run check-deps: it will check dependencies in your source code under `${cwd}/src` dir with pkg.json;
$ pape-tools run guard: it will restrain developers from using cutom-defined npm publish, they should use `pape-tools run pub`;
```
