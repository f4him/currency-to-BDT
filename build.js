// build.js
// Usage:
//   node build.js chrome
//   node build.js firefox
//   node build.js edge      (uses chrome manifest)

const fs = require("fs");
const path = require("path");

const target = process.argv[2];

if (!target) {
  console.error(
    "Please specify a target: node build.js chrome | firefox | edge",
  );
  process.exit(1);
}

// Edge uses the same manifest as Chrome
const manifestSource =
  target === "firefox"
    ? "manifests/manifest.firefox.json"
    : "manifests/manifest.chrome.json";

if (!fs.existsSync(manifestSource)) {
  console.error(`Manifest not found: ${manifestSource}`);
  process.exit(1);
}

// Copy the right manifest to manifest.json
fs.copyFileSync(manifestSource, "manifest.json");
console.log(`✓ Copied ${manifestSource} → manifest.json`);

// Also fix background.js for Firefox:
// Firefox doesn't support importScripts() in MV3 background scripts
// so we remove that line when building for Firefox.
const bgPath = "background.js";
let bgContent = fs.readFileSync(bgPath, "utf8");

if (target === "firefox") {
  // Remove the importScripts line if present
  bgContent = bgContent.replace(/importScripts\(['"]config\.js['"]\);\n?/g, "");
  console.log("✓ Removed importScripts() from background.js for Firefox");
} else {
  // Make sure importScripts is present for Chrome/Edge
  if (!bgContent.includes("importScripts('config.js')")) {
    bgContent = "importScripts('config.js');\n" + bgContent;
    console.log("✓ Added importScripts() to background.js for Chrome/Edge");
  }
}

fs.writeFileSync(bgPath, bgContent);
console.log(`✓ Build ready for: ${target}`);
console.log("  → Now zip the folder and submit to the store.");
