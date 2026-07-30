# Project overview

## Vad systemet ska lösa
Ett fristående internt system för Hela Rubbet som hanterar:
- Varor på det externa lagret och överföring av dem till butiken.
- Bäst före-datum i både lager och butik.
- Inleveranser från leverantörer, manuellt eller AI-assisterat via dokumenttolkning.
- Leveransavvikelser, skadade varor och reklamationer (inklusive mejlkommunikation).
- Manuella beställningslistor för butiken.
- Historik/spårbarhet över viktiga händelser och godkännanden.

Systemet är **inte** ett kassasystem och kopplas **inte** till Hela Rubbets POS-system. Det är ett
separat verktyg. Primärt mobilanvändning, men ska fungera bra på dator och surfplatta.

## Användare
Butikspersonal via en gemensam systeminloggning + individuell PIN-kod som identifierar vem som
utför en given åtgärd (se `authentication-and-pin.md`).

## Huvudflöden
1. Se vad som finns på det externa lagret.
2. Skapa en hämtlista över varor som ska hämtas till butiken, markera vad som faktiskt hämtats.
3. Registrera och kontrollera inleveranser (manuellt eller via AI-tolkat dokument).
4. Upptäcka saknade/felaktiga/skadade/kortdaterade produkter.
5. Skapa och skicka reklamationer, följa leverantörens svar i samma ärende.
6. Se produkter som snart går ut, registrera vad som finns kvar av ett bäst före-parti.
7. Skapa en manuell beställningslista för butiken.
8. Se vem som godkänt eller utfört viktiga åtgärder (historik).

## Vad som INTE ingår i version 1
Se `business-rules.md` för avgränsningarna. Framtida funktioner (automatiska beställningar,
prisjämförelse, statistik, POS-integration m.m.) byggs inte förrän grundsystemet fungerar och
varje sådan idé godkänns som en egen, separat fas.

## Teknik i korthet
Se `technology-rules.md`. Databasmodell: se `database-rules.md`.
