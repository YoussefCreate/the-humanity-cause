// ------- CONFIG -------
const BTC_ADDRESS = "bc1q605vmx3u25dm6wnhe8vs4w0qs0vqknvwpd5mgn";
// When you provide USDT, set below & network ("TRC20" or "ERC20")
const USDT_ADDRESS = null;
const USDT_NETWORK = null; // "TRC20" or "ERC20"

// ------- COUNTDOWN (24h from first load; change to a fixed date/time if you want) -------
const start = new Date(); // now
const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
const countdownEl = document.getElementById("countdown");
const fmt = (n)=> String(n).padStart(2,"0");
function tick() {
  const now = new Date();
  let diff = Math.max(0, end - now);
  const h = Math.floor(diff / 3600000); diff -= h*3600000;
  const m = Math.floor(diff / 60000);   diff -= m*60000;
  const s = Math.floor(diff / 1000);
  countdownEl.textContent = `⏳ ${fmt(h)}:${fmt(m)}:${fmt(s)} remaining`;
  if (end - now <= 0) clearInterval(timer);
}
const timer = setInterval(tick, 1000); tick();

// ------- QR + Copy helpers -------
const btcAddrEl = document.getElementById("btcAddr");
document.getElementById("copyBtc").onclick = async () => {
  await navigator.clipboard.writeText(BTC_ADDRESS);
  alert("BTC address copied");
};
const btcQR = document.getElementById("btcQR");
btcQR.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=bitcoin:${BTC_ADDRESS}`;
document.getElementById("openBtc").href = `bitcoin:${BTC_ADDRESS}`;

// ------- LIVE BALANCE: BTC -------
async function fetchBTC() {
  // Try Blockchair first
  try {
    const r = await fetch(`https://api.blockchair.com/bitcoin/dashboards/address/${BTC_ADDRESS}`);
    if (!r.ok) throw new Error("Blockchair error");
    const data = await r.json();
    const sats = data.data[BTC_ADDRESS].address.balance; // in satoshis
    const btc = (sats / 1e8).toFixed(8);
    document.getElementById("btcTotal").textContent = `${btc} BTC`;
    return;
  } catch (e) {
    // Fallback: mempool.space (returns sats)
    try {
      const r2 = await fetch(`https://mempool.space/api/address/${BTC_ADDRESS}`);
      if (!r2.ok) throw new Error("mempool error");
      const j = await r2.json();
      const sats = j.chain_stats.funded_txo_sum - j.chain_stats.spent_txo_sum;
      const btc = (sats / 1e8).toFixed(8);
      document.getElementById("btcTotal").textContent = `${btc} BTC`;
    } catch (e2) {
      document.getElementById("btcTotal").textContent = "—";
    }
  }
}

// ------- LIVE BALANCE: USDT (when provided) -------
async function fetchUSDT() {
  if (!USDT_ADDRESS || !USDT_NETWORK) return;
  const el = document.getElementById("usdtTotal");
  try {
    if (USDT_NETWORK === "TRC20") {
      // TRONSCAN TRC20 holder balance (USDT contract)
      const contract = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"; // USDT TRC20
      const url = `https://apilist.tronscanapi.com/api/account/tokens?address=${USDT_ADDRESS}&start=0&limit=100&hidden=0&show=0`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Tronscan error");
      const j = await r.json();
      const token = (j.data || []).find(t => t.tokenId === contract || t.tokenAbbr === "USDT");
      if (token) el.textContent = `${Number(token.balance)/10**token.tokenDecimal} USDT`;
      else el.textContent = "0 USDT";
    } else if (USDT_NETWORK === "ERC20") {
      // Etherscan ERC20 balance (requires API key for heavy use; works for light)
      const contract = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT ERC20
      const url = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contract}&address=${USDT_ADDRESS}&tag=latest`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("Etherscan error");
      const j = await r.json();
      if (j.status === "1") el.textContent = `${Number(j.result)/1e6} USDT`;
      else el.textContent = "—";
    }
  } catch {
    el.textContent = "—";
  }
}

// Refresh totals every 60s
fetchBTC(); fetchUSDT();
setInterval(fetchBTC, 60000);
setInterval(fetchUSDT, 60000);
