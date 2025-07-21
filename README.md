# Basar

A library for detecting NSFW content and faces in images and videos using TensorFlow.js and Human.js.

## Features

- **NSFW Detection**: Uses TensorFlow.js with a pre-trained NSFW model
- **Face & Gender Detection**: Uses Human.js for face detection and gender classification
- **Video Support**: Process video files with frame-by-frame analysis
- **Web Worker Support**: All heavy computations run in background threads
- **Caching & Queue**: Automatic caching and sequential processing for optimal performance
- **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install basar
```

## Setup

### Next.js Setup

```bash
npx basar setup-nextjs
```

This copies the bundled worker file to `public/basar-worker/index.js` and models to `public/models/`.

### Manual Setup

Copy the bundled worker file from `node_modules/basar/dist/worker-bundle/index.js` and models from `node_modules/basar/models/` to your public directory.

## Usage

### Basic Detection

```typescript
import { detect } from "basar";

const img = document.querySelector("img");
const bitmap = await createImageBitmap(img);
const result = await detect(bitmap, {
  detectNSFW: true,
  strictness: 0.5,
});

console.log(result.result); // 'nsfw', 'face', 'clear', or 'error'
```

### Video Detection

```typescript
import { detect } from "basar";

const video = document.createElement("video");
video.src = "path/to/video.mp4";
await new Promise((resolve) =>
  video.addEventListener("loadedmetadata", resolve)
);

const result = await detect(video, {
  detectNSFW: true,
  detectGender: true,
});

console.log("Video Result:", result.result);
console.log("Total Frames:", result.videoSummary?.totalFrames);
```

## API Reference

### `detect(input, options?)`

**Parameters:**

- `input`: `ImageBitmap | OffscreenCanvas | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement`
- `options`: `DetectionOptions` (optional)

**Returns:** `Promise<DetectionResult>`

### `getQueueStatus()`

Gets the current status of the worker queue and cache.

### `clearCache()`

Clears the detection result cache.

### Types

```typescript
interface DetectionOptions {
  detectNSFW?: boolean;
  detectGender?: boolean;
  detectMale?: boolean;
  detectFemale?: boolean;
  strictness?: number; // 0-1, default: 0.5
}

type DetectionResultType = "nsfw" | "face" | "clear" | "error";

interface DetectionResult {
  result: DetectionResultType;
  gender?: "male" | "female" | "unknown" | null;
  details?: {
    nsfw?: number[];
    human?: any;
    error?: string;
  };
  // Video-specific fields
  videoFrames?: Array<{
    frameNumber: number;
    timestamp: number;
    result: DetectionResultType;
    nsfwScores?: number[];
    faceCount?: number;
  }>;
  videoSummary?: {
    totalFrames: number;
    nsfwFrames: number;
    faceFrames: number;
    maxNsfwScore: number;
    averageNsfwScore: number;
  };
}
```

## Examples

### React Hook

```typescript
import { useEffect, useState } from "react";
import { detect, type DetectionResult } from "basar";

export function useBasar(image: HTMLImageElement | null) {
  const [data, setData] = useState<DetectionResult | null>(null);

  useEffect(() => {
    if (!image) return;
    (async () => {
      const bmp = await createImageBitmap(image);
      setData(await detect(bmp, { detectGender: true }));
    })();
  }, [image]);

  return data;
}
```

## Building

```bash
bun run build
```

## Troubleshooting

### Next.js Issues

1. Run `npx basar setup-nextjs`
2. Verify `public/basar-worker/index.js` and `public/models/` exist

### Worker Loading Issues

1. Check browser console for CORS errors
2. Ensure worker file is accessible via HTTP (not file://)
3. Verify worker path in browser's Network tab
