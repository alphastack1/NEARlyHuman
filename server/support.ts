import type { Address, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { serverConfig } from './config';

export class ServiceError extends Error {
  constructor(message: string, public code = 'unavailable', public status = 400) { super(message); }
}
export function checkedAddress(value: unknown): Address {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) throw new ServiceError('Connect a wallet first.', 'wallet');
  return value as Address;
}
export function checkedRequest(value: unknown): Hex {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) throw new ServiceError('Please check this request again.', 'request');
  return value as Hex;
}
export function serviceAccount() {
  const key = serverConfig().relayKey;
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) throw new ServiceError('Preparation is resting. Try again shortly.', 'capacity', 503);
  return privateKeyToAccount(key);
}
