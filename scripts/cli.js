#!/usr/bin/env node

import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

const setup = async () => {
  const { setup } = await import("./setup.js");
  return setup();
};

const commands = {
  setup: setup,
};

if (!command || command === "--help" || command === "-h") {
  console.log(`
🧠 Basar CLI

Usage:
  npx basar <command>

Commands:
  setup         Set up Basar for any framework (downloads models)
  --help, -h    Show this help message

Examples:
  npx basar setup
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
