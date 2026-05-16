import dayjs from "dayjs";
import "dayjs/locale/sv";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.locale("sv");

export { dayjs };

export function formatDate(iso: string | Date): string {
  return dayjs(iso).format("YYYY-MM-DD");
}

export function formatDateLong(iso: string | Date): string {
  return dayjs(iso).format("D MMMM YYYY");
}

export function ageInYears(birthdate: string | Date, today = new Date()): number {
  return dayjs(today).diff(dayjs(birthdate), "year");
}

export function ageInMonths(birthdate: string | Date, today = new Date()): number {
  return dayjs(today).diff(dayjs(birthdate), "month");
}

export function ageInWeeks(birthdate: string | Date, today = new Date()): number {
  return dayjs(today).diff(dayjs(birthdate), "week");
}

export function describeAge(birthdate: string | Date, today = new Date()): string {
  const months = ageInMonths(birthdate, today);
  if (months < 1) {
    const weeks = ageInWeeks(birthdate, today);
    return `${weeks} v`;
  }
  if (months < 24) return `${months} mån`;
  const years = ageInYears(birthdate, today);
  return `${years} år`;
}
