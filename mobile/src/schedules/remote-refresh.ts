// Remote refresh för svenska vaccinationsscheman.
//
// Bakgrund: scheman (barnvaccinationsprogrammet + giltighetsregler) levereras
// inbäddade i appen från Folkhälsomyndigheten. När myndigheten ändrar något
// kan vi annars uppdatera först via App Store-release. Med remote refresh:
//
//   1. Vid app-start (max 1×/dag) hämtas en signerad JSON-fil från en CDN.
//   2. Om filens version > inbäddad → cacha lokalt i app-sandbox.
//   3. Vid nästa app-start, applicera cacheade scheman före övrig kod kör.
//
// V1-säkerhet: HTTPS-only. Signaturverifiering (Ed25519) är planerad enligt
// PLAN.md §5b men inte implementerad ännu — markeras som TODO här. Det
// betyder: en angripare som kontrollerar CDN:en eller DNS kan injicera
// godtyckliga schemavärden. Ok i development; fixa innan produktion.

import * as FileSystem from "expo-file-system/legacy";
import { dayjs } from "../utils/dates";
import {
  setChildProgram,
  type ExpectedDoseSpec,
} from "./child-program";
import {
  setValidityRules,
  type ValidityRule,
} from "./validity";

const CACHE_FILE = `${FileSystem.documentDirectory}schedules-cache.json`;
const LAST_FETCH_KEY = `${FileSystem.documentDirectory}schedules-last-fetch.json`;
const FETCH_TIMEOUT_MS = 5000;
const MIN_FETCH_INTERVAL_HOURS = 24;

/**
 * Default CDN url. Statisk JSON-fil på t.ex. Cloudflare Pages eller GitHub
 * Pages. Override:as inte i appen idag (hardkodat tills produktions-CDN
 * existerar).
 */
const DEFAULT_REMOTE_URL =
  "https://nelliecarleke.github.io/vaccinloggen/data/schedules/v1.json";

export interface RemoteSchedulePayload {
  /** ISO-datum (YYYY-MM-DD) — när filen senast uppdaterades. */
  version: string;
  /** Vem som anses källan, visas i UI. */
  source: string;
  childProgram: ExpectedDoseSpec[];
  validityRules: Record<string, ValidityRule>;
}

export interface ActiveScheduleInfo {
  version: string;
  source: string;
  /** Var den nuvarande versionen kommer från. */
  origin: "bundled" | "cached" | "remote";
  /** När appen senast försökte hämta en uppdatering (ms epoch). */
  lastFetchAttempt: number | null;
}

/**
 * Inbäddad fallback-info, används om cache saknas. Datumet
 * bumpas manuellt när vi rör schemafilerna.
 */
const BUNDLED_VERSION = "2026-05-16";
const BUNDLED_SOURCE = "Folkhälsomyndigheten (inbäddad)";

let _active: ActiveScheduleInfo = {
  version: BUNDLED_VERSION,
  source: BUNDLED_SOURCE,
  origin: "bundled",
  lastFetchAttempt: null,
};

export function getActiveScheduleInfo(): ActiveScheduleInfo {
  return _active;
}

/**
 * Anropas EN gång vid app-start, innan derive/historical-doses kör.
 * - Läser cacheade scheman från disk (synkront blockande är ok här, körs
 *   före any UI render).
 * - Om cache är nyare än inbäddad version → applicera.
 * - Skickar i bakgrunden en fetch mot CDN för nästa starts cache.
 *
 * Returnerar när cache är applicerad. Bakgrundsfetch await:as INTE.
 */
export async function bootstrapSchedules(options?: {
  remoteUrl?: string;
  now?: Date;
}): Promise<ActiveScheduleInfo> {
  const url = options?.remoteUrl ?? DEFAULT_REMOTE_URL;
  const now = options?.now ?? new Date();

  // Steg 1: applicera ev. cacheade scheman
  try {
    const cached = await readCache();
    if (cached && isNewer(cached.version, _active.version)) {
      setChildProgram(cached.childProgram);
      setValidityRules(cached.validityRules);
      _active = {
        version: cached.version,
        source: cached.source,
        origin: "cached",
        lastFetchAttempt: _active.lastFetchAttempt,
      };
    }
  } catch {
    // Felaktig cache — ignorera, fortsätt med inbäddat
  }

  // Steg 2: ev. försök hämta uppdaterad version i bakgrunden
  const shouldFetch = await shouldAttemptFetch(now);
  if (shouldFetch) {
    // Vänta INTE — kör tyst i bakgrunden. Nästa app-start applicerar.
    void backgroundFetch(url, now);
  }

  return _active;
}

async function backgroundFetch(url: string, now: Date): Promise<void> {
  try {
    const payload = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!isValidPayload(payload)) return;
    // TODO: verifiera signatur här innan vi sparar (PLAN §5b)
    await writeCache(payload);
    // Räkna bara lyckade hämtningar mot 24h-cooldown. En 404 ska inte
    // blockera nästa försök i ett dygn — vi vill snabbt återhämta oss
    // efter en omkonfigurerad CDN-URL.
    await recordFetchAttempt(now);
  } catch {
    // Nätverksfel / parse-fel / timeout — tyst.
  }
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function isValidPayload(raw: unknown): raw is RemoteSchedulePayload {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Partial<RemoteSchedulePayload>;
  if (typeof o.version !== "string") return false;
  if (typeof o.source !== "string") return false;
  if (!Array.isArray(o.childProgram)) return false;
  if (!o.validityRules || typeof o.validityRules !== "object") return false;
  // Lättviktig sanity-check: alla childProgram-poster ska ha code+dose+trigger
  for (const spec of o.childProgram) {
    if (!spec || typeof spec !== "object") return false;
    if (typeof (spec as ExpectedDoseSpec).code !== "string") return false;
    if (typeof (spec as ExpectedDoseSpec).dose !== "number") return false;
    if (!(spec as ExpectedDoseSpec).trigger) return false;
  }
  return true;
}

function isNewer(candidate: string, current: string): boolean {
  // ISO-datum sorterar lexikografiskt — räcker för YYYY-MM-DD.
  return candidate > current;
}

async function readCache(): Promise<RemoteSchedulePayload | null> {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_FILE);
    if (!info.exists) return null;
    const text = await FileSystem.readAsStringAsync(CACHE_FILE);
    const parsed: unknown = JSON.parse(text);
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCache(payload: RemoteSchedulePayload): Promise<void> {
  await FileSystem.writeAsStringAsync(CACHE_FILE, JSON.stringify(payload));
}

async function recordFetchAttempt(now: Date): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(
      LAST_FETCH_KEY,
      JSON.stringify({ timestamp: now.getTime() }),
    );
    _active = { ..._active, lastFetchAttempt: now.getTime() };
  } catch {
    // ignore
  }
}

async function shouldAttemptFetch(now: Date): Promise<boolean> {
  // Ingen cache → försök varje start tills vi får något. Cooldown gäller
  // bara EFTER att vi lyckats hämta en gång.
  try {
    const cacheInfo = await FileSystem.getInfoAsync(CACHE_FILE);
    if (!cacheInfo.exists) return true;
  } catch {
    return true;
  }
  try {
    const info = await FileSystem.getInfoAsync(LAST_FETCH_KEY);
    if (!info.exists) return true;
    const text = await FileSystem.readAsStringAsync(LAST_FETCH_KEY);
    const parsed = JSON.parse(text) as { timestamp?: number };
    if (typeof parsed.timestamp !== "number") return true;
    _active = { ..._active, lastFetchAttempt: parsed.timestamp };
    const hoursSince = dayjs(now).diff(dayjs(parsed.timestamp), "hour");
    return hoursSince >= MIN_FETCH_INTERVAL_HOURS;
  } catch {
    return true;
  }
}
