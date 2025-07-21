#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { existsSync, mkdirSync, copyFileSync } from "fs";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODEL_FILES = [
  "group1-shard1of1",
  "group1-shard1of5.bin",
  "group1-shard2of5.bin",
  "group1-shard3of5.bin",
  "group1-shard4of5.bin",
  "group1-shard5of5.bin",
  "model.json",
];

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
  const projectRoot = process.cwd();

  console.log("🧠 Setting up Basar...");

  const packageJsonPath = join(projectRoot, "package.json");
  if (!existsSync(packageJsonPath)) {
    console.error("❌ Error: package.json not found.");
    console.error(
      "   Make sure you're running this command from your project root."
    );
    process.exit(1);
  }

  const publicDir = join(projectRoot, "public");
  if (!existsSync(publicDir)) {
    console.log("📁 Creating public directory...");
    mkdirSync(publicDir, { recursive: true });
  }

  const basarWorkerDir = join(publicDir, "basar-worker");
  if (!existsSync(basarWorkerDir)) {
    console.log("📁 Creating public/basar-worker directory...");
    mkdirSync(basarWorkerDir, { recursive: true });
  }

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

  const modelsDir = join(publicDir, "models", "nsfwjs");
  if (!existsSync(modelsDir)) {
    console.log("📁 Creating public/models/nsfwjs directory...");
    mkdirSync(modelsDir, { recursive: true });
  }

  console.log("📥 Downloading model files...");
  const downloadPromises = MODEL_FILES.map(async (filename) => {
    const url = `${MODEL_BASE_URL}/${filename}`;
    const destPath = join(modelsDir, filename);

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

  console.log("\n🎉 Basar setup complete!");
  console.log("\n📋 What was set up:");
  console.log("   • Worker file: public/basar-worker/index.js");
  console.log("   • Models: public/models/nsfwjs/");
  console.log("\n🚀 You can now use Basar in your app:");
  console.log('   import { detect } from "basar";');
  console.log(
    "\n💡 Note: Models are downloaded from GitHub. For production, consider hosting them on your own CDN."
  );
  console.log(
    "\n⚠️  Important: Make sure to commit the models to your repository for deployment!"
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setup();
}

export { setup };
