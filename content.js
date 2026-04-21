// content.js
// Scans the webpage for price patterns, wraps them in a span,
// and shows a BDT tooltip on hover.

const CURRENCY_SYMBOLS = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "₩": "KRW",
  A$: "AUD",
  C$: "CAD",
  S$: "SGD",
};

// Matches prices like $1,299 | €99.99 | £1,234.50 | ₹5000
const PRICE_REGEX = /(A\$|C\$|S\$|\$|€|£|¥|₹|₩)\s?([\d,]+(?:\.\d{1,2})?)/g;

let cachedRates = null;

async function loadRates() {
  if (cachedRates) return cachedRates;
  const response = await chrome.runtime.sendMessage({ type: "GET_RATES" });
  cachedRates = response?.rates || null;
  return cachedRates;
}

function convertToBDT(amount, fromCurrency, rates) {
  if (!rates || !rates["BDT"] || !rates[fromCurrency]) return null;
  // All rates are relative to USD base
  const amountInUSD = amount / rates[fromCurrency];
  return amountInUSD * rates["BDT"];
}

function formatBDT(amount) {
  // Bangladeshi number format: 1,00,000 style
  const fixed = Math.round(amount);
  const str = fixed.toString();
  if (str.length <= 3) return "৳ " + str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  return "৳ " + formatted;
}

// Create and inject the tooltip element (shared, moved on hover)
const tooltip = document.createElement("div");
tooltip.id = "bdt-tooltip";
tooltip.style.cssText = `
  position: fixed;
  z-index: 2147483647;
  background: #1a1a1a;
  color: #f0f0f0;
  border-radius: 8px;
  padding: 8px 13px;
  font-size: 13px;
  font-family: system-ui, sans-serif;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  max-width: 200px;
  line-height: 1.5;
`;
document.body.appendChild(tooltip);

function showTooltip(e, bdtText, originalText) {
  tooltip.innerHTML = `
    <div style="font-size:15px;font-weight:600;color:#9FE1CB">${bdtText}</div>
    <div style="font-size:11px;color:#888;margin-top:2px">${originalText} at live rate</div>
  `;
  tooltip.style.opacity = "1";
  positionTooltip(e);
}

function positionTooltip(e) {
  const x = e.clientX + 12;
  const y = e.clientY - 10;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  tooltip.style.left = (x + tw > window.innerWidth ? x - tw - 24 : x) + "px";
  tooltip.style.top = (y + th > window.innerHeight ? y - th - 4 : y) + "px";
}

function hideTooltip() {
  tooltip.style.opacity = "0";
}

function wrapPriceSpan(textNode, match, currency, amount, fromCurrency, rates) {
  const bdtAmount = convertToBDT(amount, fromCurrency, rates);
  if (!bdtAmount) return false;

  const bdtText = formatBDT(bdtAmount);
  const span = document.createElement("span");
  span.className = "bdt-price";
  span.textContent = match;
  span.style.cssText = `
    border-bottom: 1.5px dashed #1D9E75;
    cursor: help;
    border-radius: 2px;
  `;

  span.addEventListener("mouseover", (e) => showTooltip(e, bdtText, match));
  span.addEventListener("mousemove", positionTooltip);
  span.addEventListener("mouseleave", hideTooltip);

  const after = textNode.splitText(textNode.nodeValue.indexOf(match));
  after.nodeValue = after.nodeValue.slice(match.length);
  textNode.parentNode.insertBefore(span, after);
  return true;
}

function scanTextNode(node, rates) {
  const text = node.nodeValue;
  if (!text || text.trim().length === 0) return;

  PRICE_REGEX.lastIndex = 0;
  const match = PRICE_REGEX.exec(text);
  if (!match) return;

  const fullMatch = match[0];
  const symbol = match[1];
  const amountStr = match[2].replace(/,/g, "");
  const amount = parseFloat(amountStr);
  const fromCurrency = CURRENCY_SYMBOLS[symbol];

  if (!fromCurrency || isNaN(amount) || amount <= 0) return;

  wrapPriceSpan(node, fullMatch, symbol, amount, fromCurrency, rates);
}

function scanDocument(rates) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        // Skip script, style, and already-wrapped spans
        if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(tag))
          return NodeFilter.FILTER_REJECT;
        if (parent.classList.contains("bdt-price"))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach((n) => scanTextNode(n, rates));
}

// Main: load rates, then scan the page
loadRates().then((rates) => {
  if (!rates) return;
  scanDocument(rates);
});
