import { runtimeEnv } from './runtime-env';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function encryptionKey(): Promise<CryptoKey> {
  const encoded = runtimeEnv().MERCADO_LIVRE_TOKEN_ENCRYPTION_KEY;
  if (!encoded) throw new Error('Chave de criptografia da integração não configurada.');
  const keyBytes = base64ToBytes(encoded);
  if (keyBytes.byteLength !== 32) throw new Error('A chave de criptografia deve possuir 32 bytes.');
  return crypto.subtle.importKey('raw', toArrayBuffer(keyBytes), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptToken(value: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    await encryptionKey(),
    toArrayBuffer(new TextEncoder().encode(value)),
  );
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptToken(value: string): Promise<string> {
  const [ivValue, encryptedValue] = value.split('.');
  if (!ivValue || !encryptedValue) throw new Error('Token criptografado inválido.');
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(ivValue)) },
    await encryptionKey(),
    toArrayBuffer(base64ToBytes(encryptedValue)),
  );
  return new TextDecoder().decode(decrypted);
}
