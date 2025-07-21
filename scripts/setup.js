#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from "fs";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Model files to download
const MODEL_FILES = [
  "group1-shard1of1",
  "group1-shard1of5.bin",
  "group1-shard2of5.bin",
  "group1-shard3of5.bin",
  "group1-shard4of5.bin",
  "group1-shard5of5.bin",
  "model.json",
];

// Base URL for downloading models (you can change this to your CDN or GitHub releases)
const MODEL_BASE_URL =
  "https://raw.githubusercontent.com/ahmedrowaihi/basar/main/models/nsfwjs";

async function downloadFile(url, destPath) {
  console.log(`📥 Downloading ${url}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const fileStream = createWriteStream(destPath);
    await pipeline(response.body, fileStream);

    console.log(`✅ Downloaded ${destPath}`);
  } catch (error) {
    console.error(`❌ Failed to download ${url}:`, error.message);
    throw error;
  }
}

async function setup() {
  const projectRoot = process.cwd(); // Current working directory where the command is run

  console.log("🧠 Setting up Basar...");

  // Check if we're in a project directory
  const packageJsonPath = join(projectRoot, "package.json");
  if (!existsSync(packageJsonPath)) {
    console.error("❌ Error: package.json not found.");
    console.error(
      "   Make sure you're running this command from your project root."
    );
    process.exit(1);
  }

  // Create public directory if it doesn't exist
  const publicDir = join(projectRoot, "public");
  if (!existsSync(publicDir)) {
    console.log("📁 Creating public directory...");
    mkdirSync(publicDir, { recursive: true });
  }

  // Create basar-worker directory
  const basarWorkerDir = join(publicDir, "basar-worker");
  if (!existsSync(basarWorkerDir)) {
    console.log("📁 Creating public/basar-worker directory...");
    mkdirSync(basarWorkerDir, { recursive: true });
  }

  // Try to find worker file in different locations
  const possibleWorkerSources = [
    join(
      projectRoot,
      "node_modules",
      "basar",
      "dist",
      "worker-bundle",
      "index.js"
    ),
    join(projectRoot, "dist", "worker-bundle", "index.js"),
    join(__dirname, "..", "dist", "worker-bundle", "index.js"),
  ];

  let workerSource = null;
  for (const source of possibleWorkerSources) {
    if (existsSync(source)) {
      workerSource = source;
      break;
    }
  }

  const workerDest = join(basarWorkerDir, "index.js");

  if (workerSource) {
    console.log("📄 Copying bundled worker file...");
    copyFileSync(workerSource, workerDest);
    console.log("✅ Worker file copied successfully");
  } else {
    console.error("❌ Error: Worker file not found.");
    console.error("   Make sure you have installed basar: npm install basar");
    console.error(
      "   Or run 'bun run build' if you're in the basar project root."
    );
    process.exit(1);
  }

  // Create models directory
  const modelsDir = join(publicDir, "models", "nsfwjs");
  if (!existsSync(modelsDir)) {
    console.log("📁 Creating public/models/nsfwjs directory...");
    mkdirSync(modelsDir, { recursive: true });
  }

  // Download model files
  console.log("📥 Downloading model files...");
  const downloadPromises = MODEL_FILES.map(async (filename) => {
    const url = `${MODEL_BASE_URL}/${filename}`;
    const destPath = join(modelsDir, filename);

    // Skip if file already exists
    if (existsSync(destPath)) {
      console.log(`⚠️  ${filename} already exists, skipping...`);
      return;
    }

    await downloadFile(url, destPath);
  });

  try {
    await Promise.all(downloadPromises);
    console.log("✅ All model files downloaded successfully");
  } catch (error) {
    console.error("❌ Failed to download some model files:", error.message);
    console.error(
      "   You may need to download them manually or check your internet connection."
    );
    process.exit(1);
  }

  // Create a .gitignore entry for models if it doesn't exist
  const gitignorePath = join(projectRoot, ".gitignore");
  const gitignoreEntry =
    "\n# Basar models (downloaded automatically)\npublic/models/\n";

  if (existsSync(gitignorePath)) {
    const gitignoreContent = await import("fs").then((fs) =>
      fs.readFileSync(gitignorePath, "utf8")
    );
    if (!gitignoreContent.includes("public/models/")) {
      writeFileSync(gitignorePath, gitignoreContent + gitignoreEntry, "utf8");
      console.log("📝 Added models to .gitignore");
    }
  } else {
    writeFileSync(gitignorePath, gitignoreEntry, "utf8");
    console.log("📝 Created .gitignore with models entry");
  }

  console.log("\n🎉 Basar setup complete!");
  console.log("\n📋 What was set up:");
  console.log("   • Worker file: public/basar-worker/index.js");
  console.log("   • Models: public/models/nsfwjs/");
  console.log("   • .gitignore: Updated to exclude models");
  console.log("\n🚀 You can now use Basar in your app:");
  console.log('   import { detect } from "basar";');
  console.log(
    "\n💡 Note: Models are downloaded from GitHub. For production, consider hosting them on your own CDN."
  );
}

// If this file is run directly, execute the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setup();
}

export { setup };
