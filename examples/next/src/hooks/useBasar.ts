import { useState, useEffect } from 'react';
import { detect, type DetectionResult, type DetectionOptions } from 'basar';

interface UseBasarOptions extends DetectionOptions {
  autoDetect?: boolean;
}

interface UseBasarReturn {
  result: DetectionResult | null;
  isProcessing: boolean;
  error: string | null;
  detect: (input: ImageBitmap | OffscreenCanvas | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => Promise<void>;
  reset: () => void;
}

export function useBasar(
  input: ImageBitmap | OffscreenCanvas | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null,
  options: UseBasarOptions = {}
): UseBasarReturn {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { autoDetect = false, ...detectionOptions } = options;

  const performDetection = async (
    detectionInput: ImageBitmap | OffscreenCanvas | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const detectionResult = await detect(detectionInput, detectionOptions);
      setResult(detectionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };

  // Auto-detect when input changes
  useEffect(() => {
    if (autoDetect && input) {
      performDetection(input);
    }
  }, [input, autoDetect, JSON.stringify(detectionOptions)]);

  return {
    result,
    isProcessing,
    error,
    detect: performDetection,
    reset,
  };
} 