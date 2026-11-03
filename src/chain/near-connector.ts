import type { DataStorage, NearConnector, NearWalletBase } from '@hot-labs/near-connect';
import type { NearSignChallenge, NearSignedMessage } from './game-types';
import { nearAccountId, nearUnbase64, NearWalletError } from './near-rpc';

/** Loaded only when a player chooses the native NEAR world. The connector is
 * fixed to testnet and never requests a function-call key during connection. */
let connectorPromise: Promise<NearConnector> | undefined;
const memory = new Map<string, string>();
const storage: DataStorage = {
  async get(key) {
    if (key === 'debug-wallets') return null;
    try { return localStorage.getItem(`nh:near-connect:testnet:${key}`) ?? memory.get(key) ?? null; } catch { return memory.get(key) ?? null; }
  },
  async set(key, value) { if (key === 'debug-wallets') return; memory.set(key, value); try { localStorage.setItem(`nh:near-connect:testnet:${key}`, value); } catch { /* Connection remains usable for this visit. */ } },
  async remove(key) { memory.delete(key); try { localStorage.removeItem(`nh:near-connect:testnet:${key}`); } catch { /* No financial journal is touched. */ } },
};

export async function nearConnector(): Promise<NearConnector> {
  connectorPromise ||= import('@hot-labs/near-connect').then(({ NearConnector }) => new NearConnector({
    network: 'testnet', autoConnect: false, storage,
    features: { signMessage: true, signInWithoutAddKey: true, signAndSendTransaction: true, testnet: true },
    providers: { testnet: ['https://test.rpc.fastnear.com', 'https://rpc.testnet.near.org'] }, footerBranding: null,
  })).catch(error => { connectorPromise = undefined; throw new NearWalletError('connection', 'Opening your NEAR wallet. Try again.', { cause: error }); });
  const connector = await connectorPromise;
  await connector.whenManifestLoaded;
  if (connector.network !== 'testnet') throw new NearWalletError('network', 'Choose NEAR Testnet.');
  return connector;
}

export interface NearWalletChoice { kind: 'near'; id: string; name: string }
export async function nearWalletChoices(): Promise<NearWalletChoice[]> {
  const connector = await nearConnector();
  // Registration follows the manifest promise in the SDK's own callback.
  await Promise.resolve();
  return connector.availableWallets.filter(wallet => !wallet.manifest.debug).map(wallet => ({ kind: 'near' as const, id: wallet.manifest.id, name: wallet.manifest.name }))
    .sort((a, b) => Number(!/meteor/i.test(a.name)) - Number(!/meteor/i.test(b.name)) || a.name.localeCompare(b.name));
}

export function explicitlyRejectedNear(error: unknown): boolean {
  let current = error as { code?: unknown; cause?: unknown } | undefined;
  for (let i = 0; current && i < 8; i++, current = current.cause as typeof current) {
    if (current.code === 4001 || current.code === 'USER_REJECTED' || current.code === 'ACTION_REJECTED') return true;
  }
  return false;
}

export async function connectNearProvider(walletId: string): Promise<{ provider: NearWalletBase; account: string; connector: NearConnector }> {
  const connector = await nearConnector();
  if (!connector.availableWallets.some(wallet => wallet.manifest.id === walletId && !wallet.manifest.debug)) throw new NearWalletError('wallet', 'Choose a NEAR Testnet wallet.');
  let provider: NearWalletBase, selected: string | undefined;
  const selectedAccount = (event: { wallet: NearWalletBase; accounts: { accountId: string }[]; success: boolean }) => { if (event.success && event.wallet.manifest.id === walletId) selected = event.accounts[0]?.accountId; };
  connector.on('wallet:signIn', selectedAccount);
  try { provider = await connector.connect({ walletId }); }
  catch (error) { if (explicitlyRejectedNear(error)) throw new NearWalletError('ACTION_REJECTED', 'No problem. Nothing was sent.'); throw new NearWalletError('wallet', 'The wallet did not connect. Try again.', { cause: error }); }
  finally { connector.off('wallet:signIn', selectedAccount); }
  const accounts = await provider.getAccounts({ network: 'testnet' });
  // Meteor can return more than one connected account here. The actual sign-in
  // result identifies the chosen account; array order is not that selection.
  const account = selected || (accounts.length === 1 ? accounts[0]?.accountId : undefined);
  if (!nearAccountId(account) || !accounts.some(a => a.accountId === account)) throw new NearWalletError('wallet', 'Choose your NEAR Testnet account.');
  return { provider, account, connector };
}

export async function assertNearSigner(provider: NearWalletBase, account: string): Promise<void> {
  const accounts = await provider.getAccounts({ network: 'testnet' });
  if (!accounts.some(a => a.accountId === account)) throw new NearWalletError('wallet', 'Your NEAR account changed. Connect it again.');
}

export async function signNearLogin(provider: NearWalletBase, account: string, challenge: NearSignChallenge, beforeOpen?: () => Promise<void>): Promise<NearSignedMessage> {
  await assertNearSigner(provider, account);
  if (!challenge || !/^[a-zA-Z0-9_-]{16,128}$/.test(challenge.id) || typeof challenge.message !== 'string' || challenge.message.length > 2000
    || challenge.recipient !== location.host || challenge.callbackUrl !== undefined) throw new NearWalletError('session', 'Open NEARlyHuman again to verify your wallet.');
  let result: NearSignedMessage;
  const nonce = nearUnbase64(challenge.nonce, 32);
  await beforeOpen?.();
  try { result = await provider.signMessage({ message: challenge.message, recipient: challenge.recipient, nonce, network: 'testnet', signerId: account }); }
  catch (error) { if (explicitlyRejectedNear(error)) throw new NearWalletError('ACTION_REJECTED', 'No problem. Nothing was sent.'); throw new NearWalletError('session', 'Wallet verification did not finish. Try again.', { cause: error }); }
  await assertNearSigner(provider, account);
  if (result.accountId !== account || !/^ed25519:[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(result.publicKey)) throw new NearWalletError('session', 'Choose the same NEAR account to verify.');
  nearUnbase64(result.signature, 64);
  return result;
}

export async function disconnectNearProvider(provider: NearWalletBase): Promise<void> { const connector = await nearConnector(); await connector.disconnect(provider); }

export async function onNearWalletChange(callback: () => void): Promise<() => void> {
  const connector = await nearConnector();
  connector.on('wallet:signOut', callback);
  return () => connector.off('wallet:signOut', callback);
}
