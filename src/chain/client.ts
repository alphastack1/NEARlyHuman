import {
  createPublicClient, createWalletClient, custom, http, parseEventLogs,
  type Address, type EIP1193Provider, type Hex, type TransactionReceipt,
} from 'viem';
import { nearlyHumanAbi } from './abi';
import { chainFor, type CollectionConfig } from './config';
import { permitValue, type AdmissionPermit } from './permit';

export { nearlyHumanAbi } from './abi';
export * from './permit';
export * from './config';

export const RequestStatus = { None: 0, Pending: 1, Settled: 2, Failed: 3, Expired: 4 } as const;

export function publicChain(config: CollectionConfig) {
  return createPublicClient({ chain: chainFor(config.chainId), transport: http(config.rpcUrl) });
}

/** Recover a wallet submission that may have broadcast without returning its hash. */
export interface PermitSubmissionResolution {hash?:Hex;expiredUnused?:boolean;nextBlock:bigint}
export async function resolvePermitSubmission(config:CollectionConfig,permitId:Hex,player:Address,fromBlock:bigint,expiresAt:bigint):Promise<PermitSubmissionResolution> {
  if(!/^0x[0-9a-fA-F]{64}$/.test(permitId)||!/^0x[0-9a-fA-F]{40}$/.test(player)||fromBlock<0n)throw new Error('Check this wallet submission again.');
  const client=publicChain(config),block=await client.getBlock();
  const retry=async<T>(read:()=>Promise<T>):Promise<T>=>{for(let i=0;;i++){try{return await read();}catch(e){if(i>=4||!/(unsupported block number|header not found|block not found)/i.test(e instanceof Error?e.message:String(e)))throw e;await new Promise(r=>setTimeout(r,250*(i+1)));}}};
  const used=await retry(()=>client.readContract({address:config.address,abi:nearlyHumanAbi,functionName:'usedPermits',args:[permitId],blockNumber:block.number}));
  if(!used&&block.timestamp>expiresAt){
    const verified=await client.getBlock({blockNumber:block.number});
    if(verified.hash!==block.hash)throw new Error('Checking this wallet submission. Try again.');
    return {expiredUnused:true,nextBlock:fromBlock} as {hash?:Hex;expiredUnused?:boolean;nextBlock:bigint};
  }
  if(fromBlock>block.number)return {nextBlock:fromBlock};
  const end=block.number<fromBlock+19_999n?block.number:fromBlock+19_999n;
  const logs=await retry(()=>client.getContractEvents({address:config.address,abi:nearlyHumanAbi,eventName:'DayRequested',args:{player},fromBlock,toBlock:end,strict:true}));
  for(const log of logs){
    const request=await retry(()=>client.readContract({address:config.address,abi:nearlyHumanAbi,functionName:'getRequest',args:[log.args.requestId],blockNumber:log.blockNumber}));
    if(request.permitId!==permitId||request.player.toLowerCase()!==player.toLowerCase())continue;
    const canonical=await client.getBlock({blockNumber:log.blockNumber});if(canonical.hash!==log.blockHash)throw new Error('Checking this wallet submission. Try again.');
    return {hash:log.transactionHash,nextBlock:log.blockNumber} as {hash?:Hex;expiredUnused?:boolean;nextBlock:bigint};
  }
  return {nextBlock:end>32n?end-32n:0n};
}

export function createChainReader(config: CollectionConfig) {
  const client = publicChain(config);
  const contract = { address: config.address, abi: nearlyHumanAbi } as const;
  return {
    client,
    config,
    ownerOf: (tokenId: bigint) => client.readContract({ ...contract, functionName: 'ownerOf', args: [tokenId] }),
    rooster: (tokenId: bigint) => client.readContract({ ...contract, functionName: 'getRooster', args: [tokenId] }),
    request: (requestId: Hex) => client.readContract({ ...contract, functionName: 'getRequest', args: [requestId] }),
    day: (tokenId: bigint, day: number) => client.readContract({ ...contract, functionName: 'getDay', args: [tokenId, day] }),
    owned: (player: Address, cursor = 0n, limit = 20n) => client.readContract({ ...contract, functionName: 'ownedTokens', args: [player, cursor, limit] }),
    mintPrice: () => client.readContract({ ...contract, functionName: 'mintPrice' }),
    multiplier: () => client.readContract({ ...contract, functionName: 'gasMultiplier' }),
    window: () => client.readContract({ ...contract, functionName: 'requestWindow' }),
    balance: (player: Address) => client.getBalance({ address: player }),
    receipt: (hash: Hex) => client.getTransactionReceipt({ hash }),
    wait: (hash: Hex) => client.waitForTransactionReceipt({ hash, confirmations: 1, timeout: 120_000 }),
    resolvePermitSubmission:(permitId:Hex,player:Address,fromBlock:bigint,expiresAt:bigint)=>resolvePermitSubmission(config,permitId,player,fromBlock,expiresAt),
    async expiryAvailable(requestId: Hex) {
      const [request, block] = await Promise.all([
        client.readContract({ ...contract, functionName: 'getRequest', args: [requestId] }),
        client.getBlock(),
      ]);
      return request.status === RequestStatus.Pending && block.timestamp > request.deadline;
    },
  };
}

export function createOwnerWallet(provider: EIP1193Provider, config: CollectionConfig, account: Address) {
  const chain = chainFor(config.chainId);
  const client = createWalletClient({ account, chain, transport: custom(provider) });
  const contract = { address: config.address, abi: nearlyHumanAbi } as const;
  const reader = publicChain(config);
  const buffered = (estimate: bigint) => estimate * 125n / 100n + 20_000n;
  return {
    client,
    async switchNetwork() {
      try { await client.switchChain({ id: chain.id }); }
      catch (error) {
        const e = error as { code?: number; cause?: { code?: number } };
        if (e.code !== 4902 && e.cause?.code !== 4902) throw error;
        await client.addChain({ chain });
        await client.switchChain({ id: chain.id });
      }
    },
    async mint(name: string, stats: { body: number; wits: number; spirit: number }, permit: AdmissionPermit, signature: Hex) {
      const args = [name, stats.body, stats.wits, stats.spirit, permit, signature] as const;
      const gas = buffered(await reader.estimateContractGas({ ...contract, account, functionName: 'mint', args, value: permitValue(permit) }));
      return client.writeContract({ ...contract, functionName: 'mint', args, value: permitValue(permit), gas });
    },
    async requestDay(tokenId: bigint, permit: AdmissionPermit, signature: Hex) {
      const args = [tokenId, permit, signature] as const;
      const gas = buffered(await reader.estimateContractGas({ ...contract, account, functionName: 'requestDay', args, value: permitValue(permit) }));
      return client.writeContract({ ...contract, functionName: 'requestDay', args, value: permitValue(permit), gas });
    },
    async releaseExpired(requestId: Hex) {
      const gas = buffered(await reader.estimateContractGas({ ...contract, account, functionName: 'releaseExpired', args: [requestId] }));
      return client.writeContract({ ...contract, functionName: 'releaseExpired', args: [requestId], gas });
    },
  };
}

export function acceptedRequest(receipt: TransactionReceipt) {
  const events = parseEventLogs({ abi: nearlyHumanAbi, logs: receipt.logs, eventName: 'DayRequested' });
  const event = events[0];
  if (!event) return undefined;
  return { ...event.args, transactionHash: receipt.transactionHash, blockNumber: receipt.blockNumber, blockHash: receipt.blockHash };
}

export function bornToken(receipt: TransactionReceipt): bigint | undefined {
  return parseEventLogs({ abi: nearlyHumanAbi, logs: receipt.logs, eventName: 'Born' })[0]?.args.tokenId;
}

export type ChainReader = ReturnType<typeof createChainReader>;
export type ChainRooster = Awaited<ReturnType<ChainReader['rooster']>>;
export type ChainRequest = Awaited<ReturnType<ChainReader['request']>>;

export function normalizeRoosterName(name: string): string { return name.trim().toUpperCase(); }
export function validRoosterName(name: string): boolean { return /^[A-Z0-9](?:[A-Z0-9 ]{0,6}[A-Z0-9])?$/.test(name); }
