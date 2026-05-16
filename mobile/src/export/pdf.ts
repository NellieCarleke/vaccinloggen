// Generates a printable PDF "vaccinationskort" for a single profile via
// expo-print (HTML → PDF) and shares it through the native share sheet.

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { type Profile } from "../db/profiles";
import { type Vaccination } from "../db/vaccinations";
import { vaccineLabel } from "../schedules/vaccines";
import { formatDateLong } from "../utils/dates";

interface BuildArgs {
  profile: Profile;
  vaccinations: Vaccination[];
}

export async function exportProfilePdf({
  profile,
  vaccinations,
}: BuildArgs): Promise<void> {
  const html = renderHtml({ profile, vaccinations });
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Vaccinationskort — ${profile.name}`,
      UTI: "com.adobe.pdf",
    });
  }
}

function renderHtml({ profile, vaccinations }: BuildArgs): string {
  const own = vaccinations
    .filter((v) => v.profileId === profile.id)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const rows = own
    .map(
      (v) => `
        <tr>
          <td>${escape(v.date)}</td>
          <td>${escape(
            v.vaccineCode === "OTHER" && v.vaccineLabel
              ? v.vaccineLabel
              : vaccineLabel(v.vaccineCode, v.vaccineLabel),
          )}</td>
          <td>${v.doseNumber != null ? `Dos ${v.doseNumber}` : ""}</td>
          <td>${escape(v.brand ?? "")}</td>
          <td>${escape(v.provider ?? "")}</td>
          <td>${escape(v.batch ?? "")}</td>
        </tr>
      `,
    )
    .join("");

  const today = formatDateLong(new Date());

  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<title>Vaccinationskort — ${escape(profile.name)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0F1B1A; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0E7C7B; padding-bottom: 12px; margin-bottom: 24px; }
  header h1 { margin: 0; font-size: 28px; color: #0E7C7B; }
  header .meta { text-align: right; color: #6B7280; font-size: 12px; }
  .profile { background: #FAFAF7; border-left: 4px solid #F4D35E; padding: 12px 16px; margin-bottom: 20px; }
  .profile h2 { margin: 0 0 4px 0; font-size: 22px; }
  .profile p { margin: 0; color: #4A4A45; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #E8E8E2; vertical-align: top; }
  th { background: #FAFAF7; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #4A4A45; }
  tr:nth-child(even) td { background: #FAFAF7; }
  footer { margin-top: 32px; font-size: 10px; color: #8A8A82; border-top: 1px solid #E8E8E2; padding-top: 12px; }
  .empty { padding: 24px; text-align: center; color: #8A8A82; font-style: italic; }
</style>
</head>
<body>
  <header>
    <h1>Vaccinationskort</h1>
    <div class="meta">
      Genererad ${escape(today)}<br />
      Vaccinloggen
    </div>
  </header>

  <div class="profile">
    <h2>${escape(profile.name)}</h2>
    <p>Född ${escape(formatDateLong(profile.birthdate))}</p>
  </div>

  ${
    own.length > 0
      ? `<table>
          <thead>
            <tr>
              <th style="width: 90px;">Datum</th>
              <th>Vaccin</th>
              <th style="width: 60px;">Dos</th>
              <th style="width: 100px;">Fabrikat</th>
              <th style="width: 130px;">Vårdgivare</th>
              <th style="width: 80px;">Batch</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`
      : `<div class="empty">Inga registrerade vaccinationer än.</div>`
  }

  <footer>
    Vaccinloggen är inte en medicinsk journal. Detta dokument är en sammanställning av användarens egna noteringar och ersätter inte officiell dokumentation från vården.
  </footer>
</body>
</html>`;
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
