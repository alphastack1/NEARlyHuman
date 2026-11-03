import type { NearOwnerQuote } from './game-types';

/** Exact UTF-8 domain accepted by the native contract's Ed25519 verifier. */
export function nearAdmissionMessage(collection: string, admission: NearOwnerQuote['admission']): string {
  return ['NEARLYHUMAN_DAY_V2', 'near-testnet', collection, admission.id, admission.player, admission.tokenId,
    String(admission.baseRevision), admission.kitMask, admission.shipping ? '1' : '0', admission.processingFee,
    String(admission.multiplier), admission.expiresAt, admission.decisionConfig].join('\n');
}
