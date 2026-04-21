// build.js
// Copies the correct manifest for the target browser and zips the extension.
//
// Usage:
//   node build.js chrome
//   node build.js firefox
//   node build.js edge       (uses chrome manifest)

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const target = process.argv[2];

const VALID_TARGETS = ["chrome", "firefox", "edge"];

if (!target || !VALID_TARGETS.includes(target)) {
  console.error("Usage: node build.js chrome | firefox | edge");
  process.exit(1);
}

const manifestSource =
  target === "firefox"
    ? "manifests/manifest.firefox.json"
    : "manifests/manifest.chrome.json";

if (!fs.existsSync(manifestSource)) {
  console.error(`Manifest not found: ${manifestSource}`);
  process.exit(1);
}

// Step 1: Copy the right manifest
fs.copyFileSync(manifestSource, "manifest.json");
console.log(`✓ Copied ${manifestSource} → manifest.json`);

// Step 2: Zip the extension (only the files the browser needs)
const outputZip = `bd-currency-converter-${target}.zip`;
const excludes = [
  "--exclude=*.git*",
  "--exclude=manifests/*",
  "--exclude=build.js",
  "--exclude=*.zip",
  "--exclude=node_modules/*",
  "--exclude=README.md",
].join(" ");

try {
  execSync(`zip -r ${outputZip} . ${excludes}`);
  console.log(`✓ Zipped → ${outputZip}`);
} catch (err) {
  console.error("Zip failed:", err.message);
  process.exit(1);
}

console.log(`\nBuild complete for: ${target}`);
console.log(`Submit ${outputZip} to the store.`);
