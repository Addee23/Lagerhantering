# Business rules (centrala verksamhetsregler)

Dessa regler får **inte** ändras utan uttryckligt godkännande av användaren:

1. Det finns endast två fasta lagerområden: **Butik** och **Lager**.
2. Alla mängder använder den fasta enheten **flak/pall** — det finns ingen annan valbar enhet
   (inte styck, paket etc).
3. **Butiken** har inte exakt löpande lagersaldo. Där hanteras istället: bäst före-datum,
   ungefärligt antal flak/pall kvar per bäst före-parti, fritext-placering (t.ex. "Kyl 1",
   "Frys"), och vilka produkter som är slut/behöver beställas.
4. **Lagret** (det externa lagret) har kontrollerat, exakt saldo: produkter, antal flak/pall,
   bäst före-datum, leveransparti, senaste förändringar, reserverat för hämtning, flyttat till
   butik.
5. **Varumärke** och **leverantör** är två olika register. Samma varumärke kan köpas från flera
   leverantörer (t.ex. varumärke "Red Bull" via leverantör "Privab").
6. Samma produkt kan köpas från flera leverantörer — löses med en separat
   `SupplierProduct`-koppling per leverantör (eget namn/artikelnummer/streckkod per koppling).
7. AI skapar **endast ett utkast** — aldrig en direkt, godkänd åtgärd (se `delivery-and-ai-rules.md`).
8. Okopplade dokumentrader (produkter AI inte kan matcha) **får aldrig försvinna** ur en leverans.
9. Produkter skapas **endast** efter mänskligt godkännande, aldrig automatiskt av AI.
10. En korrekt leveransrad ska enkelt kunna markeras som klar (en knapptryckning).
11. Alla avvikelser vid en leverans ska kunna samlas i en reklamation.
12. Reklamationsmejl skickas **endast** efter mänsklig granskning + PIN-bekräftelse.
13. Viktiga/känsliga åtgärder kräver personlig PIN-kod (se listan i `authentication-and-pin.md`).
14. Alla viktiga ändringar ska loggas (se `logging-and-audit-rules.md`).
15. Historik ska bevaras — aldrig skrivas över eller raderas när en produkt/leverans/bäst
    före-post avslutas. Rättelser görs som nya loggrader, inte genom att skriva över gamla.
16. Varje fas i utvecklingen måste testas och godkännas av användaren innan nästa fas påbörjas
    (se `testing-and-phase-approval.md`).

## Vad systemet INTE ska göra (avgränsningar)
- Vara ett fullständigt kassasystem eller kopplas till POS.
- Hålla exakt löpande butikssaldo för alla produkter.
- Registrera enskilda burkar/styck (bara flak/pall).
- Skicka beställningar automatiskt till leverantörer.
- Godkänna AI-tolkade leveranser utan mänsklig kontroll.
