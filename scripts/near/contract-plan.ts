/** LOCAL contract evidence planner. No wallet, RPC, AI or financial-store access.
 * Reads one canonical accepted snapshot on stdin and emits a TS-verified trace.
 * This is deterministic care/production test tooling, not the game's AI policy. */
import fs from 'node:fs';
import { keccak256 } from 'viem';
import { decodeState,encodeTrace,encodeState,encodeCertificate } from '../../src/v2/codec';
import { openDay,beginSlot,endSlot,replayDay,previewPrimary } from '../../src/v2/kernel';
import { buildCareCertificate } from '../../src/v2/rescue';
import { clone } from '../../src/v2/state';
import { Op,step,type Step,type Certificate } from '../../src/v2/types';
import { shipmentBaskets } from '../../src/v2/catalog';
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const base=decodeState(input.state),kit=BigInt(input.kit),ctx=openDay(base,kit,input.seed,input.shipping!==false,255);
const steps:Step[]=[];let certificate:Certificate|undefined;
for(let slot=1;slot<=60&&ctx.state.alive;slot++){
 if(input.witness){const p=previewPrimary(ctx,slot);if(p?.harmful){certificate=buildCareCertificate(p.context);if(certificate&&input.witness==='late-invalid')certificate.steps.push(step(181,Op.Quiet));}}
 beginSlot(ctx,slot,certificate);const options:Step[]=[];
 if(slot===1)options.push(step(slot,Op.Pickup));
 if(slot===11)options.push(step(slot,Op.Breakfast,2,0),step(slot,Op.Breakfast,1,0),step(slot,Op.Eat,2));
 if(slot===21)options.push(step(slot,Op.Well));
 if(slot===31)options.push(step(slot,Op.Leisure));
 if(slot===36){options.push(step(slot,Op.Harvest));for(let bed=0;bed<4;bed++)options.push(step(slot,Op.Plant,bed,1));for(let bed=0;bed<4;bed++)options.push(step(slot,Op.RestoreSoil,bed));options.push(step(slot,Op.QuietMain));}
 if(slot===41&&input.shipping!==false){for(const basket of shipmentBaskets(ctx.state.inventory))options.push(step(slot,Op.Ship,0,0,basket.goods));}
 if(slot===51)options.push(step(slot,Op.Rest));
 if(input.neglect)options.length=0;
 let selected:Step|undefined;
 for(const option of options){try{endSlot(clone(ctx),option);selected=option;break;}catch{}}
 if(selected)steps.push(selected);endSlot(ctx,selected);
}
const trace={goal:255,steps},result=replayDay(base,kit,trace,input.seed,input.shipping!==false,certificate),state=encodeState(result.state);
console.log(JSON.stringify({trace:encodeTrace(trace),certificate:encodeCertificate(certificate),certificateSteps:certificate?.steps.length||0,state,stateHash:keccak256(state),points:result.points,alive:result.state.alive,day:result.state.day,delivery:result.delivery,steps:steps.map(s=>({slot:s.slot,op:s.op,arg:s.arg,variant:s.variant,goods:s.goods}))}));
