import { decodeEventLog, parseAbi, type Address, type Hex, type PublicClient } from 'viem';
import { freezeEvmInput, verifyEvmRuntime, EvmContextError, type EvmAcceptedRequest, type EvmRuntimeIdentity } from './context';

const acceptanceAbi = parseAbi([
  'event DayAccepted(bytes32 indexed id,uint256 indexed tokenId,address indexed player,uint256 reservedReward,bool shipping,bytes32 daySeed)',
  'function request(bytes32 id) view returns ((uint256 tokenId,address player,uint32 baseRevision,uint32 day,uint64 kitMask,bool shipping,uint64 acceptedAt,uint64 deadline,bytes32 daySeed,bytes32 decisionConfig,bytes32 baseHash,uint256 pressure,uint256 reservedReward,uint8 status))',
  'function life(uint256 id) view returns (bytes)',
  'function ownerOf(uint256 id) view returns (address)',
  'function revisions(uint256 id) view returns (uint32)',
  'function pending(uint256 id) view returns (bytes32)',
]);
const equal = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Construct worker input from a canonical paid transaction, never a client-supplied save. */
export async function readEvmAcceptedTransaction(
  client: PublicClient, runtime: EvmRuntimeIdentity, transactionHash: Hex, player: Address,
  options: { allowLocal?: boolean; requestId?: Hex } = {},
) {
  const block = await verifyEvmRuntime(client, runtime, options.allowLocal);
  const receipt = await client.getTransactionReceipt({ hash: transactionHash });
  if (receipt.status !== 'success') throw new EvmContextError('context', 'This request was not accepted.');
  const accepted = receipt.logs.filter(log => equal(log.address, runtime.collection)).flatMap(log => {
    try {
      const event = decodeEventLog({ abi: acceptanceAbi, eventName: 'DayAccepted', data: log.data, topics: log.topics });
      return equal(event.args.player, player) && (!options.requestId || equal(event.args.id, options.requestId)) ? [event.args] : [];
    } catch { return []; }
  });
  if (accepted.length !== 1) throw new EvmContextError('context', 'Choose the accepted day from this wallet.');
  const event = accepted[0]!, at = { address: runtime.collection, abi: acceptanceAbi, blockNumber: block.number! };
  const request = await client.readContract({ ...at, functionName: 'request', args: [event.id] });
  if (request.status !== 1 || request.tokenId !== event.tokenId || !equal(request.player, player)
    || request.daySeed !== event.daySeed || request.reservedReward !== event.reservedReward || request.shipping !== event.shipping) throw new EvmContextError('context', 'This accepted day has changed.');
  const [base, owner, revision, pending, acceptedBlock, confirmedBlock] = await Promise.all([
    client.readContract({ ...at, functionName: 'life', args: [event.tokenId] }),
    client.readContract({ ...at, functionName: 'ownerOf', args: [event.tokenId] }),
    client.readContract({ ...at, functionName: 'revisions', args: [event.tokenId] }),
    client.readContract({ ...at, functionName: 'pending', args: [event.tokenId] }),
    client.getBlock({ blockNumber: receipt.blockNumber }),
    client.getBlock({ blockNumber: block.number! }),
  ]);
  if (!equal(owner, player) || revision !== request.baseRevision || pending !== event.id
    || acceptedBlock.hash !== receipt.blockHash || confirmedBlock.hash !== block.hash) throw new EvmContextError('context', 'Checking the accepted day again.');
  if (block.timestamp > request.deadline) throw new EvmContextError('expired', 'This attempt has expired. The saved day is unchanged.');
  const input = freezeEvmInput(runtime, { ...request, requestId: event.id } as EvmAcceptedRequest, base,
    receipt.blockNumber, receipt.blockHash, options.allowLocal);
  return { input, ownerTx: receipt.transactionHash };
}
