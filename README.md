# BD Currency Converter

A browser extension that lets you hover over any price on any webpage and instantly see the equivalent in **Bangladeshi Taka (BDT)** at live exchange rates.

## Features

- Hover over prices like `$1,299`, `€99`, `£49.99`, `₹5,000` to see BDT instantly
- Popup manual converter supporting USD, EUR, GBP, JPY, INR, AUD, CAD, SGD, SAR, AED
- Live rates fetched from [ExchangeRate-API](https://www.exchangerate-api.com) and cached for 1 hour
- Detects prices using smart regex — works on Amazon, eBay, AliExpress, and most e-commerce sites
- Bangladeshi number formatting (1,00,000 style) in the popup
- Lightweight — no background tracking, no data collection

## Installation (Development)

1. Clone this repo
   ```
   git clone https://github.com/yourusername/bd-currency-converter
   ```

2. Get a free API key from [exchangerate-api.com](https://www.exchangerate-api.com)

3. Open `background.js` and replace `YOUR_API_KEY_HERE` with your key

4. Open Chrome and go to `chrome://extensions`

5. Enable **Developer mode** (top right toggle)

6. Click **Load unpacked** and select the project folder

7. The extension icon will appear in your toolbar — click it to open the popup

## Chrome Web Store

*(Link will be added after publication)*

## Project Structure

```
bd-currency-converter/
├── manifest.json     — Extension config (Manifest V3)
├── background.js     — Service worker: fetches & caches exchange rates
├── content.js        — Injected into pages: detects prices, shows tooltip
├── popup.html        — Toolbar popup UI
├── popup.js          — Popup logic and currency conversion
└── README.md
```

## Supported currencies for hover detection

| Symbol | Currency |
|--------|----------|
| `$`    | USD      |
| `€`    | EUR      |
| `£`    | GBP      |
| `¥`    | JPY      |
| `₹`    | INR      |
| `₩`    | KRW      |
| `A$`   | AUD      |
| `C$`   | CAD      |
| `S$`   | SGD      |

## Roadmap

- [ ] Right-click "Copy as BDT" context menu
- [ ] Options page to choose which currencies show in popup
- [ ] Firefox support
- [ ] Auto-detect currency from page locale
- [ ] Show flag icons next to results

## Privacy

This extension does not collect, store, or transmit any personal data. Exchange rates are fetched from ExchangeRate-API using your own API key and cached locally in your browser.

## License

MIT
