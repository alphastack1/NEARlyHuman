// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

interface IETHUSDFeed {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

/// @notice An owned game save. Inference and game rules are executed by the trusted service.
/// The chain preserves accepted state/history and enforces ownership, payment and lifecycle.
contract NEARlyHuman is ERC721, Ownable, EIP712, ReentrancyGuard {
    using Strings for uint256;

    uint32 public constant RULES_VERSION = 1;
    uint256 public constant STATE_BYTES = 192;
    uint256 public constant MAX_HISTORY_BYTES = 240;
    uint32 public constant TRIAL_DAYS = 3;
    bytes32 public constant PERMIT_TYPEHASH = keccak256(
        "Permit(bytes32 id,address player,uint8 operation,uint256 tokenId,uint32 baseRevision,uint16 delivery,bytes32 parametersHash,uint256 networkFee,uint256 processingFee,uint256 mintFee,uint16 multiplier,uint64 expiresAt,uint32 window,uint32 rulesVersion,bytes32 decisionConfig)"
    );

    enum RequestStatus { None, Pending, Settled, Failed, Expired }
    struct Permit {
        bytes32 id;
        address player;
        uint8 operation; // 0: mint including day one; 1: fresh day request/retry
        uint256 tokenId;
        uint32 baseRevision;
        uint16 delivery; // one bit per type; at most three distinct additions
        bytes32 parametersHash;
        uint256 networkFee;
        uint256 processingFee;
        uint256 mintFee;
        uint16 multiplier;
        uint64 expiresAt;
        uint32 window;
        uint32 rulesVersion;
        bytes32 decisionConfig;
    }
    struct Rooster {
        string name;
        uint8 body;
        uint8 wits;
        uint8 spirit;
        bool alive;
        uint8 deathCause;
        uint32 day;
        uint32 level;
        uint32 revision;
        uint32 attempts;
        uint64 bornAt;
        uint256 seed;
        bytes32 pendingRequest;
        bytes32 latestRequest;
        bytes32 replayCommitment;
        bytes state;
    }
    struct DayRequest {
        uint256 tokenId;
        address player;
        uint32 baseRevision;
        uint32 day;
        uint16 delivery;
        uint32 rulesVersion;
        uint64 acceptedAt;
        uint64 deadline;
        uint256 seed;
        bytes32 decisionConfig;
        bytes32 permitId;
        bytes32 inputDigest;
        RequestStatus status;
        bytes32 resultHash;
    }
    struct DaySummary {
        uint32 day;
        uint32 level;
        uint32 revision;
        uint64 savedAt;
        bool alive;
        uint8 deathCause;
        bytes32 requestId;
        bytes32 stateHash;
        bytes32 replayCommitment;
    }

    address public quoteSigner;
    address public relayer;
    address public treasury;
    bool public immutable isTestnet;
    bool public admissionPaused;
    uint16 public gasMultiplier = 2;
    uint32 public requestWindow = 30 minutes;
    uint256 public testnetMintPrice = 0.00001 ether;
    IETHUSDFeed public priceFeed;
    uint64 public priceMaximumAge;
    string public metadataBase;
    uint256 private _nextTokenId = 1;
    mapping(uint256 => Rooster) private _roosters;
    mapping(bytes32 => DayRequest) private _requests;
    mapping(bytes32 => bool) public usedPermits;
    mapping(uint256 => mapping(uint32 => DaySummary)) private _summaries;
    mapping(uint256 => mapping(uint32 => bytes)) private _histories;
    mapping(address => uint256[]) private _owned;
    mapping(uint256 => uint256) private _ownedIndex;

    error NotRelayer();
    error InvalidPermit();
    error WrongPayment();
    error InvalidName();
    error InvalidStats();
    error NotYourRooster();
    error RequestLocked();
    error NotPending();
    error DeadlinePassed();
    error NotExpired();
    error Unplayable();
    error InvalidState();
    error InvalidHistory();
    error InvalidDelivery();
    error AdmissionPaused();
    error PriceUnavailable();
    error TransferFailed();

    event Born(uint256 indexed tokenId, address indexed player, string name, uint256 seed);
    event DayRequested(bytes32 indexed requestId, uint256 indexed tokenId, address indexed player, uint32 day, uint16 delivery, uint256 seed, uint64 deadline, bytes32 inputDigest);
    event DaySaved(bytes32 indexed requestId, uint256 indexed tokenId, uint32 day, uint32 level, bool alive, uint8 deathCause, bytes32 stateHash, bytes32 replayCommitment);
    event AttemptFailed(bytes32 indexed requestId, uint256 indexed tokenId, bytes32 reasonHash);
    event RequestExpired(bytes32 indexed requestId, uint256 indexed tokenId);
    event ServicesChanged(address quoteSigner, address relayer);
    event MultiplierChanged(uint16 previous, uint16 current);
    event AdmissionChanged(bool paused);
    event MetadataUpdate(uint256 indexed tokenId);
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId);

    constructor(address initialOwner, address signer_, address relayer_, address treasury_, bool testnet_, address feed_, uint64 maximumAge_, string memory metadataBase_)
        ERC721("NEARlyHuman", "NPC") Ownable(initialOwner) EIP712("NEARlyHuman", "1")
    {
        require(signer_ != address(0) && relayer_ != address(0) && treasury_ != address(0), "zero service");
        // Test currency/pricing can never be enabled on the Robinhood mainnet deployment.
        require(block.chainid != 4663 || !testnet_, "mainnet mode");
        require(testnet_ || (feed_ != address(0) && maximumAge_ > 0), "feed required");
        quoteSigner = signer_;
        relayer = relayer_;
        treasury = treasury_;
        isTestnet = testnet_;
        priceFeed = IETHUSDFeed(feed_);
        priceMaximumAge = maximumAge_;
        metadataBase = metadataBase_;
    }

    modifier onlyRelayer() { if (msg.sender != relayer) revert NotRelayer(); _; }

    function totalSupply() external view returns (uint256) { return _nextTokenId - 1; }
    function getRooster(uint256 tokenId) external view returns (Rooster memory) { _requireOwned(tokenId); return _roosters[tokenId]; }
    function getRequest(bytes32 requestId) external view returns (DayRequest memory) { return _requests[requestId]; }
    function getDay(uint256 tokenId, uint32 day) external view returns (DaySummary memory summary, bytes memory history) { _requireOwned(tokenId); return (_summaries[tokenId][day], _histories[tokenId][day]); }
    function ownedTokens(address player, uint256 cursor, uint256 limit) external view returns (uint256[] memory tokenIds, uint256 nextCursor) {
        require(limit > 0 && limit <= 100, "page size");
        uint256 length = _owned[player].length;
        if (cursor >= length) return (new uint256[](0), 0);
        uint256 end = cursor + limit;
        if (end > length) end = length;
        tokenIds = new uint256[](end - cursor);
        for (uint256 i = cursor; i < end; ++i) tokenIds[i - cursor] = _owned[player][i];
        nextCursor = end < length ? end : 0;
    }

    function mintPrice() public view returns (uint256) {
        if (isTestnet) return testnetMintPrice;
        try priceFeed.latestRoundData() returns (uint80 round, int256 answer, uint256, uint256 updated, uint80 answered) {
            if (answer <= 0 || updated == 0 || updated > block.timestamp || block.timestamp - updated > priceMaximumAge || answered < round) revert PriceUnavailable();
            uint8 decimals = priceFeed.decimals();
            if (decimals > 36) revert PriceUnavailable();
            uint256 numerator = 1 ether * (10 ** uint256(decimals));
            return (numerator + uint256(answer) - 1) / uint256(answer);
        } catch { revert PriceUnavailable(); }
    }

    function hashPermit(Permit calldata p) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
            PERMIT_TYPEHASH, p.id, p.player, p.operation, p.tokenId, p.baseRevision, p.delivery,
            p.parametersHash, p.networkFee, p.processingFee, p.mintFee, p.multiplier,
            p.expiresAt, p.window, p.rulesVersion, p.decisionConfig
        )));
    }

    function mint(string calldata name_, uint8 body, uint8 wits, uint8 spirit, Permit calldata p, bytes calldata signature)
        external payable nonReentrant returns (uint256 tokenId, bytes32 requestId)
    {
        _checkName(name_);
        if (body > 5 || wits > 5 || spirit > 5 || uint256(body) + wits + spirit != 5) revert InvalidStats();
        if (p.operation != 0 || p.tokenId != 0 || p.baseRevision != 0 || p.delivery != 0 || p.parametersHash != keccak256(abi.encode(name_, body, wits, spirit))) revert InvalidPermit();
        _consumePermit(p, signature);
        uint256 currentPrice = mintPrice();
        // The signed short quote fixes exact payment; modest conversion drift is bounded.
        if (p.mintFee < currentPrice || p.mintFee > currentPrice + (currentPrice / 100) + 1) revert WrongPayment();
        if (msg.value != p.processingFee + p.mintFee) revert WrongPayment();
        tokenId = _nextTokenId++;
        uint256 seed = uint256(keccak256(abi.encode(block.chainid, address(this), tokenId, msg.sender, block.timestamp)));
        Rooster storage r = _roosters[tokenId];
        r.name = name_; r.body = body; r.wits = wits; r.spirit = spirit;
        r.alive = true; r.seed = seed; r.bornAt = uint64(block.timestamp);
        r.state = initialState(seed);
        // Establish the lock before ERC721Receiver callbacks can attempt a transfer.
        requestId = _openRequest(tokenId, msg.sender, p);
        _safeMint(msg.sender, tokenId);
        emit Born(tokenId, msg.sender, name_, seed);
    }

    function requestDay(uint256 tokenId, Permit calldata p, bytes calldata signature) external payable nonReentrant returns (bytes32 requestId) {
        if (ownerOf(tokenId) != msg.sender) revert NotYourRooster();
        Rooster storage r = _roosters[tokenId];
        if (!r.alive || (isTestnet && r.day >= TRIAL_DAYS)) revert Unplayable();
        if (r.pendingRequest != bytes32(0)) revert RequestLocked();
        if (p.operation != 1 || p.tokenId != tokenId || p.baseRevision != r.revision || p.parametersHash != bytes32(0) || p.mintFee != 0) revert InvalidPermit();
        if (r.day == 0 && p.delivery != 0) revert InvalidDelivery();
        _validateDelivery(r.state, p.delivery);
        _consumePermit(p, signature);
        if (msg.value != p.processingFee) revert WrongPayment();
        requestId = _openRequest(tokenId, msg.sender, p);
    }

    function finalize(bytes32 requestId, bytes calldata state, bytes calldata history, bytes32 replayCommitment) external onlyRelayer nonReentrant {
        DayRequest storage q = _requests[requestId];
        Rooster storage r = _pending(requestId, q);
        if (block.timestamp > q.deadline) revert DeadlinePassed();
        if (ownerOf(q.tokenId) != q.player || r.revision != q.baseRevision || q.day != r.day + 1) revert InvalidState();
        _validateState(state, q.day, r.level);
        bool alive = uint8(state[1]) == 1;
        if (history.length == 0 || history.length > MAX_HISTORY_BYTES || history.length % 4 != 0 || (alive && history.length != MAX_HISTORY_BYTES)) revert InvalidHistory();
        for (uint256 i; i < history.length; i += 4) {
            if (uint8(history[i]) == 0 || uint8(history[i]) > 35 || uint8(history[i + 1]) >= 20 || uint8(history[i + 2]) >= 40) revert InvalidHistory();
            if ((uint8(history[i + 3]) & 128) != 0 && (alive || i + 4 != history.length)) revert InvalidHistory();
        }
        if (!alive && (uint8(history[history.length - 1]) & 128) == 0) revert InvalidHistory();
        if (replayCommitment == bytes32(0)) revert InvalidState();
        r.state = state; r.alive = alive; r.deathCause = uint8(state[2]);
        r.day = q.day; r.level = _u32(state, 8); ++r.revision;
        r.replayCommitment = replayCommitment; r.latestRequest = requestId; r.pendingRequest = bytes32(0);
        bytes32 stateHash = keccak256(state);
        bytes32 resultHash = keccak256(abi.encode(stateHash, keccak256(history), replayCommitment));
        q.status = RequestStatus.Settled; q.resultHash = resultHash;
        _summaries[q.tokenId][q.day] = DaySummary(q.day, r.level, r.revision, uint64(block.timestamp), alive, r.deathCause, requestId, stateHash, replayCommitment);
        _histories[q.tokenId][q.day] = history;
        emit DaySaved(requestId, q.tokenId, q.day, r.level, alive, r.deathCause, stateHash, replayCommitment);
        emit MetadataUpdate(q.tokenId);
    }

    function recordFailure(bytes32 requestId, bytes32 reasonHash) external onlyRelayer nonReentrant {
        DayRequest storage q = _requests[requestId]; Rooster storage r = _pending(requestId, q);
        q.status = RequestStatus.Failed; q.resultHash = reasonHash; r.pendingRequest = bytes32(0);
        emit AttemptFailed(requestId, q.tokenId, reasonHash);
    }

    function releaseExpired(bytes32 requestId) external nonReentrant {
        DayRequest storage q = _requests[requestId]; Rooster storage r = _pending(requestId, q);
        if (block.timestamp <= q.deadline) revert NotExpired();
        q.status = RequestStatus.Expired; r.pendingRequest = bytes32(0);
        emit RequestExpired(requestId, q.tokenId);
    }

    function initialState(uint256 seed) public pure returns (bytes memory state) {
        state = new bytes(STATE_BYTES); state[0] = bytes1(uint8(1)); state[1] = bytes1(uint8(1));
        _put16(state, 12, 10000); for (uint256 p = 14; p <= 20; p += 2) _put16(state, p, 8000);
        _put16(state, 22, 3); _put16(state, 26, 3); // water and bread
        uint8[5] memory pool = [uint8(7), 8, 12, 13, 14];
        uint256 remaining = 5;
        for (uint256 i; i < 3; ++i) {
            uint256 at = uint8(seed >> (8 * i)) % remaining;
            _put16(state, 22 + uint256(pool[at]) * 2, 1);
            for (uint256 j = at; j + 1 < remaining; ++j) pool[j] = pool[j + 1];
            --remaining;
        }
    }

    function setServices(address signer_, address relayer_) external onlyOwner { require(signer_ != address(0) && relayer_ != address(0), "zero service"); quoteSigner = signer_; relayer = relayer_; emit ServicesChanged(signer_, relayer_); }
    function setGasMultiplier(uint16 value) external onlyOwner { require(value >= 1, "multiplier"); uint16 old = gasMultiplier; gasMultiplier = value; emit MultiplierChanged(old, value); }
    function setAdmissionPaused(bool value) external onlyOwner { admissionPaused = value; emit AdmissionChanged(value); }
    function setRequestWindow(uint32 value) external onlyOwner { require(value >= 5 minutes && value <= 1 hours, "window"); requestWindow = value; }
    function setTestnetMintPrice(uint256 value) external onlyOwner { require(isTestnet, "testnet only"); testnetMintPrice = value; }
    function setPriceFeed(address feed_, uint64 age_) external onlyOwner { require(feed_ != address(0) && age_ > 0, "feed"); priceFeed = IETHUSDFeed(feed_); priceMaximumAge = age_; }
    function setTreasury(address value) external onlyOwner { require(value != address(0), "zero treasury"); treasury = value; }
    function setMetadataBase(string calldata value) external onlyOwner { metadataBase = value; if (_nextTokenId > 1) emit BatchMetadataUpdate(1, _nextTokenId - 1); }
    function withdrawTreasury(uint256 amount) external onlyOwner nonReentrant { (bool ok,) = payable(treasury).call{value: amount}(""); if (!ok) revert TransferFailed(); }
    function tokenURI(uint256 tokenId) public view override returns (string memory) { _requireOwned(tokenId); return string.concat(metadataBase, tokenId.toString()); }
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) { return interfaceId == 0x49064906 || super.supportsInterface(interfaceId); }

    function _consumePermit(Permit calldata p, bytes calldata signature) private {
        if (admissionPaused) revert AdmissionPaused();
        if (p.player != msg.sender || p.id == bytes32(0) || usedPermits[p.id] || p.expiresAt < block.timestamp || p.expiresAt > block.timestamp + 15 minutes || p.rulesVersion != RULES_VERSION || p.decisionConfig == bytes32(0) || p.window < 5 minutes || p.window > 1 hours || p.multiplier < 1 || p.processingFee != p.networkFee * (uint256(p.multiplier) - 1)) revert InvalidPermit();
        if (ECDSA.recover(hashPermit(p), signature) != quoteSigner) revert InvalidPermit();
        usedPermits[p.id] = true;
    }
    function _openRequest(uint256 tokenId, address player, Permit calldata p) private returns (bytes32 id) {
        Rooster storage r = _roosters[tokenId]; ++r.attempts;
        id = keccak256(abi.encode(block.chainid, address(this), tokenId, r.attempts));
        uint32 day = r.day + 1;
        uint256 seed = uint256(keccak256(abi.encode(r.seed, day, RULES_VERSION)));
        uint64 deadline = uint64(block.timestamp + p.window);
        bytes32 digest = keccak256(abi.encode(id, tokenId, player, r.revision, day, p.delivery, p.rulesVersion, p.decisionConfig, seed, keccak256(r.state)));
        _requests[id] = DayRequest(tokenId, player, r.revision, day, p.delivery, p.rulesVersion, uint64(block.timestamp), deadline, seed, p.decisionConfig, p.id, digest, RequestStatus.Pending, bytes32(0));
        r.pendingRequest = id; r.latestRequest = id;
        emit DayRequested(id, tokenId, player, day, p.delivery, seed, deadline, digest);
    }
    function _pending(bytes32 id, DayRequest storage q) private view returns (Rooster storage r) {
        if (q.status != RequestStatus.Pending) revert NotPending(); r = _roosters[q.tokenId]; if (r.pendingRequest != id) revert NotPending();
    }
    function _validateDelivery(bytes storage state, uint16 delivery) private view {
        if (delivery >> 15 != 0) revert InvalidDelivery(); uint256 count;
        for (uint256 i; i < 15; ++i) if ((delivery & uint16(1 << i)) != 0) { ++count; uint256 p = 22 + i * 2; if ((uint16(uint8(state[p])) | uint16(uint8(state[p + 1])) << 8) == 65535) revert InvalidDelivery(); }
        if (count > 3) revert InvalidDelivery();
    }
    function _validateState(bytes calldata state, uint32 day, uint32 level) private pure {
        if (state.length != STATE_BYTES || uint8(state[0]) != 1 || uint8(state[1]) > 1 || uint8(state[2]) > 7 || uint8(state[3]) > 127 || _u32(state, 4) != day) revert InvalidState();
        bool alive = uint8(state[1]) == 1;
        if (_u32(state, 8) != level + (alive ? 1 : 0) || (alive && (uint8(state[2]) != 0 || _u16(state, 12) == 0)) || (!alive && uint8(state[2]) == 0)) revert InvalidState();
        for (uint256 p = 12; p <= 20; p += 2) if (_u16(state, p) > 10000) revert InvalidState();
        for (uint256 p = 52; p < 132; p += 10) if (uint8(state[p]) > 2 || uint8(state[p + 1]) > 1) revert InvalidState();
        for (uint256 p = 132; p < 144; p += 6) if (uint8(state[p]) > 2 || uint8(state[p + 1]) > 3 || uint8(state[p + 2]) > 2 || uint8(state[p + 3]) > 2 || uint8(state[p + 4]) > 1 || uint8(state[p + 5]) > 1) revert InvalidState();
        if (uint8(state[144]) > 2 || uint8(state[145]) > 7 || uint8(state[146]) > 5 || uint8(state[147]) > 1 || uint8(state[148]) > 4 || uint8(state[149]) > 3 || uint8(state[150]) > 3 || uint8(state[151]) > 2 || uint8(state[152]) > 2 || uint8(state[158]) > 2) revert InvalidState();
        for (uint256 p = 153; p <= 157; ++p) if (uint8(state[p]) > 1) revert InvalidState();
        for (uint256 p = 160; p < 184; p += 4) if (uint8(state[p]) > 35 || uint8(state[p + 1]) >= 20 || uint8(state[p + 2]) >= 40 || uint8(state[p + 3]) > 1) revert InvalidState();
    }
    function _checkName(string calldata value) private pure {
        bytes memory n = bytes(value); if (n.length == 0 || n.length > 8 || n[0] == 0x20 || n[n.length - 1] == 0x20) revert InvalidName();
        for (uint256 i; i < n.length; ++i) { uint8 c = uint8(n[i]); if (!(c == 32 || (c >= 48 && c <= 57) || (c >= 65 && c <= 90))) revert InvalidName(); }
    }
    function _u16(bytes calldata state, uint256 p) private pure returns (uint16) { return uint16(uint8(state[p])) | uint16(uint8(state[p + 1])) << 8; }
    function _u32(bytes calldata state, uint256 p) private pure returns (uint32) { return uint32(uint8(state[p])) | uint32(uint8(state[p + 1])) << 8 | uint32(uint8(state[p + 2])) << 16 | uint32(uint8(state[p + 3])) << 24; }
    function _put16(bytes memory state, uint256 p, uint16 n) private pure { state[p] = bytes1(uint8(n)); state[p + 1] = bytes1(uint8(n >> 8)); }
    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = _ownerOf(tokenId);
        if (from != address(0) && _roosters[tokenId].pendingRequest != bytes32(0)) revert RequestLocked();
        address actualFrom = super._update(to, tokenId, auth);
        if (actualFrom != to) {
            if (actualFrom != address(0)) {
                uint256 at = _ownedIndex[tokenId]; uint256 last = _owned[actualFrom][_owned[actualFrom].length - 1];
                _owned[actualFrom][at] = last; _ownedIndex[last] = at; _owned[actualFrom].pop();
                ++_roosters[tokenId].revision;
            }
            if (to != address(0)) { _ownedIndex[tokenId] = _owned[to].length; _owned[to].push(tokenId); }
        }
        return actualFrom;
    }
}
