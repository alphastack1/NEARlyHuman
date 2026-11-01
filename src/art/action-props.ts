import {canvasArt,outline}from'./pixels';
import type{Receipt}from'../domain/types';

/** Transient presentation props only: these are never catalogue/inventory items. */
export const ACTION_PROPS=['toast','cookedSteak','sandwich','bowl','coffeeCup','milkCoffeeCup','apple','rose']as const;
export type ActionProp=typeof ACTION_PROPS[number];
export function actionResultProp(r:Receipt):ActionProp|undefined{
 if(!r.success)return;
 return({K01:'toast',K02:'cookedSteak',K03:'bowl',K04:'sandwich',K05:'coffeeCup',K06:'milkCoffeeCup'}as Partial<Record<string,ActionProp>>)[r.action]
  ||(r.action==='H01'&&r.variant==='quickCoffee'?'coffeeCup':r.action==='G05'?(r.variant==='apple'?'apple':'rose'):undefined);
}
export function actionPropCanvas(kind:ActionProp):HTMLCanvasElement{return canvasArt(16,16,p=>{
 if(kind==='toast'){outline(p,3,3,10,11,'#bd7d3c');p('#ecd08a',4,4,8,8);p('#e3b660',5,5,6,6);p('#c79143',5,5,2,1);p('#b7833c',9,9,2,1);p('#e7c77d',5,12,6,1);}
 if(kind==='cookedSteak'){p('#d1d9cb',1,10,14,4);p('#8c9d9b',2,13,12,1);p('#e7e8d6',2,10,12,2);outline(p,3,5,10,7,'#7d4b34');p('#af7450',4,6,8,4);p('#d49664',5,6,5,1);for(const x of[5,8,11])p('#59432e',x,7,1,3);}
 if(kind==='sandwich'){p('#49372b',1,6,14,7);p('#bc8642',2,4,12,3);p('#edc477',3,3,10,3);p('#f6d99a',4,3,8,1);p('#e8d9aa',2,7,12,2);p('#588744',2,8,12,2);p('#9d5340',2,10,12,2);p('#dbad60',2,12,12,2);p('#a47337',3,14,10,1);}
 if(kind==='bowl'){p('#384f5c',1,6,14,5);p('#dce8d9',2,5,12,3);p('#ecd6a5',3,6,10,2);p('#ac854a',4,6,3,1);p('#d4b678',9,6,2,2);p('#90b2bb',2,9,12,3);p('#5e8599',3,12,10,2);p('#3f6478',5,14,6,1);p('#bed4d1',3,9,2,3);}
 if(kind==='coffeeCup'||kind==='milkCoffeeCup'){outline(p,3,5,9,9,'#dbe4d3');p(kind==='coffeeCup'?'#735037':'#c39b6b',4,5,7,2);p('#f1efda',4,8,6,4);p('#9db5b3',3,12,8,1);p('#bbcfc6',12,6,3,5);p('#354a4f',12,7,2,3);p('#d6e6dc',6,2,1,2);p('#d6e6dc',8,0,1,3);}
 if(kind==='apple'){p('#473a29',8,1,1,3);p('#638a42',9,1,4,2);p('#822f35',3,5,10,7);p('#bd3c3b',2,5,11,5);p('#e25845',4,4,8,7);p('#f18b60',4,5,3,2);p('#b53335',5,11,6,2);p('#e3694d',8,10,3,1);}
 if(kind==='rose'){p('#355d36',8,7,1,8);p('#739d4d',9,9,3,2);p('#507d40',5,11,3,2);p('#792b54',4,2,8,6);p('#b93c70',3,3,10,5);p('#dc6591',5,1,6,6);p('#ef9db1',6,2,3,2);p('#9a345f',7,5,5,3);}
});}
