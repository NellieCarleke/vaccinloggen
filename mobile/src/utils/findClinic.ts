// "Hitta klinik" — länkar ut till externa sökverktyg.
//
// Strategi:
//   - Barnvaccinationsprogrammet (BVC, skola) → 1177 vårdgivarsök.
//     BVC bokas inte via Google Maps, det görs via barnets ordinarie BVC.
//   - Vuxen / resevaccin → Google Maps med vettiga sökord. Maps är bättre på
//     öppettider, recensioner, exakta adresser.
//
// Vi äger ingen klinikdata och tar inget ansvar för att den vi länkar ut till
// är korrekt — användaren ser riktiga, levande resultat på källsidan.

import * as WebBrowser from "expo-web-browser";
import { type ReasonKey } from "../schedules/child-program";

const URL_1177_HITTA_VARD = "https://www.1177.se/hitta-vard/";
const MAPS_VACCINATION = "https://www.google.com/maps/search/?api=1&query=vaccinationsmottagning";
const MAPS_TRAVEL_CLINIC = "https://www.google.com/maps/search/?api=1&query=resemedicinsk+klinik";

export function findClinicUrlFor(reason: ReasonKey): string {
  switch (reason) {
    case "barnprogram-bvc":
    case "barnprogram-skola":
      return URL_1177_HITTA_VARD;
    case "tbe-series":
    case "tbe-booster":
    case "tetanus-booster":
    case "flu-season":
    case "covid-season":
    case "adult-other":
      return MAPS_VACCINATION;
  }
}

export const findTravelClinicUrl = MAPS_TRAVEL_CLINIC;

export async function openFindClinic(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    /* graceful no-op if browser fails */
  }
}
