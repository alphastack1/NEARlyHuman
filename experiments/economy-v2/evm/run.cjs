const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict'), {spawn}=require('node:child_process'), {createRequire}=require('node:module');
const ROOT=path.resolve(__dirname,'../../..');
const OUT=path.resolve(process.env.NH_EVM_OUT||path.join(ROOT,'TEMP/economy-v2-feasibility/evm'));
fs.mkdirSync(OUT,{recursive:true});
const solc=require(path.join(ROOT,'node_modules/solc'));
const toolRequire=process.env.NH_EVM_TOOL_PACKAGE ? createRequire(path.resolve(process.env.NH_EVM_TOOL_PACKAGE)) : require;
const {ethers}=toolRequire('ethers');
const input={language:'Solidity',sources:{'EconomySlice.sol':{content:fs.readFileSync(path.join(__dirname,'EconomySlice.sol'),'utf8')}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
const compiled=JSON.parse(solc.compile(JSON.stringify(input),{import:name=>{try{return{contents:fs.readFileSync(path.join(ROOT,'node_modules',name),'utf8')}}catch(e){return{error:e.message}}}}));
const errors=(compiled.errors||[]).filter(e=>e.severity==='error');if(errors.length)throw Error(errors.map(e=>e.formattedMessage).join('\n'));
const art=compiled.contracts['EconomySlice.sol'].EconomySlice,tok=compiled.contracts['EconomySlice.sol'].SliceToken;
fs.writeFileSync(path.join(OUT,'compiled.json'),JSON.stringify(compiled,null,2));
const witnesses=[],gas={},U=1000000n;
let proc,provider,txCount=0,revertedCount=0,deploymentCount=0;
const A=(op,arg=0,kind=0,shipment=[])=>({op,arg,kind,shipment:[...shipment,...Array(4-shipment.length).fill(0)]});
const water=()=>A(0), plant=(slot,kind)=>A(1,slot,kind), harvest=()=>A(2), craft=r=>A(3,r), ship=items=>A(4,0,0,items);
function passed(name,extra={}){witnesses.push({name,result:'pass',...extra});}
function ownNodeAlive(){assert(proc&&proc.exitCode===null&&!proc.killed,'Owned local node must remain alive');}
async function sent(label,promise){ownNodeAlive();const tx=await promise,receipt=await tx.wait();++txCount;(gas[label]??=[]).push(Number(receipt.gasUsed));return receipt;}
async function rejected(name,fn){try{await sent('rejected',fn());throw Error('did not reject: '+name);}catch(e){if(e.message.startsWith('did not reject'))throw e;assert(e.code==='CALL_EXCEPTION',e.message);if(e.receipt){++revertedCount;(gas.rejected??=[]).push(Number(e.receipt.gasUsed));}passed(name);}}
async function open(g,id,signer,seed=0,shipping=true){await sent('accept',g.connect(signer).accept(id,seed,shipping,{gasLimit:2000000}));return await g.pending(id);}
async function commit(g,q,actions=[],terminal=false,label='commit'){return sent(label,g.commitEconomicSlice(q,actions,terminal,{gasLimit:2000000}));}
async function day(g,id,signer,actions=[],{seed=0,shipping=true,terminal=false,label='commit'}={}){let q=await open(g,id,signer,seed,shipping);await commit(g,q,actions,terminal,label);return q;}
async function invariant(g,t){const bal=await t.balanceOf(await g.getAddress());assert(bal>=await g.totalAllocated());assert(await t.totalSupply()+await g.nftMintBurns()===await g.issued());assert(await g.available()+await g.reserved()<=await g.C());}
async function advanceToReady(g,id,signer){while((await g.life(id)).plots[0].ticks>0n)await day(g,id,signer,[water()]);}
async function deploy(signer,capacity){ownNodeAlive();const g=await new ethers.ContractFactory(art.abi,art.evm.bytecode.object,signer).deploy(capacity);const r=await g.deploymentTransaction().wait();++deploymentCount;gas.deploy??=[];gas.deploy.push(Number(r.gasUsed));const t=new ethers.Contract(await g.token(),tok.abi,signer);return{g,t};}
async function ownedEndpoint(){
 const anvilBin=process.env.NH_ANVIL_BIN||'anvil';
 proc=spawn(anvilBin,['--host','127.0.0.1','--port','0','--chain-id','31337','--hardfork','cancun'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 return new Promise((resolve,reject)=>{
  let done=false;const timer=setTimeout(()=>finish(Error('Owned Anvil did not announce its bound endpoint')),10000);
  function finish(error,url){if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve(url);}
  const consume=()=>{let tail='';return chunk=>{
   // Read only this child's listener line; never print/store Anvil's local-key banner.
   tail+=chunk.toString('utf8').replace(/\x1b\[[0-9;]*m/g,'');
   for(;;){const at=tail.indexOf('\n');if(at<0)break;const line=tail.slice(0,at).trim();tail=tail.slice(at+1);
    const found=/^Listening on (127\.0\.0\.1):(\d+)$/.exec(line);
    if(found){const port=Number(found[2]);if(port>0&&port<=65535){try{ownNodeAlive();finish(null,`http://127.0.0.1:${port}`);}catch(e){finish(e);}}}
   }
   if(tail.length>4096)tail='';
  };};
  proc.stdout.on('data',consume());proc.stderr.on('data',consume());
  proc.once('error',e=>finish(Error('Cannot launch owned Anvil: '+e.code)));
  proc.once('exit',code=>finish(Error('Owned Anvil exited before use: '+code)));
 });
}
(async()=>{
 const rpcUrl=await ownedEndpoint();ownNodeAlive();
 provider=new ethers.JsonRpcProvider(rpcUrl,31337,{staticNetwork:true,cacheTimeout:0});provider.pollingInterval=10;
 assert.equal(BigInt(await provider.send('eth_chainId',[])),31337n,'Owned local chain ID');
 assert.equal(BigInt(await provider.send('eth_blockNumber',[])),0n,'Refuse non-fresh local node');ownNodeAlive();
 const [owner,bob]=await Promise.all([provider.getSigner(0),provider.getSigner(1)]),[oa,ba]=await Promise.all([owner.getAddress(),bob.getAddress()]);
 const qa=compiled.contracts['EconomySlice.sol'].QuoteCounterHarness;
 const ch=await new ethers.ContractFactory(qa.abi,qa.evm.bytecode.object,owner).deploy();const chReceipt=await ch.deploymentTransaction().wait();++deploymentCount;gas.counterHarnessDeploy=[Number(chReceipt.gasUsed)];
 const max32=4294967295n,emptyGoods=()=>Array(12).fill(0n),emptyPlots=()=>Array.from({length:4},()=>({kind:0,ticks:0,left:0,moisture:0,dry:0}));
 let goods=emptyGoods(),plots=emptyPlots();goods[11]=max32;
 let checked=await ch.inspect(10,goods,plots);assert.equal(checked[0],1360n);passed('injected max craft-output counter still quotes existing four chests');
 goods=emptyGoods();plots=emptyPlots();goods[7]=max32-1n;plots[0]={kind:8,ticks:0,left:6,moisture:2,dry:0};
 checked=await ch.inspect(0,goods,plots);assert.equal(checked[1],true);
 plots[1]={...plots[0]};checked=await ch.inspect(0,goods,plots);assert.equal(checked[1],false);assert.equal(checked[0],160n);passed('injected multiple ready yields require aggregate real counter room');
 goods=emptyGoods();plots=emptyPlots();plots[0]={kind:9,ticks:0,left:10,moisture:2,dry:0};checked=await ch.inspect(max32,goods,plots);assert.equal(checked[1],false);passed('injected saturated wood rejects hypothetical harvest alternative');
 goods=emptyGoods();plots=emptyPlots();goods[10]=1n;checked=await ch.inspect(10,goods,plots);assert.equal(checked[0],616n);passed('hypothetical alternatives do not alias or accumulate multiple crafts');
 const {g,t}=await deploy(owner,30000n*U);
 assert.equal(await t.decimals(),6n);assert.equal(await g.quote(1360,50000n*U),68n*U);passed('six decimals and four chest half-factor fixture',{rewardMicro:'68000000'});
 await rejected('EOA cannot bypass controller to mint arbitrary tokens',()=>t.mintVault(1000n*U,{gasLimit:1500000}));
 await sent('founder',g.founder());let id=1n;
 let q=await open(g,id,owner,1,true);
 await rejected('impossible craft reverts entire seed credit',()=>g.commitEconomicSlice(q,[craft(3)],false,{gasLimit:1500000}));
 assert.equal((await g.life(id)).seeds[0],0n);assert.equal((await g.life(id)).day,0n);
 await sent('failure',g.fail(q));assert.equal((await g.life(id)).day,0n);assert.equal((await g.life(id)).seeds[0],0n);assert.equal((await g.life(id)).plots[0].kind,0n);assert.equal(await g.pending(id),0n);
 q=await day(g,id,owner,[plant(0,1)],{seed:1,label:'plant'});assert.equal((await g.life(id)).plots[0].ticks,2n);assert.equal(await g.attempts(id),2n);passed('failed attempt and retry do not duplicate kit or day');
 await rejected('nonowner cannot request a day',()=>g.connect(bob).accept(id,0,true,{gasLimit:1500000}));
 await day(g,id,owner,[water()],{label:'water'});
 q=await open(g,id,owner);
 await rejected('crop cannot harvest before third bedtime',()=>g.commitEconomicSlice(q,[harvest()],false,{gasLimit:1500000}));
 await commit(g,q,[water()],false,'water');assert.equal((await g.life(id)).plots[0].ticks,0n);
 await rejected('settlement replay cannot advance growth twice',()=>g.commitEconomicSlice(q,[water()],false,{gasLimit:1500000}));
 q=await open(g,id,owner);
 await rejected('non-relay cannot settle accepted day',()=>g.connect(bob).commitEconomicSlice(q,[],false,{gasLimit:1500000}));
 await rejected('non-relay cannot fail accepted day',()=>g.connect(bob).fail(q,{gasLimit:1500000}));
 await rejected('duplicate shipment IDs beyond owned quantity roll back entire harvest',()=>g.commitEconomicSlice(q,[harvest(),ship([1,1])],false,{gasLimit:1500000}));
 assert.equal((await g.life(id)).plots[0].ticks,0n);assert.equal((await g.life(id)).goods[0],0n);
 await rejected('second shipment in same day rejects atomically',()=>g.commitEconomicSlice(q,[harvest(),ship([1]),ship([1])],false,{gasLimit:1500000}));
 await commit(g,q,[harvest(),ship([1])],false,'harvestShip');assert.equal(await g.purse(id),6500000n);passed('Day1 quick planting is first picked on Day4',{rewardMicro:'6500000'});
 q=await open(g,id,owner,9,false);
 await sent('withdrawPending',g.withdraw(id,U));assert.equal(await t.balanceOf(oa),U);
 await commit(g,q,[plant(0,9)],false,'plant');assert.equal(await g.purse(id),5500000n);passed('pending-day withdrawal is not overwritten by settlement');
 while((await g.life(id)).wood<10n){const l=await g.life(id);await day(g,id,owner,[water(),...(l.plots[0].ticks===0n?[harvest()]:[])],{label:l.plots[0].ticks===0n?'woodHarvest':'water'});}
 assert.equal((await g.life(id)).plots[0].kind,0n);passed('tree gives exactly ten wood then clears',{finalDay:Number((await g.life(id)).day)});
 q=await open(g,id,owner);
 await rejected('no eleventh tree harvest without another sapling',()=>g.commitEconomicSlice(q,[harvest()],false,{gasLimit:1500000}));
 await commit(g,q,[],false);
 await sent('founder',g.connect(bob).founder());const b=2n;
 await day(g,b,bob,[plant(0,1)],{seed:1});await advanceToReady(g,b,bob);
 q=await open(g,id,owner);const accepted=await g.request(q),expectedChest=await g.quote(340,accepted.pressure);
 const priorIssued=await g.issued();await day(g,b,bob,[harvest(),ship([1])],{label:'harvestShip'});assert(await g.issued()>priorIssued);
 await rejected('two main undertakings reject atomically',()=>g.commitEconomicSlice(q,[craft(0),craft(1)],false,{gasLimit:1500000}));
 await commit(g,q,[craft(3),ship([12])],false,'craftShip');assert.equal(await g.purse(id),5500000n+expectedChest);assert.equal((await g.life(id)).wood,0n);passed('held quote survives another NFT payout',{chestRewardMicro:String(expectedChest)});
 await sent('founder',g.connect(bob).founder());const apples=3n;await day(g,apples,bob,[plant(0,8)],{seed:8});
 let picked=0;while((await g.life(apples)).plots[0].kind>0n){const l=await g.life(apples);const ready=l.plots[0].ticks===0n;if(ready)++picked;await day(g,apples,bob,[water(),...(ready?[harvest()]:[])],{shipping:false});}
 assert.equal(picked,6);assert.equal((await g.life(apples)).goods[7],6n);passed('apple first included in six pickups, no invisible accumulation',{pickups:picked,finalDay:Number((await g.life(apples)).day)});
 q=await open(g,apples,bob,0,false);
 await rejected('explicit care-only day cannot ship goods',()=>g.commitEconomicSlice(q,[ship([8])],false,{gasLimit:1500000}));
 await commit(g,q,[],false);assert.equal((await g.life(apples)).goods[7],6n);passed('care-only day preserves all unsent goods');
 q=await open(g,apples,bob);
 await rejected('missing output rejects without consuming available stock',()=>g.commitEconomicSlice(q,[ship([12])],false,{gasLimit:1500000}));
 await commit(g,q,[ship([8,8,8,8])],true,'terminalShip');assert.equal((await g.life(apples)).goods[7],2n);assert.equal((await g.life(apples)).alive,false);assert(await g.purse(apples)>0n);
 await sent('withdrawDead',g.connect(bob).withdraw(apples,U));passed('valid pre-death shipment paid; dead owner can withdraw directly');
 await rejected('dead rooster cannot request production',()=>g.connect(bob).accept(apples,0,false,{gasLimit:1500000}));
 q=await open(g,id,owner,1,false);const d=(await g.life(id)).day;
 await provider.send('evm_increaseTime',[901]);await provider.send('evm_mine',[]);
 await rejected('late settlement rejected even before expiry cleanup',()=>g.commitEconomicSlice(q,[plant(0,1)],false,{gasLimit:1500000}));
 await sent('expiry',g.connect(bob).expire(q));assert.equal((await g.life(id)).day,d);assert.equal((await g.life(id)).seeds[0],0n);
 await rejected('failure cannot release already expired reservation again',()=>g.fail(q,{gasLimit:1500000}));passed('expiry leaves biological base and kit unchanged');
 await sent('founder',g.founder());const producer=4n;
 let growingDays=0;
 while(await g.purse(producer)<510n*U){
  assert(growingDays++<200,'bounded earning experiment');const l=await g.life(producer),empty=l.plots.findIndex(p=>p.kind===0n),ready=l.plots.filter(p=>p.kind>0n&&p.ticks===0n).length;
  let acts=[water()];if(empty>=0)acts.push(plant(empty,1));else if(ready)acts.push(harvest(),ship(Array(ready).fill(1)));
  await day(g,producer,owner,acts,{seed:1,label:ready&&empty<0?'batchHarvestShip':'productionDay'});
 }
 await sent('approve',g.approve(ba,producer));
 await rejected('approved NFT operator cannot directly withdraw purse',()=>g.connect(bob).withdraw(producer,U,{gasLimit:1500000}));
 const oldNonce=await g.purseNonce(producer);await sent('transfer',g.transferFrom(oa,ba,producer));await sent('transfer',g.connect(bob).transferFrom(ba,oa,producer));
 await rejected('old purse intent invalid after ownership round trip',()=>g.birthFromPurse(producer,oldNonce,{gasLimit:1500000}));
 q=await open(g,producer,owner,0,false);
 await rejected('NFT transfer locked while accepted day pending',()=>g.transferFrom(oa,ba,producer,{gasLimit:1500000}));
 const before={purse:await g.purse(producer),supply:await t.totalSupply(),issued:await g.issued(),vault:await t.balanceOf(await g.getAddress())};
 await sent('birthPending',g.birthFromPurse(producer,await g.purseNonce(producer)));
 assert.equal(await g.purse(producer),before.purse-250n*U);assert.equal(await t.totalSupply(),before.supply-250n*U);assert.equal(await g.issued(),before.issued);assert.equal(await g.pending(producer),q);assert.equal(await g.ownerOf(5n),oa);passed('pending-source purse-funded birth burns250 without changing issuance pressure');
 await commit(g,q,[],true,'terminal');
 const deadBefore=await g.purse(producer);await sent('birthDead',g.birthFromPurse(producer,await g.purseNonce(producer)));assert.equal(await g.purse(producer),deadBefore-250n*U);assert.equal(await g.ownerOf(6n),oa);passed('dead-source purse can fund a new life');
 await invariant(g,t);
 const small=await deploy(owner,10n*U),s=small.g;
 for(let n=1;n<=2;n++){await sent('smallFounder',s.founder());await day(s,BigInt(n),owner,[plant(0,1)],{seed:1});await advanceToReady(s,BigInt(n),owner);}
 const held=await open(s,1n,owner);assert.equal((await s.request(held)).reserve,6500000n);
 await rejected('concurrent worst-feasible quote cannot exceed bucket',()=>s.accept(2n,0,true,{gasLimit:1500000}));
 await day(s,2n,owner,[harvest()],{shipping:false});assert.equal((await s.life(2n)).goods[0],1n);assert.equal(await s.purse(2n),0n);
 await commit(s,held,[harvest(),ship([1])]);await invariant(s,small.t);passed('busy bucket allows explicitly care-only growth/harvest and retains goods');
 const gasStats=Object.fromEntries(Object.entries(gas).map(([name,values])=>[name,{count:values.length,min:Math.min(...values),max:Math.max(...values),mean:Math.round(values.reduce((a,b)=>a+b,0)/values.length)}]));
 const report={scope:'Actual local Anvil Cancun EVM receipts, economics-only prototype. No full biology, inference-origin proof, fees, signatures, native NEAR compatibility or deployed-contract audit.',toolchain:{solc:solc.version(),evm:'cancun',optimizerRuns:200,viaIR:true,chainId:31337,localOnly:true,listener:'Ephemeral port announced by owned child; fresh block0 and actual chainID verified'},contractBytes:{init:art.evm.bytecode.object.length/2,runtime:art.evm.deployedBytecode.object.length/2,tokenRuntime:tok.evm.deployedBytecode.object.length/2},witnesses,successfulReceiptCount:txCount+deploymentCount,successfulCaseReceiptCount:txCount,deploymentReceiptCount:deploymentCount,revertedReceiptCount:revertedCount,producerDaysFor510Tokens:growingDays,gas:gasStats,final:{issuedMicro:String(await g.issued()),outstandingMicro:String(await t.totalSupply()),nftMintBurnMicro:String(await g.nftMintBurns()),vaultMicro:String(await t.balanceOf(await g.getAddress())),allocatedMicro:String(await g.totalAllocated())},knownLimitations:['Terminal bool is fixture only and MUST NOT become production death authority','No nutrition/illness/incident/phase replay; therefore gas underestimates complete biology','No owner signed quote/fee/seed-kit auth layer; requests are direct owner tx','No cold-storage NEAR or cross-chain implementation claim','Small bucket fixture changes capacity/refill only to expose pending-quote contention','NFT founder free creation is local-only fixture, no sale price oracle','Four boundary probes inject hypothetical counters through a separate pure harness; no injected state is written or minted']};
 fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1}).finally(async()=>{provider?.destroy();if(proc&&proc.exitCode===null){proc.kill();await new Promise(resolve=>{const timer=setTimeout(resolve,2000);proc.once('exit',()=>{clearTimeout(timer);resolve();});});}});
