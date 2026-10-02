const test = require('node:test');
const assert = require('node:assert/strict');
const {parseBlock, baseProjects} = require('../monitor');
test('RPC errors and invalid payloads are never reported as block data', () => {
 assert.equal(parseBlock({result:'0x123'}), '291');
 for (const payload of [{error:{message:'failed'}}, {result:'garbage'}, {}, null]) assert.throws(() => parseBlock(payload));
});
test('multi-chain protocol entries include Base and invalid data fails visibly', () => {
 assert.deepEqual(baseProjects([{name:'one',chains:['Ethereum','Base']},{name:'two',chain:'Base'},{name:'other',chain:'Ethereum'},null]),[{name:'one',url:''},{name:'two',url:''}]);
 assert.throws(()=>baseProjects({error:'failed'}));
});
