import { useEffect, useRef, type ReactNode } from 'react';
import './cartridgeOpening.css';

export type CartridgePhase = 'assembling' | 'title' | 'leaving' | 'closed';

function HouseMark() {
 return <svg className="cartridge-house-mark" viewBox="0 0 96 44" aria-hidden="true">
  <path fill="#183241" d="M42 1h12v4h6v5h7v5h5v6h-7v22H31V21h-7v-6h5v-5h7V5h6z"/>
  <path fill="#405d65" d="M42 5h12v4h6v5h6v5H30v-5h6V9h6z"/>
  <path fill="#d6a367" d="M35 21h26v18H35z"/><path fill="#b47a46" d="M35 21h26v4H35z"/>
  <path fill="#63422e" d="M43 27h10v16H43z"/><path fill="#ffdd58" d="M45 29h6v10h-6z"/>
  <path fill="#183241" d="M8 22h6v4h6v-9h5v13h9v5H18v5H8v-5H3v-7h5zm70 0h6v6h9v7h-5v5H78v-5H62v-5h9V17h5v9h2z"/>
  <path fill="#7caa63" d="M8 26h6v6h6v-6h5v9H8zm63 0h5v6h6v-6h6v9H71z"/>
  <path fill="#b4ce80" d="M8 26h4v4H8zm74 0h4v4h-4z"/>
  <path fill="#f5e8b7" d="M18 13h3v3h3v3h-3v3h-3v-3h-3v-3h3zm60-9h2v3h3v2h-3v3h-2V9h-3V7h3z"/>
 </svg>;
}

export function CartridgeOpening({phase,onStart,children}:{phase:Exclude<CartridgePhase,'closed'>;onStart:()=>void;children?:ReactNode}) {
 const start=useRef<HTMLButtonElement>(null),skip=useRef<HTMLButtonElement>(null);
 const titleSeen=useRef(false);if(phase==='title')titleSeen.current=true;
 const action=useRef(onStart);action.current=onStart;
 useEffect(()=>{
  if(phase==='title')start.current?.focus({preventScroll:true});
  else if(phase==='assembling')skip.current?.focus({preventScroll:true});
 },[phase]);
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   if(event.key!=='Enter'&&event.key!==' '&&event.key!=='Escape')return;
   if(event.target instanceof Element&&event.target.closest('.v2-sound-icon'))return;
   event.preventDefault();event.stopPropagation();
   if(!event.repeat)action.current();
  };
  document.addEventListener('keydown',key,true);
  return()=>document.removeEventListener('keydown',key,true);
 },[]);
 return <section className={'cartridge-opening opening-'+phase+(titleSeen.current?' had-title':'')} role="dialog" aria-modal="true" aria-label="NEARlyHuman title screen" onPointerDown={event=>{
  if(phase==='assembling'&&event.button===0&&!(event.target as HTMLElement).closest('button')){event.preventDefault();event.stopPropagation();onStart();}
 }}>
  <div className="cartridge-title">
   <div className="cartridge-logo"><HouseMark/><h1 aria-label="NEARlyHuman"><span aria-hidden="true">NEAR<span className="cartridge-logo-ly">ly</span>Human</span></h1></div>
   <button ref={start} className="cartridge-start" disabled={phase!=='title'} onClick={event=>{event.stopPropagation();onStart();}}><i aria-hidden="true"/>START<i aria-hidden="true"/></button>
  </div>
  {phase==='assembling'&&<button ref={skip} className="cartridge-skip" onClick={event=>{event.stopPropagation();onStart();}}>Skip<span aria-hidden="true"> ▸▸</span></button>}
  {children}
 </section>;
}
