export function WelcomeDock({busy,label,error,onHatch,onHome,next}:{busy:boolean;label?:string;error?:string;onHatch:()=>void;onHome:()=>void;next?:{label:string;loading:boolean;onClick:()=>void}}){
 return <section className="welcome-dock" aria-label="NEARlyHuman">
  <h1>NEARlyHuman</h1>
  <button className="button primary main-action" disabled={busy} onClick={onHatch}>{busy?label||'One moment…':'Hatch yours'}</button>
  <div className="welcome-secondary">
   {next&&<button className="text-button welcome-next" disabled={busy||next.loading} onClick={next.onClick}>{next.loading?'Opening…':next.label}</button>}
   <button className="text-button" disabled={busy} onClick={onHome}>Your home</button>
  </div>
  {error&&<p className="error-message" role="alert">{error}</p>}
 </section>;
}
