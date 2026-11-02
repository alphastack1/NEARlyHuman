import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { keccak256, toHex, type Address, type PrivateKeyAccount, type PublicClient } from 'viem';
import { createState, encodeState } from '../../src/v2';
import { issueV2DayQuote, calculateV2ProcessingFee } from '../../server/v2/quotes';
import { v2DecisionConfig } from '../../server/v2/preparation';
import type { V2RuntimeIdentity } from '../../server/v2/context';
import { ServiceError } from '../../server/chain';
import type { DurableStore, Stored } from '../../server/storage';

// Controlled verified-world-shaped reads only. No RPC, wallet, provider or real store.
const address = (s: string) => ('0x' + s.repeat(40)) as Address;
const collection = address('1'), verifier = address('2'), module = address('3'), relayer = address('4'), signer = address('5'), player = address('6');
const rulesHash = keccak256(toHex('controlled-quote-funds')), hash = keccak256(toHex('controlled-pinned-block'));
const runtime: V2RuntimeIdentity = { chainId:31337, collection, verifier, actionModule:module, controllerCodeHash:keccak256('0x6000'), verifierCodeHash:keccak256('0x6001'), actionModuleCodeHash:keccak256('0x6002'), rulesHash, decisionConfig:v2DecisionConfig(rulesHash), relayer, quoteSigner:signer };
const base = encodeState(createState({seed:42})), gasPrice = 10000000n;
const fees = calculateV2ProcessingFee({requestGas:1200000n,relayGas:6000000n,gasPrice,multiplier:2,inferenceReserveWei:0n});
const required = fees.processingFee + fees.networkEstimate * 2n;
class NoWrites implements DurableStore {
  reads = 0; writes = 0; lists = 0; deletes = 0;
  async get<T>(_key:string):Promise<Stored<T>|null>{this.reads++;return null;}
  async put<T>(_key:string,_value:T){this.writes++;throw Error('An unfunded player must not reserve a record.');return false;}
  async list(_prefix:string){this.lists++;return [];}
  async delete(_key:string){this.deletes++;throw Error('No deletion allowed.');}
}
const result:any[]=[];
for(const playerBalance of[0n,required-1n]){
  const store=new NoWrites(),balanceReads:any[]=[];let signatures=0;
  const client={
    getChainId:async()=>31337,
    getBlock:async({blockNumber}:{blockNumber?:bigint}={})=>{if(blockNumber!==undefined)assert.equal(blockNumber,1n);return{number:1n,hash,timestamp:10000n};},
    getCode:async({address:blockAddress,blockNumber}:{address:Address;blockNumber:bigint})=>{assert.equal(blockNumber,1n);return blockAddress===collection?'0x6000':blockAddress===verifier?'0x6001':'0x6002';},
    getGasPrice:async()=>gasPrice,
    getBalance:async(args:{address:Address;blockNumber:bigint})=>{assert.equal(args.blockNumber,1n);balanceReads.push(args);return args.address===player?playerBalance:2000000000000000000n;},
    readContract:async(args:{functionName:string;blockNumber:bigint})=>{
      assert.equal(args.blockNumber,1n);
      const values:Record<string,unknown>={verifier,actionModule:module,rulesHash,relayer,quoteSigner:signer,ownerOf:player,life:base,revisions:0,attempts:0,pending:'0x'+'0'.repeat(64),gasMultiplier:2,admissionsPaused:false,quoteDay:[0n,0n,30000000000n]};
      if(!(args.functionName in values))throw Error('Unexpected mocked contract method.');return values[args.functionName];
    },
  } as unknown as PublicClient;
  const account={address:signer,signTypedData:async()=>{signatures++;throw Error('No signature expected.');}} as unknown as PrivateKeyAccount;
  await assert.rejects(issueV2DayQuote(client,runtime,account,{player,tokenId:1n,kitMask:0n},{campaignId:'unfunded-player-proof',store,allowLocal:true}),error=>error instanceof ServiceError&&error.code==='funds');
  assert(balanceReads.some(r=>r.address===player&&r.blockNumber===1n));
  assert.equal(store.reads+store.writes+store.lists+store.deletes+signatures,0);
  result.push({playerBalance:playerBalance.toString(),required:required.toString(),code:'funds',pinnedPlayerBalance:true,storeOperations:0,signatures:0,pass:true});
}
mkdirSync(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});
writeFileSync(new URL('../../TEMP/v2-checks/quote-funds.json',import.meta.url),JSON.stringify({scope:'Controlled quote-input proof; no actual quote/RPC/provider/wallet/financial-store operation.',cases:result,pass:true},null,2));
console.log(JSON.stringify({tests:result.length,pass:true,storeOperations:0,signatures:0,networkRequests:0}));
