const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),solc=require(path.join(root,'node_modules/solc')),out=path.join(root,'TEMP/rh-v3');fs.mkdirSync(out,{recursive:true});
const files=['contracts/v3/NEARlyHumanV3.sol','contracts/token/NHCTransferBurn.sol'];
if(process.argv.includes('--tests'))files.push('contracts/v3/test/TransferBurnGameHarness.sol');
// Hash the exact text supplied to solc, including every resolved transitive import.
const compilerSources=new Map(files.map(file=>[file,fs.readFileSync(path.join(root,file),'utf8')]));
const input={language:'Solidity',sources:Object.fromEntries([...compilerSources].map(([file,content])=>[file,{content}])),settings:{optimizer:{enabled:true,runs:1},viaIR:true,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}}};
const compiled=JSON.parse(solc.compile(JSON.stringify(input),{import:file=>{try{const contents=fs.readFileSync(path.join(root,file.startsWith('@')?'node_modules':'',file),'utf8');compilerSources.set(file,contents);return{contents}}catch{return{error:'Missing import '+file}}}}));
fs.writeFileSync(path.join(out,'compiled.json'),JSON.stringify(compiled));
const errors=(compiled.errors||[]).filter(e=>e.severity==='error');if(errors.length){for(const e of errors)console.error(e.formattedMessage);process.exitCode=1;}else{
 const sources=Object.fromEntries(Object.keys(compiled.sources).sort().map(file=>{const content=compilerSources.get(file);if(content===undefined)throw Error('Missing resolved compiler input '+file);return[file,crypto.createHash('sha256').update(content,'utf8').digest('hex')]}));
 const list=[];for(const file of files)for(const[name,a]of Object.entries(compiled.contracts[file])){if(!a.evm.bytecode.object)continue;const artifact={contractName:name,compiler:solc.version(),evmVersion:'cancun',optimizerRuns:1,abi:a.abi,bytecode:'0x'+a.evm.bytecode.object,deployedBytecode:'0x'+a.evm.deployedBytecode.object,immutableReferences:a.evm.deployedBytecode.immutableReferences,sources};list.push({name,initBytes:a.evm.bytecode.object.length/2,runtimeBytes:a.evm.deployedBytecode.object.length/2});if(process.argv.includes('--artifacts')&&!file.includes('/test/')){const dest=path.join(root,'contracts/v3/artifacts');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,name+'.json'),JSON.stringify(artifact,null,2)+'\n');}}
 if(list.some(a=>a.runtimeBytes>24576))throw Error('Runtime size exceeds EIP-170');console.log(JSON.stringify({pass:true,compiler:solc.version(),contracts:list}));
}
