"use client";

import { useRef, useState } from "react";
import { useBasar } from "../hooks/useBasar";

export default function BasarHookExample() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const imageRef = useRef<HTMLImageElement>(null);

  const { result, isProcessing, error, detect } = useBasar(imageRef.current, {
    detectNSFW: true,
    detectGender: true,
    autoDetect: false, // We'll trigger manually
  });

  const handleImageLoad = async () => {
    if (imageRef.current) {
      await detect(imageRef.current);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  return (
    <div className="bg-white shadow-lg mx-auto p-6 rounded-lg max-w-md">
      <h2 className="mb-4 font-bold text-xl">🧠 Basar Hook Example</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 font-medium text-gray-700 text-sm">
            Image URL:
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        {imageUrl && (
          <div className="space-y-2">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Test image"
              onLoad={handleImageLoad}
              className="rounded-md w-full h-48 object-cover"
              crossOrigin="anonymous"
            />

            {isProcessing && (
              <div className="text-blue-600 text-sm">🔄 Processing...</div>
            )}

            {error && (
              <div className="text-red-600 text-sm">❌ Error: {error}</div>
            )}

            {result && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="mb-2 font-medium text-gray-900">
                  Detection Result:
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Result:</strong> {result.result.toUpperCase()}
                  </p>
                  {result.gender && (
                    <p>
                      <strong>Gender:</strong> {result.gender}
                    </p>
                  )}
                  {result?.details?.nsfw && (
                    <div>
                      <strong>NSFW Scores:</strong>
                      <div className="space-y-1 text-sm">
                        <p>Drawing: {result.details.nsfw[0]?.toFixed(3)}</p>
                        <p>Hentai: {result.details.nsfw[1]?.toFixed(3)}</p>
                        <p>Neutral: {result.details.nsfw[2]?.toFixed(3)}</p>
                        <p>Porn: {result.details.nsfw[3]?.toFixed(3)}</p>
                        <p>Sexy: {result.details.nsfw[4]?.toFixed(3)}</p>
                      </div>
                      <p className="font-medium text-red-600">
                        Max NSFW: {Math.max(...result.details.nsfw).toFixed(3)}
                      </p>
                    </div>
                  )}
                  {result.details?.human?.face && (
                    <p>
                      <strong>Faces Detected:</strong>{" "}
                      {result.details.human.face}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
