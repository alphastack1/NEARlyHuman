/** A visual handoff only. Selection and inventory remain owned by the app. */
export function showSupplyTransfer(source:DOMRect,target:HTMLImageElement,url:string):()=>void {
 const end=target.getBoundingClientRect(),image=document.createElement('img');
 image.src=url;image.alt='';image.className='supply-flight';image.setAttribute('aria-hidden','true');
 const size=Math.max(20,Math.min(36,source.width));
 Object.assign(image.style,{left:source.x+source.width/2-size/2+'px',top:source.y+source.height/2-size/2+'px',width:size+'px',height:size+'px'});
 document.body.append(image);
 const dx=end.x+end.width/2-source.x-source.width/2,dy=end.y+end.height/2-source.y-source.height/2;
 const flight=image.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.45}px,${dy*.45-10}px) scale(1.12)`,opacity:1,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(.85)`,opacity:0}],{duration:360,easing:'cubic-bezier(.2,.7,.3,1)'});
 const landing=target.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{delay:250,duration:190,easing:'steps(3,end)'});
 void flight.finished.catch(()=>{}).finally(()=>image.remove());
 return()=>{flight.cancel();landing.cancel();image.remove();};
}
