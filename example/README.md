# Audio Worklet Stream Library Example

This directory contains an example demonstrating the usage of the Audio Worklet Stream Library. This example showcases how to manually write audio frames to a buffer using `TimedBufferWriteStrategy` and other strategies.

## Prerequisites

- **Node.js** and **npm**: Make sure you have Node.js and npm installed.

## Running the Example

To run the example, follow these steps:

1. **Install Dependencies**: Navigate to the example directory and install the dependencies.
   ```bash
   cd example
   npm install
   ```

2. **Start the Development Server**: Use Vite to start the development server.
   ```bash
   npm run dev
   ```

3. **Open in Browser**: Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## Example Code

This example demonstrates how to manually write audio frames to a buffer using different strategies.

### Main Application

The main application logic is in `src/main.ts`:

```typescript
import { StreamNodeFactory, type OutputStreamNode } from '@ain1084/audio-worklet-stream';
import worker from './worker?worker';
import type { FillerParameters } from './sine-wave-frame-buffer-filler';
import { SineWaveFrameBufferFiller } from './sine-wave-frame-buffer-filler';

class Main {
  // Class implementation...
}

export default new Main();
```

### Sine Wave Filler

The sine wave frame buffer filler logic is in `src/sine-wave-frame-buffer-filler.ts`:

```typescript
import type { FrameBufferFiller, FrameBufferWriter } from '@ain1084/audio-worklet-stream';
import { SineWaveGenerator } from './sine-wave-generator';

export type FillerParameters = Readonly<{
  frequency: number;
  sampleRate: number;
}>;

export class SineWaveFrameBufferFiller implements FrameBufferFiller {
  // Class implementation...
}
```

### Sine Wave Generator

The sine wave generator logic is in `src/sine-wave-generator.ts`:

```typescript
/**
 * SineWaveGenerator class
 * This class generates sine wave values.
 */
export class SineWaveGenerator {
  // Class implementation...
}
```

### Worker

The worker setup is in `src/worker.ts`:

```typescript
import { BufferFillWorker } from '@ain1084/audio-worklet-stream';
import { FillerParameters, SineWaveFrameBufferFiller } from './sine-wave-frame-buffer-filler';

new BufferFillWorker<FillerParameters>(SineWaveFrameBufferFiller);
```

### HTML Entry Point

The HTML entry point is in `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audio Worklet Example</title>
</head>
<body>
  <h1>audio-worklet-stream example</h1>
  <div id="output">Ready</div>
  <button id="startTimerButton">Start Stream (UI Timer)</button>
  <button id="startWorkerButton">Start Stream (Worker)</button>
  <button id="stopButton">Stop Stream</button>
  <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

## Notes

- **AudioContext Creation**: The creation of `AudioContext` must be triggered by a user interaction (e.g., a button click) due to browser security restrictions.
- **Worker Import**: This example uses Vite's unique syntax for importing workers.

For more detailed information, please refer to the main [README.md](../README.md) in the project root.

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.