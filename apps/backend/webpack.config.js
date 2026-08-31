const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  target: 'node',
  output: {
    path: join(__dirname, '../../dist/apps/backend'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './apps/backend/src/main.ts',
      tsConfig: './apps/backend/tsconfig.app.json',
      outputHashing: 'none',
      generatePackageJson: true,
      transformers: [
        {
          name: '@nestjs/swagger/plugin',
          options: {
            dtoFileNameSuffix: ['.dto.ts', '.entity.ts'],
            introspectComments: true,
          },
        },
      ],
    }),
  ],
  externalsPresets: {
    node: true,
  },
};
