"""Deterministic native-frame export of the approved transparent furniture sources.

Authoring tool only; production uses committed PNGs and needs no Python/Pillow.
This preserves content, normalizes alpha/scale and bottom-center contact anchors.
"""
from pathlib import Path
from PIL import Image
import json

HERE=Path(__file__).resolve().parent
OUT=HERE.parents[1]/'public'/'assets'/'game'/'props'
OUT.mkdir(parents=True,exist_ok=True)
GROUPS={
 'kitchen':[('fridge',30,44),('stove',32,34),('prep',34,28)],
 'bedroom':[('bed',44,66),('cupboard',28,44),('plant',26,31)],
 'living':[('table',52,36),('chair',18,25),('baseSeat',24,28)],
}
records=[]
for group,frames in GROUPS.items():
    image=Image.open(HERE/'sources'/f'{group}.png').convert('RGBA')
    alpha=image.getchannel('A').point(lambda x:255 if x>=96 else 0)
    # Isolated objects have clear horizontal gutters, but the generated table is
    # wider than its requested third. Find actual silhouettes rather than
    # clipping a chair into the neighboring frame with equal-width slicing.
    runs=[];begin=None
    for x in range(image.width+1):
        occupied=x<image.width and alpha.crop((x,0,x+1,image.height)).getbbox() is not None
        if occupied and begin is None:begin=x
        elif not occupied and begin is not None:runs.append((begin,x));begin=None
    if len(runs)!=3:raise ValueError(f'Expected three isolated silhouettes in {group}, found {len(runs)}')
    for i,(name,width,height) in enumerate(frames):
        left,right=runs[i]
        slot=image.crop((left,0,right,image.height))
        alpha=slot.getchannel('A').point(lambda x:255 if x>=96 else 0)
        slot.putalpha(alpha)
        box=alpha.getbbox()
        if box is None:raise ValueError(f'Empty source: {group}/{name}')
        crop=slot.crop(box)
        scale=min(width/crop.width,height/crop.height)
        new_size=(max(1,round(crop.width*scale)),max(1,round(crop.height*scale)))
        crop=crop.resize(new_size,Image.Resampling.NEAREST)
        # A small bounded palette keeps the exported clusters crisp at game size.
        alpha=crop.getchannel('A')
        rgb=crop.convert('RGB').quantize(colors=48,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGBA')
        rgb.putalpha(alpha)
        final=Image.new('RGBA',(width,height),(0,0,0,0))
        final.alpha_composite(rgb,((width-new_size[0])//2,height-new_size[1]))
        final.save(OUT/f'{name}.png',optimize=True)
        records.append({'name':name,'source':f'{group}.png','object':i,'sourceBounds':[left,box[1],right,box[3]],'width':width,'height':height,'anchor':'bottom-center','content':new_size})
(OUT/'manifest.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf8')
print(json.dumps({'exported':len(records),'output':str(OUT)}))
