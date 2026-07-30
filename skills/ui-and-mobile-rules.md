# UI and mobile rules

## Prioritet
Mobil är förstahandsplattformen — designa och testa där först — men allt ska fungera bra på
dator och surfplatta också (responsiv layout, inte två separata kodbaser).

## Navigation
Huvudsidor: Dashboard, Produkter, Lager, Hämtlistor, Inleveranser, Bäst före, Beställningslista,
Reklamationer, Mejlinkorg, Leverantörer, Varumärken, Kategorier, Personal, Aktivitetslogg,
Inställningar. På mobil ska detta bli en kompakt meny (t.ex. hamburgermeny eller bottennavigation)
— inte en bred sidomeny som tar plats på liten skärm.

## Sökning och skanning
Snabb sökning ska täcka: produktnamn, streckkod, leverantörens artikelnummer, varumärke,
leverantör, fakturanummer, ordernummer, reklamationsnummer. På mobil ska kameran kunna användas
för att skanna streckkod där det förbättrar arbetsflödet (t.ex. vid hämtning och mottagningskontroll).

## Allmänna UI-krav
- Tydliga laddningslägen (loading states) — användaren ska aldrig undra om något hänger sig.
- Tydliga felmeddelanden — beskriv vad som gick fel och vad användaren kan göra.
- Tydliga tomma lägen (empty states) — t.ex. "Inga aktiva hämtlistor just nu".
- Snabba, tydliga knappar för vanliga handlingar (t.ex. "Markera rad som hämtad", "Markera alla
  rader utan avvikelse som klara").

## Dashboard
Startsidan ska fokusera på vad personalen **behöver agera på** (aktiva hämtlistor, lågt
lagersaldo, bäst före inom 30 dagar, utgångna produkter, väntande godkännanden, okopplade
dokumentrader, reklamationer som väntar på svar, ej kopplade mejl, produkter att beställa,
senaste aktiviteter) — inte bara ren statistik.
