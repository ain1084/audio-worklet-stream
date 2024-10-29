# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2024-10-30

### Fixed

- Fixed incorrect dependency (local reference to `array-buffer-partitioner`)

### Changed

- Updated npm packages
- Regenerated `package-lock.json`

## [1.0.4] - 2024-10-29

### Summary of Changes

- **Refactoring**: Simplified code structure by removing redundant functions and configurations
- **Internal Use Adjustment**: Added `@internal` tags to constructors to indicate internal-only usage
- **Typedoc Enhancements**: Added documentation links to improve cross-referencing in the docs

### Detailed Changes

#### Improvements

- Updated constructors in `FrameBufferWriter` and `FrameBufferReader` to take `FrameBufferConfig` as a parameter, simplifying configuration handling
- Added `{@link}` tags to `xxxParams` types in `StreamNodeFactory` to link to related functions in the documentation
- Added `@internal` tags to constructors in `FrameBufferWriter` and `FrameBufferReader` to clarify internal use
- Implemented `@ain1084/array-buffer-partitioner` to create `SharedArrayBuffer`, optimizing memory partitioning

#### Removals

- Removed `createFrameBufferWriter` and `createFrameBufferReader` functions (made redundant by direct use of `FrameBufferConfig` parameter)
- Removed `OutputStreamProcessorOptions` (no longer necessary as `FrameBufferConfig` is passed directly)

## [Unreleased] - 2024-10-22

### Added

- Added more detailed example code to README.md, reflecting a more realistic usage scenario.
- Added a button in the `example/` (in the example directory, not in README.md) for manual buffering playback.

### Changed

- Renamed strategy implementation files under `write-strategy/` to `XXXX-strategy.ts` to make it clearer that they are strategy implementations.

## [Unreleased] - 2024-10-20

### Added

- Added `@template` tag in TypeDoc comments for generic type parameters to improve documentation clarity.
- Added comments to clarify that the `generator` parameter in `BufferFillWorker` constructor is a constructor function, not a regular function.

### Updated

- Restricted the `generator` parameter in `BufferFillWorker` to accept only constructor functions (i.e., `new` keyword) for creating `FrameBufferFiller` instances, ensuring consistent instantiation.
- Improved TypeDoc comments for the `BufferFillWorker` constructor to specify that the `generator` is a constructor function for creating `FrameBufferFiller` instances.

## [Unreleased] - 2024-10-20

### Added

- Added a note in the **Worker** section of README.md, clarifying that data passed from the UI thread to the Worker (such as `fillerParams` in `WorkerBufferNodeParams<T>`) must be serializable. This includes primitives, arrays, and objects, while non-serializable values like functions or DOM elements are not allowed.

### Updated

- Improved the description in the **Worker** section of README.md to provide more clarity on how the `FrameBufferFiller` is instantiated and managed within the Worker.

## [1.0.3] - 2024-10-20

### Added

- Added diagrams to README.md to illustrate different buffer writing methods: Manual, Timed, Worker.
- Included a note in README.md clarifying that the diagrams are simplified representations and may differ from the actual implementation.

### Updated

- Updated the description in README.md for the `OutputStreamNode` buffer writing methods to improve clarity.

## [1.0.2] - 2024-10-18

### Fixed

### Added

- Added a link to the API documentation in the `README.md`.

## [1.0.1] - 2024-10-18

### Fixed

- Fixed typos in README.md
- Updated example usage in README.md for clarity

## [1.0.0] - 2024-10-18

### Breaking Changes

- Removed the `setFrames` function from the `FrameBuffer` class. There is no replacement for this function, so any code using it must be rewritten.
- Changed the arguments passed to the callback functions in `FrameBufferWriter.write` and `FrameBufferReader.read`. Instead of passing a `FrameBuffer` instance and start index, a `subarray` representing the valid portion of the frame buffer is now passed.

### Improvements

- Renamed ambiguous function and argument names to make them more descriptive and easier to understand (e.g., `frames` -> `frameCount`, `available` -> `availableFrames`).

### Fixed

- Fixed an issue where multi-channel (including stereo) playback was not functioning correctly.

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

### Fixed

- Fixed a bug in the example where the `sampleRate` was fixed at 48000Hz when using a worker.
  - Now, the `sampleRate` correctly references the `AudioContext` frequency.

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
