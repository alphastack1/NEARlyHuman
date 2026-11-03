import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { baseEncode } from 'near-api-js';
import { actions, executeNearOperation, operatorRpc } from './operator';

const filename='contracts/near/deployments/testnet.json',current=JSON.parse(await fs.readFile(filename,'utf8'));
const build=JSON.parse(await fs.readFile('contracts/near/artifacts/build.json','utf8')),wasm=await fs.readFile('contracts/near/artifacts/nearlyhuman_near.wasm');
const sha256=createHash('sha256').update(wasm).digest('hex'),codeHash=baseEncode(createHash('sha256').update(wasm).digest());
if(build.sha256!==sha256||!WebAssembly.validate(wasm))throw Error('The native upgrade artifact is not verified.');
for(const relative of ['src/lib.rs','src/kernel.rs','Cargo.toml','Cargo.lock'])if(build.sources[relative]!==createHash('sha256').update(await fs.readFile('contracts/near/'+relative)).digest('hex'))throw Error('Native source changed after build.');
const operation=process.argv.find(arg=>arg.startsWith('--operation='))?.slice(12);
async function stateDigest(blockHash:string){
 const view=await operatorRpc<{values:Array<{key:string;value:string}>;block_hash:string}>('query',{request_type:'view_state',account_id:current.runtime.collection,prefix_base64:'',block_id:blockHash});
 assert.equal(view.block_hash,blockHash);
 const values=view.values.map(({key,value})=>({key,value})).sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
 return {sha256:createHash('sha256').update(JSON.stringify(values)).digest('hex'),entries:values.length};
}
async function snapshot(){
 const block=await operatorRpc<{header:{hash:string; height:number}}>('block',{finality:'final'});
 const view=async(method:string)=>{const result=await operatorRpc<{result:number[];block_hash:string}>('query',{request_type:'call_function',account_id:current.runtime.collection,method_name:method,args_base64:'e30=',block_id:block.header.hash});assert.equal(result.block_hash,block.header.hash);return JSON.parse(Buffer.from(result.result).toString('utf8'));};
 const [account,config,supply,state]=await Promise.all([
  operatorRpc<{code_hash:string;storage_usage:number;amount:string;block_hash:string}>('query',{request_type:'view_account',account_id:current.runtime.collection,block_id:block.header.hash}),view('config'),view('nft_total_supply'),stateDigest(block.header.hash),
 ]);
 assert.equal(account.block_hash,block.header.hash);
 return {block:block.header,account,config,supply,state};
}
if(!process.argv.includes('--broadcast'))console.log(JSON.stringify({mode:'dry-run',account:current.runtime.collection,oldCodeHash:current.runtime.codeHash,newCodeHash:codeHash,sha256,bytes:wasm.length,initialization:false}));
else{
 if(!process.argv.includes('--gate=native-testnet-integration')||!operation||!/^upgrade-[a-z\d-]{1,60}$/.test(operation))throw Error('Explicit native testnet code-upgrade scope required.');
 process.env.NEARLYHUMAN_NEAR_QA_WALLET='1';
 const before=await snapshot();
 if(before.account.code_hash!==current.runtime.codeHash&&before.account.code_hash!==codeHash)throw Error('The deployed native code changed unexpectedly.');
 if(current.runtime.codeHash===codeHash){console.log(JSON.stringify({alreadyUpgraded:true,account:current.runtime.collection,codeHash,nftSupply:before.supply,newSignature:false,recordChanged:false}));process.exit(0);}
 // Reviewing real lives requires paused admissions and zero pending-day rent,
 // then a byte-for-byte digest of ALL contract data, including NFT/FT ledgers,
 // old requests and history. Deploying code never initializes or migrates it.
 if(before.supply!=='0'&&(!process.argv.includes('--review-live-state')||before.config.admissions_paused!==true||before.config.native_storage_reserved!=='0'))throw Error('Pause and drain native admissions, then explicitly review the existing state.');
 const result=await executeNearOperation({id:operation,role:'contract',receiver:current.runtime.collection,actions:[actions.deployContract(wasm)]});
 const after=await snapshot();
 assert.equal(after.account.code_hash,codeHash);assert.deepEqual(after.config,before.config);assert.equal(after.supply,before.supply);assert.deepEqual(after.state,before.state);
 const previousArtifact=current.artifact.sha256==='99f30e7aee1151218b6cbe8eab8e4bcc8ac13d077b92825dd4c9e814184c40ca'?{...current.artifact,path:'contracts/near/artifacts/history/mind7/nearlyhuman_near.wasm'}:current.artifact;
 const previous={transaction:current.deploymentTransaction,codeHash:current.runtime.codeHash,artifact:previousArtifact,deployedAtUtc:current.deployedAtUtc,...(current.artifact.sha256==='99f30e7aee1151218b6cbe8eab8e4bcc8ac13d077b92825dd4c9e814184c40ca'?{sourceCommit:'768aff93f3f59f721cf925eea3efb07da674fbe4'}:{})};
 const record={...current,initializationTransaction:current.initializationTransaction||current.deploymentTransaction,history:[...(current.history||[]),previous],deploymentTransaction:result.hash,deployedAtUtc:new Date().toISOString(),runtime:{...current.runtime,codeHash},artifact:{path:'contracts/near/artifacts/nearlyhuman_near.wasm',sha256,bytes:wasm.length},observedBlock:String(after.block.height),observedBlockHash:after.block.hash,storageUsage:after.account.storage_usage,contractBalanceYoctoNEAR:after.account.amount,config:after.config,upgradeStateProof:{beforeBlock:String(before.block.height),beforeBlockHash:before.block.hash,afterBlock:String(after.block.height),afterBlockHash:after.block.hash,...after.state,nftSupply:after.supply,preserved:true}};
 await fs.writeFile(filename,JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify({upgraded:true,account:current.runtime.collection,hash:result.hash,codeHash,storageUsage:after.account.storage_usage,statePreserved:true,nftSupply:after.supply,stateDigest:after.state.sha256}));
}
