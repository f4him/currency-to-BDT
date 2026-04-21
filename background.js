// background.js
// Fetches live exchange rates and caches them for 1 hour.
// Uses Frankfurter API — completely free, no API key required.
// Docs: https://frankfurter.app

const BASE_URL = "https://api.frankfurter.app/latest?from=USD";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

async function fetchRates() {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();

    // Frankfurter returns { rates: { EUR: 0.91, GBP: 0.78, ... } }
    // It doesn't include USD itself, so we add it manually
    const rates = { USD: 1, ...data.rates };

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
