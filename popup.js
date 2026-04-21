// popup.js

let rates = null;

const amountInput  = document.getElementById('amount-input');
const currencySelect = document.getElementById('currency-select');
const bdtResult    = document.getElementById('bdt-result');
const usdResult    = document.getElementById('usd-result');
const eurResult    = document.getElementById('eur-result');
const gbpResult    = document.getElementById('gbp-result');
const inrResult    = document.getElementById('inr-result');
const rateBadge    = document.getElementById('rate-badge');
const errorMsg     = document.getElementById('error-msg');
const footer       = document.getElementById('footer');

function formatBDT(amount) {
  const fixed = Math.round(amount);
  const str = fixed.toString();
  if (str.length <= 3) return '৳ ' + str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  return '৳ ' + formatted;
}

function fmt(amount, symbol, decimals = 2) {
  return symbol + ' ' + amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function convert() {
  if (!rates) return;

  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount < 0) return;

  const from = currencySelect.value;

  if (!rates[from] || !rates['BDT']) return;

  // All rates base: USD. Convert: amount → USD → target
  const amountInUSD = amount / rates[from];

  const bdt = amountInUSD * rates['BDT'];
  const usd = amountInUSD;
  const eur = amountInUSD * rates['EUR'];
  const gbp = amountInUSD * rates['GBP'];
  const inr = amountInUSD * rates['INR'];

  bdtResult.textContent = formatBDT(bdt);
  usdResult.textContent = from === 'USD' ? fmt(amount, '$') : fmt(usd, '$');
  eurResult.textContent = from === 'EUR' ? fmt(amount, '€') : fmt(eur, '€');
  gbpResult.textContent = from === 'GBP' ? fmt(amount, '£') : fmt(gbp, '£');
  inrResult.textContent = from === 'INR' ? fmt(amount, '₹', 0) : fmt(inr, '₹', 0);

  rateBadge.textContent = `1 ${from} = ${formatBDT(rates['BDT'] / rates[from])}`;
}

async function init() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_RATES' });
  rates = response?.rates || null;

  if (!rates) {
    errorMsg.style.display = 'block';
    rateBadge.textContent = 'No data';
    return;
  }

  // Show when rates were last updated
  const tsResponse = await chrome.runtime.sendMessage({ type: 'GET_RATES_TIMESTAMP' });
  if (tsResponse?.timestamp) {
    const mins = Math.floor((Date.now() - tsResponse.timestamp) / 60000);
    const timeStr = mins < 1 ? 'just now' : mins === 1 ? '1 min ago' : `${mins} mins ago`;
    footer.innerHTML = `Updated ${timeStr} · <a href="https://www.exchangerate-api.com" target="_blank">exchangerate-api.com</a>`;
  }

  convert();
}

amountInput.addEventListener('input', convert);
currencySelect.addEventListener('change', convert);

init();
