// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {V2Types as T} from "./V2Types.sol";
import {IV2LifeVerifier} from "./IV2LifeVerifier.sol";
import {V2ActionModule} from "./V2ActionModule.sol";

/// @notice Owned-snapshot life/material interpreter. No token or contract storage writes.
contract V2LifeVerifier is IV2LifeVerifier {
    error InvalidLifeTransition();
    function _check(bool value) private pure {if(!value)revert InvalidLifeTransition();}
    using Strings for uint256;
    V2ActionModule public immutable actionModule;
    constructor(address module_){_check(module_.code.length>0);actionModule=V2ActionModule(module_);}
    uint256 private constant MAX=10_000;
    function rulesHash() external pure returns(bytes32){return keccak256("nearlyhuman-v2-kernel-2");}
    function initialize(bytes32 seed,uint8[3] calldata stats) external pure returns(bytes memory){
        _check(stats[0]<=5&&stats[1]<=5&&stats[2]<=5&&uint256(stats[0])+stats[1]+stats[2]==5);
        T.State memory s;s.version=2;s.seed=seed;s.alive=true;s.stats=stats;s.needs=[uint16(10000),8000,8000,8000,8000];s.inventory[0]=3;s.inventory[2]=3;return abi.encode(s);
    }
    function _decode(bytes memory saved) private pure returns(T.State memory s){s=abi.decode(saved,(T.State));_check(keccak256(saved)==keccak256(abi.encode(s)));_assert(s,false);}
    function inspect(bytes calldata saved) external pure returns(uint32 day,uint32 level,bool alive){T.State memory s=_decode(saved);return(s.day,s.level,s.alive);}
    function validateKit(bytes calldata saved,uint64 mask) external pure {_kitCheck(_decode(saved),mask);}
    function _kitCheck(T.State memory s,uint64 mask) private pure {
        _check(mask>>34==0);uint8 count;uint8 seeds;
        for(uint8 i;i<34;++i)if(mask&(uint64(1)<<i)!=0){_check((i<13&&i!=6)||(i>=13&&i<=21));_check(s.inventory[i]<type(uint32).max);++count;if(i>=13)++seeds;}
        _check(count<=3&&seeds<=1);
    }
    function _assert(T.State memory s,bool provisional) private pure {
        _check(s.version==2&&s.level<=s.day&&(provisional||!s.alive||s.level==s.day));
        _check(s.stats[0]<=5&&s.stats[1]<=5&&s.stats[2]<=5&&uint256(s.stats[0])+s.stats[1]+s.stats[2]==5);
        _check(s.deathCause<=7&&(s.alive?s.deathCause==0&&s.needs[0]>0:s.deathCause>0));
        for(uint8 i;i<5;++i)_check(s.needs[i]<=MAX);
        for(uint8 i;i<8;++i){T.Condition memory a=s.conditions[i];_check(a.severity<=2&&a.onsetDay<=s.day);if(a.severity==0)_check(a.onsetDay==0&&a.dueDay==0&&!a.resolved);else if(i<5)_check(a.dueDay>0);}
        for(uint8 i;i<4;++i){T.Plot memory p=s.plots[i];_check(p.kind<=9&&p.moisture<=2&&p.dry<=1);if(p.kind==0)_check(p.ticks==0&&p.left==0&&p.moisture==0&&p.dry==0);else _check(p.left>0&&p.left<=_yields(p.kind)&&p.ticks<=(p.left==_yields(p.kind)?_first(p.kind):2)&&(p.ticks>0||p.dry==0));}
        _check(s.house.mess<=2&&s.house.damage<=7&&s.house.fire<=2&&s.house.chairAnchor<=1&&s.goal<=6&&s.goalCreatedDay<=s.day);
        for(uint8 i;i<6;++i)_check(s.recent[i]<=38);
    }
    function _first(uint8 k) private pure returns(uint8){return k==1||k==2||k==5?3:k==3||k==6||k==9?6:8;}
    function _yields(uint8 k) private pure returns(uint8){return k==9?10:k==7||k==8?6:1;}
    function _output(uint8 k) private pure returns(uint8){return k==9?6:k+21;}
    function _cost(uint8 r) private pure returns(uint8){uint8[4] memory a=[uint8(3),6,8,10];_check(r<4);return a[r];}
    function _weight(uint8 id) private pure returns(uint16){uint16[12] memory a=[uint16(65),65,95,115,65,95,40,40,116,212,276,340];_check(id>=22&&id<34);return a[id-22];}
    function _stockCopy(uint32[34] memory stock) private pure returns(uint32[34] memory result){for(uint8 i;i<34;++i)result[i]=stock[i];}
    function _top(uint32[34] memory stock) private pure returns(uint16 points){for(uint8 n;n<4;++n){uint16 best;uint8 at;for(uint8 i=22;i<34;++i)if(stock[i]>0&&_weight(i)>best){best=_weight(i);at=i;}if(best==0)break;--stock[at];points+=best;}}
    function maxShipmentPoints(bytes calldata saved) external pure returns(uint16 best){
        T.State memory s=_decode(saved);uint32[34] memory a=_stockCopy(s.inventory);best=_top(a);a=_stockCopy(s.inventory);bool valid=true;
        for(uint8 i;i<4;++i)if(s.plots[i].kind>0&&s.plots[i].ticks==0){uint8 out=_output(s.plots[i].kind);if(a[out]==type(uint32).max){valid=false;break;}++a[out];}
        if(valid){uint16 n=_top(a);if(n>best)best=n;}
        for(uint8 r;r<4;++r)if(s.inventory[6]>=_cost(r)&&s.inventory[30+r]<type(uint32).max){a=_stockCopy(s.inventory);++a[30+r];uint16 n=_top(a);if(n>best)best=n;}
    }
    function _active(T.State memory s,uint8 kind) private pure returns(bool){return s.conditions[kind].severity>0&&!s.conditions[kind].resolved;}
    function _add(T.Context memory c,uint8 kind,uint8 severity,uint32 due) private pure returns(bool fresh){
        T.Condition memory p=c.state.conditions[kind];fresh=p.severity==0;
        if(fresh)c.state.conditions[kind]=T.Condition(severity,c.day,due,false);
        else{c.state.conditions[kind].resolved=false;if(severity>p.severity)c.state.conditions[kind].severity=severity;if(due>0&&(p.dueDay==0||due<p.dueDay))c.state.conditions[kind].dueDay=due;}
    }
    function _clear(T.State memory s,uint8 kind) private pure{if(_active(s,kind))s.conditions[kind].resolved=true;}
    function _need(T.State memory s,uint8 kind,int256 amount) private pure{int256 n=int256(uint256(s.needs[kind]))+amount;s.needs[kind]=n<0?0:n>int256(MAX)?uint16(MAX):uint16(uint256(n));}

    function _kill(T.Context memory c,uint8 cause) private pure{if(c.state.alive){c.state.alive=false;c.state.deathCause=cause;}}
    function _damage(T.Context memory c,uint16 amount,bool physical,uint8 cause) private pure{uint256 loss=physical?uint256(amount)*(50-c.state.stats[0])/50:amount;_need(c.state,0,-int256(loss));if(c.state.needs[0]==0)_kill(c,cause);}
    function _morale(T.Context memory c,uint16 amount) private pure{_need(c.state,4,-int256(uint256(amount)*(50-c.state.stats[2])/50));}
    function _infect(T.Context memory c,uint8 kind) private pure{if(_add(c,kind,1,c.day+(kind==3?2:1)))_damage(c,1000,false,kind==3?5:6);}
    function _wound(T.Context memory c,uint8 severity) private pure{_damage(c,severity==1?800:2000,true,4);if(c.state.alive)_add(c,2,severity,c.day+(severity==1?2:1));}

    function _give(T.State memory s,uint8 id,uint32 n) private pure{s.inventory[id]+=n;}
    function _recent(T.State memory s,uint8 op) private pure{for(uint8 i;i<5;++i)s.recent[i]=s.recent[i+1];s.recent[5]=op;}
    function _heat(T.State memory s) private pure returns(bool){return s.house.fire!=1&&((s.house.damage&1)==0||s.house.stovePatch>0)&&(!s.house.powerOut||s.house.backupHeat);}
    function _draw(bytes32 seed,uint32 day,uint8 slot,string memory label) private view returns(uint32){return actionModule.draw(seed,day,slot,label);}

    function _chance(T.Context memory c,string memory label,uint16 bps) private view returns(bool){return uint256(_draw(c.seed,c.day,c.slot,label))*10000<uint256(bps)*4294967296;}







    function _clearBed(T.Plot memory p) private pure{p.kind=0;p.ticks=0;p.left=0;p.moisture=0;p.dry=0;}



    function _episodeBoundary(T.Context memory c,bool task) private pure{
        T.Episode memory e=task?c.taskFire:c.primary;if(e.kind==0||e.resolved||e.deadline!=c.slot)return;
        T.State memory s=c.state;
        if(e.kind==2){if(s.house.fire==1){_wound(c,2);if(s.alive&&s.house.mess<2)++s.house.mess;}else if(s.house.fire==2)_damage(c,500,true,1);s.house.fire=0;}
        else if(e.kind==1&&(s.house.damage&2)!=0&&s.house.windowPatch==0&&!s.house.windowBrace){if(!e.covered)_damage(c,1200,true,1);if(s.alive&&!s.house.dripDiverted&&!e.diverted&&e.stock==0&&s.inventory[0]>0)--s.inventory[0];}
        else if(e.kind==4){T.Plot memory p=s.plots[e.target];if(p.kind>0&&p.ticks>0){uint8 span=p.left==_yields(p.kind)?_first(p.kind):2;if(p.ticks<span)++p.ticks;s.plots[e.target]=p;}}
        else if(e.kind==5&&s.inventory[e.stock]>0)--s.inventory[e.stock];
        if(task)c.taskFire.resolved=true;else c.primary.resolved=true;
    }
    function _boundary(T.Context memory c) private pure{_need(c.state,1,-500);uint16[6] memory water=[uint16(700),600,700,700,600,700];_need(c.state,2,-int256(uint256(water[(c.slot-1)/10])));_morale(c,300);if(c.state.needs[1]==0&&_add(c,0,1,c.day+1))_damage(c,1500,false,2);if(!c.state.alive)return;if(c.state.needs[2]==0&&_add(c,1,1,c.day+1))_damage(c,1500,false,3);if(c.state.alive)_episodeBoundary(c,false);if(c.state.alive)_episodeBoundary(c,true);}
    function _bedtime(T.Context memory c) private view{
        T.State memory s=c.state;bool exposure=(_active(s,6)&&s.conditions[6].onsetDay<c.day)||(_active(s,7)&&s.conditions[7].onsetDay<c.day);
        if(exposure&&(c.witness||_chance(c,"contamination-exposure",2500)))_infect(c,_active(s,2)?4:3);if(!s.alive)return;
        if(_active(s,3)){if(c.day>=s.conditions[3].onsetDay+1)s.conditions[3].severity=2;_need(s,3,s.conditions[3].severity==2?int256(-1000):int256(-500));}if(_active(s,4))_need(s,3,-1000);
        if(_active(s,2)&&s.conditions[2].severity==1&&c.day>=s.conditions[2].onsetDay+1){if(!_active(s,4)&&s.needs[1]>3000&&s.needs[2]>3000&&s.needs[3]>=2000)_clear(s,2);else s.conditions[2].severity=2;}
        _clear(s,5);
        for(uint8 i;i<5;++i)if(_active(s,i)&&s.conditions[i].dueDay>0&&s.conditions[i].dueDay<=c.day&&(i<2||i==4||s.conditions[i].severity==2)){_kill(c,i==0?2:i==1?3:i==2?4:i==3?5:6);return;}
        bool recover=s.needs[1]>3000&&s.needs[2]>3000&&s.needs[3]>=2000&&!_active(s,4)&&!_active(s,0)&&!_active(s,1)&&!(_active(s,2)&&s.conditions[2].severity==2)&&!(_active(s,3)&&s.conditions[3].severity==2);
        _need(s,3,3500);if(recover)_need(s,0,500);
        for(uint8 i;i<4;++i){T.Plot memory p=s.plots[i];if(p.kind>0){if(p.ticks>0){if(p.moisture>0){if(!p.soilBlocked)--p.ticks;p.dry=0;}else if(++p.dry>=2)_clearBed(p);}if(p.kind>0&&p.moisture>0)--p.moisture;s.plots[i]=p;}if(s.house.umbrellaLife[i]>0)--s.house.umbrellaLife[i];}
        if(s.house.chairLife>0)--s.house.chairLife;if(s.house.shelterLife>0)--s.house.shelterLife;if(s.house.stovePatch>0)--s.house.stovePatch;if(s.house.windowPatch>0)--s.house.windowPatch;
        if(s.house.chairLife==0){s.house.damage&=~uint8(4);s.house.chairAnchor=0;}s.house.chairBrace=false;s.house.windowBrace=false;s.house.dripDiverted=false;s.house.backupHeat=false;s.house.powerOut=false;s.house.fire=0;
        for(uint8 i;i<8;++i)if(s.conditions[i].resolved)delete s.conditions[i];++s.level;
    }
    function _proposal(T.Context memory c) private view returns(bool harmful){
        c.primaryIntroduced=true;uint8 kind=uint8(uint256(_draw(c.seed,c.day,c.slot,"primary-family"))*10/4294967296)+1;
        c.primary=T.Episode(kind,c.slot,c.slot+9,0,255,false,false,false,false,false);T.State memory s=c.state;
        if(!_chance(c,"primary-admission",4500)){c.primary.kind=0;c.primary.resolved=true;return false;}
        if(kind==1){for(uint8 i;i<4;++i)if(s.plots[i].kind>0)s.plots[i].moisture=2;if((s.house.damage&2)==0||s.house.windowPatch>0||s.house.windowBrace){c.primary.resolved=true;return false;}if(s.needs[0]<=uint256(1200)*(50-s.stats[0])/50&&s.inventory[8]==0&&!(s.needs[3]>=300&&(s.inventory[7]>0||s.inventory[6]>0))){c.primary.resolved=true;return false;}c.primary.resolved=false;c.primary.target=1;c.primary.stock=s.inventory[0]>0?0:255;return true;}
        if(kind==2){uint8 last=s.recent[5];if(s.house.fire!=0||!_heat(s)||(last!=13&&last!=14&&last!=16&&last!=25)){c.primary.kind=0;c.primary.resolved=true;return false;}s.house.fire=1;c.primary.resolved=false;return true;}
        if(kind==3){s.house.powerOut=true;if(s.inventory[1]>0)--s.inventory[1];return true;}
        if(kind==4||kind==10){uint8[4] memory choices;uint8 n;for(uint8 i;i<4;++i){T.Plot memory p=s.plots[i];uint8 span=p.kind>0?(p.left==_yields(p.kind)?_first(p.kind):2):0;if(kind==4?p.kind>0&&p.ticks>0&&p.ticks<span:p.kind>0&&!p.soilBlocked&&s.house.shelterLife==0&&s.house.umbrellaLife[i]==0)choices[n++]=i;}if(n==0){c.primary.kind=0;c.primary.resolved=true;return false;}uint8 at=choices[uint256(_draw(c.seed,c.day,c.slot,kind==4?"pest-plot":"soil-target"))*n/4294967296];c.primary.target=at;if(kind==4)c.primary.resolved=false;else s.plots[at].soilBlocked=true;return true;}
        if(kind==5){uint8[3] memory food=[uint8(2),1,3];uint8[3] memory choices;uint8 n;for(uint8 i;i<3;++i)if(s.inventory[food[i]]>0)choices[n++]=food[i];if(n==0){c.primary.kind=0;c.primary.resolved=true;return false;}c.primary.stock=choices[uint256(_draw(c.seed,c.day,c.slot,"visitor-stock"))*n/4294967296];c.primary.resolved=false;return true;}
        if(kind==6){uint8[3] memory choices;uint8 n;for(uint8 i;i<3;++i)if((s.house.damage&(uint8(1)<<i))==0&&(i!=2||s.house.chairLife>0)&&!(i==0&&_active(s,0)&&s.inventory[2]==0&&s.inventory[1]==0))choices[n++]=i;if(n==0){c.primary.kind=0;c.primary.resolved=true;return false;}uint8 at=choices[uint256(_draw(c.seed,c.day,c.slot,"broken-fixture"))*n/4294967296];c.primary.target=at;s.house.damage|=uint8(1)<<at;return true;}
        if(kind==7){if(s.needs[0]<=uint256(800)*(50-s.stats[0])/50){c.primary.kind=0;c.primary.resolved=true;return false;}_wound(c,1);return true;}if(kind==8){if(s.needs[0]<=1000){c.primary.kind=0;c.primary.resolved=true;return false;}_infect(c,3);return true;}_morale(c,2000);return true;
    }
    function _copy(T.Context memory c) private pure returns(T.Context memory){return abi.decode(abi.encode(c),(T.Context));}
    function _admit(T.Context memory c,bytes calldata cert) private view returns(T.Context memory){
        T.Context memory before_=_copy(c);bool harmful=_proposal(c);if(!harmful)return c;bool valid;
        if(cert.length>0&&cert.length<=8192){(bool ok,bytes memory result)=address(this).staticcall{gas:5_000_000}(abi.encodeCall(this.verifyCertificate,(abi.encode(c),cert)));valid=ok&&result.length==32&&abi.decode(result,(bool));}
        if(valid)return c;before_.primaryIntroduced=true;before_.primary=T.Episode(0,c.slot,c.slot+9,0,255,true,false,false,false,false);return before_;
    }
    function _newContext(T.State memory s,bytes32 seed,uint64 kit,bool shipping) private pure returns(T.Context memory c){c.state=s;c.day=s.day+1;c.state.day=c.day;c.seed=seed;c.kit=kit;c.shipping=shipping;c.pickup=kit==0;c.lastRest=-100;c.lastLeisure=-100;}
    function _finish(T.Context memory c) private pure{if(!c.pickup){for(uint8 i;i<34;++i)if(c.kit&(uint64(1)<<i)!=0)_give(c.state,i,1);c.pickup=true;}}
    function transition(bytes calldata saved,bytes calldata encodedTrace,bytes calldata cert,bytes32 seed,uint64 kit,bool shipping) external view returns(bytes memory result,uint16 points){
        T.State memory s=_decode(saved);_check(s.alive);_kitCheck(s,kit);T.Trace memory trace=abi.decode(encodedTrace,(T.Trace));_check(encodedTrace.length<=4608&&keccak256(encodedTrace)==keccak256(abi.encode(trace))&&trace.steps.length<=16);
        T.Context memory c=_newContext(s,seed,kit,shipping);if(trace.goal!=255){_check(trace.goal<=6);if(trace.goal!=s.goal)s.goalCreatedDay=c.day;s.goal=trace.goal;s.goalReviewDay=trace.goal==0?0:c.day>type(uint32).max-3?type(uint32).max:c.day+3;}
        uint256 at;uint8 primary=uint8(1+(uint32(uint256(seed))%5)*10);
        for(uint8 slot=1;slot<=60&&c.state.alive;++slot){c.slot=slot;if(slot==primary)c=_admit(c,cert);if(c.day>1&&slot==31&&uint256(_draw(c.seed,c.day,31,"structural-exception"))*4000<4294967296)_kill(c,7);
            if(c.state.alive){uint8 op;if(at<trace.steps.length&&trace.steps[at].slot==slot){T.Step memory a=trace.steps[at++];c=actionModule.applyAction(c,a);op=a.op;}else if(at<trace.steps.length)_check(trace.steps[at].slot>slot);
                if(c.state.alive&&slot%10==0)_boundary(c);if(c.state.alive&&slot==60)_bedtime(c);_recent(c.state,op);}
        }
        _check(at==trace.steps.length);if(c.state.alive)_check(c.pickup);else _finish(c);_assert(c.state,false);return(abi.encode(c.state),c.points);
    }
    function verifyCertificate(bytes calldata encodedContext,bytes calldata encodedCertificate) external view returns(bool){
        _check(encodedCertificate.length<=8192);T.Certificate memory cert=abi.decode(encodedCertificate,(T.Certificate));_check(cert.horizon==2&&cert.steps.length<=24&&keccak256(encodedCertificate)==keccak256(abi.encode(cert)));
        T.Context memory c=abi.decode(encodedContext,(T.Context));_check(c.state.alive);c.witness=true;uint8 start=c.slot;uint256 at;
        for(uint8 d;d<=2&&c.state.alive;++d){if(d>0){T.State memory s=c.state;c=_newContext(s,c.seed,cert.kits[d-1],false);c.witness=true;_kitCheck(c.state,c.kit);start=1;}
            for(uint8 slot=start;slot<=60&&c.state.alive;++slot){c.slot=slot;uint8 op;
                if(at<cert.steps.length&&cert.steps[at].slot==uint16(d)*60+slot){T.Step memory a=cert.steps[at++];a.slot=slot;_check(a.op<=8||a.op==11||a.op>=31&&a.op<=34||a.op==38);c=actionModule.applyAction(c,a);op=a.op;}else if(at<cert.steps.length)_check(cert.steps[at].slot>uint16(d)*60+slot);
                if(c.state.alive&&slot%10==0)_boundary(c);if(c.state.alive&&slot==60)_bedtime(c);_recent(c.state,op);
            }
            _check(c.state.alive&&c.pickup);
        }
        _check(at==cert.steps.length&&c.state.alive&&c.state.needs[1]>3000&&c.state.needs[2]>3000&&c.state.needs[3]>=2000);for(uint8 i;i<8;++i)if(i!=5)_check(!_active(c.state,i));return true;
    }
}
