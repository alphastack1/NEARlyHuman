// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IV2LifeVerifier} from "./IV2LifeVerifier.sol";
import {V2Types as T} from "./V2Types.sol";

/// @notice Only the immutable game controller can issue or burn vault units.
contract NEARlyHumanCoin is ERC20 {
    address public immutable controller;
    constructor() ERC20("NEARlyHuman Coin", "NHC") { controller=msg.sender; }
    function decimals() public pure override returns(uint8) { return 6; }
    function mintVault(uint256 amount) external { require(msg.sender==controller,"controller"); _mint(controller,amount); }
    function burnVault(uint256 amount) external { require(msg.sender==controller,"controller"); _burn(controller,amount); }
}

/// @notice Testnet candidate. The pinned verifier derives all biological/material consequences.
/// The relay selects delegated legal actions but cannot provide stock, reward or death outputs.
contract NEARlyHumanV2 is ERC721, Ownable, EIP712, ReentrancyGuard {
    using SafeERC20 for NEARlyHumanCoin;
    using Strings for uint256;
    uint256 public constant UNIT=1e6;
    uint256 public constant PRESSURE_SCALE=50_000*UNIT;
    uint256 public constant TOKEN_BIRTH_PRICE=250*UNIT;
    uint256 public constant BUCKET_CAPACITY=30_000*UNIT;
    uint64 public constant REQUEST_WINDOW=15 minutes;
    bytes32 public constant ADMISSION_TYPEHASH=keccak256("Admission(bytes32 id,address player,uint256 tokenId,uint32 baseRevision,uint64 kitMask,bool shipping,uint256 processingFee,uint16 multiplier,uint64 expiresAt,bytes32 decisionConfig)");

    enum Status { None, Pending, Settled, Failed, Expired }
    struct Admission {
        bytes32 id; address player; uint256 tokenId; uint32 baseRevision;
        uint64 kitMask; bool shipping; uint256 processingFee; uint16 multiplier;
        uint64 expiresAt; bytes32 decisionConfig;
    }
    struct Request {
        uint256 tokenId; address player; uint32 baseRevision; uint32 day;
        uint64 kitMask; bool shipping; uint64 acceptedAt; uint64 deadline;
        bytes32 daySeed; bytes32 decisionConfig; bytes32 baseHash;
        uint256 pressure; uint256 reservedReward; Status status;
    }
    struct DayRecord {
        bytes32 requestId; bytes32 seed; bytes32 stateHash; bytes32 traceHash;
        bytes32 certificateHash; bytes32 replayCommitment; uint256 reward; bytes history;
    }
    IV2LifeVerifier public immutable verifier;
    NEARlyHumanCoin public immutable token;
    bytes32 public immutable rulesHash;
    address public relayer;
    address public quoteSigner;
    address payable public treasury;
    uint256 public nativeMintPrice;
    uint16 public gasMultiplier=2;
    bool public admissionsPaused;
    uint256 public nextTokenId;
    uint256 public issued;
    uint256 public nftMintBurns;
    uint256 public totalAllocated;
    uint256 public nativeFees;
    uint256 public available=BUCKET_CAPACITY;
    uint256 public reserved;
    uint256 public refillCarry;
    uint64 public refillAt;
    mapping(uint256=>bytes) private saves;
    mapping(uint256=>string) public names;
    mapping(uint256=>bytes32) public appearanceSeed;
    mapping(uint256=>uint32) public revisions;
    mapping(uint256=>uint32) public attempts;
    mapping(uint256=>bytes32) public pending;
    mapping(uint256=>uint256) public purse;
    mapping(uint256=>uint256) public purseNonce;
    mapping(bytes32=>Request) private requests;
    mapping(bytes32=>bool) public usedAdmissions;
    mapping(uint256=>mapping(uint32=>DayRecord)) private records;

    event DayAccepted(bytes32 indexed id,uint256 indexed tokenId,address indexed player,uint256 reservedReward,bool shipping,bytes32 daySeed);
    event DaySettled(bytes32 indexed id,uint256 indexed tokenId,uint32 day,bytes32 stateHash,uint256 reward,bytes32 replayCommitment);
    event DayFailed(bytes32 indexed id,uint256 indexed tokenId,Status status);
    event PurseWithdrawal(uint256 indexed tokenId,address indexed owner,uint256 amount);
    event PurseBirth(uint256 indexed source,uint256 indexed child,address indexed owner,uint256 burned);
    event FeesChanged(uint256 nativeMintPrice,uint16 multiplier);

    constructor(address verifier_,address relayer_,address quoteSigner_,address payable treasury_,uint256 nativeMintPrice_)
        ERC721("NEARlyHuman", "LIFE") Ownable(msg.sender) EIP712("NEARlyHuman V2","2") {
        require(block.chainid==46630||block.chainid==31337,"testnet only");
        require(verifier_.code.length>0&&relayer_!=address(0)&&quoteSigner_!=address(0)&&treasury_!=address(0),"configuration");
        verifier=IV2LifeVerifier(verifier_); rulesHash=verifier.rulesHash();
        relayer=relayer_;quoteSigner=quoteSigner_;treasury=treasury_;nativeMintPrice=nativeMintPrice_;
        token=new NEARlyHumanCoin();refillAt=uint64(block.timestamp);
    }
    modifier relayOnly(){require(msg.sender==relayer,"relay");_;}
    function setServices(address relayer_,address signer_) external onlyOwner {require(relayer_!=address(0)&&signer_!=address(0));relayer=relayer_;quoteSigner=signer_;}
    function setFees(uint256 mintPrice_,uint16 multiplier_) external onlyOwner {require(multiplier_>=1&&multiplier_<=20);nativeMintPrice=mintPrice_;gasMultiplier=multiplier_;emit FeesChanged(mintPrice_,multiplier_);}
    function setAdmissionsPaused(bool value) external onlyOwner {admissionsPaused=value;}
    function life(uint256 id) external view returns(bytes memory){ownerOf(id);return saves[id];}
    function lifeInfo(uint256 id) external view returns(uint32 day,uint32 level,bool alive,uint32 revision,string memory name,bytes32 seed){
        ownerOf(id);(day,level,alive)=verifier.inspect(saves[id]);return(day,level,alive,revisions[id],names[id],appearanceSeed[id]);
    }
    function request(bytes32 id) external view returns(Request memory){return requests[id];}
    function dayRecord(uint256 id,uint32 day) external view returns(DayRecord memory){return records[id][day];}
    function _newLife(address receiver,string memory name,uint8[3] memory stats) private returns(uint256 id){
        bytes memory n=bytes(name);require(n.length>0&&n.length<=8&&n[0]!=0x20&&n[n.length-1]!=0x20,"name");
        for(uint256 i;i<n.length;++i) require(n[i]==0x20||(n[i]>=0x30&&n[i]<=0x39)||(n[i]>=0x41&&n[i]<=0x5a),"name");
        id=++nextTokenId;bytes32 seed=keccak256(abi.encode(block.chainid,address(this),id,block.prevrandao,block.timestamp));
        saves[id]=verifier.initialize(seed,stats);names[id]=name;appearanceSeed[id]=seed;_safeMint(receiver,id);
    }
    function mintNFT(string calldata name,uint8[3] calldata stats) external payable nonReentrant returns(uint256){
        require(!admissionsPaused&&msg.value==nativeMintPrice,"mint fee");nativeFees+=msg.value;return _newLife(msg.sender,name,stats);
    }
    function admissionDigest(Admission calldata a) public view returns(bytes32){
        return _hashTypedDataV4(keccak256(abi.encode(ADMISSION_TYPEHASH,a.id,a.player,a.tokenId,a.baseRevision,a.kitMask,a.shipping,a.processingFee,a.multiplier,a.expiresAt,a.decisionConfig)));
    }
    function quoteReward(uint256 decipoints,uint256 pressure) public pure returns(uint256){require(decipoints<=1360,"shipment bound");return decipoints*UNIT*PRESSURE_SCALE/(10*(PRESSURE_SCALE+pressure));}
    function _refill() private {
        uint256 raw=refillCarry+(block.timestamp-refillAt)*BUCKET_CAPACITY;
        uint256 credit=raw/86400;uint256 space=BUCKET_CAPACITY-available-reserved;
        if(credit>=space){available+=space;refillCarry=0;}else{available+=credit;refillCarry=raw%86400;}
        refillAt=uint64(block.timestamp);
    }
    function quoteDay(uint256 id) external view returns(uint256 maximum,uint256 pressure,uint256 capacity){
        ownerOf(id);maximum=quoteReward(verifier.maxShipmentPoints(saves[id]),issued);pressure=issued;
        uint256 credit=(refillCarry+(block.timestamp-refillAt)*BUCKET_CAPACITY)/86400;
        capacity=available+credit;uint256 ceiling=BUCKET_CAPACITY-reserved;if(capacity>ceiling)capacity=ceiling;
    }
    function acceptDay(Admission calldata a,bytes calldata signature) external payable nonReentrant {
        require(!admissionsPaused&&a.player==msg.sender&&ownerOf(a.tokenId)==msg.sender,"owner admission");
        require(a.id!=bytes32(0)&&!usedAdmissions[a.id]&&pending[a.tokenId]==bytes32(0),"one attempt");
        require(a.baseRevision==revisions[a.tokenId]&&a.multiplier==gasMultiplier&&a.expiresAt>=block.timestamp&&a.expiresAt<=block.timestamp+REQUEST_WINDOW,"admission changed");
        require(msg.value==a.processingFee&&ECDSA.recover(admissionDigest(a),signature)==quoteSigner,"signed fee");
        (uint32 day,,bool alive)=verifier.inspect(saves[a.tokenId]);require(alive,"life ended");
        // Validate supplies and headroom before paid inference is admitted.
        require(a.kitMask>>34==0,"kit bits");uint8 count;uint8 productive;
        for(uint8 i;i<34;++i)if(a.kitMask&(uint64(1)<<i)!=0){++count;if(i>=13&&i<=21)++productive;else require(i<13&&i!=6,"gift product");}
        require(count<=3&&productive<=1,"kit limit");
        verifier.validateKit(saves[a.tokenId],a.kitMask);
        _refill();uint256 q=a.shipping?quoteReward(verifier.maxShipmentPoints(saves[a.tokenId]),issued):0;
        require(available>=q,"shipping busy");available-=q;reserved+=q;
        bytes32 seed=keccak256(abi.encode(block.chainid,address(this),a.tokenId,a.id,a.baseRevision,block.prevrandao,block.timestamp));
        requests[a.id]=Request(a.tokenId,msg.sender,a.baseRevision,day+1,a.kitMask,a.shipping&&q>0,uint64(block.timestamp),uint64(block.timestamp+REQUEST_WINDOW),seed,a.decisionConfig,keccak256(saves[a.tokenId]),issued,q,Status.Pending);
        usedAdmissions[a.id]=true;pending[a.tokenId]=a.id;++attempts[a.tokenId];nativeFees+=msg.value;
        emit DayAccepted(a.id,a.tokenId,msg.sender,q,a.shipping&&q>0,seed);
    }
    function _release(Request storage q,uint256 amount) private {require(amount<=q.reservedReward,"reserved quote");reserved-=q.reservedReward;available+=q.reservedReward-amount;pending[q.tokenId]=bytes32(0);}
    function _packHistory(bytes calldata encodedTrace) private pure returns(bytes memory history){
        T.Trace memory t=abi.decode(encodedTrace,(T.Trace));require(t.steps.length<=16,"history length");
        history=new bytes(1+t.steps.length*8);history[0]=bytes1(t.goal);
        for(uint256 i;i<t.steps.length;++i){T.Step memory a=t.steps[i];uint256 at=1+i*8;
            history[at]=bytes1(a.slot);history[at+1]=bytes1(a.op);history[at+2]=bytes1(a.arg);history[at+3]=bytes1(a.variant);
            for(uint256 j;j<4;++j)history[at+4+j]=bytes1(a.goods[j]);
        }
    }
    function finalize(bytes32 id,bytes calldata trace,bytes calldata certificate,bytes32 replayCommitment) external relayOnly nonReentrant {
        require(replayCommitment!=bytes32(0),"replay commitment");
        Request storage q=requests[id];require(q.status==Status.Pending&&block.timestamp<=q.deadline&&pending[q.tokenId]==id&&q.baseRevision==revisions[q.tokenId]&&keccak256(saves[q.tokenId])==q.baseHash,"accepted base");
        (bytes memory result,uint16 points)=verifier.transition(saves[q.tokenId],trace,certificate,q.daySeed,q.kitMask,q.shipping);
        (uint32 day,,)=verifier.inspect(result);require(day==q.day,"day result");
        uint256 amount=quoteReward(points,q.pressure);require(points==0||amount>0,"zero shipment");_refill();_release(q,amount);q.status=Status.Settled;
        saves[q.tokenId]=result;++revisions[q.tokenId];
        bytes32 stateHash=keccak256(result);records[q.tokenId][day]=DayRecord(id,q.daySeed,stateHash,keccak256(trace),keccak256(certificate),replayCommitment,amount,_packHistory(trace));
        if(amount>0){purse[q.tokenId]+=amount;totalAllocated+=amount;issued+=amount;token.mintVault(amount);}
        emit DaySettled(id,q.tokenId,day,stateHash,amount,replayCommitment);
    }
    function fail(bytes32 id) external relayOnly {Request storage q=requests[id];require(q.status==Status.Pending,"pending");_refill();_release(q,0);q.status=Status.Failed;emit DayFailed(id,q.tokenId,Status.Failed);}
    function expire(bytes32 id) external {Request storage q=requests[id];require(q.status==Status.Pending&&block.timestamp>q.deadline,"expiry");_refill();_release(q,0);q.status=Status.Expired;emit DayFailed(id,q.tokenId,Status.Expired);}
    function withdraw(uint256 id,uint256 amount) external nonReentrant {
        require(ownerOf(id)==msg.sender&&amount>0&&purse[id]>=amount,"owner purse");
        ++purseNonce[id];purse[id]-=amount;totalAllocated-=amount;token.safeTransfer(msg.sender,amount);emit PurseWithdrawal(id,msg.sender,amount);
    }
    function birthFromPurse(uint256 source,uint256 expectedNonce,string calldata name,uint8[3] calldata stats) external nonReentrant returns(uint256 child){
        require(!admissionsPaused&&ownerOf(source)==msg.sender&&purseNonce[source]==expectedNonce&&purse[source]>=TOKEN_BIRTH_PRICE,"purse birth");
        ++purseNonce[source];purse[source]-=TOKEN_BIRTH_PRICE;totalAllocated-=TOKEN_BIRTH_PRICE;nftMintBurns+=TOKEN_BIRTH_PRICE;token.burnVault(TOKEN_BIRTH_PRICE);
        child=_newLife(msg.sender,name,stats);emit PurseBirth(source,child,msg.sender,TOKEN_BIRTH_PRICE);
    }
    function birthFromWallet(string calldata name,uint8[3] calldata stats) external nonReentrant returns(uint256 child){
        require(!admissionsPaused,"admission paused");token.safeTransferFrom(msg.sender,address(this),TOKEN_BIRTH_PRICE);token.burnVault(TOKEN_BIRTH_PRICE);nftMintBurns+=TOKEN_BIRTH_PRICE;
        child=_newLife(msg.sender,name,stats);emit PurseBirth(0,child,msg.sender,TOKEN_BIRTH_PRICE);
    }
    function withdrawFees() external nonReentrant {uint256 amount=nativeFees;nativeFees=0;(bool ok,)=treasury.call{value:amount}("");require(ok,"treasury transfer");}
    function _update(address to,uint256 id,address auth) internal override returns(address from){
        from=_ownerOf(id);if(from!=address(0)){require(pending[id]==bytes32(0),"day pending");++purseNonce[id];++revisions[id];}return super._update(to,id,auth);
    }
    function tokenURI(uint256 id) public view override returns(string memory){ownerOf(id);return string.concat("https://nearlyhuman.netlify.app/api/v2/nft/",id.toString(),"?chainId=",block.chainid.toString(),"&collection=",Strings.toHexString(uint160(address(this)),20));}
}
