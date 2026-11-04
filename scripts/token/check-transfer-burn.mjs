import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {createPublicClient,createWalletClient,defineChain,http,parseEventLogs} from 'viem';

const root=path.resolve(import.meta.dirname,'../..'),out=path.join(root,'TEMP/token-transfer-burn');
const require=createRequire(path.join(root,'package.json')),solc=require('solc');
const cases=[];
const tokenSource='contracts/token/NHCTransferBurn.sol',harnessSource='contracts/token/test/TransferBurnHarness.sol';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function protectedDigest(){
  const dirs=['contracts/v2','contracts/v2/artifacts','contracts/near/src','contracts/near/artifacts'];
  const files=[];
  for(const dir of dirs)for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true}))if(entry.isFile())files.push(path.posix.join(dir,entry.name));
  return digest((await Promise.all(files.sort().map(async file=>file+':'+digest(await fs.readFile(path.join(root,file)))))).join('\n'));
}
const before=await protectedDigest();
await fs.mkdir(out,{recursive:true});
const input={language:'Solidity',sources:Object.fromEntries(await Promise.all([tokenSource,harnessSource].map(async file=>[file,{content:await fs.readFile(path.join(root,file),'utf8')}]))),settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
const compiled=JSON.parse(solc.compile(JSON.stringify(input),{import:filename=>{try{return{contents:require('node:fs').readFileSync(path.join(root,filename.startsWith('@')?'node_modules':'',filename),'utf8')}}catch{return{error:'Missing import '+filename}}}}));
const errors=(compiled.errors||[]).filter(e=>e.severity==='error');assert.equal(errors.length,0,errors.map(e=>e.formattedMessage).join('\n'));
await fs.writeFile(path.join(out,'compiled.json'),JSON.stringify(compiled));
const artifact=(file,name)=>compiled.contracts[file][name],tokenArtifact=artifact(tokenSource,'NHCTransferBurn'),harnessArtifact=artifact(harnessSource,'TransferBurnHarness');
const reserve=net.createServer();await new Promise((resolve,reject)=>reserve.once('error',reject).listen(0,'127.0.0.1',resolve));const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
const defaultBinary=process.platform==='win32'?path.join(os.homedir(),'.foundry/bin/anvil.exe'):'anvil';
const binary=process.env.ANVIL_BIN||defaultBinary;
const proc=spawn(binary,['--host','127.0.0.1','--port',String(port),'--chain-id','31337','--hardfork','cancun','--silent'],{windowsHide:true,stdio:'ignore'});
let spawnError;proc.once('error',e=>{spawnError=e});
const url=`http://127.0.0.1:${port}`,chain=defineChain({id:31337,name:'Local transfer-burn verification',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[url]}}});
const client=createPublicClient({chain,transport:http(url,{timeout:1000,retryCount:0}),pollingInterval:50});
const unit=1_000_000n,max=2n**256n-1n;
const report={scope:'Actual ephemeral local EVM execution only; no external RPC, private credentials, deployed game mutation, AI or financial service operation.',compiler:solc.version(),chainId:31337,cases,protectedDeploymentFiles:{before,after:null,unchanged:false},pass:false};
try{
  for(let i=0;;i++){if(spawnError)throw spawnError;if(proc.exitCode!==null)throw Error('Local node exited before verification');try{assert.equal(await client.getChainId(),31337);break}catch(e){if(i>=60)throw e;await new Promise(resolve=>setTimeout(resolve,100))}}
  const accounts=await client.request({method:'eth_accounts'}),wallets=accounts.slice(0,4).map(account=>createWalletClient({account,chain,transport:http(url),pollingInterval:50}));
  const [controller,alice,bob,spender]=accounts;
  const read=(address,abi,functionName,args=[])=>client.readContract({address,abi,functionName,args});
  const tokenRead=(address,name,args=[])=>read(address,tokenArtifact.abi,name,args);
  async function write(index,address,abi,functionName,args=[],extra={}){const hash=await wallets[index].writeContract({address,abi,functionName,args,...extra});const receipt=await client.waitForTransactionReceipt({hash});assert.equal(receipt.status,'success',functionName);return receipt}
  const tokenWrite=(index,address,name,args=[],extra={})=>write(index,address,tokenArtifact.abi,name,args,extra);
  async function deploy(index,a,args){const hash=await wallets[index].deployContract({abi:a.abi,bytecode:'0x'+a.evm.bytecode.object,args});const receipt=await client.waitForTransactionReceipt({hash});assert.equal(receipt.status,'success');assert(receipt.contractAddress);return receipt.contractAddress}
  async function rejects(index,address,abi,name,args,errorName){const errors=tokenArtifact.abi.filter(item=>item.type==='error'&&!abi.some(existing=>existing.type==='error'&&existing.name===item.name));await assert.rejects(client.simulateContract({account:accounts[index],address,abi:[...abi,...errors],functionName:name,args}),e=>e.walk?.(cause=>cause.name==='ContractFunctionRevertedError')?.data?.errorName===errorName,`${name} must reject as ${errorName}`)}
  async function record(label,fn){await fn();cases.push(label)}

  const token=await deploy(0,tokenArtifact,[true]);
  await record('Explicit enabled constructor, controller, fixed 50bps and six decimals',async()=>{
    assert.equal((await tokenRead(token,'controller')).toLowerCase(),controller.toLowerCase());assert.equal(await tokenRead(token,'transferBurnEnabled'),true);assert.equal(await tokenRead(token,'TRANSFER_BURN_BPS'),50n);assert.equal(await tokenRead(token,'decimals'),6);
  });
  await record('Mint is untaxed and one 100-NHC transfer delivers99.5, burns0.5, emits matching supply events',async()=>{
    await tokenWrite(0,token,'mintVault',[1000n*unit]);assert.equal(await tokenRead(token,'totalTransferBurned'),0n);assert.equal(await tokenRead(token,'totalSupply'),1000n*unit);
    const receipt=await tokenWrite(0,token,'transfer',[alice,100n*unit]);assert.equal(await tokenRead(token,'balanceOf',[alice]),99_500_000n);assert.equal(await tokenRead(token,'balanceOf',[controller]),900n*unit);assert.equal(await tokenRead(token,'totalSupply'),999_500_000n);assert.equal(await tokenRead(token,'totalTransferBurned'),500_000n);
    const logs=parseEventLogs({abi:tokenArtifact.abi,logs:receipt.logs});const transfers=logs.filter(l=>l.eventName==='Transfer');assert.equal(transfers.length,2);assert.equal(transfers[0].args.to,'0x0000000000000000000000000000000000000000');assert.equal(transfers[0].args.value,500_000n);assert.equal(transfers[1].args.value,99_500_000n);assert.equal(logs.find(l=>l.eventName==='TransferBurn').args.gross,100n*unit);
  });
  await record('Floor rounding, zero and first nonzero 200-micro threshold',async()=>{
    for(const amount of [0n,1n,199n,200n,201n,1000001n,max]){const [net,burn]=await tokenRead(token,'previewTransfer',[amount]);assert.equal(burn,amount/200n);assert.equal(net+burn,amount)}
    const supply=await tokenRead(token,'totalSupply'),burned=await tokenRead(token,'totalTransferBurned');await tokenWrite(0,token,'transfer',[bob,199n]);assert.equal(await tokenRead(token,'totalSupply'),supply);await tokenWrite(0,token,'transfer',[bob,200n]);assert.equal(await tokenRead(token,'balanceOf',[bob]),398n);assert.equal(await tokenRead(token,'totalSupply'),supply-1n);assert.equal(await tokenRead(token,'totalTransferBurned'),burned+1n);
    const zero=await tokenWrite(0,token,'transfer',[bob,0n]);assert.equal(parseEventLogs({abi:tokenArtifact.abi,logs:zero.logs,eventName:'TransferBurn'}).length,0);
  });
  await record('Self-transfer requires gross balance and only removes its burn',async()=>{
    const balance=await tokenRead(token,'balanceOf',[alice]);await rejects(1,token,tokenArtifact.abi,'transfer',[alice,balance+1n],'ERC20InsufficientBalance');
    const supply=await tokenRead(token,'totalSupply');await tokenWrite(1,token,'transfer',[alice,20n*unit]);assert.equal(await tokenRead(token,'balanceOf',[alice]),balance-100_000n);assert.equal(await tokenRead(token,'totalSupply'),supply-100_000n);
  });
  await record('Only immutable controller may toggle, mint or call explicit burns',async()=>{
    for(const [fn,args]of [['setTransferBurnEnabled',[false]],['mintVault',[unit]],['burnVault',[unit]],['burnWalletForBirth',[alice,unit]]])await rejects(1,token,tokenArtifact.abi,fn,args,'ControllerOnly');
  });
  await record('Controller toggles off and back on without a mutable rate or recipient',async()=>{
    const burned=await tokenRead(token,'totalTransferBurned'),supply=await tokenRead(token,'totalSupply'),balance=await tokenRead(token,'balanceOf',[bob]);await tokenWrite(0,token,'setTransferBurnEnabled',[false]);assert.deepEqual(await tokenRead(token,'previewTransfer',[10n*unit]),[10n*unit,0n]);await tokenWrite(0,token,'transfer',[bob,10n*unit]);assert.equal(await tokenRead(token,'balanceOf',[bob]),balance+10n*unit);assert.equal(await tokenRead(token,'totalSupply'),supply);assert.equal(await tokenRead(token,'totalTransferBurned'),burned);await tokenWrite(0,token,'setTransferBurnEnabled',[true]);await tokenWrite(0,token,'transfer',[bob,unit]);assert.equal(await tokenRead(token,'totalTransferBurned'),burned+5000n);
  });
  await record('transferFrom consumes gross allowance, including self-transfer; infinite allowance stays infinite',async()=>{
    await tokenWrite(1,token,'approve',[spender,2n*unit]);await rejects(3,token,tokenArtifact.abi,'transferFrom',[alice,bob,2n*unit+1n],'ERC20InsufficientAllowance');await tokenWrite(3,token,'transferFrom',[alice,bob,unit]);assert.equal(await tokenRead(token,'allowance',[alice,spender]),unit);await tokenWrite(3,token,'transferFrom',[alice,alice,unit]);assert.equal(await tokenRead(token,'allowance',[alice,spender]),0n);
    await tokenWrite(1,token,'approve',[spender,max]);await tokenWrite(3,token,'transferFrom',[alice,bob,unit]);assert.equal(await tokenRead(token,'allowance',[alice,spender]),max);
  });
  await record('Mined insufficient-balance transferFrom reverts its prior allowance write atomically',async()=>{
    const balance=await tokenRead(token,'balanceOf',[alice]),gross=balance+unit;await tokenWrite(1,token,'approve',[spender,gross]);const supply=await tokenRead(token,'totalSupply'),burned=await tokenRead(token,'totalTransferBurned');const hash=await wallets[3].writeContract({address:token,abi:tokenArtifact.abi,functionName:'transferFrom',args:[alice,bob,gross],gas:300000n});const receipt=await client.waitForTransactionReceipt({hash});assert.equal(receipt.status,'reverted');assert.equal(await tokenRead(token,'allowance',[alice,spender]),gross);assert.equal(await tokenRead(token,'balanceOf',[alice]),balance);assert.equal(await tokenRead(token,'totalSupply'),supply);assert.equal(await tokenRead(token,'totalTransferBurned'),burned);
  });
  await record('Explicit vault burn reduces supply without a second transfer fee',async()=>{
    const supply=await tokenRead(token,'totalSupply'),burned=await tokenRead(token,'totalTransferBurned');await tokenWrite(0,token,'burnVault',[10n*unit]);assert.equal(await tokenRead(token,'totalSupply'),supply-10n*unit);assert.equal(await tokenRead(token,'totalTransferBurned'),burned);
  });
  await record('Maximum uint256 preview and actual transfer do not overflow fee multiplication',async()=>{
    const large=await deploy(0,tokenArtifact,[true]);await tokenWrite(0,large,'mintVault',[max]);await tokenWrite(0,large,'transfer',[alice,max]);assert.equal(await tokenRead(large,'totalSupply'),max-max/200n);assert.equal(await tokenRead(large,'balanceOf',[alice]),max-max/200n);assert.equal(await tokenRead(large,'totalTransferBurned'),max/200n);
  });

  for(const initiallyEnabled of [true,false]){
    const harness=await deploy(0,harnessArtifact,[initiallyEnabled]),coin=await read(harness,harnessArtifact.abi,'token');
    const call=(i,name,args=[])=>write(i,harness,harnessArtifact.abi,name,args);
    const hr=(name,args=[])=>read(harness,harnessArtifact.abi,name,args);
    await record(`Backed purses and gross withdrawal, constructor burn=${initiallyEnabled}`,async()=>{
      await call(0,'credit',[1n,1000n*unit]);await call(0,'withdraw',[1n,alice,500n*unit]);assert.equal(await tokenRead(coin,'balanceOf',[alice]),initiallyEnabled?497_500_000n:500n*unit);assert.equal(await tokenRead(coin,'balanceOf',[harness]),500n*unit);assert.equal(await hr('totalAllocated'),500n*unit);assert.equal(await hr('purse',[1n]),500n*unit);
    });
    await record(`250-NHC wallet birth is allowance-backed direct burn, constructor burn=${initiallyEnabled}`,async()=>{
      await rejects(1,harness,harnessArtifact.abi,'walletBirth',[],'ERC20InsufficientAllowance');const balance=await tokenRead(coin,'balanceOf',[alice]),supply=await tokenRead(coin,'totalSupply'),burned=await tokenRead(coin,'totalTransferBurned');await tokenWrite(1,coin,'approve',[harness,250n*unit]);await call(1,'walletBirth');assert.equal(await tokenRead(coin,'balanceOf',[alice]),balance-250n*unit);assert.equal(await tokenRead(coin,'totalSupply'),supply-250n*unit);assert.equal(await tokenRead(coin,'allowance',[alice,harness]),0n);assert.equal(await tokenRead(coin,'balanceOf',[harness]),500n*unit);assert.equal(await hr('totalAllocated'),500n*unit);assert.equal(await tokenRead(coin,'totalTransferBurned'),burned);
    });
    await record(`Purse birth preserves backing and owner-only toggle forwarding, constructor burn=${initiallyEnabled}`,async()=>{
      const burned=await tokenRead(coin,'totalTransferBurned');await call(0,'purseBirth',[1n]);assert.equal(await tokenRead(coin,'balanceOf',[harness]),250n*unit);assert.equal(await hr('totalAllocated'),250n*unit);assert.equal(await hr('birthBurns'),500n*unit);assert.equal(await tokenRead(coin,'totalTransferBurned'),burned);await rejects(1,harness,harnessArtifact.abi,'setTransferBurnEnabled',[!initiallyEnabled],'OwnerOnly');await rejects(0,coin,tokenArtifact.abi,'setTransferBurnEnabled',[!initiallyEnabled],'ControllerOnly');await call(0,'setTransferBurnEnabled',[true]);assert.equal(await tokenRead(coin,'transferBurnEnabled'),true);
    });
    await record(`After owner enables burn, ordinary wallet-to-vault transfers are taxed too; initial flag=${initiallyEnabled}`,async()=>{
      const vault=await tokenRead(coin,'balanceOf',[harness]),burned=await tokenRead(coin,'totalTransferBurned');await tokenWrite(1,coin,'transfer',[harness,10n*unit]);assert.equal(await tokenRead(coin,'balanceOf',[harness]),vault+9_950_000n);assert.equal(await tokenRead(coin,'totalTransferBurned'),burned+50_000n);assert.equal(await hr('totalAllocated'),250n*unit);
    });
  }
  report.protectedDeploymentFiles.after=await protectedDigest();report.protectedDeploymentFiles.unchanged=report.protectedDeploymentFiles.after===before;assert.equal(report.protectedDeploymentFiles.unchanged,true);
  report.artifact={runtimeBytes:tokenArtifact.evm.deployedBytecode.object.length/2,bytecodeSha256:digest(Buffer.from(tokenArtifact.evm.bytecode.object,'hex')),sources:Object.fromEntries(await Promise.all([tokenSource,harnessSource].map(async file=>[file,digest(await fs.readFile(path.join(root,file)))])))};
  report.pass=true;
}catch(error){report.failure=String(error.shortMessage||error.message).split('\n')[0];throw error}
finally{
  proc.kill();await new Promise(resolve=>{if(proc.exitCode!==null)return resolve();proc.once('exit',resolve);setTimeout(resolve,2000).unref()});await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({pass:report.pass,cases:cases.length,compiler:report.compiler,unchangedExistingDeployments:report.protectedDeploymentFiles.unchanged,proof:path.relative(root,path.join(out,'verification.json'))}));
