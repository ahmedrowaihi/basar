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

### Automatic Setup

```bash
npx basar setup
```

This command:

- Downloads the required ML models from GitHub
- Copies the worker file to `public/basar-worker/index.js`
- Creates necessary directories

**Important**: The models will be committed to your repository by default. This ensures they're available when your app is deployed.

### Manual Setup

1. Copy the bundled worker file from `node_modules/basar/dist/worker-bundle/index.js` to your `public/basar-worker/index.js`
2. Download the NSFW model files from [GitHub](https://github.com/ahmedrowaihi/basar/tree/main/models/nsfwjs) to your `public/models/nsfwjs/` directory

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

## Deployment

### For Production Deployments

The models are committed to your repository by default. This ensures they're available when your app is deployed to platforms like Vercel, Netlify, or any other hosting service.

If you prefer not to commit the models (to keep your repository smaller), you can:

1. Add `public/models/` to your `.gitignore`
2. Set up a build step to download models during deployment
3. Host models on a CDN and update the worker to load from there

## Troubleshooting

### Setup Issues

1. Run `npx basar setup` to download models and set up worker
2. Verify `public/basar-worker/index.js` and `public/models/nsfwjs/` exist
3. Check that models were downloaded successfully

### Worker Loading Issues

1. Check browser console for CORS errors
2. Ensure worker file is accessible via HTTP (not file://)
3. Verify worker path in browser's Network tab

### Model Download Issues

If models fail to download:

1. Check your internet connection
2. Download models manually from [GitHub](https://github.com/ahmedrowaihi/basar/tree/main/models/nsfwjs)
3. Place them in `public/models/nsfwjs/`

### Deployment Issues

If your app fails in production:

1. Ensure models are committed to your repository
2. Check that the worker file is accessible at `/basar-worker/index.js`
3. Verify model files are accessible at `/models/nsfwjs/`
