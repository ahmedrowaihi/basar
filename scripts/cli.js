#!/usr/bin/env node

import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

const setupNextjs = async () => {
  const { setupNextjs } = await import("./setup-nextjs.js");
  return setupNextjs();
};

const commands = {
  "setup-next": setupNextjs,
};

if (!command || command === "--help" || command === "-h") {
  console.log(`
🧠 Basar CLI

Usage:
  npx basar <command>

Commands:
  setup-next    Set up Basar for Next.js projects
  --help, -h    Show this help message

Examples:
  npx basar setup-next
`);
  process.exit(0);
}

const executeCommand = async () => {
  const cmd = commands[command];

  if (!cmd) {
    console.error(`❌ Unknown command: ${command}`);
    console.error('Run "npx basar --help" for available commands.');
    process.exit(1);
  }

  try {
    await cmd();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

executeCommand();
