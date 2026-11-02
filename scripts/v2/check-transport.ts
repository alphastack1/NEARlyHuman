import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createPublicClient} from 'viem';
import {v2HttpTransport,isV2StateLagError} from '../../src/chain/v2-transport';
const request={method:'eth_call',params:[{to:'0x1111111111111111111111111111111111111111',data:'0x12345678'},'0x93']} as const;
function mock(error:{code:number;message:string},failures:number){const calls:any[]=[];const fetchFn:typeof fetch=async(_input,init)=>{const body=JSON.parse(String(init?.body));calls.push(body);return new Response(JSON.stringify({jsonrpc:'2.0',id:body.id,...(calls.length<=failures?{error}:{result:'0x1234'})}),{headers:{'Content-Type':'application/json'}});};return{calls,client:createPublicClient({transport:v2HttpTransport('https://mock.invalid',{fetchFn,retryCount:0,timeout:1000})})};}
const checks:any[]=[];
{
 const m=mock({code:-32000,message:'unsupported block number 147'},2);assert.equal(await m.client.request(request),'0x1234');assert.equal(m.calls.length,3);assert(m.calls.every(c=>JSON.stringify(c.params)===JSON.stringify(request.params)));checks.push({name:'same pinned state arguments retry twice then succeed',calls:m.calls.length,block:m.calls[2].params[1]});
}
for(const [name,error,args]of[
 ['logical contract revert',{code:3,message:'execution reverted: accepted base'},request],
 ['generic invalid parameters',{code:-32602,message:'invalid parameters'},request],
 ['different unsupported block',{code:-32000,message:'unsupported block number 148'},request],
 ['unqualified latest state',{code:-32000,message:'unsupported block number 147'},{...request,params:[request.params[0],'latest']}],
 ['transaction submission',{code:-32000,message:'unsupported block number 147'},{method:'eth_sendRawTransaction',params:['0xdeadbeef']}],
] as const){const m=mock(error,100);await assert.rejects(m.client.request(args as any));assert.equal(m.calls.length,1);checks.push({name:name+' never receives an added retry',calls:m.calls.length});}
{
 const m=mock({code:-32000,message:'unsupported block number 147'},100),started=Date.now();let caught:unknown;try{await m.client.request(request);}catch(e){caught=e;}assert(isV2StateLagError(caught));assert(m.calls.length<=5);assert(Date.now()-started<3200);checks.push({name:'exhaustion stays bounded and explicitly transient through nested cause',calls:m.calls.length,elapsedMs:Date.now()-started});assert(isV2StateLagError(new Error('outer',{cause:caught})));
}
const out={scope:'Controlled HTTP responses via actual viem transport; zero network, signing, provider calls or ledger mutation.',checks,passed:true};await fs.mkdir(new URL('../../TEMP/v2-checks/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../../TEMP/v2-checks/transport-check.json',import.meta.url),JSON.stringify(out,null,2));console.log(JSON.stringify(out));
