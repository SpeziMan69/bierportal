const { workspaceRoot } = require('@nx/devkit');
const { join } = require('node:path');

module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  transform: {
    '^.+\.(ts|js|html)$': 'ts-jest',
  },
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@bierportal/dtos$': join(workspaceRoot, 'apps/shared/dtos/src/index.ts'),
  },
  coverageReporters: ['html'],
  passWithNoTests: true,
};
