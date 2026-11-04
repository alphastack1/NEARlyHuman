import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { publicEnvUpdateRequest, type CutoverPublicEnvEntry } from './env-update-request';

const tests:string[]=[],native:CutoverPublicEnvEntry={key:'NEARLYHUMAN_NEAR_RUNTIME_JSON',is_secret:false,scopes:['functions'],values:[{context:'all',value:'old public fixture'}]};
const replacement=publicEnvUpdateRequest(native,'new public fixture');assert.deepEqual(replacement,{method:'PUT',body:{key:native.key,is_secret:false,scopes:['functions'],values:[{context:'all',value:'new public fixture'}]}});tests.push('All-context public replacement uses complete PUT body preserving key/scopes/secret flag');
const production=publicEnvUpdateRequest({...native,key:'NEARLYHUMAN_V2_RUNTIME_JSON',values:[{context:'production',value:'old public fixture'}]},'new public fixture');assert.deepEqual(production,{method:'PATCH',body:{context:'production',value:'new public fixture'}});tests.push('Production-context public value uses individual PATCH body');
assert.throws(()=>publicEnvUpdateRequest({...native,is_secret:true},'fixture'));tests.push('Secret variable cannot enter either update form');
assert.throws(()=>publicEnvUpdateRequest({...native,values:[...native.values,{context:'production',value:'fixture'}]},'fixture'));tests.push('Multiple/custom contexts cannot be erased by full replacement');
assert.throws(()=>publicEnvUpdateRequest({...native,key:'NEARLYHUMAN_NEAR_RELAY_KEY'},'fixture'));tests.push('Unlisted/private key cannot enter public update helper');
assert.throws(()=>publicEnvUpdateRequest({...native,scopes:['functions','builds']},'fixture'));tests.push('Unexpected scope metadata is preserved through rejection');
let schemaEvidence:unknown;
const schemaFile=process.argv.find(arg=>arg.startsWith('--schema='))?.slice(9);
if(schemaFile){
  const bytes=await fs.readFile(schemaFile),schema=JSON.parse(bytes.toString('utf8')),operations=schema.paths['/accounts/{account_id}/env/{key}'];
  for(const [update,operation]of [[replacement,'updateEnvVar'],[production,'setEnvVarValue']] as const){
    const spec=operations[update.method.toLowerCase()];assert.equal(spec.operationId,operation);const body=spec.parameters.find((parameter:{in:string})=>parameter.in==='body').schema;
    for(const [key,value]of Object.entries(update.body)){assert(key in body.properties);const property=body.properties[key];if(property.type==='string')assert.equal(typeof value,'string');if(property.type==='boolean')assert.equal(typeof value,'boolean');if(property.type==='array'){assert(Array.isArray(value));if(property.items.enum)assert((value as unknown[]).every(item=>property.items.enum.includes(item)));}}
    const context=update.method==='PUT'?(update.body as typeof replacement.body).values![0]!.context:(update.body as typeof production.body).context;const contextSchema=update.method==='PUT'?body.properties.values.items.properties.context:body.properties.context;assert(contextSchema.enum.includes(context));
  }
  schemaEvidence={source:'Installed official @netlify/open-api/dist/swagger.json',sha256:createHash('sha256').update(bytes).digest('hex'),operations:['updateEnvVar PUT','setEnvVarValue PATCH'],reference:'https://open-api.netlify.com/#tag/environmentVariables'};
  tests.push('Both generated bodies match installed official operation/schema properties and context enums');
}
const report={checkedAt:new Date().toISOString(),pass:true,cases:tests.length,tests,schemaEvidence,scope:'Public in-memory fixtures and official schema only; no Netlify network requests, credentials or writes.'};
await fs.mkdir(new URL('../../TEMP/rh-v3/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../../TEMP/rh-v3/env-update-schema-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
