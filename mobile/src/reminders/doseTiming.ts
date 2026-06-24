// Presentation av tidsangivelser för förväntade doser. Pure funktion så
// strängarna kan testas utan att rendera UI.

import { type ExpectedDose } from "./derive";
import { formatDateLong } from "../utils/dates";
import { t } from "../i18n/sv";

export function formatRelative(days: number): string {
  if (days < -1) return t("expected.overdueDays").replace("{n}", String(-days));
  if (days === -1) return t("expected.overdueOne");
  if (days === 0) return t("expected.today");
  if (days === 1) return t("expected.tomorrow");
  if (days < 14) return t("expected.inDays").replace("{n}", String(days));
  if (days < 90)
    return t("expected.inWeeks").replace("{n}", String(Math.round(days / 7)));
  return t("expected.inMonths").replace("{n}", String(Math.round(days / 30)));
}

/**
 * Tre fönster för doser med spacing-data:
 *   före MIN     → "Kan tas från {datum}"
 *   MIN ≤ x ≤ MAX → "Kan tas nu — deadline {datum}"
 *   efter MAX    → "{n} dagar försenat · {datum}"
 *
 * Doser utan availableFrom (booster-doser m.fl.) faller tillbaka på den
 * gamla "Om N dagar · {datum}"-formuleringen.
 */
export function formatTiming(dose: ExpectedDose): string {
  if (dose.status === "overdue") {
    return `${formatRelative(dose.daysUntilDue)} · ${formatDateLong(dose.dueDate)}`;
  }
  if (!dose.availableFrom) {
    return `${formatRelative(dose.daysUntilDue)} · ${formatDateLong(dose.dueDate)}`;
  }
  if (dose.status === "soon") {
    return `Kan tas nu — deadline ${formatDateLong(dose.dueDate)}`;
  }
  return `Kan tas från ${formatDateLong(dose.availableFrom)}`;
}
