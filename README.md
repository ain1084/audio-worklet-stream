# Audio Worklet Stream Library

[![npm version](https://badge.fury.io/js/@ain1084%2Faudio-worklet-stream.svg)](https://badge.fury.io/js/@ain1084%2Faudio-worklet-stream)
[![Documentation](https://github.com/ain1084/audio-worklet-stream/workflows/docs/badge.svg)](https://github.com/ain1084/audio-worklet-stream/actions?query=workflow%3Adocs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

This library provides a way to work with audio worklets and streams using modern web technologies. It allows for the manual writing of audio frames to a buffer and supports various buffer writing strategies.

This library was created for use in my project [fbdplay_wasm](https://github.com/ain1084/fbdplay_wasm). In this project, we utilize only a very limited set of WebAudio functionalities. It might lack features for general use.

## Features

- **Manual Buffer Writing**: Provides the ability to manually write audio frames to a buffer.
- **Multiple Buffer Writing Strategies**: Includes support for various strategies like manual, timer-based, and worker-based buffer writing.
- **Worker-Based Stability**: Utilizes Workers to ensure stable and consistent audio playback.
- **Vite Integration**: Leverages Vite for easy worker loading and configuration without complex setup.
- **Audio Worklet Integration**: Seamlessly integrates with the Web Audio API's Audio Worklet for real-time audio processing.

## Confirmed Browser Support

|Feature|Chrome|Chrome (Android)|Firefox|Safari (macOS)|Safari (iOS)|Edge|Opera|
|:--|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
|Basic Support|![Chrome](https://img.icons8.com/color/24/000000/chrome.png)|![Chrome](https://img.icons8.com/color/24/000000/chrome.png)|![Firefox](https://img.icons8.com/color/24/000000/firefox.png)|![Safari](https://img.icons8.com/color/24/000000/safari--v2.png)|![Safari](https://img.icons8.com/color/24/000000/safari--v2.png)|![Edge](https://img.icons8.com/color/24/000000/ms-edge.png)|![Opera](https://img.icons8.com/color/24/000000/opera.png)|
|Manual Buffer Writing|✅|✅|✅|✅|❓|✅|❓|
|Timer-Based Buffer Writing|✅|✅|✅|🔺|❓|✅|❓|
|Worker-Based Stability|✅|✅|✅|✅|❓|✅|❓|

### Legend
- ✅: Confirmed and working without issues
- 🔺: Confirmed with limitations (e.g., unstable in background operation)
- ❓: Not yet confirmed

## Prerequisites

- **Node.js** and **npm**: Make sure you have Node.js (version 20 or higher) and npm installed. This library hasn't been tested on versions below 20.
- **Vite**: This library uses Vite as the bundler for its simplicity in loading and configuring workers. The developer uses Nuxt3, which is compatible with Vite.

## Installation

To install the library, run:

```bash
npm install @ain1084/audio-worklet-stream
```

You need to add `@ain1084/audio-worklet-stream` to the optimizeDeps.exclude section in `vite.config.ts`. Furthermore, include the necessary CORS settings to enable the use of `SharedArrayBuffer`.

**vite.config.ts**
```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['@ain1084/audio-worklet-stream']
  },
  plugins: [
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          next()
        })
      },
    },
  ],
})
```

If you are using Nuxt3, add it under vite in `nuxt.config.ts`.

**nuxt.config.ts**
```typescript
export default defineNuxtConfig({
  vite: {
    optimizeDeps: {
      exclude: ['@ain1084/audio-worklet-stream']
    },
    plugins: [
      {
        name: 'configure-response-headers',
        configureServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
            next()
          })
        },
      },
    ],
  },
})
```

Additionally, add the Nitro configuration (needed when running `npm run build`).

**nuxt.config.ts**
```typescript
export default defineNuxtConfig({
  nitro: {
    rollupConfig: {
      external: '@ain1084/audio-worklet-stream',
    },
    routeRules: {
      '/**': {
        cors: true,
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
      },
    },
  },
})
```

## Usage

### Overview

This library continuously plays audio sample frames using `AudioWorkletNode`. The audio sample frames need to be supplied externally via a ring buffer. The library provides functionality to retrieve the number of written and read (played) frames and allows stopping playback at a specified frame.

### Buffer Writing Methods

- **Manual**: The consumer is responsible for writing to the ring buffer. If the buffer becomes empty, silence is played. This method requires active management to ensure the buffer is always filled with audio data.
  - *Example*：
    ```typescript
    const writer = await main.createManualNode();
    // Write arbitrary audio frames
    writer.write(...);
    main.start();
    ```

- **Timed**: Uses a UI thread timer to periodically write to the buffer. Frames to be written to the buffer are requested through `FrameBufferFiller`.
  - *Example*：
    ```typescript
    await main.createTimedNode();
    main.start();
    ```

- **Worker**: Similar to Timed but uses a timer in a Worker instead of the UI thread. This approach provides more stable playback by avoiding UI thread throttling. See the [MDN Web Docs on setInterval delay restrictions](https://developer.mozilla.org/en-US/docs/Web/API/setInterval#delay_restrictions) for more details.
  - *Example*：
    ```typescript
    await main.createWorkerNode();
    main.start();
    ```

Below is a reference implementation of `main` used in the examples.

Note: The imported `sine-wave-frame-buffer-filler` and `worker` can be found in the `example/src/` directory.

```typescript
import { StreamNodeFactory, type OutputStreamNode } from '@ain1084/audio-worklet-stream';
import worker from './worker?worker';
import type { FillerParameters } from './sine-wave-frame-buffer-filler';
import { SineWaveFrameBufferFiller } from './sine-wave-frame-buffer-filler';

class Main {
  private factory: StreamNodeFactory | null = null;
  private streamNode: OutputStreamNode | null = null;

  // Initialize the AudioContext and StreamNodeFactory
  async init() {
    const audioContext = new AudioContext();
    this.factory = await StreamNodeFactory.create(audioContext);
  }

  // Create a manual buffer node
  async createManualNode() {
    if (!this.factory) throw new Error('Factory not initialized');
    const [node, writer] = await this.factory.createManualBufferNode({
      channelCount: 2,
      frameBufferSize: 4096,
    });
    this.streamNode = node;
    return writer;
  }

  // Create a timed buffer node
  async createTimedNode() {
    if (!this.factory) throw new Error('Factory not initialized');
    const filler = new SineWaveFrameBufferFiller({ frequency: 440, sampleRate: 44100 });
    this.streamNode = await this.factory.createTimedBufferNode(filler, {
      channelCount: 2,
      fillInterval: 20,
      sampleRate: 44100,
    });
  }

  // Create a worker buffer node
  async createWorkerNode() {
    if (!this.factory) throw new Error('Factory not initialized');
    this.streamNode = await this.factory.createWorkerBufferNode<FillerParameters>(worker, {
      channelCount: 2,
      fillInterval: 20,
      sampleRate: 44100,
      fillerParams: { frequency: 440, sampleRate: 44100 },
    });
  }

  // Start the audio stream
  // Node’s streaming process (such as timer activation) does not start until start() is called.
  start() {
    if (!this.streamNode) throw new Error('Stream node not created');
    this.streamNode.connect(this.streamNode.context.destination);
    this.streamNode.start();
  }

  // Stop the audio stream
  // stop() internally calls node.disconnect(). Since inter-thread communication may take some time, it returns a Promise.
  stop() {
    if (!this.streamNode) throw new Error('Stream node not created');
    return this.streamNode.stop();
  }
}

export default new Main();
```

## Documentation

For more detailed documentation, visit the [API documentation](https://ain1084.github.io/audio-worklet-stream/).

## Provided Example

The provided example demonstrates how to use the library to manually write audio frames to a buffer. It includes:

- **Main Application** (`example/src/main.ts`): Sets up and starts the audio stream using different buffer writing strategies.
- **Sine Wave Filler** (`example/src/sine-wave-frame-buffer-filler.ts`): Implements a frame buffer filler that generates a sine wave.
- **Sine Wave Generator** (`example/src/sine-wave-generator.ts`): Generates sine wave values for the buffer filler.
- **Worker** (`example/src/worker.ts`): Sets up a worker to handle buffer filling tasks.
- **HTML Entry Point** (`example/index.html`): Provides the HTML structure and buttons to control the audio stream.

For more details, refer to the `example/README.md`.

## Known Issues and Workarounds

*Note: Some content overlaps with previous sections.*

### SSR and Import Errors with ESM Modules

When using `@ain1084/audio-worklet-stream` in a Nuxt 3 project, you may encounter issues during SSR (Server-Side Rendering) or when importing the package as an ESM module. This can result in errors like:

```bash
[nuxt] [request error] [unhandled] [500] Cannot find module '/path/to/node_modules/@ain1084/audio-worklet-stream/dist/esm/events' imported from '/path/to/node_modules/@ain1084/audio-worklet-stream/dist/esm/index.js'
```

### Workarounds

1. **Disable SSR for the Component**

   You can disable SSR for the component that uses the package. This can be done by using `<client-only>`:

   ```vue
   <client-only>
     <MyComponent />
   </client-only>
   ```

2. **Use ssr: false in nuxt.config.ts**

   You can disable SSR for the entire project in `nuxt.config.ts`:

   ```typescript
   export default defineNuxtConfig({
     ssr: false,
     // other configurations
   })
   ```

3. **Use import.meta.server and import.meta.client**

   For a more granular control, you can use `import.meta.server` and `import.meta.client` to conditionally import the module only on the client-side. Note that this method is more complex compared to 1 and 2:

   ```typescript
   if (import.meta.client) {
     const { StreamNodeFactory } = await import('@ain1084/audio-worklet-stream');
     // Use StreamNodeFactory
   }
   ```

### Example Configuration

To ensure proper operation, it is essential to use `ssr: false` or `<client-only>` for components and to exclude `@ain1084/audio-worklet-stream` from Vite's optimization in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  ssr: false, // or use <client-only> for specific components
  vite: {
    optimizeDeps: {
      exclude: ['@ain1084/audio-worklet-stream'],
    },
  },
  nitro: {
    rollupConfig: {
      external: '@ain1084/audio-worklet-stream',
    },
  },
  // Ensure CORS settings for SharedArrayBuffer
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})
```

## Future Plans and Known Issues

### Future Plans
1. **Enhanced Documentation**: Improve the documentation with more examples and detailed explanations.

### Known Issues
1. **Buffer Underruns**: Occasional buffer underruns under heavy CPU load.
2. **Limited Worker Support**: Advanced features in workers might not be fully supported across all browsers.
3. **Overhead at the Start of Playback**: The ring buffer is being generated each time.
4. **Overhead during Worker Playback**: It seems that the Worker is being loaded every time playback starts (although it hits the cache).

We are continuously working on these areas to improve the library. Contributions and suggestions are always welcome!

## Notes

- **Vite as a Bundler**: This library utilizes Vite to enable the loading and placement of workers without complex configurations. It may not work out-of-the-box with WebPack due to differences in how bundlers handle workers. While similar methods may exist for WebPack, this library currently only supports Vite. Initially, a bundler-independent approach was considered, but a suitable method could not be found.

- **Security Requirements**: Since this library uses `SharedArrayBuffer`, ensuring browser compatibility requires meeting specific security requirements. For more details, refer to the [MDN Web Docs on SharedArrayBuffer Security Requirements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).


## Contribution

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License

This project is licensed under multiple licenses:

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

You can choose either license depending on your project needs.

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
