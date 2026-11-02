// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// ECONOMY EXPERIMENT ONLY. No biological reducer, fee/signature system or production deployment.
contract SliceToken is ERC20 {
    address public immutable controller;
    constructor() ERC20("Experiment token", "TEST") { controller = msg.sender; }
    function decimals() public pure override returns(uint8) { return 6; }
    function mintVault(uint256 n) external { require(msg.sender == controller); _mint(controller,n); }
    function burnVault(uint256 n) external { require(msg.sender == controller); _burn(controller,n); }
}

contract EconomySlice is ERC721, ReentrancyGuard {
    using SafeERC20 for SliceToken;
    uint256 public constant U=1e6;
    uint256 public constant K=50_000*U;
    uint256 public constant M=250*U;
    uint256 public immutable C;
    address public immutable relayer;
    SliceToken public immutable token;
    struct Plot { uint8 kind; uint8 ticks; uint8 left; uint8 moisture; uint8 dry; }
    struct Life { uint32 day; uint32 revision; bool alive; uint32 wood; uint32[9] seeds; uint32[12] goods; Plot[4] plots; }
    struct Request { uint256 life; uint32 revision; uint256 pressure; uint256 reserve; uint64 deadline; uint8 seed; uint8 status; bool shipping; }
    enum Op { Water, Plant, Harvest, Craft, Ship }
    struct Action { Op op; uint8 arg; uint8 kind; uint8[4] shipment; }
    mapping(uint256=>Life) private lives;
    mapping(uint256=>uint256) public purse;
    mapping(uint256=>uint256) public purseNonce;
    mapping(uint256=>uint256) public pending;
    mapping(uint256=>uint256) public attempts;
    mapping(uint256=>Request) private requests;
    uint256 public totalAllocated;
    uint256 public issued;
    uint256 public nftMintBurns;
    uint256 public available;
    uint256 public reserved;
    uint256 public refillCarry;
    uint64 public refillAt;
    uint256 public nextLife;
    uint256 public nextRequest;
    event Accepted(uint256 indexed requestId,uint256 indexed life,uint256 reserve,bool shipping);
    event Committed(uint256 indexed requestId,uint256 reward);
    constructor(uint256 capacity) ERC721("Economy experiment", "SLICE") {
        require(capacity>0); C=capacity; available=capacity;
        relayer=msg.sender; token=new SliceToken(); refillAt=uint64(block.timestamp);
    }
    modifier relayOnly() { require(msg.sender==relayer,"relay"); _; }
    function _newLife(address owner) private returns(uint256 id) {
        id=++nextLife; lives[id].alive=true; _safeMint(owner,id);
    }
    /// Founding NFT creation is free only in this local experiment; no token grant.
    function founder() external nonReentrant returns(uint256) { return _newLife(msg.sender); }
    function life(uint256 id) external view returns(Life memory) { return lives[id]; }
    function request(uint256 id) external view returns(Request memory) { return requests[id]; }
    function _update(address to,uint256 id,address auth) internal override returns(address from) {
        from=_ownerOf(id);
        if(from!=address(0)) { require(pending[id]==0,"day pending"); ++purseNonce[id]; ++lives[id].revision; }
        return super._update(to,id,auth);
    }
    function _weight(uint8 kind) private pure returns(uint16) {
        uint16[12] memory weights=[uint16(65),65,95,115,65,95,40,40,116,212,276,340];
        require(kind>0&&kind<=12,"good kind"); return weights[kind-1];
    }
    function _first(uint8 kind) private pure returns(uint8) { require(kind>0&&kind<=9); return kind==1||kind==2||kind==5 ? 3 : kind==3||kind==6||kind==9 ? 6 : 8; }
    function _yields(uint8 kind) private pure returns(uint8) { return kind==9 ? 10 : kind==7||kind==8 ? 6 : 1; }
    function _cost(uint8 recipe) private pure returns(uint8) { uint8[4] memory costs=[uint8(3),6,8,10]; require(recipe<4); return costs[recipe]; }
    function quote(uint256 decipoints,uint256 pressure) public pure returns(uint256) { return decipoints*U*K/(10*(K+pressure)); }
    function _topFour(uint32[12] memory goods) private pure returns(uint256 points) {
        for(uint8 slot;slot<4;++slot) {
            uint16 best; uint8 at;
            for(uint8 i;i<12;++i) if(goods[i]>0&&_weight(i+1)>best) { best=_weight(i+1); at=i; }
            if(best==0) break; --goods[at]; points+=best;
        }
    }
    function _cappedGoods(uint32[12] memory goods) private pure returns(uint32[12] memory caps) {
        for(uint8 i;i<12;++i) caps[i]=goods[i]>4 ? 4 : goods[i];
    }
    function _harvestFits(Life memory l) internal pure returns(bool) {
        uint8[12] memory added; uint8 woodAdded;
        for(uint8 i;i<4;++i) {
            Plot memory p=l.plots[i];
            if(p.kind>0&&p.ticks==0) { if(p.kind==9) ++woodAdded; else ++added[p.kind-1]; }
        }
        if(uint256(l.wood)+woodAdded>type(uint32).max) return false;
        for(uint8 i;i<12;++i) if(uint256(l.goods[i])+added[i]>type(uint32).max) return false;
        return true;
    }
    function _maxPoints(Life memory l) internal pure returns(uint256 best) {
        // Quote arithmetic needs at most four units/type. Never increment the real
        // narrow counters merely to explore a hypothetical output alternative.
        best=_topFour(_cappedGoods(l.goods));
        if(_harvestFits(l)) {
            uint32[12] memory gs=_cappedGoods(l.goods);
            for(uint8 i;i<4;++i) {
                Plot memory p=l.plots[i];
                if(p.kind>0&&p.kind<9&&p.ticks==0&&gs[p.kind-1]<4) ++gs[p.kind-1];
            }
            uint256 n=_topFour(gs); if(n>best) best=n;
        }
        for(uint8 recipe;recipe<4;++recipe) if(l.wood>=_cost(recipe)&&l.goods[8+recipe]<type(uint32).max) {
            // A fresh cap array per alternative avoids memory aliasing between
            // the baseline, harvest and mutually exclusive single crafts.
            uint32[12] memory gs=_cappedGoods(l.goods); if(gs[8+recipe]<4) ++gs[8+recipe];
            uint256 n=_topFour(gs); if(n>best) best=n;
        }
    }
    function maxPoints(uint256 id) public view returns(uint256) {
        return _maxPoints(lives[id]);
    }
    function _refill() private {
        uint256 raw=refillCarry+(block.timestamp-refillAt)*C;
        uint256 credit=raw/86400; uint256 headroom=C-available-reserved;
        if(credit>=headroom) { available+=headroom; refillCarry=0; }
        else { available+=credit; refillCarry=raw%86400; }
        refillAt=uint64(block.timestamp);
    }
    function accept(uint256 id,uint8 seed,bool shipping) external nonReentrant returns(uint256 qid) {
        require(ownerOf(id)==msg.sender&&lives[id].alive&&pending[id]==0,"admission");
        require(seed<=9,"seed"); _refill();
        uint256 q=shipping ? quote(maxPoints(id),issued) : 0;
        require(available>=q,"capacity"); available-=q; reserved+=q;
        qid=++nextRequest; ++attempts[id];
        requests[qid]=Request(id,lives[id].revision,issued,q,uint64(block.timestamp+900),seed,1,shipping&&q>0);
        pending[id]=qid; emit Accepted(qid,id,q,requests[qid].shipping);
    }
    function _release(Request storage q,uint256 actual) private {
        require(actual<=q.reserve,"reservation"); reserved-=q.reserve; available+=q.reserve-actual; pending[q.life]=0;
    }
    function fail(uint256 qid) external relayOnly {
        Request storage q=requests[qid]; require(q.status==1,"status"); _refill(); q.status=3; _release(q,0);
    }
    function expire(uint256 qid) external {
        Request storage q=requests[qid]; require(q.status==1&&block.timestamp>q.deadline,"expiry"); _refill(); q.status=4; _release(q,0);
    }
    /// validatedTerminalFixture STANDS FOR a separate complete canonical biology trace.
    /// This experiment does NOT validate death, needs, illness, incidents or AI origin.
    /// A production implementation MUST NOT accept a supplied bool as death authority.
    function commitEconomicSlice(uint256 qid,Action[] calldata actions,bool validatedTerminalFixture) external relayOnly nonReentrant {
        Request storage q=requests[qid]; Life storage l=lives[q.life];
        require(q.status==1&&block.timestamp<=q.deadline&&q.revision==l.revision&&pending[q.life]==qid,"base");
        require(actions.length<=6,"trace length");
        if(q.seed>0) ++l.seeds[q.seed-1];
        uint8 mains; uint8 routines; bool shipped; uint256 points;
        for(uint256 ai;ai<actions.length;++ai) {
            Action calldata a=actions[ai];
            if(a.op==Op.Plant||a.op==Op.Harvest||a.op==Op.Craft) require(++mains==1,"one main");
            else require(++routines<=5,"routine limit");
            if(a.op==Op.Water) { for(uint8 i;i<4;++i) if(l.plots[i].kind>0) l.plots[i].moisture=2; }
            else if(a.op==Op.Plant) {
                require(a.arg<4&&a.kind>0&&a.kind<=9&&l.plots[a.arg].kind==0&&l.seeds[a.kind-1]>0,"plant");
                --l.seeds[a.kind-1]; l.plots[a.arg]=Plot(a.kind,_first(a.kind),_yields(a.kind),2,0);
            } else if(a.op==Op.Harvest) {
                bool picked;
                for(uint8 i;i<4;++i) {
                    Plot storage p=l.plots[i];
                    if(p.kind>0&&p.ticks==0) {
                        picked=true; if(p.kind==9) ++l.wood; else ++l.goods[p.kind-1];
                        if(--p.left==0) delete l.plots[i]; else p.ticks=2;
                    }
                }
                require(picked,"nothing ready");
            } else if(a.op==Op.Craft) {
                uint8 cost=_cost(a.arg); require(l.wood>=cost,"wood"); l.wood-=cost; ++l.goods[8+a.arg];
            } else if(a.op==Op.Ship) {
                require(q.shipping&&!shipped,"shipping"); shipped=true; bool any;
                for(uint8 i;i<4;++i) if(a.shipment[i]>0) {
                    uint8 k=a.shipment[i]; require(k<=12&&l.goods[k-1]>0,"missing good");
                    --l.goods[k-1]; points+=_weight(k); any=true;
                }
                require(any&&quote(points,q.pressure)>0,"zero reward");
            }
        }
        if(!validatedTerminalFixture) {
            for(uint8 i;i<4;++i) {
                Plot storage p=l.plots[i]; if(p.kind==0) continue;
                if(p.ticks>0) {
                    if(p.moisture>0) { --p.ticks; p.dry=0; }
                    else if(++p.dry==2) { delete l.plots[i]; continue; }
                }
                if(p.moisture>0) --p.moisture;
            }
        } else l.alive=false;
        uint256 reward=quote(points,q.pressure); _refill(); _release(q,reward); q.status=2;
        ++l.day; ++l.revision;
        if(reward>0) { purse[q.life]+=reward; totalAllocated+=reward; issued+=reward; token.mintVault(reward); }
        emit Committed(qid,reward);
    }
    function withdraw(uint256 id,uint256 amount) external nonReentrant {
        require(ownerOf(id)==msg.sender&&amount>0&&purse[id]>=amount,"owner purse");
        purse[id]-=amount; totalAllocated-=amount; token.safeTransfer(msg.sender,amount);
    }
    function birthFromPurse(uint256 id,uint256 expectedNonce) external nonReentrant returns(uint256 newborn) {
        require(ownerOf(id)==msg.sender&&expectedNonce==purseNonce[id]&&purse[id]>=M,"purse birth");
        ++purseNonce[id]; purse[id]-=M; totalAllocated-=M; nftMintBurns+=M; token.burnVault(M);
        return _newLife(msg.sender);
    }
}

/// Injected COUNTER-BOUNDARY fixture only. No supplied state is written to a life
/// or accepted as production authority. Exercises the SAME quote helpers above.
contract QuoteCounterHarness is EconomySlice {
    constructor() EconomySlice(30_000*1e6) {}
    function inspect(uint32 wood,uint32[12] calldata goods,Plot[4] calldata plots) external pure returns(uint256 maxPoints_,bool harvestFits_) {
        Life memory l; l.wood=wood; l.goods=goods; l.plots=plots;
        return(_maxPoints(l),_harvestFits(l));
    }
}
