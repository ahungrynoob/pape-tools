const fs = require('fs-extra');
const path = require('path');

module.exports = (dir, { name }) => {
  const configJS = `
    import { configure, addDecorator } from '@storybook/react';
    import { withConsole } from '@storybook/addon-console';
    import { addReadme } from 'storybook-readme';

    addDecorator(addReadme);
    addDecorator((storyFn, context) => withConsole()(storyFn)(context));
    // automatically import all files ending in *.stories.js
    const req = require.context(
        '${dir}',
        true,
        /.stories.js$/
    );
    function loadStories() {
        req.keys().forEach(filename => req(filename));
    }

    configure(loadStories, module);
    `;

  const manageHeaderHtml = `
    <script>
      document.title = '${name.toUpperCase()}';
    </script>
  `;
  fs.writeFileSync(path.join(__dirname, './storybook/config.js'), configJS);
  fs.writeFileSync(path.join(__dirname, './storybook/manager-head.html'), manageHeaderHtml);
};
