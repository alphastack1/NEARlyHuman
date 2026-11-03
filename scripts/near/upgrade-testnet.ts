import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { baseEncode } from 'near-api-js';
import { actions, executeNearOperation, operatorRpc, operatorView } from './operator';

const filename='contracts/near/deployments/testnet.json',current=JSON.parse(await fs.readFile(filename,'utf8'));
const build=JSON.parse(await fs.readFile('contracts/near/artifacts/build.json','utf8')),wasm=await fs.readFile('contracts/near/artifacts/nearlyhuman_near.wasm');
const sha256=createHash('sha256').update(wasm).digest('hex'),codeHash=baseEncode(createHash('sha256').update(wasm).digest());
if(build.sha256!==sha256||!WebAssembly.validate(wasm))throw Error('The native upgrade artifact is not verified.');
for(const relative of ['src/lib.rs','src/kernel.rs','Cargo.toml','Cargo.lock'])if(build.sources[relative]!==createHash('sha256').update(await fs.readFile('contracts/near/'+relative)).digest('hex'))throw Error('Native source changed after build.');
const operation=process.argv.find(arg=>arg.startsWith('--operation='))?.slice(12);
if(!process.argv.includes('--broadcast'))console.log(JSON.stringify({mode:'dry-run',account:current.runtime.collection,oldCodeHash:current.runtime.codeHash,newCodeHash:codeHash,sha256,bytes:wasm.length,initialization:false}));
else{
 if(!process.argv.includes('--gate=native-testnet-integration')||!operation||!/^upgrade-[a-z\d-]{1,60}$/.test(operation))throw Error('Explicit native testnet code-upgrade scope required.');
 process.env.NEARLYHUMAN_NEAR_QA_WALLET='1';
 const account=await operatorRpc<{code_hash:string}>('query',{request_type:'view_account',finality:'final',account_id:current.runtime.collection});
 if(account.code_hash!==current.runtime.codeHash&&account.code_hash!==codeHash)throw Error('The deployed native code changed unexpectedly.');
 const before=await operatorView(current.runtime.collection,'config'),supplyBefore=await operatorView(current.runtime.collection,'nft_total_supply');
 // This first integration upgrade is deliberately confined to an empty
 // candidate. Never reinitialize, migrate or clear accepted game/financial state.
 if(supplyBefore!=='0')throw Error('Drain and review real native lives before an upgrade.');
 const result=await executeNearOperation({id:operation,role:'contract',receiver:current.runtime.collection,actions:[actions.deployContract(wasm)]});
 const [after,config,supplyAfter]=await Promise.all([
  operatorRpc<{code_hash:string;storage_usage:number;amount:string;block_height:number;block_hash:string}>('query',{request_type:'view_account',finality:'final',account_id:current.runtime.collection}),
  operatorView(current.runtime.collection,'config'),operatorView(current.runtime.collection,'nft_total_supply'),
 ]);
 assert.equal(after.code_hash,codeHash);assert.deepEqual(config,before);assert.equal(supplyAfter,supplyBefore);
 const previous={transaction:current.deploymentTransaction,codeHash:current.runtime.codeHash,artifact:current.artifact,deployedAtUtc:current.deployedAtUtc};
 const record={...current,initializationTransaction:current.initializationTransaction||current.deploymentTransaction,history:[...(current.history||[]),previous],deploymentTransaction:result.hash,deployedAtUtc:new Date().toISOString(),runtime:{...current.runtime,codeHash},artifact:{path:'contracts/near/artifacts/nearlyhuman_near.wasm',sha256,bytes:wasm.length},observedBlock:String(after.block_height),observedBlockHash:after.block_hash,storageUsage:after.storage_usage,contractBalanceYoctoNEAR:after.amount,config};
 await fs.writeFile(filename,JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify({upgraded:true,account:current.runtime.collection,hash:result.hash,codeHash,storageUsage:after.storage_usage,statePreserved:true,nftSupply:supplyAfter}));
}
