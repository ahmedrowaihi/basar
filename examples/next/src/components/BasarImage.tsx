"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { detect, type DetectionResult, type DetectionOptions } from "basar";

interface BasarImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: ReactNode;
  loading?: "lazy" | "eager";
  priority?: boolean;
  // Basar detection options
  detectNSFW?: boolean;
  detectGender?: boolean;
  strictness?: number;
  // Content filtering options
  hideNSFW?: boolean;
  hideGender?: boolean | "male" | "female";
  showDetectionStatus?: boolean;
  onDetectionComplete?: (
    result: DetectionResult | null,
    error?: string
  ) => void;
  onContentFiltered?: (reason: string) => void;
}

interface DetectionState {
  status: "idle" | "loading" | "completed" | "error";
  result: DetectionResult | null;
  error: string | null;
}

export default function BasarImage({
  src,
  alt,
  width,
  height,
  className = "",
  fallback = (
    <div className="flex justify-center items-center bg-gray-200 text-gray-500">
      <span>Content filtered</span>
    </div>
  ),
  loading = "lazy",
  priority = false,
  detectNSFW = true,
  detectGender = false,
  strictness = 0.5,
  hideNSFW = true,
  hideGender = false,
  showDetectionStatus = false,
  onDetectionComplete,
  onContentFiltered,
}: BasarImageProps) {
  const [detectionState, setDetectionState] = useState<DetectionState>({
    status: "idle",
    result: null,
    error: null,
  });
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const [filterReason, setFilterReason] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const detectionOptions: DetectionOptions = {
    detectNSFW,
    detectGender,
    strictness,
  };

  const performDetection = async (imageElement: HTMLImageElement) => {
    setDetectionState({ status: "loading", result: null, error: null });

    try {
      const bitmap = await createImageBitmap(imageElement);
      const result = await detect(bitmap, detectionOptions);

      setDetectionState({ status: "completed", result, error: null });

      // Determine if content should be shown
      let show = true;
      let reason: string | null = null;

      if (hideNSFW && result.result === "nsfw") {
        show = false;
        reason = "NSFW content detected";
      } else if (hideGender && result.result === "face") {
        // Check gender-specific filtering
        if (typeof hideGender === "boolean" && hideGender) {
          // Hide all faces
          show = false;
          reason = "Face content detected";
        } else if (typeof hideGender === "string") {
          // Check specific gender
          const detectedGender = result.details?.human?.gender;
          if (
            detectedGender &&
            detectedGender.toLowerCase() === hideGender.toLowerCase()
          ) {
            show = false;
            reason = `${hideGender} content detected`;
          }
        }
      }

      setShouldShow(show);
      setFilterReason(reason);

      // Call callbacks
      onDetectionComplete?.(result);
      if (!show && reason) {
        onContentFiltered?.(reason);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Detection failed";
      setDetectionState({ status: "error", result: null, error: errorMessage });
      setShouldShow(true); // Show image on error
      onDetectionComplete?.(null, errorMessage);
    }
  };

  const handleImageLoad = () => {
    if (imageRef.current && (detectNSFW || detectGender)) {
      performDetection(imageRef.current);
    } else {
      setShouldShow(true);
    }
  };

  const handleImageError = () => {
    setDetectionState({
      status: "error",
      result: null,
      error: "Failed to load image",
    });
    setShouldShow(true); // Show fallback on load error
  };

  // Reset state when src changes
  useEffect(() => {
    setDetectionState({ status: "idle", result: null, error: null });
    setShouldShow(null);
    setFilterReason(null);
  }, [src]);

  // If detection is disabled, show image immediately
  useEffect(() => {
    if (!detectNSFW && !detectGender) {
      setShouldShow(true);
    }
  }, [detectNSFW, detectGender]);

  // Show loading state
  if (detectionState.status === "loading") {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="opacity-50 transition-opacity duration-300"
        />
        {showDetectionStatus && (
          <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white shadow-lg px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="border-b-2 border-blue-600 rounded-full w-4 h-4 animate-spin"></div>
                <span className="font-medium text-sm">
                  Analyzing content...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show filtered content
  if (shouldShow === false) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        {fallback}
        {showDetectionStatus && (
          <div className="top-2 right-2 absolute bg-red-100 px-2 py-1 rounded font-medium text-red-800 text-xs">
            {filterReason}
          </div>
        )}
      </div>
    );
  }

  // Show image (either not filtered or detection failed)
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className="w-full h-full object-cover"
      />

      {/* Detection status indicator */}
      {showDetectionStatus &&
        detectionState.status === "completed" &&
        detectionState.result && (
          <div className="top-2 right-2 absolute bg-white bg-opacity-90 shadow-sm px-2 py-1 rounded font-medium text-xs">
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  detectionState.result.result === "nsfw"
                    ? "bg-red-500"
                    : detectionState.result.result === "face"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              ></span>
              <span className="capitalize">{detectionState.result.result}</span>
            </div>
            {detectionState.result.details?.nsfw && (
              <div className="mt-1 text-gray-600 text-xs">
                NSFW:{" "}
                {Math.max(...detectionState.result.details.nsfw).toFixed(2)}
              </div>
            )}
            {detectionState.result.details?.human?.gender && (
              <div className="text-gray-600 text-xs">
                Gender: {detectionState.result.details.human.gender}
              </div>
            )}
          </div>
        )}

      {/* Error indicator */}
      {showDetectionStatus && detectionState.status === "error" && (
        <div className="top-2 right-2 absolute bg-yellow-100 px-2 py-1 rounded font-medium text-yellow-800 text-xs">
          Detection failed
        </div>
      )}
    </div>
  );
}
