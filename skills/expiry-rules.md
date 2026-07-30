# Expiry (bäst före) rules

## Standardgränser
- Standardfilter på bäst före-översikten: produkter som går ut inom **30 dagar**.
- Standardgräns för "kort bäst före-datum" vid inleverans: **90 dagar (3 månader)** — kan senare
  göras konfigurerbar per kategori/produkt/leverantör, men 90 dagar är default.

## Filter på bäst före-listan
7 / 14 / 30 / 60 / 90 dagar, eget datumintervall, kategori, varumärke, leverantör, produkt,
butik eller lager, placering i butiken, aktiv/avslutad, utgången/ej utgången.

## Vid inleverans (kort bäst före-datum)
Personalen måste välja ett av: Acceptera leveransen / Lägg till i reklamationen / Kontrollera
senare / Ej relevant för denna produkt. **Om leveransen accepteras trots kort datum ska beslutet
loggas** med personalens namn, PIN-bekräftelse, datum/tid och ev. kommentar.

## Uppdatera en bäst före-post
Personalen kan öppna en post och ange antal kvar, eller trycka: Slut / Kasserad / Flyttad /
Kontrollerad / Uppdatera antal. När en post markeras som slut försvinner den från den **aktiva**
listan men sparas i historiken (raderas aldrig).

Om datumet passerar och det fortfarande finns varor kvar ska posten markeras som **utgången**
(inte bara tas bort) — personalen anger då antal kvar, antal kasserade, datum, anledning,
kommentar och PIN.

Kassation och acceptans av kort bäst före-datum kräver alltid PIN (se
`authentication-and-pin.md`).
