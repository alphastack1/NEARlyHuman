const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'TEMP/overnight/wave1/contract');
fs.mkdirSync(OUT,{recursive:true});
const solc=require(path.join(ROOT,'node_modules/solc'));
const sources=Object.fromEntries(fs.readdirSync(path.join(ROOT,'contracts/v2')).filter(n=>n.endsWith('.sol')).map(n=>['contracts/v2/'+n,{content:fs.readFileSync(path.join(ROOT,'contracts/v2',n),'utf8')}]));
const compiled=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:1},viaIR:true,evmVersion:'cancun',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}}),{import:n=>{try{return{contents:fs.readFileSync(path.join(ROOT,n.startsWith('@')?'node_modules':'',n),'utf8')}}catch(e){return{error:e.message}}}}));
fs.writeFileSync(path.join(OUT,'compiled.json'),JSON.stringify(compiled));
for(const e of compiled.errors||[])console.log(e.formattedMessage);
if((compiled.errors||[]).some(e=>e.severity==='error'))process.exitCode=1;
else {const list=[];for(const [file,contracts]of Object.entries(compiled.contracts))for(const [name,a]of Object.entries(contracts))if(file.startsWith('contracts/v2/'))list.push({name,init:a.evm.bytecode.object.length/2,runtime:a.evm.deployedBytecode.object.length/2});console.log(JSON.stringify({compiler:solc.version(),contracts:list},null,2));
 if(process.argv.includes('--artifacts')){const dest=path.join(ROOT,'contracts/v2/artifacts');fs.mkdirSync(dest,{recursive:true});for(const [file,contracts]of Object.entries(compiled.contracts))if(file.startsWith('contracts/v2/'))for(const [name,a]of Object.entries(contracts))if(a.evm.bytecode.object)fs.writeFileSync(path.join(dest,name+'.json'),JSON.stringify({contractName:name,compiler:solc.version(),evmVersion:'cancun',abi:a.abi,bytecode:'0x'+a.evm.bytecode.object,deployedBytecode:'0x'+a.evm.deployedBytecode.object},null,2)+'\n');}
}
