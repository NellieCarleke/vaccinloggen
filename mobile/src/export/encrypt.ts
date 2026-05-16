// Symmetrisk kryptering av export-payload med tweetnacl secretbox
// (XSalsa20-Poly1305). Nyckelhärledning: SHA-512 kedjad N gånger över
// (lösenord || salt). Inte Argon2id, men bättre än ingenting och fullt
// kompatibelt med ren JavaScript.
//
// Filformat (alla fält JSON-encoded i ett objekt):
//   {
//     "v": 1,                 // format version
//     "kdf": "sha512-chain",
//     "iters": 50000,
//     "salt": base64,
//     "nonce": base64,
//     "data": base64          // ciphertext + auth tag
//   }
//
// Sätter vi v=2 senare med Argon2id kan importören välja rätt KDF utifrån "kdf".

import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

export const ENVELOPE_VERSION = 1;
export const KDF_NAME = "sha512-chain";
export const KDF_ITERATIONS = 50_000;

const SECRETBOX_KEY_LEN = 32;

export interface CipherEnvelope {
  v: number;
  kdf: string;
  iters: number;
  salt: string;
  nonce: string;
  data: string;
}

export async function encryptToString(
  plaintext: string,
  password: string,
): Promise<string> {
  const salt = nacl.randomBytes(16);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const key = await deriveKey(password, salt, KDF_ITERATIONS);
  const message = naclUtil.decodeUTF8(plaintext);
  const ciphertext = nacl.secretbox(message, nonce, key);
  const env: CipherEnvelope = {
    v: ENVELOPE_VERSION,
    kdf: KDF_NAME,
    iters: KDF_ITERATIONS,
    salt: naclUtil.encodeBase64(salt),
    nonce: naclUtil.encodeBase64(nonce),
    data: naclUtil.encodeBase64(ciphertext),
  };
  return JSON.stringify(env);
}

export async function decryptFromString(
  envelope: string,
  password: string,
): Promise<string> {
  const env: CipherEnvelope = JSON.parse(envelope);
  if (env.v !== ENVELOPE_VERSION) {
    throw new Error(`Okänd filversion: ${env.v}`);
  }
  if (env.kdf !== KDF_NAME) {
    throw new Error(`Okänd nyckelhärledning: ${env.kdf}`);
  }
  const salt = naclUtil.decodeBase64(env.salt);
  const nonce = naclUtil.decodeBase64(env.nonce);
  const ciphertext = naclUtil.decodeBase64(env.data);
  const key = await deriveKey(password, salt, env.iters);
  const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
  if (!plaintext) {
    throw new Error("Fel lösenord eller skadad fil");
  }
  return naclUtil.encodeUTF8(plaintext);
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  // Initial: SHA-512(password || salt)
  let block = concat(naclUtil.decodeUTF8(password), salt);
  block = nacl.hash(block); // 64-byte SHA-512

  // Iterate: hash(block) chained iterations-1 times. Slow on purpose.
  for (let i = 1; i < iterations; i++) {
    block = nacl.hash(block);
  }
  return block.slice(0, SECRETBOX_KEY_LEN);
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/**
 * 6-word passphrase, BIP39-ish from a small Swedish-friendly word list. Not
 * BIP39 itself (different list), but easy to type and read aloud.
 */
export function generatePassphrase(): string {
  const words = [
    "alm", "berg", "ek", "fjäll", "gran", "hav", "is", "ko",
    "lo", "mås", "näs", "orm", "päron", "räv", "sjö", "tall",
    "ulv", "viol", "yxa", "ås", "äng", "öst", "moln", "sten",
    "skog", "sand", "snö", "regn", "sol", "vind", "fisk", "blom",
    "ren", "älg", "lax", "hjul", "stig", "dal", "ö", "ström",
    "hus", "by", "stad", "väg", "bro", "torg", "eld", "rök",
  ];
  const random = nacl.randomBytes(6);
  return Array.from(random)
    .map((b) => words[b % words.length])
    .join("-");
}
