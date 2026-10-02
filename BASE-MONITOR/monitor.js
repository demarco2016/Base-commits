const fs = require('node:fs');
const path = require('node:path');
const DATA_FILE = path.join(__dirname, '.local', 'tracked_projects.json');

async function requestJSON(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
function parseBlock(payload) {
  if (!payload || payload.error || typeof payload.result !== 'string' || !/^0x[0-9a-f]+$/i.test(payload.result)) throw new Error('Invalid RPC block response');
  return BigInt(payload.result).toString();
}
function baseProjects(payload) {
  if (!Array.isArray(payload)) throw new Error('Invalid protocol list');
  return payload.filter(item => item && (item.chain === 'Base' || (Array.isArray(item.chains) && item.chains.includes('Base'))))
    .filter(item => typeof item.name === 'string' && item.name.trim())
    .map(item => ({ name: item.name, url: typeof item.url === 'string' ? item.url : '' }));
}
async function runMonitor(request = requestJSON) {
  let failed = false;
  try {
    const block = parseBlock(await request('https://mainnet.base.org', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_blockNumber',params:[]}) }));
    console.log(`Base latest block: ${block}`);
  } catch (error) { console.error(`Block data unavailable: ${error.message}`); failed = true; }
  try {
    const projects = baseProjects(await request('https://api.llama.fi/protocols'));
    let previous = [];
    try {
      previous = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')).tracked;
      if (!Array.isArray(previous)) throw new Error('Invalid local tracked data');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const seen = new Set(previous.map(item => item.name));
    const discovered = [];
    for (const project of projects) {
      if (seen.has(project.name)) continue;
      seen.add(project.name);
      discovered.push({...project, discovered: new Date().toISOString()});
      console.log(`New to local dataset: ${project.name}`);
    }
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const temp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(temp, JSON.stringify({tracked:[...previous,...discovered]}, null, 2));
    fs.renameSync(temp, DATA_FILE);
    console.log(`Retrieved ${projects.length} Base protocol entries from DefiLlama; listing is not a safety assessment.`);
  } catch (error) { console.error(`Protocol data unavailable: ${error.message}`); failed = true; }
  return failed ? 1 : 0;
}
module.exports = { requestJSON, parseBlock, baseProjects, runMonitor };
if (require.main === module) runMonitor().then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 1; });
