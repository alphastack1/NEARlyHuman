import { createHash, createPublicKey, verify } from 'node:crypto';
import {base58} from '@scure/base';
import { NearError } from './types';

export function base58Decode(value: string, expected?: number): Buffer {
  if (typeof value !== 'string' || !value.length || value.length > 128) throw new NearError('format', 'Check the wallet details.');
  let bytes:Buffer;try{bytes=Buffer.from(base58.decode(value));}catch{throw new NearError('format','Check the wallet details.');}
  if(expected!==undefined&&bytes.length!==expected)throw new NearError('format','Check the wallet details.');
  return bytes;
}
export function base58Encode(bytes: Uint8Array): string {
  return base58.encode(bytes);
}
export function base64Bytes(value: unknown, length?: number): Buffer {
  if(typeof value!=='string'||value.length>10000||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new NearError('format','Check the signed wallet message.',401);
  const bytes=Buffer.from(value,'base64');if(bytes.toString('base64')!==value||length!==undefined&&bytes.length!==length)throw new NearError('format','Check the signed wallet message.',401);return bytes;
}
export function borshInteger(value: bigint, size: number): Buffer {
  if(value<0n||value>=1n<<BigInt(size*8))throw new NearError('format','Check the transaction details.');
  const b=Buffer.alloc(size);for(let i=0;i<size;i++){b[i]=Number(value&255n);value>>=8n;}return b;
}
export const borshBytes=(value:Uint8Array)=>Buffer.concat([borshInteger(BigInt(value.length),4),Buffer.from(value)]);
export const borshString=(value:string)=>borshBytes(Buffer.from(value,'utf8'));
export const sha256=(value:Uint8Array)=>createHash('sha256').update(value).digest();
export function nearMessageDigest(input:{message:string;nonce:string;recipient:string;callbackUrl?:string}):Buffer {
  return sha256(Buffer.concat([borshInteger(2147484061n,4),borshString(input.message),base64Bytes(input.nonce,32),borshString(input.recipient),Buffer.from([input.callbackUrl===undefined?0:1]),...(input.callbackUrl===undefined?[]:[borshString(input.callbackUrl)])]));
}
export function ed25519PublicBytes(publicKey:string):Buffer {
  if(!publicKey.startsWith('ed25519:'))throw new NearError('signature','Choose an Ed25519 NEAR wallet.',401);return base58Decode(publicKey.slice(8),32);
}
export function verifyNearMessage(input:{message:string;nonce:string;recipient:string;callbackUrl?:string},publicKey:string,signature:string):boolean {
  const key=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),ed25519PublicBytes(publicKey)]),format:'der',type:'spki'});
  return verify(null,nearMessageDigest(input),key,base64Bytes(signature,64));
}
