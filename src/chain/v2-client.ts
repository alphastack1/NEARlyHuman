import { createPublicClient,createWalletClient,custom,defineChain,parseAbi,parseEventLogs,encodeFunctionData,keccak256,recoverTypedDataAddress,type Address,type Hex,type EIP1193Provider,type TransactionReceipt } from 'viem';
import { chainFor } from './config';
import { v2HttpTransport } from './v2-transport';
import { networkForConfig } from './networks';
import { v2AdmissionTypedData } from './v2-admission';
import type { V2PublicConfig,V2OwnerQuote } from '../v2/public';

export const v2Abi=parseAbi([
 'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)',
 'event DayAccepted(bytes32 indexed id,uint256 indexed tokenId,address indexed player,uint256 reservedReward,bool shipping,bytes32 daySeed)',
 'function verifier() view returns(address)','function rulesHash() view returns(bytes32)','function relayer() view returns(address)','function quoteSigner() view returns(address)',
 'function nativeMintPrice() view returns(uint256)','function token() view returns(address)','function ownerOf(uint256 id) view returns(address)','function pending(uint256 id) view returns(bytes32)',
 'function purse(uint256 id) view returns(uint256)','function purseNonce(uint256 id) view returns(uint256)','function gasMultiplier() view returns(uint16)',
 'function mintNFT(string name,uint8[3] stats) payable returns(uint256)',
 'function acceptDay((bytes32 id,address player,uint256 tokenId,uint32 baseRevision,uint64 kitMask,bool shipping,uint256 processingFee,uint16 multiplier,uint64 expiresAt,bytes32 decisionConfig) a,bytes signature) payable',
 'function withdraw(uint256 id,uint256 amount)','function birthFromPurse(uint256 source,uint256 expectedNonce,string name,uint8[3] stats) returns(uint256)',
 'function birthFromWallet(string name,uint8[3] stats) returns(uint256)','function expire(bytes32 id)',
 'function ownedTokens(address holder,uint256 cursor,uint256 limit) view returns(uint256[] ids,uint256 next)',
]);
const tokenAbi=parseAbi(['function balanceOf(address holder) view returns(uint256)','function allowance(address holder,address spender) view returns(uint256)','function approve(address spender,uint256 amount) returns(bool)']);
const moduleAbi=parseAbi(['function actionModule() view returns(address)']);
const equal=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
const zero='0x0000000000000000000000000000000000000000';
function chain(config:V2PublicConfig){if(config.chainId===31337&&/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(config.rpcUrl))return defineChain({id:31337,name:'Local test world',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[config.rpcUrl]}},testnet:true});const network=networkForConfig(config);if(config.chainId!==46630||!config.testnet||!network||config.networkId&&config.networkId!==network.id)throw new V2WalletError('network','Choose Robinhood Testnet.');return chainFor(46630);}
export type V2Stats=readonly[number,number,number];
export interface V2SubmissionIntent {account:Address;chainId:number;collection:Address;to?:Address;nonce:number;fromBlock:string;data:Hex;value:string}
export class V2WalletError extends Error {constructor(public code:string,message:string,public intent?:V2SubmissionIntent){super(message);}}
export function isV2WalletRejected(error:unknown){let e=error as {code?:unknown;cause?:unknown}|undefined;for(let depth=0;e&&depth<12;depth++,e=e.cause as typeof e)if(e.code===4001||e.code==='ACTION_REJECTED')return true;return false;}
export type V2OwnerReceipt=TransactionReceipt&{replacementReason?:'repriced'|'cancelled'|'replaced';originalHash:Hex};
export function createV2ChainReader(config:V2PublicConfig){
 const client=createPublicClient({chain:chain(config),transport:v2HttpTransport(config.rpcUrl,{timeout:15000,retryCount:1}),cacheTime:0}),at={address:config.collection,abi:v2Abi};
 return {client,config,balance:(owner:Address)=>client.getBalance({address:owner}),tokenBalance:(owner:Address)=>client.readContract({address:config.token,abi:tokenAbi,functionName:'balanceOf',args:[owner]}),
  ownerOf:(id:bigint)=>client.readContract({...at,functionName:'ownerOf',args:[id]}),purse:(id:bigint)=>client.readContract({...at,functionName:'purse',args:[id]}),purseNonce:(id:bigint)=>client.readContract({...at,functionName:'purseNonce',args:[id]}),
  async wait(hash:Hex):Promise<V2OwnerReceipt>{let replacementReason:V2OwnerReceipt['replacementReason'];const receipt=await client.waitForTransactionReceipt({hash,confirmations:1,timeout:120000,onReplaced:e=>{replacementReason=e.reason;}});if(replacementReason==='cancelled'||replacementReason==='replaced')throw new V2WalletError(replacementReason,'That wallet payment was changed.');if(receipt.status!=='success')throw new V2WalletError('reverted','That payment did not complete.');const block=await client.getBlock({blockNumber:receipt.blockNumber});if(block.hash!==receipt.blockHash)throw new V2WalletError('uncertain','Checking that payment again.');return {...receipt,originalHash:hash,replacementReason};},
 };
}
export function mintedId(receipt:TransactionReceipt,config?:V2PublicConfig,owner?:Address):bigint|undefined{
 const logs=receipt.logs.filter(l=>!config||equal(l.address,config.collection));
 return parseEventLogs({abi:v2Abi,logs,eventName:'Transfer'}).filter(e=>equal(e.args.from,zero)&&(!owner||equal(e.args.to,owner)))[0]?.args.tokenId;
}
export function acceptedV2Day(receipt:TransactionReceipt,config:V2PublicConfig,requestId?:Hex){return parseEventLogs({abi:v2Abi,logs:receipt.logs.filter(l=>equal(l.address,config.collection)),eventName:'DayAccepted'}).find(e=>!requestId||equal(e.args.id,requestId))?.args;}
export async function verifyV2WalletWorld(config:V2PublicConfig){
 const {client}=createV2ChainReader(config),block=await client.getBlock(),at={address:config.collection,abi:v2Abi,blockNumber:block.number!};
 if(!config.controllerCodeHash||!config.verifier||!config.actionModule||!config.verifierCodeHash||!config.actionModuleCodeHash||!config.relayer||!config.quoteSigner)throw new V2WalletError('connection','Checking the home connection.');
 const [chainId,code,verifierCode,moduleCode,verifier,module,rules,relay,signer,token]=await Promise.all([client.getChainId(),client.getCode({address:config.collection,blockNumber:block.number!}),client.getCode({address:config.verifier,blockNumber:block.number!}),client.getCode({address:config.actionModule,blockNumber:block.number!}),client.readContract({...at,functionName:'verifier'}),client.readContract({address:config.verifier,abi:moduleAbi,functionName:'actionModule',blockNumber:block.number!}),client.readContract({...at,functionName:'rulesHash'}),client.readContract({...at,functionName:'relayer'}),client.readContract({...at,functionName:'quoteSigner'}),client.readContract({...at,functionName:'token'})]);
 if(chainId!==config.chainId||!code||keccak256(code)!==config.controllerCodeHash||!verifierCode||keccak256(verifierCode)!==config.verifierCodeHash||!moduleCode||keccak256(moduleCode)!==config.actionModuleCodeHash||!equal(verifier,config.verifier)||!equal(module,config.actionModule)||rules!==config.rulesHash||!equal(relay,config.relayer)||!equal(signer,config.quoteSigner)||!equal(token,config.token)||(await client.getBlock({blockNumber:block.number!})).hash!==block.hash)throw new V2WalletError('connection','The home connection needs another check.');
}
export function createV2OwnerWallet(provider:EIP1193Provider,config:V2PublicConfig,account:Address,onIntent?:(intent:V2SubmissionIntent)=>void){
 const configuredChain=chain(config),client=createWalletClient({account,chain:configuredChain,transport:custom(provider)}),reader=createV2ChainReader(config),at={address:config.collection,abi:v2Abi};
 async function guard(){const [accounts,chainId]=await Promise.all([provider.request({method:'eth_accounts'}),provider.request({method:'eth_chainId'})]);if(!Array.isArray(accounts)||typeof accounts[0]!=='string'||!equal(accounts[0],account)||Number(chainId)!==config.chainId)throw new V2WalletError('wallet','Reconnect this wallet to continue.');await verifyV2WalletWorld(config);}
 async function send(to:Address,data:Hex,value=0n,submit?:(request:{gas:bigint;nonce:number})=>Promise<Hex>){
  await guard();
  // Estimate before creating an ambiguous submission. A failed preflight is safe to amend.
  let estimate:bigint;try{estimate=await reader.client.estimateGas({account,to,data,value});}catch(error){if(/insufficient funds|funds for gas|exceeds the balance/i.test(error instanceof Error?error.message:''))throw new V2WalletError('funds','This wallet needs test ETH.');throw new V2WalletError('preflight','The home changed. Check it again.');}
  const [nonce,fromBlock,balance,price]=await Promise.all([reader.client.getTransactionCount({address:account,blockTag:'pending'}),reader.client.getBlockNumber(),reader.client.getBalance({address:account}),reader.client.getGasPrice()]);
  const gas=estimate*125n/100n+20000n;if(balance<value+gas*price*2n)throw new V2WalletError('funds','This wallet needs test ETH.');
  const intent:V2SubmissionIntent={account,chainId:config.chainId,collection:config.collection,to,nonce,fromBlock:fromBlock.toString(),data,value:value.toString()};onIntent?.(intent);
  try{return await (submit?submit({gas,nonce}):client.sendTransaction({to,data,value,gas,nonce}));}catch(e){if(isV2WalletRejected(e))throw new V2WalletError('ACTION_REJECTED','No problem. Nothing was sent.');const error=e as Error&{intent?:V2SubmissionIntent};error.intent=intent;throw error;}
 }
 const write=(functionName:'mintNFT'|'acceptDay'|'expire'|'withdraw'|'birthFromPurse'|'birthFromWallet',args:readonly unknown[],value=0n)=>{const frozen=structuredClone(args),data=encodeFunctionData({abi:v2Abi,functionName,args:frozen as never});return send(config.collection,data,value,({gas,nonce})=>client.writeContract({...at,functionName,args:frozen,value,gas,nonce} as never));};
 const wallet={account,client,reader,
  async switchNetwork(){if(Number(await provider.request({method:'eth_chainId'}))===config.chainId)return;try{await client.switchChain({id:config.chainId});}catch(e){const x=e as {code?:number;cause?:{code?:number}};if(x.code!==4902&&x.cause?.code!==4902)throw e;await client.addChain({chain:configuredChain});await client.switchChain({id:config.chainId});}},
  signMessage:async(message:string)=>{await guard();return client.signMessage({message});},
  mint:async(name:string,stats:V2Stats)=>{const price=await reader.client.readContract({...at,functionName:'nativeMintPrice'});if(price!==BigInt(config.nativeMintPrice))throw new V2WalletError('price','The hatch price changed. Check it again.');return write('mintNFT',[name.trim().toUpperCase(),stats],price);},
  async accept(quote:V2OwnerQuote){const a={...quote.admission,tokenId:BigInt(quote.admission.tokenId),kitMask:BigInt(quote.admission.kitMask),processingFee:BigInt(quote.admission.processingFee),expiresAt:BigInt(quote.admission.expiresAt)};if(!equal(a.player,account)||a.decisionConfig!==config.decisionConfig||BigInt(quote.value)!==a.processingFee)throw new V2WalletError('quote','Check these supplies again.');const signer=await recoverTypedDataAddress({...v2AdmissionTypedData(config.chainId,config.collection,a),signature:quote.signature});if(!config.quoteSigner||!equal(signer,config.quoteSigner))throw new V2WalletError('quote','Check this day estimate again.');return write('acceptDay',[a,quote.signature],a.processingFee);},
  expire:(id:Hex)=>write('expire',[id]),withdraw:(id:string|bigint,amount:string|bigint)=>write('withdraw',[BigInt(id),BigInt(amount)]),
  birthFromPurse:(id:string|bigint,nonce:string|bigint,name:string,stats:V2Stats)=>write('birthFromPurse',[BigInt(id),BigInt(nonce),name.trim().toUpperCase(),stats]),
  tokenAllowance:()=>reader.client.readContract({address:config.token,abi:tokenAbi,functionName:'allowance',args:[account,config.collection]}),
  approveBirthTokens:()=>send(config.token,encodeFunctionData({abi:tokenAbi,functionName:'approve',args:[config.collection,250000000n]}),0n,({gas,nonce})=>client.writeContract({address:config.token,abi:tokenAbi,functionName:'approve',args:[config.collection,250000000n],gas,nonce})),
  async birthFromWallet(name:string,stats:V2Stats){await guard();const allowance=await reader.client.readContract({address:config.token,abi:tokenAbi,functionName:'allowance',args:[account,config.collection]});if(allowance<250000000n)throw new V2WalletError('approval_required','Approve NHC to hatch this life.');return write('birthFromWallet',[name.trim().toUpperCase(),stats]);},
  wait:reader.wait,balance:()=>reader.balance(account),tokenBalance:()=>reader.tokenBalance(account),
 };
 return {...wallet,acceptDay:wallet.accept};
}
export async function connectV2Wallet(provider:EIP1193Provider,config:V2PublicConfig,onIntent?:(intent:V2SubmissionIntent)=>void){
 chain(config); // Reject an unsupported world before asking for wallet access.
 const accounts=await provider.request({method:'eth_requestAccounts'});if(!Array.isArray(accounts)||!/^0x[0-9a-f]{40}$/i.test(accounts[0]||''))throw new V2WalletError('wallet','Choose a wallet to continue.');
 const wallet=createV2OwnerWallet(provider,config,accounts[0] as Address,onIntent);await wallet.switchNetwork();await verifyV2WalletWorld(config);
 // A switch acknowledgement is not enough: wallet/account changes can happen
 // while the public contract checks are in flight. Adopt only the final state.
 const [currentAccounts,currentChain]=await Promise.all([provider.request({method:'eth_accounts'}),provider.request({method:'eth_chainId'})]);
 if(Number(currentChain)!==config.chainId)throw new V2WalletError('network','Choose Robinhood Testnet in your wallet.');
 if(!Array.isArray(currentAccounts)||typeof currentAccounts[0]!=='string'||!equal(currentAccounts[0],wallet.account))throw new V2WalletError('wallet','Your wallet changed. Connect it again.');
 return wallet;
}
/** A hashless wallet result remains pending until its exact nonce/intent is found. */
export async function resolveV2Submission(config:V2PublicConfig,intent:V2SubmissionIntent,cursor?:string){
 if(config.chainId!==intent.chainId||!equal(config.collection,intent.collection)||!Number.isInteger(intent.nonce)||intent.nonce<0||!/^(0|[1-9]\d*)$/.test(intent.fromBlock)||cursor!==undefined&&!/^(0|[1-9]\d*)$/.test(cursor))throw new V2WalletError('context','Choose the original payment world.');
 const {client}=createV2ChainReader(config),head=await client.getBlockNumber(),start=BigInt(intent.fromBlock);
 const inspect=async(n:bigint)=>{const b=await client.getBlock({blockNumber:n,includeTransactions:true});for(const tx of b.transactions){if(typeof tx==='string'||!equal(tx.from,intent.account)||tx.nonce!==intent.nonce)continue;const canonical=await client.getBlock({blockNumber:n});if(canonical.hash!==b.hash)throw new V2WalletError('uncertain','Checking that payment again.');return {hash:tx.hash,matched:!!tx.to&&equal(tx.to,intent.to||config.collection)&&tx.input===intent.data&&tx.value===BigInt(intent.value),nextBlock:n.toString()};}};
 // Historical account nonces are monotonic. Find the one mined block in log(N)
 // reads rather than asking a fast-chain player to scan hours of blocks by hand.
 let mined:bigint|undefined,historyUnavailable=false;
 try{
  if(await client.getTransactionCount({address:intent.account,blockNumber:head})<=intent.nonce)return {nextBlock:(cursor||intent.fromBlock)};
  let lo=start<=head?start:0n,hi=head;
  if(lo>0n&&await client.getTransactionCount({address:intent.account,blockNumber:lo})>intent.nonce)lo=0n;
  while(lo<hi){const mid=(lo+hi)/2n;if(await client.getTransactionCount({address:intent.account,blockNumber:mid})>intent.nonce)hi=mid;else lo=mid+1n;}
  mined=lo;
 }catch{historyUnavailable=true;}
 if(mined!==undefined){const found=await inspect(mined);if(found)return found;throw new V2WalletError('uncertain','Checking that payment again.');}
 // Some RPCs cannot serve historical account state. Bounded block inspection
 // remains a recovery fallback; an absent hash never means permission to resend.
 const from=BigInt(cursor||intent.fromBlock),end=head<from+63n?head:from+63n;
 for(let n=from;n<=end;n++){const found=await inspect(n);if(found)return {...found,historyFallback:historyUnavailable};}
 return {nextBlock:(end<from?from:end+1n).toString(),historyFallback:historyUnavailable};
}
export type V2OwnerWallet=Awaited<ReturnType<typeof connectV2Wallet>>;
