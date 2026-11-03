import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import solc from 'solc';

// Public explorer metadata only. Dry-run by default; --submit publishes source
// after exact artifact/creation-bytecode checks. No private key or gas is used.
const root=path.resolve(import.meta.dirname,'../..'),out=path.join(root,'TEMP/player-feedback/wallet/verification');
await fs.mkdir(out,{recursive:true});
const deployment=JSON.parse(await fs.readFile(path.join(root,'contracts/v2/deployments/robinhood-testnet.json'),'utf8'));
if(deployment.runtime.chainId!==46630)throw Error('Only Robinhood Testnet verification is permitted.');
const sources:Record<string,{content:string}>={};
for(const name of await fs.readdir(path.join(root,'contracts/v2')))if(name.endsWith('.sol'))sources['contracts/v2/'+name]={content:await fs.readFile(path.join(root,'contracts/v2',name),'utf8')};
const settings={optimizer:{enabled:true,runs:1},viaIR:true,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}};
const imports:Record<string,{content:string}>={};
const {readFileSync}=await import('node:fs');
const input={language:'Solidity',sources,settings};
const compiled=JSON.parse(solc.compile(JSON.stringify(input),{import:(name:string)=>{
 try{const resolved=path.resolve(root,name.startsWith('@')?'node_modules':'',name);if(!resolved.startsWith(root+path.sep)||!name.endsWith('.sol'))throw Error('Unexpected source import');const content=readFileSync(resolved,'utf8');imports[name]={content};return{contents:content}}catch{return{error:'Missing source '+name}}
}}));
if(compiled.errors?.some((e:{severity:string})=>e.severity==='error'))throw Error('Verification compilation failed.');
const standard={...input,sources:{...sources,...imports}};
await fs.writeFile(path.join(out,'standard-input.json'),JSON.stringify(standard));
const explorer='https://explorer.testnet.chain.robinhood.com';
const rpc='https://rpc.testnet.chain.robinhood.com';
const verificationConfig=await (await fetch(explorer+'/api/v2/smart-contracts/verification/config')).json();
const compiler='v'+solc.version().split('.Emscripten')[0];
if(!verificationConfig.solidity_compiler_versions?.includes(compiler))throw Error('Explorer does not offer the exact compiler.');
if(solc.version()!==deployment.compiler)throw Error('Compiler differs from the deployed artifact compiler.');
const report:{contract:string;address:string;creationMatches?:boolean;runtimeMatches?:boolean;artifactMatches:boolean;sourceInputSha256:string;compiler:string;submission?:unknown}[]=[];
for(const name of ['V2ActionModule','V2LifeVerifier','NEARlyHumanV2']){
 const filename='contracts/v2/'+(name==='NEARlyHumanV2'?'NEARlyHumanV2':name)+'.sol';
 const artifact=JSON.parse(await fs.readFile(path.join(root,'contracts/v2/artifacts',name+'.json'),'utf8'));
 const build=compiled.contracts[filename][name];
 if('0x'+build.evm.bytecode.object!==artifact.bytecode||'0x'+build.evm.deployedBytecode.object!==artifact.deployedBytecode)throw Error(name+' source does not reproduce deployment artifacts.');
 const creation=deployment.transactions[name];
 const transaction=await (await fetch(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getTransactionByHash',params:[creation.hash]})})).json();
 if(!transaction.result||transaction.result.to!==null||!transaction.result.input.startsWith(artifact.bytecode))throw Error(name+' creation bytecode does not match the canonical creation transaction.');
 const constructorArguments=transaction.result.input.slice(artifact.bytecode.length);
 const payload={contractaddress:creation.contractAddress,contractname:filename+':'+name,codeformat:'solidity-standard-json-input',compilerversion:compiler,sourceCode:JSON.stringify(standard),constructorArguments,licenseType:'3'};
 await fs.writeFile(path.join(out,name+'-payload.json'),JSON.stringify(payload));
 const row={contract:name,address:creation.contractAddress,creationMatches:true,artifactMatches:true,sourceInputSha256:createHash('sha256').update(payload.sourceCode).digest('hex'),compiler} as (typeof report)[number];
 if(process.argv.includes('--submit')){
  const response=await fetch(explorer+'/api?module=contract&action=verifysourcecode',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(payload),signal:AbortSignal.timeout(60000)});
  row.submission=await response.json();
 }
 report.push(row);
 console.log(JSON.stringify(row));
}
// The token is created inside the controller constructor. Its public runtime
// differs only at immutable controller slots; it has no constructor arguments.
const coinArtifact=JSON.parse(await fs.readFile(path.join(root,'contracts/v2/artifacts/NEARlyHumanCoin.json'),'utf8'));
const coinBuild=compiled.contracts['contracts/v2/NEARlyHumanV2.sol'].NEARlyHumanCoin;
if('0x'+coinBuild.evm.bytecode.object!==coinArtifact.bytecode||'0x'+coinBuild.evm.deployedBytecode.object!==coinArtifact.deployedBytecode)throw Error('Token source does not reproduce the deployment artifact.');
const codeResponse=await(await fetch(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getCode',params:[deployment.token,'latest']})})).json();
if(typeof codeResponse.result!=='string'||codeResponse.result.toLowerCase().replaceAll(deployment.runtime.collection.slice(2).toLowerCase().padStart(64,'0'),'0'.repeat(64))!==coinArtifact.deployedBytecode.toLowerCase())throw Error('Token runtime differs after exact controller immutable substitution.');
const coinPayload={contractaddress:deployment.token,contractname:'contracts/v2/NEARlyHumanV2.sol:NEARlyHumanCoin',codeformat:'solidity-standard-json-input',compilerversion:compiler,sourceCode:JSON.stringify(standard),constructorArguments:'',licenseType:'3'};
await fs.writeFile(path.join(out,'NEARlyHumanCoin-payload.json'),JSON.stringify(coinPayload));
const coinRow={contract:'NEARlyHumanCoin',address:deployment.token,artifactMatches:true,runtimeMatches:true,sourceInputSha256:createHash('sha256').update(coinPayload.sourceCode).digest('hex'),compiler} as (typeof report)[number];
if(process.argv.includes('--submit'))coinRow.submission=await(await fetch(explorer+'/api?module=contract&action=verifysourcecode',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(coinPayload),signal:AbortSignal.timeout(60000)})).json();
report.push(coinRow);console.log(JSON.stringify(coinRow));
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({scope:'Public source verification only; zero wallet signing, chain transactions or model calls.',checkedAt:new Date().toISOString(),submitted:process.argv.includes('--submit'),report},null,2));
