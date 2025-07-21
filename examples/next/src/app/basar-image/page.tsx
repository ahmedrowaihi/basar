"use client";

import { useState, useRef } from "react";
import BasarImage from "../../components/BasarImage";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  hideNSFW: boolean;
  hideGender: boolean | "male" | "female";
  showDetectionStatus: boolean;
  strictness: number;
}

export default function BasarImageExamplePage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [globalConfig, setGlobalConfig] = useState({
    hideNSFW: true,
    hideGender: false as boolean | "male" | "female",
    showDetectionStatus: true,
    strictness: 0.5,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newImages: UploadedImage[] = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      ...globalConfig,
    }));

    setUploadedImages((prev) => [...prev, ...newImages]);
    // Reset input so re-uploading same file works
    e.target.value = "";
  };

  const updateImageConfig = (id: string, updates: Partial<UploadedImage>) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
    );
  };

  const updateGlobalConfig = (updates: Partial<typeof globalConfig>) => {
    setGlobalConfig((prev) => ({ ...prev, ...updates }));
    setUploadedImages((prev) => prev.map((img) => ({ ...img, ...updates })));
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => {
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  const clearAll = () => {
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
  };

  return (
    <div className="bg-gray-50 py-8 min-h-screen">
      <div className="bg-white shadow-lg mx-auto p-6 rounded-lg max-w-6xl">
        <h1 className="mb-6 font-bold text-3xl">
          🖼️ BasarImage Component Example
        </h1>

        {/* Global Configuration */}
        <div className="bg-blue-50 mb-8 p-4 rounded-lg">
          <h2 className="mb-4 font-semibold text-blue-900 text-xl">
            Global Configuration
          </h2>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={globalConfig.hideNSFW}
                onChange={(e) =>
                  updateGlobalConfig({ hideNSFW: e.target.checked })
                }
                className="rounded"
              />
              <span className="font-medium text-sm">Hide NSFW</span>
            </label>
            <div className="flex flex-col gap-2">
              <span className="font-medium text-sm">Hide Gender:</span>
              <select
                value={
                  typeof globalConfig.hideGender === "string"
                    ? globalConfig.hideGender
                    : globalConfig.hideGender
                    ? "all"
                    : "none"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  let hideGender: boolean | "male" | "female";
                  if (value === "none") hideGender = false;
                  else if (value === "all") hideGender = true;
                  else hideGender = value as "male" | "female";
                  updateGlobalConfig({ hideGender });
                }}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="none">None</option>
                <option value="all">All Faces</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={globalConfig.showDetectionStatus}
                onChange={(e) =>
                  updateGlobalConfig({ showDetectionStatus: e.target.checked })
                }
                className="rounded"
              />
              <span className="font-medium text-sm">Show Status</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Strictness:</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={globalConfig.strictness}
                onChange={(e) =>
                  updateGlobalConfig({ strictness: parseFloat(e.target.value) })
                }
                className="flex-1"
              />
              <span className="w-8 text-xs">{globalConfig.strictness}</span>
            </div>
          </div>
        </div>

        {/* File Upload Controls */}
        <div className="flex gap-4 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium text-white"
          >
            📁 Upload Images
          </button>
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium text-white"
            disabled={uploadedImages.length === 0}
          >
            🗑️ Clear All
          </button>
        </div>

        {/* Uploaded Images Grid */}
        {uploadedImages.length > 0 ? (
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {uploadedImages.map((image) => (
              <div key={image.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm truncate">
                    {image.file.name}
                  </h3>
                  <button
                    onClick={() => removeImage(image.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Individual Image Configuration */}
                <div className="space-y-2 mb-4 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={image.hideNSFW}
                      onChange={(e) =>
                        updateImageConfig(image.id, {
                          hideNSFW: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span>Hide NSFW</span>
                  </label>
                  <div className="flex flex-col gap-1">
                    <span>Hide Gender:</span>
                    <select
                      value={
                        typeof image.hideGender === "string"
                          ? image.hideGender
                          : image.hideGender
                          ? "all"
                          : "none"
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        let hideGender: boolean | "male" | "female";
                        if (value === "none") hideGender = false;
                        else if (value === "all") hideGender = true;
                        else hideGender = value as "male" | "female";
                        updateImageConfig(image.id, { hideGender });
                      }}
                      className="px-1 py-0.5 border rounded text-xs"
                    >
                      <option value="none">None</option>
                      <option value="all">All Faces</option>
                      <option value="male">Male Only</option>
                      <option value="female">Female Only</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={image.showDetectionStatus}
                      onChange={(e) =>
                        updateImageConfig(image.id, {
                          showDetectionStatus: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span>Show Status</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span>Strictness:</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={image.strictness}
                      onChange={(e) =>
                        updateImageConfig(image.id, {
                          strictness: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="w-6">{image.strictness}</span>
                  </div>
                </div>

                {/* BasarImage Component */}
                <BasarImage
                  src={image.preview}
                  alt={image.file.name}
                  width={400}
                  height={300}
                  className="rounded-lg w-full h-48"
                  detectNSFW={true}
                  detectGender={true}
                  strictness={image.strictness}
                  hideNSFW={image.hideNSFW}
                  hideGender={image.hideGender}
                  showDetectionStatus={image.showDetectionStatus}
                  fallback={
                    <div className="flex justify-center items-center bg-red-100 border-2 border-red-300 rounded-lg w-full h-48">
                      <div className="text-center">
                        <div className="font-medium text-red-600">
                          🚫 Content Filtered
                        </div>
                        <div className="text-red-500 text-sm">
                          Inappropriate content detected
                        </div>
                      </div>
                    </div>
                  }
                  onDetectionComplete={(result, error) => {
                    if (error) {
                      console.error(
                        `Image ${image.file.name} detection error:`,
                        error
                      );
                    } else if (result) {
                      console.log(
                        `Image ${image.file.name} detection result:`,
                        result
                      );
                    }
                  }}
                  onContentFiltered={(reason) => {
                    console.log(`Image ${image.file.name} filtered:`, reason);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-500 text-lg">
              📁 No images uploaded yet
            </div>
            <p className="text-gray-400">
              Click &quot;Upload Images&quot; to get started with the BasarImage
              component
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 mt-8 p-4 rounded-lg">
          <h3 className="mb-2 font-semibold text-lg">How to Use BasarImage</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Basic Usage:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
              {`<BasarImage
  src="https://example.com/image.jpg"
  alt="Description"
  hideNSFW={true}
  showDetectionStatus={true}
/>`}
            </pre>

            <p>
              <strong>Advanced Configuration:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">
              {`<BasarImage
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
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
