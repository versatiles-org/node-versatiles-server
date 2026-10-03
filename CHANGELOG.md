# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.2] - 2026-10-03

### Bug Fixes

- update eslint configuration to use typescript-eslint parser and plugin ([2705360](https://github.com/versatiles-org/node-versatiles/commit/270536033f77a315ddd423774768108fbc48644b))
- update generateStyle function to be asynchronous and adjust style generation logic ([2abfd4b](https://github.com/versatiles-org/node-versatiles/commit/2abfd4b3e54b2ccb419c084dd6c6c2319e3b9340))

### Chores

- add ignore rule for typescript dependency in dependabot configuration ([1e875a3](https://github.com/versatiles-org/node-versatiles/commit/1e875a347ed11626b95d79dd6730a1b386135a20))
- update dependencies to latest versions ([8a99a77](https://github.com/versatiles-org/node-versatiles/commit/8a99a775f167c916fac99901df853bb288680819))
- update brace-expansion and markdown-it packages to latest versions ([3c2df9b](https://github.com/versatiles-org/node-versatiles/commit/3c2df9b0315d53c0ef8aabdda84042850396ffb6))

## [1.7.1] - 2026-08-18

### Bug Fixes

- update funding information in FUNDING.yml ([1ae1934](https://github.com/versatiles-org/node-versatiles/commit/1ae1934f7e48c15fdf28f808c0151f1980cb6926))
- ensure errors do not expose trace information ([c8699b1](https://github.com/versatiles-org/node-versatiles/commit/c8699b1feda1e96d094ebfc5058635f73eaec32f))
- improve sourceToId function to handle trailing slashes more efficiently ([6956f75](https://github.com/versatiles-org/node-versatiles/commit/6956f75f508182737c18d7ee04853bbf7af01961))

### Build System

- **deps:** bump actions/setup-node ([60ac36c](https://github.com/versatiles-org/node-versatiles/commit/60ac36c06d53071206936d39300a90b1b9d8f4a7))

### Chores

- add security update groups for GitHub Actions and npm in dependabot configuration ([c80a5f3](https://github.com/versatiles-org/node-versatiles/commit/c80a5f3501157a0637182bd278b60ef414391e6b))
- update dependencies and devDependencies in package.json ([372081d](https://github.com/versatiles-org/node-versatiles/commit/372081d24b02af30dc8aa6365b71d4a6e866ca26))

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

