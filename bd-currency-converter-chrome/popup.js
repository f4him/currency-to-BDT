// popup.js
// Rates are BDT-based: rates[currency] = how much 1 BDT is in that currency
// To convert foreign amount → BDT: bdtAmount = amount / rates[fromCurrency]
// To convert BDT → foreign: foreignAmount = bdtAmount * rates[foreignCurrency]

let rates = null;

const amountInput = document.getElementById("amount-input");
const currencySelect = document.getElementById("currency-select");
const bdtResult = document.getElementById("bdt-result");
const usdResult = document.getElementById("usd-result");
const eurResult = document.getElementById("eur-result");
const gbpResult = document.getElementById("gbp-result");
const inrResult = document.getElementById("inr-result");
const rateBadge = document.getElementById("rate-badge");
const errorMsg = document.getElementById("error-msg");
const footer = document.getElementById("footer");

function formatBDT(amount) {
  // Bangladeshi lakh system: 1,00,000
  const fixed = Math.round(amount);
  const str = fixed.toString();
  if (str.length <= 3) return "৳ " + str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  return "৳ " + formatted;
}

function fmt(amount, symbol, decimals = 2) {
  return (
    symbol +
    " " +
    amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}

function convert() {
  if (!rates) return;

  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount < 0) return;

  const from = currencySelect.value;
  if (rates[from] == null) return;

  // Step 1: Convert input amount → BDT
  const bdtAmount = from === "BDT" ? amount : amount / rates[from];

  // Step 2: Convert BDT → other display currencies
  const toUSD = bdtAmount * rates["USD"];
  const toEUR = bdtAmount * rates["EUR"];
  const toGBP = bdtAmount * rates["GBP"];
  const toINR = bdtAmount * rates["INR"];

  bdtResult.textContent = formatBDT(bdtAmount);
  usdResult.textContent = fmt(toUSD, "$");
  eurResult.textContent = fmt(toEUR, "€");
  gbpResult.textContent = fmt(toGBP, "£");
  inrResult.textContent = fmt(toINR, "₹", 0);

  // Badge: show how much 1 unit of selected currency = BDT
  const oneBDT = from === "BDT" ? 1 : 1 / rates[from];
  rateBadge.textContent = `1 ${from} = ${formatBDT(oneBDT)}`;
}

async function init() {
  const response = await chrome.runtime.sendMessage({ type: "GET_RATES" });
  rates = response?.rates || null;

  if (!rates) {
    errorMsg.style.display = "block";
    rateBadge.textContent = "No data";
    return;
  }

  // Show when rates were last fetched
  const tsResponse = await chrome.runtime.sendMessage({
    type: "GET_RATES_TIMESTAMP",
  });
  if (tsResponse?.timestamp) {
    const mins = Math.floor((Date.now() - tsResponse.timestamp) / 60000);
    const timeStr =
      mins < 1 ? "just now" : mins === 1 ? "1 min ago" : `${mins} mins ago`;
    footer.innerHTML = `Updated ${timeStr} · <a href="https://frankfurter.dev" target="_blank">frankfurter.dev</a>`;
  }

  convert();
}

amountInput.addEventListener("input", convert);
currencySelect.addEventListener("change", convert);

init();
