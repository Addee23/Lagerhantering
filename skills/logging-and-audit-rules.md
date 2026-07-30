# Logging and audit rules

## Aktivitetsloggen (ActivityLog)
Alla viktiga händelser sparas i en **oföränderlig** aktivitetslogg. Loggposter kan **aldrig**
raderas eller redigeras från den vanliga användarvyn (append-only från applikationens sida).

Varje loggpost bör innehålla:
- Vad som hände (händelsetyp).
- Vilken produkt/post det gällde.
- Tidigare värde och nytt värde (där relevant).
- Datum och tid.
- Vilken personalmedlem (kopplat till PIN-bekräftelsen).
- Anledning/kommentar.
- Koppling till relaterad leverans, hämtlista och/eller reklamation, om tillämpligt.

## Exempel på händelser som alltid ska loggas
Produkt skapad, produkt kopplad till leverantörsrad, inleverans godkänd, lagersaldo ändrat, varor
flyttade till butik, kort bäst före accepterat, produkt kasserad, reklamation skickad, inkommande
svar kopplat, reklamation avslutad.

## Koppling till PIN
Varje åtgärd som kräver PIN (se `authentication-and-pin.md`) ska generera en loggpost som visar
**vem** (vilken `StaffMember`) som bekräftade åtgärden — det är hela syftet med PIN-systemet:
spårbarhet, inte ytterligare inloggning.
