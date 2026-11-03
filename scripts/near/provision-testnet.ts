import { PublicKey } from 'near-api-js';
import { nearWalletMetadata } from './local-wallet';
import { actions, executeNearOperation, nativeOperationInfo, operatorRpc } from './operator';

const owner = nearWalletMetadata('owner');
const plan = [
  { role: 'contract' as const, ...nearWalletMetadata('contract'), amount: 5500000000000000000000000n },
  { role: 'relay' as const, ...nearWalletMetadata('relay'), amount: 750000000000000000000000n },
];
if (!process.argv.includes('--broadcast')) {
  console.log(JSON.stringify({ mode: 'dry-run', owner: owner.accountId, plan: plan.map(entry => ({ accountId: entry.accountId, publicKey: entry.publicKey, fundingYoctoNEAR: entry.amount.toString() })), signing: false }));
} else {
  if (!process.argv.includes('--gate=native-testnet-integration')) throw new Error('An exact native testnet provisioning gate is required.');
  process.env.NEARLYHUMAN_NEAR_QA_WALLET = '1';
  const status = await operatorRpc<{ chain_id: string }>('status', []); if (status.chain_id !== 'testnet') throw new Error('Testnet only.');
  for (const entry of plan) {
    const id = `create-${entry.role}-v1`, previous = await nativeOperationInfo(id);
    let exists = false;
    try { await operatorRpc('query', { request_type: 'view_account', finality: 'final', account_id: entry.accountId }); exists = true; }
    catch (error) { if ((error as { rpcCode?: string }).rpcCode !== 'UNKNOWN_ACCOUNT') throw error; }
    if (!exists || previous) {
      if (!previous) {
        const balance = await operatorRpc<{ amount: string }>('query', { request_type: 'view_account', finality: 'final', account_id: owner.accountId });
        if (BigInt(balance.amount) < entry.amount + 1500000000000000000000000n) throw new Error('Keep the developer account funded before creating the native service account.');
      }
      const result = await executeNearOperation({ id, role: 'owner', receiver: entry.accountId, actions: [actions.createAccount(), actions.transfer(entry.amount), actions.addFullAccessKey(PublicKey.fromString(entry.publicKey))] });
      console.log(JSON.stringify({ accountId: entry.accountId, creationHash: result.hash, confirmed: true }));
    }
    const keys = await operatorRpc<{ keys: Array<{ public_key: string; access_key: { permission: unknown } }> }>('query', { request_type: 'view_access_key_list', finality: 'final', account_id: entry.accountId });
    if (!keys.keys.some(value => value.public_key === entry.publicKey && value.access_key.permission === 'FullAccess')) throw new Error('The native service account key does not match the protected role.');
    console.log(JSON.stringify({ accountId: entry.accountId, publicKey: entry.publicKey, authorityVerified: true }));
  }
}
