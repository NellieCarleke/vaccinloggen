# Vaccinationsscheman — remote refresh

Den här mappen innehåller den JSON-fil som appen hämtar vid start för att se
om Folkhälsomyndigheten har uppdaterat barnvaccinationsprogrammet eller en
giltighetsregel sen senaste app-release. Filen serveras från en statisk CDN.

## URL appen letar på

```
https://vaccinloggen.github.io/schedules/v1.json
```

(definierad i `mobile/src/schedules/remote-refresh.ts`, kan ändras innan
första release om vi vill peka mot egen domän, t.ex. `vaccinloggen.se`).

## Så här uppdaterar du

1. Redigera bundled TypeScript-källan i `mobile/src/schedules/child-program.ts`
   eller `mobile/src/schedules/validity.ts`.
2. Uppdatera **också** `data/schedules/v1.json` för att hålla CDN-filen i synk.
   Testet i `mobile/tests/remote-refresh.test.ts` verifierar att de matchar.
3. Bumpa `version` i `v1.json` till dagens datum (YYYY-MM-DD).
4. Bumpa `BUNDLED_VERSION` i `mobile/src/schedules/remote-refresh.ts` till
   samma datum så att inbäddad och CDN matchar för nya app-installs.
5. Pusha till main. CI / manuell deploy publicerar `v1.json` till CDN:en.
6. Appar som öppnas inom 24h hämtar den nya versionen i bakgrunden och
   applicerar den vid nästa app-start.

## Säkerhet — gör innan produktion

V1 har **ingen signaturverifiering**. En angripare som kontrollerar CDN:en
eller DNS:en kan injicera godtyckliga vaccinrekommendationer. PLAN.md §5b
beskriver Ed25519-signatur:

- Privat nyckel sparas i password manager / 1Password.
- `v1.json.sig` genereras vid release tillsammans med `v1.json`.
- Appen hardcodar publik nyckel och verifierar signatur innan cache skrivs.

Lägg till detta i `remote-refresh.ts` (TODO-kommentaren finns där) innan
appen släpps på App Store / Play Store.
