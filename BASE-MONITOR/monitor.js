require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const LOG_DIR = path.join(__dirname, 'logs');
const DATA_FILE = path.join(__dirname, 'tracked_projects.json');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ tracked: [], seen: [] }, null, 2));

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'BaseMonitor/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(LOG_DIR, 'monitor.log'), line + '\n');
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function checkBaseStats() {
  try {
    const payload = JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: []
    });
    const parsed = new URL('https://mainnet.base.org');
    const blockNum = await new Promise((resolve, reject) => {
      const req = https.request('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(parseInt(JSON.parse(data).result, 16)); }
          catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
    log(`Base latest block: ${blockNum}`);
    return blockNum;
  } catch (e) {
    log(`RPC error: ${e.message}`);
    return null;
  }
}

async function checkNewProjects() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const seen = new Set(data.seen);

  const sources = [
    'https://api.llama.fi/protocols'
  ];

  for (const src of sources) {
    try {
      const res = await fetch(src);
      if (Array.isArray(res)) {
        for (const item of res) {
          if (item.chain === 'Base' || (item.name && item.chain === 'Base')) {
            const name = item.name || item.id;
            if (!seen.has(name)) {
              seen.add(name);
              data.tracked.push({
                name,
                source: src,
                discovered: new Date().toISOString(),
                url: item.url || item.twitter || ''
              });
              log(`NEW PROJECT FOUND: ${name}`);
            }
          }
        }
      }
    } catch (e) {
      log(`Fetch error from ${src}: ${e.message}`);
    }
  }

  data.seen = Array.from(seen);
  saveData(data);

  const today = data.tracked.filter(t => {
    const d = new Date(t.discovered);
    return (Date.now() - d.getTime()) < 86400000;
  });
  if (today.length > 0) {
    log(`=== NEW TODAY (${today.length}) ===`);
    today.forEach(p => log(`  - ${p.name}${p.url ? ` (${p.url})` : ''}`));
  }
}

async function runMonitor() {
  log('=== Base Monitor Started ===');
  log(`Time: ${new Date().toISOString()}`);
  await checkBaseStats();
  await checkNewProjects();
  log('=== Base Monitor Finished ===\n');
}

runMonitor().catch(e => log(`Fatal: ${e.message}`));
