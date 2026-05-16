import * as Crypto from "expo-crypto";

// Lightweight UUID v4 using expo-crypto's secure RNG.
// Avoids pulling in the uuid package's getRandomValues polyfill on RN.
export function uuid(): string {
  return Crypto.randomUUID();
}
