// background.js
// Fetches live exchange rates and caches them for 1 hour.
// Uses Frankfurter v2 API — completely free, no API key required.
// Docs: https://frankfurter.dev
//
// API response is an array of objects like:
// [{ date, base: "BDT", quote: "USD", rate: 0.00833 }, ...]
// We convert this into a flat map: { USD: 0.00833, EUR: 0.0076, ... }
// Since base is BDT, rate = "how much 1 BDT is worth in that currency"
// To convert FROM a foreign currency TO BDT: bdtAmount = amount / rates[fromCurrency]

const BASE_URL = "https://api.frankfurter.dev/v2/rates?base=BDT";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

async function fetchRates() {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();

    // Convert array of objects → flat map { quote: rate }
    // e.g. [{ quote: "USD", rate: 0.00833 }] → { USD: 0.00833 }
    const rates = {};
    for (const entry of data) {
      rates[entry.quote] = entry.rate;
    }

    // Add BDT itself (1 BDT = 1 BDT)
    rates["BDT"] = 1;

    await chrome.storage.local.set({
      rates: rates,
      ratesTimestamp: Date.now(),
    });

    return rates;
  } catch (err) {
    console.error("[BD Converter] Failed to fetch rates:", err);
    return null;
  }
}

async function getRates() {
  const stored = await chrome.storage.local.get(["rates", "ratesTimestamp"]);
  const now = Date.now();

  if (
    stored.rates &&
    stored.ratesTimestamp &&
    now - stored.ratesTimestamp < CACHE_TTL
  ) {
    return stored.rates;
  }

  return await fetchRates();
}

// Listen for messages from content.js and popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_RATES") {
    getRates().then((rates) => sendResponse({ rates }));
    return true; // keep channel open for async response
  }

  if (message.type === "GET_RATES_TIMESTAMP") {
    chrome.storage.local.get("ratesTimestamp").then((stored) => {
      sendResponse({ timestamp: stored.ratesTimestamp || null });
    });
    return true;
  }
});

// Pre-fetch rates when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  fetchRates();
});
