#!/usr/bin/env node
// Daily check for changes in the official sources that drive Vaccinloggen's
// schedules. Run by .github/workflows/check-source-changes.yml.
//
// Strategy: fetch each URL, strip transient/boilerplate HTML, hash the rest,
// compare to the previous run's hashes. If anything changed, write the new
// hashes (so we don't keep alerting on the same change) and emit a JSON
// summary to GITHUB_OUTPUT so the workflow can open a GitHub issue.
//
// Intentionally tolerant: false positives are acceptable (close the issue),
// false negatives are not (medical accuracy).

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { appendFile } from "node:fs/promises";

const SOURCES_FILE = "data/sources.json";
const HASHES_FILE = "data/source-hashes.json";
const USER_AGENT =
  "Vaccinloggen schedule monitor (+https://github.com/NellieCarleke/vaccinloggen)";
const FETCH_TIMEOUT_MS = 15000;

async function main() {
  const sourcesRaw = JSON.parse(await readFile(SOURCES_FILE, "utf8"));
  const sources = sourcesRaw.sources ?? [];

  let previous = {};
  if (existsSync(HASHES_FILE)) {
    try {
      previous = JSON.parse(await readFile(HASHES_FILE, "utf8"));
    } catch {
      // corrupt file — treat as first run
    }
  }

  const next = {};
  const changes = [];
  const errors = [];

  for (const source of sources) {
    try {
      const text = await fetchAndStrip(source.url);
      const hash = sha256(text);
      next[source.id] = {
        hash,
        label: source.label,
        url: source.url,
        lastChecked: new Date().toISOString(),
      };
      const prev = previous[source.id];
      if (prev && prev.hash !== hash) {
        changes.push({
          id: source.id,
          label: source.label,
          url: source.url,
          oldHash: prev.hash.slice(0, 12),
          newHash: hash.slice(0, 12),
          previouslyChecked: prev.lastChecked,
        });
      }
    } catch (err) {
      errors.push({ id: source.id, url: source.url, error: String(err) });
      // Carry the old hash forward — we don't want a 24h Folkhälsomyndigheten
      // outage to make us forget what their content looked like.
      if (previous[source.id]) {
        next[source.id] = {
          ...previous[source.id],
          lastFetchError: String(err),
        };
      }
    }
  }

  await writeFile(HASHES_FILE, JSON.stringify(next, null, 2) + "\n", "utf8");

  // Anything to commit? (hashes changed, errors logged, OR first run that
  // generated the file from scratch)
  const fileChanged = changes.length > 0 || errors.length > 0 || Object.keys(previous).length === 0;

  console.log(`Sources checked: ${sources.length}`);
  console.log(`Content changes: ${changes.length}`);
  console.log(`Fetch errors:    ${errors.length}`);
  if (changes.length > 0) {
    for (const c of changes) {
      console.log(`  CHANGED: ${c.label} (${c.url})`);
    }
  }
  if (errors.length > 0) {
    for (const e of errors) {
      console.log(`  ERROR:   ${e.url} — ${e.error}`);
    }
  }

  await emitOutput("changed", changes.length > 0 ? "true" : "false");
  await emitOutput("file_changed", fileChanged ? "true" : "false");
  await emitOutput("changes", JSON.stringify(changes));
  await emitOutput("errors", JSON.stringify(errors));
}

async function fetchAndStrip(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let html;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.5" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }
  return stripBoilerplate(html);
}

function stripBoilerplate(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Strip CSRF tokens, session IDs, asset versioning etc. that change on
    // every request without reflecting content changes.
    .replace(/\b[a-f0-9]{32,}\b/gi, "")
    .replace(/\?v=\d+/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

async function emitOutput(name, value) {
  // Workflows read step outputs via $GITHUB_OUTPUT. Outside of CI we just log.
  if (!process.env.GITHUB_OUTPUT) {
    console.log(`[output] ${name}=${value}`);
    return;
  }
  // Multiline-safe via heredoc-style delimiter.
  const delim = `GHA_${Math.random().toString(36).slice(2)}`;
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `${name}<<${delim}\n${value}\n${delim}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
