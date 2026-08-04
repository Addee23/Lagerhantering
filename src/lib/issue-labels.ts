// Delad mellan leveranssidan (Fas 5/6) och reklamationsflödet (Fas 9) - båda
// visar samma avvikelsetyper, och AI-mejlutkastet behöver samma svenska
// text istället för det råa enum-värdet.
export const ISSUE_TYPE_LABELS: Record<string, string> = {
  SAKNAS_HELT: "Produkten saknas helt",
  FARRE_MOTTAGNA: "Färre mottagna än dokumenterat",
  FLER_MOTTAGNA: "Fler mottagna än dokumenterat",
  EJ_PA_FAKTURA: "Levererad men inte på fakturan",
  FEL_PRODUKT: "Fel produkt levererad",
  SKADAD: "Skadad vara",
  KORT_BAST_FORE: "För kort bäst före-datum",
  FELAKTIGT_PRIS: "Felaktigt pris/fakturaavvikelse",
  ANNAN: "Annan avvikelse",
};
