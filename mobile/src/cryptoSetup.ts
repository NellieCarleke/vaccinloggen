// Seed tweetnacl:s interna PRNG med expo-crypto:s säkra slumpkälla.
//
// tweetnacl letar efter window.crypto.getRandomValues vid första anropet av
// nacl.randomBytes(). Hermes (RN:s default-engine i 0.81+) saknar den globalen
// i Release-builds, vilket gör att nacl.randomBytes() kastar — t.ex. när
// share-skärmen anropar generatePassphrase() i useState-initialisatorn.
//
// Importera den här filen EN gång, ovanför alla andra imports som kan röra
// tweetnacl, så är all nacl-användning säker.

import nacl from "tweetnacl";
import * as Crypto from "expo-crypto";

nacl.setPRNG((x, n) => {
  const bytes = Crypto.getRandomBytes(n);
  for (let i = 0; i < n; i++) x[i] = bytes[i];
});
