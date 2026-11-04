import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { encodeFunctionData, keccak256, parseAbi, parseTransaction, recoverTransactionAddress, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import original from '../../contracts/v2/deployments/robinhood-testnet.json';
import native from '../../contracts/near/deployments/testnet.json';
import { v2PublicClient, verifyV2Runtime, type V2RuntimeIdentity } from '../../server/v2/context';
import { verifyNearRuntime } from '../../server/near/rpc';
import type { NearRuntime } from '../../server/near/types';
import { nearWalletMetadata } from '../near/local-wallet';
import { actions, executeNearOperation, nativeOperationInfo } from '../near/operator';
import { openCutoverCloud, inspectNativeCutover } from './cloud-control';

const broadcast=process.argv.includes('--broadcast'),gate='testnet-transfer-burn-cutover';
if(process.argv.some(arg=>/mainnet|unpause|reset|reconcile/.test(arg)))throw Error('This operator only pauses the two reviewed testnet admissions.');
if(broadcast&&!process.argv.includes('--gate='+gate))throw Error('Explicit testnet cutoff gate required.');
const OWNER='0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6' as Address,runtime=original.runtime as V2RuntimeIdentity,nearRuntime=native.runtime as NearRuntime;
if(runtime.collection!=='0x30cb5213fa94020a95893ddb6b07470dbf7a9efc'||runtime.chainId!==46630||nearRuntime.collection!=='game.nearlyhuman-dev-20261102-26c8bd.testnet'||nearRuntime.codeHash!=='F8hcchfZEbdVzEpKaFxM65LsVHiZSs2Lu72TLbRC1PfV'||native.owner!=='nearlyhuman-dev-20261102-26c8bd.testnet')throw Error('Cutoff identity changed. Review a new operator.');
if(nearWalletMetadata('owner').accountId!==native.owner)throw Error('Prepared native owner metadata changed.');
const client=v2PublicClient('https://rpc.testnet.chain.robinhood.com',runtime),abi=parseAbi(['function owner() view returns(address)','function admissionsPaused() view returns(bool)','function setAdmissionsPaused(bool value)']);
async function rhHead(){const block=await verifyV2Runtime(client,runtime),[owner,paused]=await Promise.all([client.readContract({address:runtime.collection,abi,functionName:'owner',blockNumber:block.number!}),client.readContract({address:runtime.collection,abi,functionName:'admissionsPaused',blockNumber:block.number!})]);if(owner.toLowerCase()!==OWNER.toLowerCase()||(await client.getBlock({blockNumber:block.number!})).hash!==block.hash)throw Error('Old RH owner or canonical block changed.');return {block,paused};}
async function pauseRh(){
  const before=await rhHead(),directory=path.join(os.homedir(),'.codex/data/nearlyhuman'),journalFile=path.join(directory,'cutover-v3-pause-46630.json');
  await fs.mkdir(directory,{recursive:true});let previous:any;try{previous=JSON.parse(await fs.readFile(journalFile,'utf8'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  if(before.paused&&!previous)return {alreadyPaused:true,signature:false};
  const lockFile=path.join(directory,'owner-46630-'+OWNER.toLowerCase()+'.lock'),token=randomUUID(),lock=await fs.open(lockFile,'wx',0o600);await lock.writeFile(JSON.stringify({pid:process.pid,token,gate,at:new Date().toISOString()}));await lock.sync();await lock.close();
  const release=()=>{try{const held=JSON.parse(fsSync.readFileSync(lockFile,'utf8'));if(held.pid===process.pid&&held.token===token)fsSync.unlinkSync(lockFile);}catch{/* Preserve another/stale owner lock. */}};process.once('exit',release);
  try{
    const data=encodeFunctionData({abi,functionName:'setAdmissionsPaused',args:[true]});let entry=previous;
    if(!entry){await rhHead();const [estimate,price,nonce,balance]=await Promise.all([client.estimateGas({account:OWNER,to:runtime.collection,data}),client.getGasPrice(),client.getTransactionCount({address:OWNER,blockTag:'pending'}),client.getBalance({address:OWNER})]);const gas=estimate*125n/100n+20000n,gasPrice=price*2n;if(gas>150000n||gas*gasPrice>5000000000000n||balance<gas*gasPrice)throw Error('Bounded pause gas is unavailable.');
      const filename=path.join(os.homedir(),'.codex/secrets/nearlyhuman/developer-wallet.dpapi').replaceAll("'","''"),command=`Add-Type -AssemblyName System.Security; $b=[IO.File]::ReadAllBytes('${filename}'); $p=[Security.Cryptography.ProtectedData]::Unprotect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); try{[Console]::Out.Write('0x'+([BitConverter]::ToString($p).Replace('-','').ToLowerInvariant()))}finally{[Array]::Clear($p,0,$p.Length)}`;
      const unlocked=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',windowsHide:true});if(unlocked.status!==0||!/^0x[\da-f]{64}$/.test(unlocked.stdout.trim()))throw Error('Owner key could not be recovered.');const account=privateKeyToAccount(unlocked.stdout.trim() as Hex);unlocked.stdout='';if(account.address.toLowerCase()!==OWNER.toLowerCase())throw Error('Owner key identity changed.');
      const raw=await account.signTransaction({chainId:46630,type:'legacy',nonce,to:runtime.collection,data,value:0n,gas,gasPrice});entry={version:3,chainId:46630,owner:OWNER,collection:runtime.collection,controllerCodeHash:runtime.controllerCodeHash,raw,hash:keccak256(raw),nonce,gas:gas.toString(),gasPrice:gasPrice.toString(),data,status:'prepared'};await fs.writeFile(journalFile,JSON.stringify(entry),{flag:'wx',mode:0o600});
    }
    const parsed=parseTransaction(entry.raw),sender=await recoverTransactionAddress({serializedTransaction:entry.raw});if(entry.version!==3||entry.chainId!==46630||entry.owner.toLowerCase()!==OWNER.toLowerCase()||entry.collection!==runtime.collection||entry.controllerCodeHash!==runtime.controllerCodeHash||parsed.chainId!==46630||sender.toLowerCase()!==OWNER.toLowerCase()||parsed.to?.toLowerCase()!==runtime.collection||parsed.data!==data||(parsed.value||0n)!==0n||parsed.nonce!==entry.nonce||parsed.gas!==BigInt(entry.gas)||parsed.gasPrice!==BigInt(entry.gasPrice)||parsed.gas!>150000n||parsed.gas!*parsed.gasPrice!>5000000000000n||keccak256(entry.raw)!==entry.hash)throw Error('Frozen RH pause intent changed. Preserve its journal.');
    let receipt;try{receipt=await client.getTransactionReceipt({hash:entry.hash});}catch{}if(!receipt){await rhHead();try{await client.sendRawTransaction({serializedTransaction:entry.raw});}catch(error){try{await client.getTransaction({hash:entry.hash});}catch{throw error;}}receipt=await client.waitForTransactionReceipt({hash:entry.hash,confirmations:1,timeout:180000});}
    if(receipt.status!=='success'||receipt.transactionHash!==entry.hash||receipt.from.toLowerCase()!==OWNER.toLowerCase()||receipt.to?.toLowerCase()!==runtime.collection||(await client.getBlock({blockNumber:receipt.blockNumber})).hash!==receipt.blockHash||!(await rhHead()).paused)throw Error('Pause receipt/state needs inspection. Preserve its original journal.');
    await fs.writeFile(journalFile+'.tmp',JSON.stringify({...entry,status:'confirmed',block:receipt.blockNumber.toString(),gasUsed:receipt.gasUsed.toString()}),{mode:0o600});await fs.rename(journalFile+'.tmp',journalFile);return {hash:receipt.transactionHash,block:receipt.blockNumber.toString(),gasUsed:receipt.gasUsed.toString(),paused:true};
  }finally{release();process.removeListener('exit',release);}
}
const [rhBefore,nearBefore]=await Promise.all([rhHead(),verifyNearRuntime(nearRuntime)]);if(nearBefore.config.owner_id!==native.owner)throw Error('Native owner changed.');
let transactions:unknown;
if(broadcast){
  const rh=await pauseRh(),operation='pause-transfer-burn-cutover-20261104';
  const now=await verifyNearRuntime(nearRuntime);if(now.config.owner_id!==native.owner)throw Error('Native owner changed.');
  let near:unknown={alreadyPaused:now.config.admissions_paused,signature:false};const pending=await nativeOperationInfo(operation);
  if(!now.config.admissions_paused||pending?.status==='prepared'){
    // Existing helper's private operator gate is local-process only; no service setting is changed.
    process.env.NEARLYHUMAN_NEAR_QA_WALLET='1';
    const result=await executeNearOperation({id:operation,role:'owner',receiver:nearRuntime.collection,actions:[actions.functionCall('set_admissions_paused',{paused:true},30000000000000n,0n)]});
    if(!(await verifyNearRuntime(nearRuntime)).config.admissions_paused)throw Error('Native admissions were not paused.');near={hash:result.hash,paused:true};
  }
  transactions={rh,near};
}
const control=await openCutoverCloud(),nativeObligations=await inspectNativeCutover(nearRuntime,native.owner,control.store);
const inspection=spawnSync(process.execPath,['--import','tsx',path.resolve(import.meta.dirname,'inspect-cutover.ts')],{encoding:'utf8',windowsHide:true,timeout:180000});
if(inspection.status!==0)throw Error('Read-only RH cloud inspection failed; preserve cutoff transactions and inspect.');
const rhObligations=JSON.parse(inspection.stdout.trim().split(/\r?\n/).at(-1)!);
const report={checkedAt:new Date().toISOString(),mode:broadcast?'pause-and-inspect':'read-only',rhBefore:{paused:rhBefore.paused,block:rhBefore.block.number!.toString()},nativeBefore:{paused:nearBefore.config.admissions_paused,codeHash:nearRuntime.codeHash,block:nearBefore.block.height},...(transactions?{transactions}:{}),rh:rhObligations,native:nativeObligations,sharedCampaign:rhObligations.budget.campaignId===nativeObligations.budget.campaignId,quiescent:rhObligations.quiescent&&nativeObligations.quiescent,financialStoreMutations:0,environmentWrites:0,inferenceCalls:0};
await fs.mkdir(new URL('../../TEMP/rh-v3/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../../TEMP/rh-v3/cutover-both-inspection.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
