import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createPublicClient, http, defineChain, encodeDeployData, parseEther, formatEther, keccak256, getContractAddress, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const root=path.resolve(import.meta.dirname,'../..');
const mainnet=process.argv.includes('--mainnet');
const broadcast=process.argv.includes('--broadcast');
const chainId=mainnet?4663:46630;
const rpc=process.env.NEARLYHUMAN_DEPLOY_RPC||`https://rpc.${mainnet?'mainnet':'testnet'}.chain.robinhood.com`;
const explorer=mainnet?'https://robinhoodchain.blockscout.com':'https://explorer.testnet.chain.robinhood.com';
const chain=defineChain({id:chainId,name:mainnet?'Robinhood Chain':'Robinhood Chain Testnet',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[rpc]}}});
const owner='0x131C15fD2d9151F361213d8e8BC2a188Dc0149c6';
const service=process.env.NEARLYHUMAN_SERVICE_ADDRESS||'0x3c63FD61B244b3B3290c74993F603816c6144C26';
const artifact=JSON.parse(fs.readFileSync(path.join(root,'contracts/artifacts/NEARlyHuman.json'),'utf8'));
const feed=mainnet?process.env.NEARLYHUMAN_PRICE_FEED:zeroAddress;
const feedAge=mainnet?Number(process.env.NEARLYHUMAN_PRICE_MAX_AGE):0;
if(mainnet&&(!feed||!Number.isSafeInteger(feedAge)||feedAge<=0))throw Error('Mainnet requires an explicitly verified feed and freshness bound.');
const args=[owner,service,service,owner,!mainnet,feed,feedAge,`https://nearlyhuman.netlify.app/api/nft/${chainId}/`];
const client=createPublicClient({chain,transport:http(rpc),cacheTime:0});
if(await client.getChainId()!==chainId)throw Error('RPC network does not match requested deployment.');
const data=encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args});
const [balance,relayBalance,gasPrice,estimate]=await Promise.all([client.getBalance({address:owner}),client.getBalance({address:service}),client.getGasPrice(),client.estimateGas({account:owner,data})]);
const gas=estimate*125n/100n+50_000n;
const relayTarget=mainnet?0n:parseEther('0.002');
const relayTopup=relayBalance<relayTarget?relayTarget-relayBalance:0n;
const transferEstimate=relayTopup?await client.estimateGas({account:owner,to:service,value:relayTopup}):0n;
const transferGas=transferEstimate?transferEstimate*125n/100n+5_000n:0n;
const txGasPrice=gasPrice*2n;
const upperCost=(gas+transferGas)*txGasPrice+relayTopup;
console.log(JSON.stringify({chainId,owner,service,balance:formatEther(balance),relayBalance:formatEther(relayBalance),estimatedDeploymentGas:estimate.toString(),gasLimit:gas.toString(),networkGasPrice:gasPrice.toString(),gasPriceLimit:txGasPrice.toString(),relayTopup:formatEther(relayTopup),upperCombinedCost:formatEther(upperCost),willBroadcast:broadcast}));
if(!mainnet&&upperCost>parseEther('0.006'))throw Error('Testnet deployment/funding budget exceeded.');
if(balance<upperCost)throw Error('Owner needs more ETH for deployment and requested reserve.');
if(!broadcast)process.exit(0);
const key=process.env.NEARLYHUMAN_OWNER_PRIVATE_KEY;
if(!key||!/^0x[0-9a-fA-F]{64}$/.test(key))throw Error('Supply the deployer key through a secure process environment.');
const account=privateKeyToAccount(key);
if(account.address.toLowerCase()!==owner.toLowerCase())throw Error('Deployer does not match project wallet.');
const journalDir=process.env.NEARLYHUMAN_DEPLOY_JOURNAL_DIR||path.join(os.homedir(),'.codex','data','nearlyhuman');fs.mkdirSync(journalDir,{recursive:true});
const journalPath=path.join(journalDir,`deployment-${chainId}.json`);
const journal=fs.existsSync(journalPath)?JSON.parse(fs.readFileSync(journalPath,'utf8')):{chainId,owner,service,sourceSha256:artifact.sourceSha256};
if(journal.sourceSha256!==artifact.sourceSha256)throw Error('A different source deployment journal exists; reconcile it before replacing.');
const save=()=>fs.writeFileSync(journalPath,JSON.stringify(journal,null,2));
async function sendOnce(label,request){
 let j=journal[label];
 if(!j){const nonce=await client.getTransactionCount({address:owner,blockTag:'pending'});const tx={...request,chainId,nonce,type:'legacy'};const raw=await account.signTransaction(tx);j={nonce,hash:keccak256(raw),raw,status:'prepared'};journal[label]=j;save();}
 let receipt;try{receipt=await client.getTransactionReceipt({hash:j.hash})}catch{}
 if(!receipt){try{await client.sendRawTransaction({serializedTransaction:j.raw})}catch(error){let exists=false;try{await client.getTransaction({hash:j.hash});exists=true}catch{}if(!exists)throw error;}j.status='broadcast';save();receipt=await client.waitForTransactionReceipt({hash:j.hash,confirmations:1,timeout:180_000});}
 if(receipt.status!=='success')throw Error(label+' transaction reverted; inspect the journal before retrying.');
 j.status='confirmed';j.blockNumber=Number(receipt.blockNumber);j.gasUsed=receipt.gasUsed.toString();save();return receipt;
}
const deployment=await sendOnce('deployment',{data,gas,gasPrice:txGasPrice,value:0n});
const address=deployment.contractAddress||getContractAddress({from:owner,nonce:BigInt(journal.deployment.nonce)});
const code=await client.getCode({address});if(!code||code==='0x')throw Error('No deployed code.');
const read=functionName=>client.readContract({address,abi:artifact.abi,functionName});
const [actualOwner,actualSigner,actualRelayer,mintPrice,initial]=await Promise.all([read('owner'),read('quoteSigner'),read('relayer'),read('mintPrice'),client.readContract({address,abi:artifact.abi,functionName:'initialState',args:[0n]})]);
if(actualOwner.toLowerCase()!==owner.toLowerCase()||actualSigner.toLowerCase()!==service.toLowerCase()||actualRelayer.toLowerCase()!==service.toLowerCase()||initial.length!==386)throw Error('Deployed configuration does not match.');
if(relayTopup)await sendOnce('relayFunding',{to:service,value:relayTopup,gas:transferGas,gasPrice:txGasPrice});
const record={chainId,address,owner,quoteSigner:service,relayer:service,treasury:owner,blockNumber:Number(deployment.blockNumber),transactionHash:deployment.transactionHash,sourceSha256:artifact.sourceSha256,codeHash:keccak256(code),compiler:artifact.compiler,evmVersion:artifact.evmVersion,mintPrice:mintPrice.toString(),explorer:explorer+'/address/'+address,metadataBase:args[7],deploymentGasUsed:deployment.gasUsed.toString(),checkedAt:new Date().toISOString()};
const allPath=path.join(root,'contracts/deployments.json');const all=fs.existsSync(allPath)?JSON.parse(fs.readFileSync(allPath,'utf8')):{};all[chainId]=record;fs.writeFileSync(allPath,JSON.stringify(all,null,2)+'\n');
const publicMap=Object.fromEntries(Object.entries(all).map(([id,r])=>[id,{address:r.address,blockNumber:r.blockNumber,transactionHash:r.transactionHash}]));
fs.writeFileSync(path.join(root,'src/chain/deployments.ts'),"import type { Address, Hex } from 'viem';\n\n/** Confirmed public collection deployments. */\nexport const deployments: Record<number, { address: Address; blockNumber: number; transactionHash: Hex }> = "+JSON.stringify(publicMap,null,2)+';\n');
console.log(JSON.stringify({deployed:record,ownerRemaining:formatEther(await client.getBalance({address:owner})),relayFundedBalance:formatEther(await client.getBalance({address:service}))}));
