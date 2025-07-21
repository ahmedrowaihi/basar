# Basar Examples - Next.js

This is a [Next.js](https://nextjs.org/) project demonstrating various ways to use the [Basar](https://github.com/ahmedrowaihi/basar) library for NSFW content and face detection.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Examples Included

### 1. File Upload Detection (`/`)

- Upload multiple images and videos
- Real-time detection with Web Workers
- Configurable detection options
- Detailed results with NSFW scores

### 2. BasarImage Component (`/basar-image`)

- Drop-in replacement for `<img>` tags
- Automatic content filtering
- Configurable detection options
- Custom fallback content
- Visual detection status indicators

### 3. useBasar Hook (`/hook-example`)

- React hook for easy integration
- Automatic detection lifecycle management
- Loading states and error handling
- Simple API for manual detection

## BasarImage Component

The `BasarImage` component is a drop-in replacement for regular `<img>` tags that automatically detects and filters inappropriate content.

### Basic Usage

```tsx
import BasarImage from "../components/BasarImage";

<BasarImage
  src="https://example.com/image.jpg"
  alt="Description"
  hideNSFW={true}
  showDetectionStatus={true}
/>;
```

### Advanced Configuration

```tsx
<BasarImage
  src="https://example.com/image.jpg"
  alt="Description"
  width={400}
  height={300}
  detectNSFW={true}
  detectGender={true}
  strictness={0.5}
  hideNSFW={true}
  hideGender="male" // or "female" or true for all faces
  showDetectionStatus={true}
  fallback={<CustomFallback />}
  onDetectionComplete={(result) => console.log(result)}
  onContentFiltered={(reason) => console.log(reason)}
/>
```

### Props

| Prop                  | Type                          | Default                | Description                       |
| --------------------- | ----------------------------- | ---------------------- | --------------------------------- |
| `src`                 | string                        | -                      | Image source URL                  |
| `alt`                 | string                        | -                      | Alt text for accessibility        |
| `width`               | number                        | -                      | Image width                       |
| `height`              | number                        | -                      | Image height                      |
| `className`           | string                        | ""                     | CSS classes                       |
| `fallback`            | ReactNode                     | Default filter message | Content to show when filtered     |
| `detectNSFW`          | boolean                       | true                   | Enable NSFW detection             |
| `detectGender`        | boolean                       | false                  | Enable face/gender detection      |
| `strictness`          | number                        | 0.5                    | Detection sensitivity (0-1)       |
| `hideNSFW`            | boolean                       | true                   | Hide NSFW content                 |
| `hideGender`          | boolean \| "male" \| "female" | false                  | Hide specific gender content      |
| `showDetectionStatus` | boolean                       | false                  | Show detection indicators         |
| `onDetectionComplete` | function                      | -                      | Callback with detection result    |
| `onContentFiltered`   | function                      | -                      | Callback when content is filtered |

## useBasar Hook

The `useBasar` hook provides a simple way to integrate Basar detection into your components.

### Usage

```tsx
import { useBasar } from "../hooks/useBasar";

const { result, isProcessing, error, detect } = useBasar(imageRef.current, {
  detectNSFW: true,
  detectGender: true,
  autoDetect: false,
});

const handleImageLoad = async () => {
  if (imageRef.current) {
    await detect(imageRef.current);
  }
};
```

### Hook Return Values

| Property       | Type                    | Description              |
| -------------- | ----------------------- | ------------------------ |
| `result`       | DetectionResult \| null | Detection result         |
| `isProcessing` | boolean                 | Loading state            |
| `error`        | string \| null          | Error message            |
| `detect`       | function                | Manual detection trigger |
| `reset`        | function                | Reset hook state         |

## Direct API Usage

For direct control, you can use the Basar API directly:

```typescript
import { detect } from "basar";

const bitmap = await createImageBitmap(imageFile);
const result = await detect(bitmap, {
  detectNSFW: true,
  detectGender: true,
  strictness: 0.5,
});
```

## Performance Benefits

- **Non-blocking UI**: Detection runs in background Web Workers
- **Parallel Processing**: Multiple images processed simultaneously
- **Efficient Transfers**: ImageBitmap transfers avoid data copying
- **Automatic Caching**: Models loaded once and reused
- **Lazy Loading**: Images load and detect on demand

## Learn More

- [Basar Documentation](https://github.com/ahmedrowaihi/basar)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks](https://react.dev/reference/react/hooks)
