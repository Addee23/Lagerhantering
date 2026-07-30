# Complaint and email rules

## Reklamationsutkast
Skapas automatiskt när en godkänd leverans innehåller avvikelser. Samlar: leverantör,
leveransdatum, order-/fakturanummer, saknade produkter, felaktiga antal, produkter som inte
fanns på fakturan, skadade produkter, kort bäst före-datum, bilder, kommentarer och önskad
åtgärd.

## Reklamationsnummer
Unikt format: `REK-ÅÅÅÅ-NNNN` (ex. `REK-2026-0001`). Ämnesrad i mejl kan t.ex. vara
"Reklamation REK-2026-0001 – Faktura 45872".

## AI-genererat mejl
AI:n skapar ett professionellt mejlutkast utifrån avvikelserna. **Mejlet skickas aldrig
automatiskt.** Personalen läser igenom, redigerar text/mottagare/ämne, hanterar bilagor,
förhandsgranskar, bekräftar med PIN och skickar. Innan en reklamation kan skickas måste
leverantören ha en registrerad reklamationsadress — annars blockeras sändning.

## Statusflöde
**Utkast → Skickad → Väntar på svar → Krediterad/Ersatt → Avslutad**, samt separata statusar
**Behöver kompletteras**, **Avvisad av leverantör**, **Avbruten**.

## Inkommande mejl (IMAP)
Läses från en separat reklamationsbrevlåda (t.ex. `reklamation@helarubbet.se`). Matchning mot
rätt ärende i denna ordning:
1. Mejlets tråd-/meddelandeidentifierare.
2. Reklamationsnumret i ämnesraden.
3. Faktura- eller ordernummer.
4. Leverantörens e-postadress.
5. Manuell koppling.

Mejl som inte kan kopplas automatiskt hamnar i **Ej kopplade mejl**, där personalen kan öppna,
söka reklamation, koppla manuellt, skapa nytt ärende eller markera som irrelevant. Ett tydligt
matchat svar sätter automatiskt status "Väntar på svar från oss" (eller motsvarande).

Svar från systemet (inkl. AI-föreslaget svar som redigeras av personal) kräver PIN innan
sändning, precis som nya reklamationsmejl.
