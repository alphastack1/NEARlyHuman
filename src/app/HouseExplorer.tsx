import { HOUSE_ROOMS, itemImageUrl, type HouseRoom } from '../game';
import type { GameState, TargetId } from '../domain';
import { houseInfo } from './houseInfo';
import { Icon, type IconName } from './Icons';

const roomIcons:Record<HouseRoom,IconName>={kitchen:'food',bedroom:'energy',living:'morale',wash:'water',garden:'leaf'};

export function HouseExplorer({state,view,peek,lines,roomsOpen,onRoomsOpenChange,onRoom,onFollow,onDetails}:{
 state:GameState;view:{exploring:boolean;room?:HouseRoom};peek?:TargetId;lines:[string,string];
 roomsOpen:boolean;onRoomsOpenChange:(open:boolean)=>void;
 onRoom:(room:HouseRoom)=>void;onFollow:()=>void;onDetails:(target:TargetId)=>void;
}){
 const setRoomsOpen=onRoomsOpenChange;
 const info=peek?houseInfo(state,peek):undefined;
 const stock=info?.items.filter(item=>state.inventory[item]>0);
 const shown=(stock?.length?stock:info?.items)?.slice(0,3);
 return <div className="event-box care-sleep house-care">
  <div className="house-view-controls">
   {view.exploring&&<button className="house-follow" onClick={()=>{setRoomsOpen(false);onFollow();}} aria-label={'Return to '+state.name}><Icon name="back" size={12}/>{state.name}</button>}
   <button className={'house-rooms-button '+(roomsOpen?'selected':'')} aria-label="Look around the house" aria-expanded={roomsOpen} onClick={()=>setRoomsOpen(!roomsOpen)}><Icon name="house" size={13}/>Rooms <span aria-hidden="true">{roomsOpen?'▴':'▾'}</span></button>
  </div>
  {roomsOpen&&<nav className="house-room-strip" aria-label="House rooms">{HOUSE_ROOMS.map(room=><button key={room.id} className={view.room===room.id?'selected':''} onClick={()=>{onRoom(room.id);setRoomsOpen(false);}} aria-label={'Look at '+room.label}><Icon name={roomIcons[room.id]} size={13}/><span>{room.id==='living'?'Living':room.id==='wash'?'Wash':room.label}</span></button>)}</nav>}
  {info&&peek?<button className="house-peek" aria-label={'Inspect '+info.title} onClick={()=>onDetails(peek)}>
   <span className="house-peek-copy"><strong>{info.title}</strong>{(peek==='store'||peek==='cupboard')&&shown?.length?<span className="house-peek-stock">{shown.map(item=><span key={item}><img src={itemImageUrl(item)} alt=""/><b>{state.inventory[item].toLocaleString('en-US')}</b></span>)}</span>:<span className="house-peek-detail">{info.detail}</span>}</span><Icon name="info" size={17}/>
  </button>:<div className="event-lines"><span>{lines[0]}</span><span>{lines[1]}</span></div>}
 </div>;
}
