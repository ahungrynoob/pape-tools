
    import { configure, addDecorator } from '@storybook/react';
    import { withConsole } from '@storybook/addon-console';
    import { addReadme } from 'storybook-readme';

    addDecorator(addReadme);
    addDecorator((storyFn, context) => withConsole()(storyFn)(context));
    // automatically import all files ending in *.stories.js
    const req = require.context(
        '/Users/xudading/work/opensource/pape-tools-playground/storybook',
        true,
        /.stories.js$/
    );
    function loadStories() {
        req.keys().forEach(filename => req(filename));
    }

    configure(loadStories, module);
    