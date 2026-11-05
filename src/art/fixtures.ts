import { canvasArt, COLORS as C, outline, plantArt, woodPanel } from './pixels';

export type FixtureArt='fridge'|'pantry'|'stove'|'prep'|'sink'|'bed'|'bedCover'|'cupboard'|'baseSeat'|'chair'|'table'|'window'|'plant'|'painting'|'mailbox'|'shelf'|'bedside'|'umbrella'|'shelter';
export interface ArtOptions { damaged?:boolean; patched?:boolean; braced?:boolean; open?:boolean; parcel?:boolean; variant?:number }
export const FIXTURE_SIZES:Record<FixtureArt,[number,number]>={fridge:[30,44],pantry:[34,28],stove:[32,34],prep:[34,28],sink:[32,30],bed:[44,66],bedCover:[44,66],cupboard:[28,44],baseSeat:[24,28],chair:[18,25],table:[52,36],window:[36,32],plant:[26,31],painting:[20,18],mailbox:[23,28],shelf:[36,20],bedside:[26,35],umbrella:[40,48],shelter:[92,66]};

export function fixtureCanvas(kind:FixtureArt,opts:ArtOptions={}):HTMLCanvasElement {
  const [w,h]=FIXTURE_SIZES[kind];
  return canvasArt(w,h,p=>{
    if(kind==='plant'){plantArt(p,0,0);return;}
    if(kind==='fridge'){
      p(C.outline,3,1,24,42);p(C.metalDark,4,2,22,40);p(C.metalLight,5,2,19,38);p('#bdc5bd',6,4,17,35);p('#e1e4d6',6,4,17,2);p('#889594',24,4,2,36);
      p('#6d7978',5,18,19,2);p('#e0e3d7',6,20,17,1);p('#566365',7,10,2,5);p('#566365',7,23,2,6);p('#f3f0d7',9,10,1,5);p('#d45945',16,22,3,2);p('#69a66b',19,24,2,3);p('#5e8d9d',11,32,2,2);p(C.outline,6,41,3,3);p(C.outline,22,41,3,3);
      if(opts.open){p('#566563',4,20,20,19);p('#d1d6bd',5,23,17,1);p('#d1d6bd',5,30,17,1);p('#e9ecdd',5,37,17,1);p('#e1e2ce',0,19,7,22);p('#8e9d94',0,19,1,22);p('#409ec9',10,25,3,4);p('#f4e4c7',16,32,3,4);}
    }
    if(kind==='stove'){
      outline(p,1,1,30,31,C.metalDark);p('#d1d2bb',2,2,28,13);p('#8f9a93',3,3,26,11);p('#c4c8b9',4,3,24,1);
      for(const x of [5,18])for(const y of [4,10]){p('#313b3a',x,y,8,5);p('#4c5650',x+2,y+1,4,3);p('#263133',x+3,y+1,2,2);}
      p('#566561',3,16,26,4);for(const x of [5,11,18,24]){p('#293a3a',x,17,3,2);p('#a0afa1',x,17,2,1);}
      outline(p,4,21,23,10,'#273d42');p('#758b86',6,23,19,1);p('#192e34',7,25,16,4);p('#ed9a42',14,26,4,2);p(C.outline,3,32,4,2);p(C.outline,25,32,4,2);
      if(opts.damaged){for(const[x,y]of [[25,13],[24,15],[25,17],[23,19],[25,21],[26,23],[25,25],[27,27],[27,29]])p('#292c28',x,y,1,3);}
      if(opts.patched){woodPanel(p,24,21,7,11);p('#696b5a',26,23,2,2);p('#696b5a',26,28,2,2);}
    }
    if(kind==='prep'||kind==='sink'){
      outline(p,1,4,30,23,C.beam);p('#d39857',2,5,28,5);p('#e1b578',2,5,28,1);p('#946038',2,11,28,15);
      woodPanel(p,3,13,12,13);woodPanel(p,16,13,13,13);p('#ded1a6',12,18,2,2);p('#ded1a6',18,18,2,2);p(C.outline,3,26,3,2);p(C.outline,27,26,3,2);
      if(kind==='prep'){outline(p,7,6,15,7,'#d2bd88');p('#e6d5a8',9,7,11,4);p('#ae9b6f',10,10,6,1);p('#9da79a',25,3,2,6);p('#d4d7c4',25,2,2,5);}
      else{outline(p,6,5,20,8,'#849e96');p('#d6dfcf',8,6,16,5);p('#628d91',10,7,12,3);p('#9ed9d4',11,7,9,1);p('#315966',15,9,3,1);p('#507c83',18,0,3,6);p('#c3dfd6',19,0,2,4);p('#385f6a',15,0,5,2);p('#e5efda',16,0,4,1);p('#3b8ca3',26,7,3,7);p('#8dcec9',26,7,3,1);p('#d8e7cd',27,9,1,4);}
    }
    if(kind==='pantry'||kind==='cupboard'){
      const width=kind==='cupboard'?28:24;const height=kind==='cupboard'?44:34;
      outline(p,1,1,width-2,height-3,C.beam);p('#a17b50',3,3,width-6,height-7);p('#b78a57',3,3,width-6,2);p('#6d4a30',width/2,6,1,height-13);p('#c79a60',4,6,1,height-13);p('#c79a60',width-5,6,1,height-13);p('#e8c683',width/2-3,height/2,1,3);p('#e8c683',width/2+3,height/2,1,3);p(C.outline,3,height-3,3,3);p(C.outline,width-6,height-3,3,3);
      if(opts.open){p('#503c29',5,7,width-10,height-15);for(const y of [15,27]){if(y<height-7){p('#a5804f',5,y,width-10,2);p('#e3e1c7',8,y-6,4,5);p('#bb4645',9,y-5,2,3);p('#568b74',16,y-4,3,3);}}p('#ad7c45',2,5,5,height-11);p('#65462d',6,6,1,height-13);}
    }
    if(kind==='bed'||kind==='bedCover'){
      if(kind==='bed'){
        outline(p,2,0,40,64,C.beam);p('#9f7147',4,2,36,6);p('#c09359',5,3,34,2);p('#4c3d31',5,8,34,3);p('#5d7088',5,11,34,47);p('#83acd4',6,12,32,44);
        outline(p,8,12,28,16,'#aac5e0','#5276a5');p('#cbd9dc',10,14,24,10);p('#d8e1db',11,14,22,2);p('#94b6d9',10,24,24,2);
      }
      // Blanket is also a separate foreground layer for the menu sleeping pose.
      p('#254a81',5,29,34,29);p('#3776b6',6,30,32,27);p('#4c8cce',7,30,30,6);p('#6ca7de',8,30,28,2);p('#345e9a',6,36,7,21);p('#2f6ab2',13,36,8,21);p('#3e80c2',21,36,9,21);p('#2861a6',30,36,8,21);p('#548ed0',9,37,3,17);p('#3b75b7',17,38,3,17);p('#548bd0',25,37,3,18);p('#1f4d88',6,55,32,3);
      if(kind==='bed'){p(C.outline,2,59,40,5);p('#89603f',4,59,36,3);p('#be8d55',5,59,34,1);p(C.outline,3,62,4,4);p(C.outline,37,62,4,4);}
    }
    if(kind==='chair'){
      p(C.outline,3,1,12,22);p('#9f7144',4,2,10,19);p('#ca995f',4,2,10,2);p('#322e26',6,5,6,7);for(const x of [6,9,12])p('#b98b54',x,5,1,7);
      outline(p,2,13,14,7,'#b98750');p('#d6a66b',3,14,12,2);p('#8d603b',3,18,12,1);p(C.outline,2,19,3,6);p('#997044',3,20,1,4);p(C.outline,13,19,3,6);p('#ac7b4b',14,20,1,4);
      if(opts.damaged){p('#312c26',2,21,3,1);p('#312c26',4,22,2,2);}
      if(opts.braced){p('#e0dcc6',1,21,5,2);p('#f2ecd4',1,21,4,1);p('#b0b6a8',2,23,3,1);}
    }
    if(kind==='baseSeat'){
      p(C.outline,2,1,20,25);p('#9e7950',3,2,18,22);p('#cdb68a',4,3,16,16);p('#eee2be',5,4,14,13);p('#e1d6af',4,17,16,5);p('#aeb58b',6,7,10,9);p('#5e8c58',7,7,8,8);p('#85a36a',8,8,6,2);p(C.outline,2,23,3,5);p(C.outline,19,23,3,5);
    }
    if(kind==='table'){
      p(C.outline,3,7,36,24);p('#9c7044',5,13,4,21);p('#9c7044',33,13,4,21);outline(p,1,1,40,25,'#b6834c');p('#d1a16a',3,3,36,20);p('#e1b780',3,3,36,2);p('#b17e47',4,12,34,1);p('#a87946',3,22,36,2);
      p('#d9c89d',11,7,20,13);p('#f2e6c1',12,7,18,12);for(let y=8;y<19;y+=4)for(let x=12;x<30;x+=4)p('#dfd2ad',x,y,2,2);
      p('#855f3d',19,9,6,7);p('#bd8850',19,9,6,2);p('#518047',17,7,9,4);p('#7ba155',20,4,5,7);p('#a2b264',21,4,2,2);
    }
    if(kind==='window'){
      outline(p,1,1,34,30,C.beam);p('#b5844a',3,3,30,24);p('#dfbb7e',4,4,28,22);p('#527e95',6,6,24,18);p('#7caed0',7,7,22,16);p('#a3cbdf',8,8,20,3);p('#e1e6d6',9,8,3,4);p('#d2e7df',11,9,3,2);p('#bad4db',23,17,4,4);p('#bc9b63',17,5,3,20);p('#ad8a57',5,14,26,3);p('#e0c68b',18,6,1,18);p('#d6ba7f',6,14,24,1);p(C.beam,0,28,36,3);p('#bc8e54',1,28,34,1);
      if(opts.damaged){for(const [x,y]of [[24,7],[23,9],[25,11],[24,13],[26,15]])p('#3c5657',x,y,1,3);}
      if(opts.patched||opts.braced){for(let i=0;i<25;i++){p('#67492e',5+i,23-Math.floor(i/2),3,4);p('#bd8b4c',5+i,23-Math.floor(i/2),2,2);}p('#b6baaa',7,22,2,2);p('#b6baaa',28,12,2,2);}
    }
    if(kind==='painting'){
      outline(p,0,0,20,18,'#785737');p('#b68b54',1,1,18,16);p('#d9c68e',3,3,14,12);p('#78a8ba',4,4,12,10);p('#a2cad6',5,5,10,3);p('#577e55',4,10,12,4);p('#73945a',7,8,5,5);p('#45694b',10,10,6,4);
      if(opts.variant===1){p('#759db2',4,4,12,10);p('#d5ddd0',7,6,5,3);p('#e1e1c8',8,5,3,2);p('#517e69',4,12,12,2);p('#87b4bc',4,10,12,2);}
      if(opts.variant===2){p('#ded7b0',4,4,12,10);p('#4c7651',9,8,2,6);p('#527e52',6,10,6,2);p('#b96862',7,5,6,5);p('#e0a083',8,5,3,2);p('#d0b76f',9,7,2,2);}
      if(opts.variant===3){p('#86b3bf',4,4,12,10);p('#52745a',4,11,12,3);p('#7c5739',7,8,6,5);p('#bf915d',8,9,4,4);p('#6d4d38',6,7,8,2);p('#ead8aa',9,10,2,2);}
    }
    if(kind==='mailbox'){
      p('#3a3429',9,14,6,14);p('#926b3f',10,15,4,13);p('#c6a064',10,15,1,12);p('#5d4932',7,26,10,2);
      p('#172c39',1,5,21,12);p('#172c39',4,2,15,15);p('#456d78',2,6,19,9);p('#64929a',5,3,13,3);p('#9cb6ae',5,3,12,1);p('#30515f',3,13,17,3);p('#b6c8b9',5,7,11,1);p('#dcce99',11,11,3,2);
      if(opts.open){p('#152b36',4,7,14,8);p('#6c8c91',2,15,18,3);p('#a6bcb4',3,16,16,1);}
      p('#573e32',20,6,2,9);p('#bd5143',19,opts.parcel?0:10,4,4);if(opts.parcel)p('#d97556',20,0,3,1);
      if(opts.parcel&&opts.open){p('#805f3b',6,8,10,7);p('#d3ae73',7,8,8,6);p('#a67e47',10,8,2,6);p('#e9ddbd',8,10,5,2);}
    }
    if(kind==='shelf'){
      p(C.outline,1,13,34,5);p('#9d7046',2,13,32,3);p('#c3995f',2,13,32,1);p('#684d33',6,18,3,2);p('#684d33',28,18,3,2);
      p('#eff0da',9,2,5,11);p('#f6eacf',10,3,3,7);p('#865d3c',15,4,4,9);p('#d1b37a',16,5,2,7);p('#487c4e',23,6,7,7);p('#65a05b',25,2,4,8);p('#88b365',26,2,2,4);
      if(opts.variant){p(['#f0db9f','#3f8fa9','#77a754','#cc795c'][opts.variant%4],9,3,4,9);p('#f1e6c4',9,4,4,1);}
    }
    if(kind==='bedside'){
      p('#332c27',1,15,24,18);p('#67482f',3,16,20,16);p('#a47847',3,17,20,13);p('#d2a264',2,15,22,2);p('#e4b77a',3,15,20,1);
      p('#6c4e31',4,20,18,1);p('#bf9256',5,22,16,7);p('#7f5b36',5,28,16,1);p('#e0bf79',12,23,3,2);p('#352c25',3,32,3,3);p('#352c25',20,32,3,3);
      p('#6c6653',11,7,4,9);p('#b9b69a',12,8,2,6);p('#4b4b3d',8,14,11,2);p('#a7a087',9,14,9,1);
      p('#555a50',7,2,13,8);p('#c3bd98',6,3,15,7);p('#e8ddb5',7,2,13,6);p('#f5e9c5',9,2,8,1);p('#d1c79f',7,8,13,2);p('#ada782',6,10,15,1);
      if(opts.variant===1){p('#c4bd98',10,3,1,5);p('#c4bd98',16,3,1,5);}if(opts.variant===2)p('#b7b894',7,7,13,1);
    }
    if(kind==='umbrella'){
      p('#353b34',20,12,2,35);p('#b59152',20,39,3,8);p('#2b526d',5,9,30,12);p('#235b93',2,13,36,8);p('#387eb4',5,9,30,11);p('#4e9bcf',10,5,20,12);p('#8ec5dc',16,3,9,13);p('#c3ddd9',19,3,2,14);p('#246695',3,19,34,2);p('#32433c',19,0,3,4);
    }
    if(kind==='shelter'){
      p('#54432c',6,16,5,50);p('#a27743',7,18,2,46);p('#54432c',82,16,5,50);p('#a27743',83,18,2,46);
      for(let y=0;y<27;y++){const inset=Math.max(0,8-Math.floor(y/3));p('#4a3827',inset,y,92-inset*2,1);p(y%5===0?'#d0a064':y%5===4?'#7d532f':'#ac7b46',inset+2,y,88-inset*2,1);}
      p('#5e422b',1,27,90,4);p('#bc8a51',2,27,88,1);p('#756044',3,62,11,4);p('#756044',79,62,11,4);
    }
  });
}
