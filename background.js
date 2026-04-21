importScripts('config.js');
importScripts("config.js");

const API_KEY = CONFIG.API_KEY; //put api key in config.js
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;
const CACHE_TTL = 60 * 60 * 1000;

async function fetchRates() {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();

    if (data.result !== "success") throw new Error("API returned error");

    const rates = data.conversion_rates;
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
