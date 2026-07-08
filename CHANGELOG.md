# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-07-08

### Features

- add script to update bundled frontend from latest release ([2f1c009](https://github.com/versatiles-org/node-versatiles/commit/2f1c0092b1df4ef5c1f86e1ffaeef19e867b7202))
- support multiple sources as named layers and update client-side layer selection ([245397e](https://github.com/versatiles-org/node-versatiles/commit/245397effc2e894333d4ff85d4f2faa7e4971434))
- add dev script for local development with specified output layers ([cf99345](https://github.com/versatiles-org/node-versatiles/commit/cf99345af46a3daabcad5fd700988d7140eaae05))

### Bug Fixes

- remove *.js.map files from static frontend ([3312d20](https://github.com/versatiles-org/node-versatiles/commit/3312d207276bf733a36e3b42056fe0c2f4a6ce41))

### Tests

- update tile function test to check for non-existent tiles with correct coordinates ([2fd4aee](https://github.com/versatiles-org/node-versatiles/commit/2fd4aee98ecee69660f8c9e948c181f924ab52d2))

### Build System

- **deps:** bump the npm group with 10 updates ([efc55bf](https://github.com/versatiles-org/node-versatiles/commit/efc55bfe635b60f5fd9315a5e978594d3d619e7e))
- **deps:** bump the npm group with 9 updates ([c05fbc1](https://github.com/versatiles-org/node-versatiles/commit/c05fbc13768672f94ec8b7dd1a5bbc24fae0d0a1))
- **deps:** bump the action group with 2 updates ([98dca44](https://github.com/versatiles-org/node-versatiles/commit/98dca442d57337874bfaa2ec56b35faea807a679))
- **deps:** add Prettier for code formatting and create configuration files ([1aac8c0](https://github.com/versatiles-org/node-versatiles/commit/1aac8c0082be1c5ca3a1aa5e4e7f56a62ab49466))
- **deps:** remove .vscode/settings.json from version control ([cf973e3](https://github.com/versatiles-org/node-versatiles/commit/cf973e3596ac2b521257a94e928bf6f730c174d3))
- **ci:** standardize quotes in CI configuration and add formatting check step ([48ca847](https://github.com/versatiles-org/node-versatiles/commit/48ca84705d49709e52dc56c448b5239fe42f2328))

### Chores

- update dependencies to latest versions ([aaec54d](https://github.com/versatiles-org/node-versatiles/commit/aaec54dda73a994a474d0162323aad330354a6e7))

### Styles

- update format ([15abedd](https://github.com/versatiles-org/node-versatiles/commit/15abedde565dee1c6977dd7e504dd5c4e84ad697))
- update .prettierignore to include and exclude specific files ([668c63d](https://github.com/versatiles-org/node-versatiles/commit/668c63d4fc4bba093a168608a9901e8698d0aa4b))
- update .prettierignore to include static assets while excluding specific files ([1897658](https://github.com/versatiles-org/node-versatiles/commit/1897658b8900fb77cfdf6f6df92927ee107de3db))

### Other Changes

- Update sprite JSON files and corresponding PNG assets ([3509936](https://github.com/versatiles-org/node-versatiles/commit/3509936d0a6bcf8cd56ef1eb59568ab83bb57a6e))

## [1.6.8] - 2026-05-15

### Bug Fixes

- add rootDir and types options to TypeScript configuration ([c1ddc7f](https://github.com/versatiles-org/node-versatiles/commit/c1ddc7f7f8f85ee5ce04884f769f3bc32b196ee1))

### Build System

- **deps:** bump codecov/codecov-action from 5 to 6 in the action group ([3d7b427](https://github.com/versatiles-org/node-versatiles/commit/3d7b4275ea59ed579780e247c5fbe2f9efee75a9))

### Chores

- update dependencies to latest versions ([94201a5](https://github.com/versatiles-org/node-versatiles/commit/94201a5ec83659452733133ae9e9b05e068ec18f))

## [1.6.7] - 2026-03-01

### Bug Fixes

- improve error handling in generateStyle function for invalid metadata

### Chores

- update dependencies and devDependencies in package.json
- remove ts-node from dependencies in package.json

## [1.6.6] - 2026-02-15

### Chores

- update badge links in README.md for NPM version, downloads, code coverage, CI status, and license
- update dependencies to latest versions

