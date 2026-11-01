export function WelcomeDock({busy,label,error,onHatch,onHome}:{busy:boolean;label?:string;error?:string;onHatch:()=>void;onHome:()=>void}){
 return <section className="welcome-dock" aria-label="NEARlyHuman">
  <h1>NEARlyHuman</h1>
  <button className="button primary main-action" disabled={busy} onClick={onHatch}>{busy?label||'One moment…':'Hatch yours'}</button>
  <button className="text-button" disabled={busy} onClick={onHome}>Your home</button>
  {error&&<p className="error-message" role="alert">{error}</p>}
 </section>;
}
