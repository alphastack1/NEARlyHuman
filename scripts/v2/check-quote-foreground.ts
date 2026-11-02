import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { keccak256, toHex, type Address, type PrivateKeyAccount, type PublicClient } from 'viem';
import { createState, encodeState } from '../../src/v2';
import { issueV2DayQuote } from '../../server/v2/quotes';
import { createV2Campaign } from '../../server/v2/budget';
import { v2DecisionConfig } from '../../server/v2/preparation';
import type { V2RuntimeIdentity } from '../../server/v2/context';
import type { DurableStore, Stored } from '../../server/storage';

// An in-memory funded quote proof. No keys, cryptographic signature, RPC, AI or real ledger.
class CountingStore implements DurableStore {
  data=new Map<string,Stored<any>>(); serial=0; historyLists=0; historyGets=0; forbidHistory=false;
  async get<T>(key:string):Promise<Stored<T>|null>{if(key.startsWith('v2/quotes/history-'))this.historyGets++;return structuredClone(this.data.get(key)||null);}
  async put<T>(key:string,value:T,condition:{etag?:string;isNew?:boolean}={}){const old=this.data.get(key);if(condition.isNew&&old||condition.etag&&old?.etag!==condition.etag)return false;this.data.set(key,{value:structuredClone(value),etag:String(++this.serial)});return true;}
  async list(prefix:string){if(prefix==='v2/quotes/'){this.historyLists++;if(this.forbidHistory)throw Error('Foreground quote must not scan history.');}return[...this.data.keys()].filter(k=>k.startsWith(prefix));}
  async delete(key:string){this.data.delete(key);}
}
const addr=(n:string)=>('0x'+n.repeat(40)) as Address,collection=addr('1'),verifier=addr('2'),module=addr('3'),relayer=addr('4'),signer=addr('5'),player=addr('6');
const rulesHash=keccak256(toHex('controlled-foreground-quote')),hash=keccak256(toHex('controlled-block'));
const runtime:V2RuntimeIdentity={chainId:31337,collection,verifier,actionModule:module,controllerCodeHash:keccak256('0x6000'),verifierCodeHash:keccak256('0x6001'),actionModuleCodeHash:keccak256('0x6002'),rulesHash,decisionConfig:v2DecisionConfig(rulesHash),relayer,quoteSigner:signer};
const base=encodeState(createState({seed:42}));let timestamp=10000n,dummySignatures=0;
const client={getChainId:async()=>31337,getBlock:async({blockNumber}:{blockNumber?:bigint}={})=>{if(blockNumber!==undefined)assert.equal(blockNumber,1n);return{number:1n,hash,timestamp};},getCode:async({address,blockNumber}:{address:Address;blockNumber:bigint})=>{assert.equal(blockNumber,1n);return address===collection?'0x6000':address===verifier?'0x6001':'0x6002';},getGasPrice:async()=>10000000n,getBalance:async({blockNumber}:{blockNumber:bigint})=>{assert.equal(blockNumber,1n);return 2000000000000000000n;},readContract:async({functionName,blockNumber}:{functionName:string;blockNumber:bigint})=>{assert.equal(blockNumber,1n);const values:Record<string,unknown>={verifier,actionModule:module,rulesHash,relayer,quoteSigner:signer,ownerOf:player,life:base,revisions:0,attempts:0,pending:'0x'+'0'.repeat(64),gasMultiplier:2,admissionsPaused:false,quoteDay:[0n,0n,30000000000n]};if(!(functionName in values))throw Error('Unexpected mocked contract read.');return values[functionName];}} as unknown as PublicClient;
const dummySigner={address:signer,signTypedData:async()=>{dummySignatures++;return('0x'+'11'.repeat(65)) as `0x${string}`;}} as unknown as PrivateKeyAccount;
const store=new CountingStore();await createV2Campaign('foreground-proof',100000,store);
for(let n=0;n<41;n++)await store.put('v2/quotes/history-'+n,{scope:`31337:${collection.toLowerCase()}:old:${n}`,campaignId:'foreground-proof',id:keccak256(toHex('old-'+n)),expiresAt:'100',status:'retired',generation:0});
store.forbidHistory=true;store.historyLists=0;store.historyGets=0;
const first=await issueV2DayQuote(client,runtime,dummySigner,{player,tokenId:1n,kitMask:0n},{campaignId:'foreground-proof',store,allowLocal:true});
timestamp+=10n;
const repeated=await issueV2DayQuote(client,runtime,dummySigner,{player,tokenId:1n,kitMask:0n},{campaignId:'foreground-proof',store,allowLocal:true});
assert.equal(store.historyLists,0);assert.equal(store.historyGets,0);assert.equal(first.admission.id,repeated.admission.id);assert.equal(BigInt(repeated.expiresAt),timestamp+120n);assert.equal(dummySignatures,2);
const campaign=(await store.get<any>('v2/ai-campaigns/foreground-proof'))!.value;
assert.equal(Object.keys(campaign.jobs).length,1);assert.equal(campaign.chargedMicroUSD,0);assert.equal(campaign.jobs[first.fundingId].active,true);
assert.equal([...store.data.keys()].filter(k=>k.startsWith('v2/quotes/history-')).length,41);
const report={scope:'Controlled in-memory funded admission with41 retired quote records. Dummy signature only; no actual quote/RPC/provider/key/financial-store operation.',historyRecords:41,foregroundHistoryLists:store.historyLists,foregroundHistoryGets:store.historyGets,repeatedScopeSameId:true,renewedExpiryAtPinnedTime:true,activeJobHolds:1,chargedMicroUSD:0,dummySignatures,pass:true};
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});writeFileSync(new URL('../../TEMP/v2-checks/quote-foreground.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
