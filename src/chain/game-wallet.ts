import type { Address, EIP1193Provider, Hex } from 'viem';
import type { GameOwnerQuote, GamePublicConfig, GameWorld, NearSignChallenge, NearSignedMessage } from './game-types';
import { isNearWorld } from './game-types';
import { sameWorld } from './game-world';
import { connectV2Wallet, createV2ChainReader, mintedId, resolveV2Submission, type V2OwnerReceipt, type V2SubmissionIntent } from './v2-client';
import { connectNearWallet, createNearChainReader, isNearIntent, resolveNearSubmission, type NearOwnerReceipt, type NearSubmissionIntent } from './near-client';
import { NearWalletError } from './near-rpc';

export type GameSubmissionIntent = V2SubmissionIntent | NearSubmissionIntent;
export type GameReceipt = { kind: 'evm'; transactionHash: string; receipt: V2OwnerReceipt } | NearOwnerReceipt;
export interface GameWallet {
  kind: 'evm' | 'near'; account: string; world: GameWorld; requiresBirthApproval: boolean; walletName?: string;
  connectionValid(): Promise<boolean>;
  signLogin(challenge: { message: string } | NearSignChallenge, beforeOpen?: () => Promise<void>): Promise<string | NearSignedMessage>;
  mint(name: string, stats: readonly [number, number, number], beforeOpen?: () => Promise<void>): Promise<string>;
  accept(quote: GameOwnerQuote, beforeOpen?: () => Promise<void>): Promise<string>;
  withdraw(id: string, amount: string, beforeOpen?: () => Promise<void>): Promise<string>;
  birthFromPurse(source: string, nonce: string, name: string, stats: readonly [number, number, number], beforeOpen?: () => Promise<void>): Promise<string>;
  birthFromWallet(name: string, stats: readonly [number, number, number], beforeOpen?: () => Promise<void>): Promise<string>;
  approveBirthTokens(): Promise<string>;
  expire(requestId: string, beforeOpen?: () => Promise<void>): Promise<string>;
  balance(): Promise<bigint>; tokenBalance(): Promise<bigint>; tokenAllowance(): Promise<bigint>;
  wait(hash: string, intent?: GameSubmissionIntent): Promise<GameReceipt>;
  retryOriginal?(intent: GameSubmissionIntent, beforeOpen?: () => Promise<void>): Promise<{ hash?: string; receipt?: GameReceipt; expired?: boolean }>;
}

export function createGameReader(config: GamePublicConfig) {
  if (isNearWorld(config)) {
    const reader = createNearChainReader(config);
    return { balance: reader.balance, wait: async (hash: string, intent?: GameSubmissionIntent): Promise<GameReceipt> => {
      if (!isNearIntent(intent)) throw new NearWalletError('uncertain', 'Choose the original NEAR transaction.');
      return reader.wait(hash, intent);
    } };
  }
  const reader = createV2ChainReader(config);
  return { balance: (account: string) => reader.balance(account as Address), wait: async (hash: string): Promise<GameReceipt> => {
    const receipt = await reader.wait(hash as Hex); return { kind: 'evm', transactionHash: receipt.transactionHash, receipt };
  } };
}

export async function connectGameWallet(choice: { kind: 'evm'; provider: EIP1193Provider } | { kind: 'near'; id: string }, config: GamePublicConfig, onIntent: (intent: GameSubmissionIntent) => void): Promise<GameWallet> {
  if (isNearWorld(config)) {
    if (choice.kind !== 'near') throw new NearWalletError('network', 'Choose a NEAR Testnet wallet.');
    const wallet = await connectNearWallet(choice.id, config, onIntent);
    return { ...wallet, world: config,
      connectionValid: async () => { try { return (await wallet.provider.getAccounts({ network: 'testnet' })).some(a => a.accountId === wallet.account); } catch { return false; } },
      signLogin: (challenge, beforeOpen) => { if (!('nonce' in challenge)) throw new NearWalletError('session', 'Verify your NEAR wallet again.'); return wallet.signLogin(challenge, beforeOpen); },
      accept: (quote, beforeOpen) => { if (!isNearWorld(quote) || !sameWorld(quote, config)) throw new NearWalletError('context', 'Choose this NEAR home.'); return wallet.accept(quote, beforeOpen); },
      wait: (hash, intent) => { if (!isNearIntent(intent)) throw new NearWalletError('uncertain', 'Choose the original NEAR transaction.'); return wallet.wait(hash, intent); },
      retryOriginal: (intent, beforeOpen) => { if (!isNearIntent(intent)) throw new NearWalletError('context', 'Choose the original NEAR transaction.'); return wallet.retryOriginal(intent, beforeOpen); },
    };
  }
  if (choice.kind !== 'evm') throw new NearWalletError('network', 'Choose a Robinhood Testnet wallet.');
  const wallet = await connectV2Wallet(choice.provider, config, onIntent);
  return { ...wallet, kind: 'evm', world: config, requiresBirthApproval: true,
    connectionValid: async () => { try { const [accounts, chain] = await Promise.all([choice.provider.request({ method: 'eth_accounts' }), choice.provider.request({ method: 'eth_chainId' })]); return Array.isArray(accounts) && typeof accounts[0] === 'string' && accounts[0].toLowerCase() === wallet.account.toLowerCase() && Number(chain) === config.chainId; } catch { return false; } },
    signLogin: challenge => { if ('nonce' in challenge) throw new NearWalletError('session', 'Verify your wallet again.'); return wallet.signMessage(challenge.message); },
    accept: quote => { if (isNearWorld(quote)) throw new NearWalletError('context', 'Choose this Robinhood home.'); return wallet.accept(quote); },
    expire: requestId => wallet.expire(requestId as Hex),
    wait: async hash => { const receipt = await wallet.wait(hash as Hex); return { kind: 'evm', transactionHash: receipt.transactionHash, receipt }; },
  };
}

export function mintedGameId(receipt: GameReceipt, config: GamePublicConfig, owner?: string): string | undefined {
  if (receipt.kind === 'near') return isNearWorld(config) ? receipt.tokenId : undefined;
  return !isNearWorld(config) ? mintedId(receipt.receipt, config, owner as Address | undefined)?.toString() : undefined;
}

export async function resolveGameSubmission(config: GamePublicConfig, intent: GameSubmissionIntent, cursor?: string): Promise<{ hash?: string; matched?: boolean; nextBlock?: string; receipt?: GameReceipt; expired?: boolean }> {
  if (isNearWorld(config)) {
    if (!isNearIntent(intent)) throw new NearWalletError('context', 'Choose the original NEAR transaction.');
    return resolveNearSubmission(config, intent);
  }
  if (isNearIntent(intent)) throw new NearWalletError('context', 'Choose the original Robinhood transaction.');
  return resolveV2Submission(config, intent, cursor);
}

export function intentWorld(intent: GameSubmissionIntent): GameWorld { return isNearIntent(intent) ? { networkId: 'near-testnet', collection: intent.collection } : { chainId: intent.chainId, collection: intent.collection }; }
