# Delivery and AI rules

## AI:ns roll och begränsningar
AI:n läser dokument (faktura/följesedel/orderbekräftelse) och föreslår strukturerad information.
AI:n får **aldrig**:
- Godkänna en leverans.
- Ändra lagersaldo direkt.
- Skicka en reklamation utan mänsklig kontroll.
- Ta bort rader den inte förstår.
- Skapa produkter utan personalens uttryckliga godkännande.
- Hitta på ett värde när informationen saknas (hellre "kunde inte tolkas").

Dokumentuppladdning skapar alltid ett **granskningsutkast** — lagret uppdateras aldrig direkt.

## AI-förtroende per fält
Varje tolkat fält får en säkerhetsnivå: **Hög / Medelhög / Låg / Kunde inte tolkas.** Fält med låg
säkerhet ska markeras tydligt för manuell kontroll innan godkännande.

## Produktmatchning (i denna ordning)
1. Tidigare sparad leverantörskoppling (`SupplierProduct`).
2. Leverantörens artikelnummer.
3. Streckkod.
4. Exakt produktnamn.
5. Liknande produktnamn.
6. AI-förslag.

Varje rad får status **Kopplad till produkt**, **Föreslagen koppling** (kräver bekräftelse om
matchningen är osäker) eller **Ej kopplad till produkt** (och sådana rader försvinner *aldrig*
ur leveransen — personalen kan söka manuellt eller trycka "Skapa produkt").

## Avvikelser
En leveransrad kan flaggas med en eller flera av: produkten saknas helt, färre/fler mottagna än
dokumenterat, levererad men saknas på fakturan, fel produkt levererad, skadad vara, för kort bäst
före-datum, felaktig fakturering, annan avvikelse. Skadad vara kräver: antal, typ av skada,
kommentar, bild(er), kasserad/sparas/returneras, önskad åtgärd.

## Godkännande av leverans (gate)
En inleverans får **inte** godkännas förrän: alla rader är klara eller avvikelsemarkerade, alla
okopplade produkter är hanterade, mottaget antal är kontrollerat, bäst före-info är hanterad, och
nödvändiga reklamationsuppgifter är ifyllda om avvikelser finns.

Vid godkännande (kräver PIN): skapa lagerpartier, uppdatera lagersaldo, spara alla rörelser,
skapa bäst före-poster, skapa ett reklamationsutkast om avvikelser finns, spara vem som godkände,
och **lås originalinformationen** från dokumentet. Senare rättelser blir nya loggrader — aldrig
en överskrivning av den ursprungliga historiken.
