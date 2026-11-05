// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library V2Types {
    struct Condition {uint8 severity;uint32 onsetDay;uint32 dueDay;bool resolved;}
    struct Plot {uint8 kind;uint8 ticks;uint8 left;uint8 moisture;uint8 dry;bool soilBlocked;}
    struct House {uint8 mess;uint8 damage;uint8 chairLife;uint8 chairAnchor;uint8 shelterLife;uint8[4] umbrellaLife;uint8 stovePatch;uint8 windowPatch;bool chairBrace;bool windowBrace;bool dripDiverted;bool backupHeat;bool powerOut;uint8 fire;}
    struct State {uint8 version;bytes32 seed;uint32 day;uint32 level;bool alive;uint8 deathCause;uint8[3] stats;uint16[5] needs;uint32[34] inventory;Condition[8] conditions;Plot[4] plots;House house;uint8 goal;uint32 goalCreatedDay;uint32 goalReviewDay;uint8[6] recent;}
    struct Step {uint8 slot;uint8 op;uint8 arg;uint8 variant;uint8[4] goods;}
    struct Trace {uint8 goal;Step[] steps;}
    struct Certificate {uint8 horizon;uint64[2] kits;Step[] steps;}
    struct Episode {uint8 kind;uint8 start;uint8 deadline;uint8 target;uint8 stock;bool resolved;bool responded;bool shooTried;bool covered;bool diverted;}
    struct Context {State state;uint32 day;uint8 slot;bytes32 seed;uint64 kit;bool shipping;bool pickup;uint8 ordinaryMask;uint8 ordinaryUses;bool mainUsed;uint8 acuteUses;uint8 restUses;uint8 leisureUses;int16 lastRest;int16 lastLeisure;bool minorUsed;bool chairMoved;bool shipped;uint16 points;bool primaryIntroduced;Episode primary;Episode taskFire;bool witness;}
}
