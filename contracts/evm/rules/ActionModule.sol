// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {V2Types as T} from "./V2Types.sol";


/// @notice Owned-snapshot life/material interpreter. No token or contract storage writes.
contract V2ActionModule {
    using Strings for uint256;
    function draw(bytes32 seed,uint32 day,uint8 slot,string calldata label) external pure returns(uint32){return _draw(seed,day,slot,label);}
    function applyAction(T.Context calldata input,T.Step calldata action) external pure returns(T.Context memory){T.Context memory c=input;_apply(c,action);return c;}
    uint256 private constant MAX=10_000;







    function _first(uint8 k) private pure returns(uint8){return k==1||k==2||k==5?3:k==3||k==6||k==9?6:8;}
    function _yields(uint8 k) private pure returns(uint8){return k==9?10:k==7||k==8?6:1;}
    function _output(uint8 k) private pure returns(uint8){return k==9?6:k+21;}
    function _cost(uint8 r) private pure returns(uint8){uint8[4] memory a=[uint8(3),6,8,10];require(r<4,"recipe");return a[r];}
    function _weight(uint8 id) private pure returns(uint16){uint16[12] memory a=[uint16(65),65,95,115,65,95,40,40,116,212,276,340];require(id>=22&&id<34,"good");return a[id-22];}


    function _active(T.State memory s,uint8 kind) private pure returns(bool){return s.conditions[kind].severity>0&&!s.conditions[kind].resolved;}
    function _add(T.Context memory c,uint8 kind,uint8 severity,uint32 due) private pure returns(bool fresh){
        T.Condition memory p=c.state.conditions[kind];fresh=p.severity==0;
        if(fresh)c.state.conditions[kind]=T.Condition(severity,c.day,due,false);
        else{c.state.conditions[kind].resolved=false;if(severity>p.severity)c.state.conditions[kind].severity=severity;if(due>0&&(p.dueDay==0||due<p.dueDay))c.state.conditions[kind].dueDay=due;}
    }
    function _clear(T.State memory s,uint8 kind) private pure{if(_active(s,kind))s.conditions[kind].resolved=true;}
    function _need(T.State memory s,uint8 kind,int256 amount) private pure{int256 n=int256(uint256(s.needs[kind]))+amount;s.needs[kind]=n<0?0:n>int256(MAX)?uint16(MAX):uint16(uint256(n));}
    function _restore(T.State memory s,uint8 kind,uint16 amount) private pure{_need(s,kind,int256(uint256(amount)));if(s.needs[1]>3000)_clear(s,0);if(s.needs[2]>3000)_clear(s,1);}
    function _kill(T.Context memory c,uint8 cause) private pure{if(c.state.alive){c.state.alive=false;c.state.deathCause=cause;}}
    function _damage(T.Context memory c,uint16 amount,bool physical,uint8 cause) private pure{uint256 loss=physical?uint256(amount)*(50-c.state.stats[0])/50:amount;_need(c.state,0,-int256(loss));if(c.state.needs[0]==0)_kill(c,cause);}

    function _infect(T.Context memory c,uint8 kind) private pure{if(_add(c,kind,1,c.day+(kind==3?2:1)))_damage(c,1000,false,kind==3?5:6);}
    function _wound(T.Context memory c,uint8 severity) private pure{_damage(c,severity==1?800:2000,true,4);if(c.state.alive)_add(c,2,severity,c.day+(severity==1?2:1));}
    function _take(T.State memory s,uint8 id,uint32 n) private pure{require(s.inventory[id]>=n,"missing input");s.inventory[id]-=n;}
    function _give(T.State memory s,uint8 id,uint32 n) private pure{s.inventory[id]+=n;}

    function _heat(T.State memory s) private pure returns(bool){return s.house.fire!=1&&((s.house.damage&1)==0||s.house.stovePatch>0)&&(!s.house.powerOut||s.house.backupHeat);}
    function _draw(bytes32 seed,uint32 day,uint8 slot,string memory label) private pure returns(uint32 h){
        bytes memory data=abi.encodePacked(uint256(seed).toHexString(32),":",uint256(day).toString(),":",uint256(slot).toString(),":",label);h=2166136261;
        unchecked{for(uint256 i;i<data.length;++i){h^=uint32(uint8(data[i]));h*=16777619;}h^=h>>16;h*=0x7feb352d;h^=h>>15;h*=0x846ca68b;h^=h>>16;}
    }
    function _chance(T.Context memory c,string memory label,uint16 bps) private pure returns(bool){return uint256(_draw(c.seed,c.day,c.slot,label))*10000<uint256(bps)*4294967296;}
    function _competence(T.Context memory c,uint16 base,bool precision,bool stove) private pure returns(uint16){
        uint16 penalty;if(precision){if(c.state.needs[3]==0)penalty+=5;if(c.state.needs[4]==0)penalty+=5;if(_active(c.state,5))penalty+=5;if(c.state.house.mess==2)penalty+=5;if(stove&&c.state.house.stovePatch>0)penalty+=5;if(penalty>10)penalty=10;}
        int256 n=int256(uint256(base))+int256(uint256(c.state.stats[1])*200)-int256(uint256(penalty)*100);return n<100?100:n>9900?9900:uint16(uint256(n));
    }
    function _main(uint8 op) private pure returns(bool){return(op>=13&&op<=24)||op==26||op==27||op==28||op==29||op==30;}
    function _acute(uint8 op) private pure returns(bool){return op>=31&&op<=34;}
    function _shape(T.Step memory a) private pure {
        require(a.op<=38,"op");if(a.op!=10)for(uint8 i;i<4;++i)require(a.goods[i]==0,"unused goods");
        bool argUsed=a.op==2||a.op==3||a.op==4||a.op==5||a.op==6||a.op==17||a.op==18||a.op==20||a.op==21||a.op==24||a.op==27||a.op==28||a.op==36||a.op==38;
        bool varUsed=a.op==2||a.op==8||a.op==11||a.op==18;
        require(argUsed||a.arg==0,"unused arg");require(varUsed||a.variant==0,"unused variant");
    }
    function _role(T.Context memory c,T.Step memory a) private pure {
        if(a.op==1){require(!c.pickup&&c.kit!=0&&c.slot<=6,"pickup");return;}
        if(_main(a.op)){require(!c.mainUsed&&c.slot>=36&&c.slot<=40,"main budget");c.mainUsed=true;return;}
        if(_acute(a.op)){require(c.acuteUses<2,"acute budget");++c.acuteUses;return;}
        uint8 phase=(c.slot-1)/10;if(phase==0){require(c.slot<=5,"morning");phase=1;}
        uint8 bit=uint8(1)<<phase;require(c.ordinaryUses<5&&(c.ordinaryMask&bit)==0,"ordinary budget");++c.ordinaryUses;c.ordinaryMask|=bit;
    }
    function _food(T.Context memory c,uint8 id) private pure {
        require(id==2||id==1||id>=26&&id<=29,"food");_take(c.state,id,1);
        if(id==2)_restore(c.state,1,4000);else if(id==1){_restore(c.state,1,2500);_restore(c.state,2,3000);}else{
            uint16[4] memory food=[uint16(3000),4000,3500,6000];uint16[4] memory water=[uint16(1500),1000,2500,1000];_restore(c.state,1,food[id-26]);_restore(c.state,2,water[id-26]);
        }
    }
    function _drink(T.Context memory c,uint8 id) private pure{require(id==0||id==1,"drink");_take(c.state,id,1);if(id==0)_restore(c.state,2,5000);else{_restore(c.state,1,2500);_restore(c.state,2,3000);}}
    function _goalProgress(T.Context memory c,uint8 kind,uint8 recipe) private pure {
        T.State memory s=c.state;if(s.goal==0)return;
        if((kind==2&&s.goal==1)||(kind==3&&s.goal==recipe+3)){s.goal=0;s.goalReviewDay=0;}
        else if((kind==0&&s.goal==2)||(kind==1&&s.goal>=3))s.goalReviewDay=c.day>type(uint32).max-3?type(uint32).max:c.day+3;
    }
    function _clearBed(T.Plot memory p) private pure{p.kind=0;p.ticks=0;p.left=0;p.moisture=0;p.dry=0;}
    function _respond(T.Context memory c,uint8 kind) private pure returns(bool task){
        if(c.primary.kind==kind&&!c.primary.resolved&&!c.primary.responded&&c.slot<=c.primary.deadline){c.primary.responded=true;return false;}
        require(c.taskFire.kind==kind&&!c.taskFire.resolved&&!c.taskFire.responded&&c.slot<=c.taskFire.deadline,"acute episode");c.taskFire.responded=true;return true;
    }
    function _apply(T.Context memory c,T.Step memory a) private pure {
        _shape(a);_role(c,a);T.State memory s=c.state;uint8 op=a.op;uint16 energy=100;uint16 bps=10000;
        bool clean=!_active(s,7);bool heat=_heat(s);
        if(op==0||op==1||op==7||op==30)energy=0;
        else if(op==2)energy=200;
        else if(op==17||op==18||op==19||op==20||op==21||op==22||op==23||op==24||op==25||op==26||op==27)energy=300;
        if(energy==300)require(s.needs[3]>=300,"main energy");
        if(op==13||op==14||op==15||op==16||op==17||op==22||op==23||op==24||op==25)bps=_competence(c,op==13||op==15?9500:9000,true,op==13||op==14||op==16||op==25||op==17&&a.arg==0||op==24&&a.arg==0);
        if(op==35)bps=_competence(c,7500,false,false);
        // Input/legality checks precede random outcomes and consume exactly once.
        if(op==1){for(uint8 i;i<34;++i)if(c.kit&(uint64(1)<<i)!=0)_give(s,i,1);c.pickup=true;}
        else if(op==2){require(s.needs[1]<MAX||s.needs[2]<MAX,"breakfast needed");require(a.arg==2||a.arg==1||a.arg>=26&&a.arg<=29,"breakfast food");require(a.variant==0||a.variant==1,"breakfast drink");_food(c,a.arg);_drink(c,a.variant);}
        else if(op==3){require(s.needs[1]<MAX||s.needs[2]<MAX,"food needed");_food(c,a.arg);}
        else if(op==4){require(s.needs[2]<MAX,"drink needed");_drink(c,a.arg);}
        else if(op==5){require(a.arg>=2&&a.arg<=4&&_active(s,a.arg),"treatment");_take(s,a.arg==2?11:4,1);_clear(s,a.arg);_restore(s,0,1500);}
        else if(op==6){require((a.arg==6||a.arg==7)&&_active(s,a.arg),"wash");_take(s,10,1);_clear(s,a.arg);if(a.arg==6)_restore(s,4,500);}
        else if(op==7){require(s.needs[3]<MAX&&c.restUses<2&&int16(uint16(c.slot))-c.lastRest>=10,"rest");++c.restUses;c.lastRest=int16(uint16(c.slot));_restore(s,3,1200);}
        else if(op==8){require(a.variant<=2&&s.needs[4]<MAX&&c.leisureUses<2&&int16(uint16(c.slot))-c.lastLeisure>=10,"leisure");if(a.variant==2)require(s.house.chairLife>0&&((s.house.damage&4)==0||s.house.chairBrace),"chair");if(a.variant==1){bool garden;for(uint8 i;i<4;++i)if(s.plots[i].kind>0)garden=true;require(garden,"garden");}++c.leisureUses;c.lastLeisure=int16(uint16(c.slot));_restore(s,4,a.variant==2?1500:1000);}
        else if(op==9){bool any;for(uint8 i;i<4;++i)if(s.plots[i].kind>0&&s.plots[i].moisture<2){any=true;s.plots[i].moisture=2;}require(any,"well needed");_goalProgress(c,0,0);}
        else if(op==10){require(c.shipping&&!c.shipped,"shipping");uint16 points;bool end;for(uint8 i;i<4;++i){uint8 id=a.goods[i];if(id==0){end=true;continue;}require(!end&&id>=23&&id<=34,"shipment");_take(s,id-1,1);points+=_weight(id-1);}require(points>0,"empty shipment");c.points+=points;c.shipped=true;}
        else if(op==11){require(a.variant<=2&&(s.needs[3]<MAX||s.needs[4]<MAX||a.variant==2&&s.needs[2]<MAX),"coffee");if(a.variant>0)require(clean,"surface");_take(s,5,1);if(a.variant==2)_take(s,1,1);_need(s,3,-100);energy=0;_restore(s,3,a.variant==1?1000:2000);_restore(s,4,a.variant==0?500:1500);if(a.variant==2)_restore(s,2,1500);_add(c,5,1,0);}
        else if(op==12){require(s.house.mess==1,"tidy");s.house.mess=0;}
        else if(op>=13&&op<=16){require(clean&&(op==15||heat),"kitchen");_take(s,op==14?3:2,1);if(op==15)_take(s,1,1);if(op==16)_take(s,3,1);}
        else if(op==17){require(a.arg<3&&(s.house.damage&(uint8(1)<<a.arg))!=0&&(a.arg!=2||s.house.chairLife>0),"repair");_take(s,7,1);}
        else if(op==18){require(a.arg<4&&a.variant>=1&&a.variant<=9&&s.plots[a.arg].kind==0&&!s.plots[a.arg].soilBlocked,"plant");_take(s,12+a.variant,1);s.plots[a.arg]=T.Plot(a.variant,_first(a.variant),_yields(a.variant),2,0,false);_goalProgress(c,0,0);}
        else if(op==19){bool any;for(uint8 i;i<4;++i){T.Plot memory p=s.plots[i];if(p.kind>0&&p.ticks==0){any=true;_give(s,_output(p.kind),1);if(p.kind==9)_goalProgress(c,1,0);--p.left;if(p.left==0)_clearBed(p);else{p.ticks=2;p.dry=0;}s.plots[i]=p;}}require(any,"harvest");}
        else if(op==20){require(a.arg<4,"recipe");_take(s,6,_cost(a.arg));_give(s,30+a.arg,1);_goalProgress(c,3,a.arg);}
        else if(op==21){require(a.arg<4&&s.plots[a.arg].soilBlocked,"soil");_take(s,12,1);s.plots[a.arg].soilBlocked=false;}
        else if(op==22||op==23){require(op==22?s.house.chairLife==0:s.house.shelterLife==0,"existing build");_take(s,6,1);_take(s,7,1);}
        else if(op==24){require(a.arg<2&&(s.house.damage&(uint8(1)<<a.arg))!=0&&(a.arg==0?s.house.stovePatch==0:s.house.windowPatch==0),"patch");_take(s,6,1);}
        else if(op==25){require(s.house.powerOut&&(s.house.damage&1)==0&&!s.house.backupHeat&&s.house.fire==0,"backup heat");_take(s,6,1);_take(s,9,1);}
        else if(op==26){require(s.house.chairLife>0&&!c.chairMoved&&c.primary.kind!=0,"move chair");s.house.chairAnchor=s.house.chairAnchor==0?1:0;c.chairMoved=true;}
        else if(op==27){require(a.arg<4&&s.plots[a.arg].kind>0,"abandon");_clearBed(s.plots[a.arg]);}
        else if(op==28){require(a.arg<4&&s.plots[a.arg].kind>0&&s.house.shelterLife==0&&s.house.umbrellaLife[a.arg]==0,"cover plot");_take(s,8,1);s.house.umbrellaLife[a.arg]=3;}
        else if(op==29){require(s.house.mess==2,"deep clean");_take(s,10,1);s.house.mess=1;}
        else if(op==31||op==32){_respond(c,2);require(s.house.fire>0&&(op==31||s.house.fire==1),"fire");if(op==31){_take(s,0,1);s.house.fire=0;if(c.primary.kind==2)c.primary.resolved=true;if(c.taskFire.kind==2)c.taskFire.resolved=true;}else s.house.fire=2;}
        else if(op==33||op==34){_respond(c,1);require(c.primary.kind==1&&!c.primary.resolved&&(s.house.damage&2)!=0&&s.house.windowPatch==0&&!s.house.windowBrace,"rain response");if(op==33){require(s.needs[3]>=300,"brace energy");energy=300;_take(s,7,1);s.house.windowBrace=true;}else{_take(s,8,1);c.primary.covered=true;}}
        else if(op==35||op==36){require((c.primary.kind==4||c.primary.kind==5)&&!c.primary.resolved&&c.slot<=c.primary.deadline,"pest");if(op==35){require(!c.primary.shooTried,"one shoo");c.primary.shooTried=true;}else{require(c.primary.kind==4?(a.arg==2||a.arg>=13&&a.arg<=21):(a.arg==1||a.arg==3),"bait");_take(s,a.arg,1);c.primary.resolved=true;}}
        else if(op==37){require(c.day>1&&s.needs[1]<=3000&&s.inventory[2]==0&&s.inventory[1]==0&&s.inventory[26]==0&&s.inventory[27]==0&&s.inventory[28]==0&&s.inventory[29]==0,"raw emergency");_take(s,3,1);_restore(s,1,4500);if(!c.minorUsed&&_chance(c,"raw-exposure",2500)){c.minorUsed=true;_infect(c,3);}}
        else if(op==38){require(a.arg>=22&&a.arg<=25&&s.needs[4]<MAX,"flower");_take(s,a.arg,1);uint16[4] memory f=[uint16(1500),1500,2500,3500];_restore(s,4,f[a.arg-22]);_goalProgress(c,2,0);}
        _need(s,3,-int256(uint256(energy)));
        if(bps<10000){string memory key=string.concat(uint256(op).toString(),":",uint256(a.arg).toString(),":",uint256(a.variant).toString());bool ok=_chance(c,string.concat("competence:",key),bps);
            if(!ok){bool minor=!c.minorUsed&&_chance(c,"task-complication",2500);if(op==35){if(minor){c.minorUsed=true;_add(c,6,1,0);}}else if(minor&&op==15){c.minorUsed=true;_add(c,7,1,0);}else if(minor&&op==25&&_startFire(c)){c.minorUsed=true;}else if(minor&&op!=25){c.minorUsed=true;_wound(c,1);}else if(s.house.mess<2)++s.house.mess;}
            else if(op==13){_restore(s,1,3500);_restore(s,4,800);}else if(op==14){_restore(s,1,6500);_restore(s,4,600);}else if(op==15){_restore(s,1,5000);_restore(s,2,2000);_restore(s,4,2000);}else if(op==16){_restore(s,1,8000);_restore(s,4,2000);}else if(op==17)s.house.damage&=~(uint8(1)<<a.arg);else if(op==22){s.house.chairLife=5;s.house.chairAnchor=0;s.house.damage&=~uint8(4);}else if(op==23)s.house.shelterLife=4;else if(op==24){if(a.arg==0)s.house.stovePatch=2;else s.house.windowPatch=2;}else if(op==25)s.house.backupHeat=true;else if(op==35)c.primary.resolved=true;
        }
    }
    function _startFire(T.Context memory c) private pure returns(bool){uint8 boundary=uint8(((uint16(c.slot)+9)/10)*10);if(boundary-c.slot<2)boundary+=10;if(boundary>60||c.state.house.fire!=0)return false;c.state.house.fire=1;c.taskFire=T.Episode(2,c.slot,boundary,0,0,false,false,false,false,false);return true;}










}
