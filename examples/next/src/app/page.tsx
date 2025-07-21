"use client";

import { useRef, useState } from "react";
import { detect, type DetectionResult } from "basar";

interface FileItem {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
  status: "pending" | "processing" | "completed" | "error";
  result?: DetectionResult;
  error?: string;
}

interface DetectionOptions {
  detectNSFW: boolean;
  detectGender: boolean;
  strictness: number;
}

export default function BasarDetectionPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [options, setOptions] = useState<DetectionOptions>({
    detectNSFW: true,
    detectGender: true,
    strictness: 0.5,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to create a FileItem
  const createFileItem = (file: File): FileItem => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
      .toString(36)
      .slice(2)}`,
    file,
    preview: URL.createObjectURL(file),
    type: file.type.startsWith("video/") ? "video" : "image",
    status: "pending",
  });

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const newItems = Array.from(fileList).map(createFileItem);
    setFiles((prev) => [...prev, ...newItems]);
    // Reset input so re-uploading same file works
    e.target.value = "";
  };

  // Remove a file
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const toRemove = prev.find((f) => f.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  // Clear all
  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  // Process all files
  const processAll = async () => {
    setProcessing(true);
    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: "pending",
        result: undefined,
        error: undefined,
      }))
    );
    const updated: FileItem[] = [];
    for (const fileItem of files) {
      let result: DetectionResult | undefined = undefined;
      let error: string | undefined = undefined;
      try {
        if (fileItem.type === "image") {
          const bitmap = await createImageBitmap(fileItem.file);
          result = await detect(bitmap, options);
        } else {
          // Video: extract frames in main thread
          const videoUrl = fileItem.preview;
          const video = document.createElement("video");
          video.src = videoUrl;
          video.muted = true;
          await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
          });
          const duration = video.duration;
          const frameCount = 10;
          const interval = duration / frameCount;
          const frames: DetectionResult["videoFrames"] = [];
          const nsfwScores: number[] = [];
          for (let i = 0; i < frameCount; i++) {
            try {
              const time = i * interval;
              video.currentTime = time;
              await new Promise((resolve) =>
                video.addEventListener("seeked", resolve, { once: true })
              );
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d")!;
              ctx.drawImage(video, 0, 0);
              const bitmap = await createImageBitmap(canvas);
              const frameResult = await detect(bitmap, options);
              frames.push({
                frameNumber: i,
                timestamp: time,
                result: frameResult.result,
                nsfwScores: frameResult.details?.nsfw,
                faceCount: frameResult.details?.human?.face || 0,
              });
              if (frameResult.details?.nsfw)
                nsfwScores.push(Math.max(...frameResult.details.nsfw));
            } catch (err) {
              // Ignore individual frame errors
            }
          }
          const nsfwFrames = frames.filter((f) => f.result === "nsfw").length;
          const faceFrames = frames.filter((f) => f.result === "face").length;
          const maxNsfwScore =
            nsfwScores.length > 0 ? Math.max(...nsfwScores) : 0;
          const averageNsfwScore =
            nsfwScores.length > 0
              ? nsfwScores.reduce((a, b) => a + b, 0) / nsfwScores.length
              : 0;
          let overallResult: DetectionResult["result"] = "clear";
          if (nsfwFrames > frames.length * 0.3) overallResult = "nsfw";
          else if (faceFrames > frames.length * 0.2) overallResult = "face";
          result = {
            result: overallResult,
            videoFrames: frames,
            videoSummary: {
              totalFrames: frames.length,
              nsfwFrames,
              faceFrames,
              maxNsfwScore,
              averageNsfwScore,
            },
          };
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
      updated.push({
        ...fileItem,
        status: error ? "error" : "completed",
        result,
        error,
      });
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? updated[updated.length - 1] : f
        )
      );
    }
    setProcessing(false);
  };

  return (
    <div className="bg-gray-50 py-8 min-h-screen">
      <div className="bg-white shadow-lg mx-auto p-6 rounded-lg max-w-3xl">
        <h1 className="mb-4 font-bold text-2xl">🧠 Basar Detection</h1>
        {/* Options Panel */}
        <div className="flex sm:flex-row flex-col items-center gap-4 bg-gray-100 mb-6 p-4 rounded-lg">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.detectNSFW}
              onChange={(e) =>
                setOptions((o) => ({ ...o, detectNSFW: e.target.checked }))
              }
              className="rounded"
            />
            <span className="font-medium text-sm">Detect NSFW</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.detectGender}
              onChange={(e) =>
                setOptions((o) => ({ ...o, detectGender: e.target.checked }))
              }
              className="rounded"
            />
            <span className="font-medium text-sm">Detect Faces/Gender</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Strictness:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={options.strictness}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  strictness: parseFloat(e.target.value),
                }))
              }
              className="w-32"
            />
            <span className="text-xs">{options.strictness}</span>
          </div>
        </div>
        <div className="flex sm:flex-row flex-col gap-4 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            Select Images or Videos
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 px-4 py-2 rounded text-white"
            onClick={processAll}
            disabled={processing || files.length === 0}
          >
            {processing ? "Processing..." : "Detect All"}
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 px-4 py-2 rounded text-white"
            onClick={clearAll}
            disabled={processing || files.length === 0}
          >
            Clear All
          </button>
        </div>
        {files.length > 0 && (
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-2">
            {files.map((item) => (
              <div
                key={item.id}
                className="relative bg-gray-50 p-3 border rounded-lg"
              >
                <button
                  className="top-2 right-2 absolute flex justify-center items-center bg-red-500 hover:bg-red-600 rounded-full w-6 h-6 text-white"
                  onClick={() => removeFile(item.id)}
                  title="Remove"
                  disabled={processing}
                >
                  ×
                </button>
                <div className="mb-2">
                  {item.type === "image" ? (
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="rounded w-full h-48 object-cover"
                    />
                  ) : (
                    <video
                      src={item.preview}
                      controls
                      className="rounded w-full h-48 object-cover"
                    />
                  )}
                </div>
                <div className="mb-1 font-medium truncate">
                  {item.file.name}
                </div>
                <div className="mb-1 text-gray-500 text-xs">
                  {item.type.toUpperCase()}
                </div>
                <div className="mb-1">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${
                      item.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : item.status === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : item.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>
                {item.status === "completed" && item.result && (
                  <div className="mt-2 text-xs">
                    <div className="mb-1 font-bold">
                      Result: {item.result.result.toUpperCase()}
                    </div>
                    {item.result.details?.nsfw && (
                      <div>
                        <div className="font-medium">NSFW Scores:</div>
                        <div className="gap-1 grid grid-cols-2">
                          <div>
                            Drawing: {item.result.details.nsfw[0]?.toFixed(3)}
                          </div>
                          <div>
                            Hentai: {item.result.details.nsfw[1]?.toFixed(3)}
                          </div>
                          <div>
                            Neutral: {item.result.details.nsfw[2]?.toFixed(3)}
                          </div>
                          <div>
                            Porn: {item.result.details.nsfw[3]?.toFixed(3)}
                          </div>
                          <div>
                            Sexy: {item.result.details.nsfw[4]?.toFixed(3)}
                          </div>
                        </div>
                        <div className="mt-1 font-medium text-red-600">
                          Max NSFW:{" "}
                          {Math.max(...item.result.details.nsfw).toFixed(3)}
                        </div>
                      </div>
                    )}
                    {item.result.details?.human?.face && (
                      <div>Faces: {item.result.details.human.face}</div>
                    )}
                    {item.result.videoSummary && (
                      <div className="bg-blue-50 mt-2 p-2 rounded">
                        <div className="font-medium text-blue-900">
                          🎥 Video Analysis:
                        </div>
                        <div className="space-y-1 text-blue-800 text-xs">
                          <div>
                            Total Frames: {item.result.videoSummary.totalFrames}
                          </div>
                          <div>
                            NSFW Frames: {item.result.videoSummary.nsfwFrames}
                          </div>
                          <div>
                            Face Frames: {item.result.videoSummary.faceFrames}
                          </div>
                          <div>
                            Max NSFW Score:{" "}
                            {item.result.videoSummary.maxNsfwScore.toFixed(3)}
                          </div>
                          <div>
                            Avg NSFW Score:{" "}
                            {item.result.videoSummary.averageNsfwScore.toFixed(
                              3
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {item.status === "error" && (
                  <div className="mt-2 text-red-600 text-xs">
                    Error: {item.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
