#!/usr/bin/env node
// Reads the agent wallet from the public Solana chain and writes state/wallet.json.
// Read-only: needs only the public address. No keys, no dependencies (Node 18+).
//
// Usage: node scripts/wallet.mjs [--address <pubkey>] [--max-new <n>]

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));
const outFile = path.join(root, 'state', 'wallet.json');

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const address = argValue('--address') || config.wallet_address;
const maxNew = Number(argValue('--max-new') || 40);
const rpcUrl = process.env.SOLANA_RPC_URL || config.rpc_url;
const USDC = config.usdc_mint;

if (!address || address.startsWith('REPLACE')) {
  console.error('No wallet address set in config.json');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rpc(method, params, attempt = 0) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (res.status === 429 && attempt < 5) {
    await sleep(1000 * 2 ** attempt);
    return rpc(method, params, attempt + 1);
  }
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

async function solPrice(previous) {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const body = await res.json();
    if (typeof body?.solana?.usd === 'number') return { price: body.solana.usd, source: 'coingecko' };
  } catch {}
  return { price: previous ?? null, source: previous ? 'previous' : 'unavailable' };
}

let previous = { transfers: [] };
try {
  previous = JSON.parse(await readFile(outFile, 'utf8'));
} catch {}
const known = new Map((previous.transfers || []).map((t) => [t.signature, t]));

const lamports = (await rpc('getBalance', [address, { commitment: 'confirmed' }])).value;
const sol = lamports / 1e9;

const tokenAccounts = (
  await rpc('getTokenAccountsByOwner', [address, { mint: USDC }, { encoding: 'jsonParsed', commitment: 'confirmed' }])
).value;
const usdc = tokenAccounts.reduce((sum, a) => sum + (a.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);

// USDC lands in the token account, not the main address, so watch both.
const watched = [address, ...tokenAccounts.map((a) => a.pubkey)];
const signatures = new Map();
for (const acct of watched) {
  const sigs = await rpc('getSignaturesForAddress', [acct, { limit: 100, commitment: 'confirmed' }]);
  for (const s of sigs) if (!s.err) signatures.set(s.signature, s);
}

const fresh = [...signatures.values()]
  .filter((s) => !known.has(s.signature))
  .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0))
  .slice(0, maxNew);

for (const s of fresh) {
  const tx = await rpc('getTransaction', [
    s.signature,
    { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'confirmed' },
  ]);
  if (!tx) continue;
  const keys = tx.transaction.message.accountKeys.map((k) => (typeof k === 'string' ? k : k.pubkey));
  const idx = keys.indexOf(address);
  const solDelta = idx >= 0 ? (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / 1e9 : 0;
  const tokenAmount = (list) =>
    (list || [])
      .filter((b) => b.owner === address && b.mint === USDC)
      .reduce((sum, b) => sum + (b.uiTokenAmount.uiAmount || 0), 0);
  const usdcDelta = tokenAmount(tx.meta.postTokenBalances) - tokenAmount(tx.meta.preTokenBalances);
  const memos = tx.transaction.message.instructions
    .filter((ix) => ix.program === 'spl-memo' && typeof ix.parsed === 'string')
    .map((ix) => ix.parsed);
  known.set(s.signature, {
    signature: s.signature,
    time: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
    direction: usdcDelta > 0 || (usdcDelta === 0 && solDelta > 0) ? 'in' : 'out',
    usdc_delta: Math.round(usdcDelta * 1e6) / 1e6,
    sol_delta: Math.round(solDelta * 1e9) / 1e9,
    fee_sol: idx === 0 ? tx.meta.fee / 1e9 : 0,
    memos,
    // Solana Pay puts each order's reference key in the account list.
    accounts: keys,
  });
  await sleep(250);
}

const price = await solPrice(previous.sol_usd_price);
const totalUsd = price.price == null ? null : Math.round((usdc + sol * price.price) * 100) / 100;

const wallet = {
  checked_at: new Date().toISOString(),
  address,
  sol,
  usdc,
  sol_usd_price: price.price,
  price_source: price.source,
  total_usd: totalUsd,
  token_accounts: tokenAccounts.map((a) => a.pubkey),
  unprocessed_signatures: Math.max(0, [...signatures.keys()].filter((k) => !known.has(k)).length),
  transfers: [...known.values()].sort((a, b) => (b.time || '').localeCompare(a.time || '')).slice(0, 300),
};

await writeFile(outFile, JSON.stringify(wallet, null, 2) + '\n');
console.log(
  `capital $${totalUsd ?? '?'} | ${usdc} USDC + ${sol} SOL @ $${price.price ?? '?'} | ${fresh.length} new tx | ${wallet.unprocessed_signatures} not yet fetched`
);
