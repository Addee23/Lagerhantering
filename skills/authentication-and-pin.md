# Authentication and PIN rules

## Systeminloggning
Hela systemet är låst bakom inloggning från start. Ingen sida med intern information får vara
nåbar utan att användaren är inloggad. En gemensam inloggning för själva systemet är tillräckligt
(dvs inte nödvändigtvis en unik användare per person på detta lager — det löser `StaffMember`
+ PIN istället, se nedan).

## Personalprofiler (StaffMember)
Varje personalmedlem har en egen profil med: namn, 4- eller 6-siffrig PIN-kod, aktiv/inaktiv,
skapad-datum, senast använd, ev. kommentar.

**PIN-koden får aldrig sparas i klartext** — den ska hashas (t.ex. med bcrypt) precis som ett
lösenord.

## När PIN krävs
PIN-kod (dvs bekräftelse av vem som gör åtgärden) krävs när en person:
- Godkänner en inleverans.
- Slutför en hämtlista.
- Ändrar ett lagersaldo manuellt.
- Accepterar ett kort bäst före-datum.
- Kasserar produkter.
- Skickar en reklamation.
- Svarar på ett reklamationsmejl.
- Markerar en reklamation som löst.
- Gör en känslig manuell korrigering.

## PIN-inmatning (mobilvänlig)
- Stora sifferknappar, fungerar som mobilens kodlås.
- Visar vilket personalnamn som är valt.
- Snabb att använda, döljs (maskeras) efter inmatning.
- Blockerar eller fördröjer vid upprepade felaktiga försök (brute-force-skydd).

PIN-koden identifierar **vem** som utför åtgärden — den ersätter inte själva systemets
inloggning, den är ett andra, personligt lager ovanpå den gemensamma inloggningen.
