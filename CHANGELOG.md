# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8] - 2024-10-09

### Security

- Updated dependencies to address security vulnerabilities:
  - Bumped `rollup` from 4.18.1 to 4.24.0
  - Bumped `vite` from 5.3.3 to 5.4.8
- No functional changes; only dependency updates to fix security issues.

### Chore

- Updated various npm dependencies to their latest versions to ensure compatibility and maintainability.
  - No changes to functionality or behavior.
  - Refer to `package.json` for detailed version changes.
- Added `dependi` extension to `.devcontainer/devcontainer.json` for improved dependency management in the development environment.
- Applied `markdownlint` formatting to `CHANGELOG.md` for improved consistency and readability.

## [0.1.7] - 2024-07-21

### Fixed

- Fixed README.md

### Changed

- Modify the behavior so that calling stop() when the stream is already stopped does not throw an exception.

## [0.1.6] - 2024-07-16

### Fixed

- Fixed README.md

## [0.1.5] - 2024-07-16

### Fixed

- Fixed README.md

## [0.1.4] - 2024-07-16

### Added

- **Background Information**: Added a section to README.md explaining the purpose and origin of the package, specifically mentioning its use in the [fbdplay_wasm](https://github.com/ain1084/fbdplay_wasm) project.
- **Browser Support Table**: Added a table to README.md indicating the confirmed browser support, including limitations and unconfirmed platforms.

### Improved

- **Documentation**: Enhanced README.md to include details on known issues, workarounds, and additional configuration settings for Vite and Nuxt.

### Known Issues

- **Overhead at the Start of Playback**: The ring buffer is being generated each time. We plan to add a memory management mechanism to reuse the allocated memory.
- **Overhead during Worker Playback**: It appears that the Worker is loaded every time playback starts. We plan to cache the Worker in memory and reuse it.

## [0.1.3] - 2024-07-15

### Added

- Added CHANGELOG.md

### Changed

- None

### Fixed

- Fixed README.md

## [0.1.2] - 2024-07-14

### Added

- Added configuration, methods for vite.config.ts and nuxt.config.ts
- Added optimizeDeps.exclude

### Changed

- None

### Fixed

- None

## [0.1.1] - 2024-07-14

### Added

- None

### Changed

- None

### Fixed

- None

### Added

- Initial release of the audio worklet stream library.

## [0.1.0] - 2024-07-14

### Added

- Initial release of the audio worklet stream library.
