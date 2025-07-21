#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { existsSync, mkdirSync, copyFileSync, cpSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupNextjs() {
  const projectRoot = resolve(__dirname, "..");
  const nextjsRoot = process.cwd(); // Current working directory where the command is run

  console.log("🧠 Setting up Basar for Next.js...");

  const nextFiles = [
    "next.config.js",
    "next.config.ts",
    "next.config.cjs",
    "next.config.mjs",
  ];

  const packageJsonPath = join(nextjsRoot, "package.json");

  if (!nextFiles.some((file) => existsSync(join(nextjsRoot, file)))) {
    console.error("❌ Error: This doesn't appear to be a Next.js project.");
    console.error(
      "   Make sure you're running this command from your Next.js project root."
    );
    process.exit(1);
  }

  if (!existsSync(packageJsonPath)) {
    console.error("❌ Error: package.json not found.");
    process.exit(1);
  }

  const basarWorkerDir = join(nextjsRoot, "public", "basar-worker");
  if (!existsSync(basarWorkerDir)) {
    console.log("📁 Creating public/basar-worker directory...");
    mkdirSync(basarWorkerDir, { recursive: true });
  }

  const workerSource = join(projectRoot, "dist", "worker-bundle", "index.js");
  const workerDest = join(basarWorkerDir, "index.js");

  if (!existsSync(workerSource)) {
    console.log("🔨 Worker file not found. Building project first...");
    try {
      const { spawn } = await import("child_process");
      const buildProcess = spawn("bun", ["run", "build"], {
        cwd: projectRoot,
        stdio: "inherit",
      });

      await new Promise((resolve, reject) => {
        buildProcess.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Build failed with exit code ${code}`));
          }
        });
      });

      console.log("✅ Build completed successfully");
    } catch (error) {
      console.error("❌ Build failed:", error.message);
      console.error(
        "Please run 'bun run build' manually in the basar project root."
      );
      process.exit(1);
    }
  }

  if (existsSync(workerSource)) {
    console.log("📄 Copying bundled worker file...");
    copyFileSync(workerSource, workerDest);
    console.log("✅ Worker file copied successfully");
  } else {
    console.error("❌ Error: Worker file still not found after build.");
    process.exit(1);
  }

  const modelsSource = join(projectRoot, "models");
  const modelsDest = join(nextjsRoot, "public", "models");

  if (existsSync(modelsSource)) {
    console.log("📁 Copying models directory...");
    if (existsSync(modelsDest)) {
      console.log("⚠️  Models directory already exists, overwriting...");
    }
    cpSync(modelsSource, modelsDest, { recursive: true, force: true });
    console.log("✅ Models copied successfully");
  } else {
    console.error("❌ Error: Models directory not found.");
    process.exit(1);
  }

  console.log("\n🎉 Basar setup complete!");
  console.log("\n📋 What was set up:");
  console.log("   • Worker file: public/basar-worker/index.js");
  console.log("   • Models: public/models/");
  console.log("\n🚀 You can now use Basar in your Next.js app:");
  console.log('   import { detect } from "basar";');
}

// If this file is run directly, execute the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupNextjs();
}
