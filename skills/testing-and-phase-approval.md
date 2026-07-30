# Testing and phase-approval rules

## En fas i taget
Systemet byggs i väl avgränsade, granskningsbara faser (se projektets `docs/dagsplan.md` för
schemat). **Ingen ny fas eller framtida funktion byggs i förväg** "för säkerhets skull", och
fungerande delar från tidigare godkända faser ändras inte utan tydligt behov och förklaring.

## Arbetsprocess för varje pass/fas
1. Läs relevanta skills-filer och kontrollera aktuell kod innan ändringar görs.
2. Beskriv kort vad som ska byggas i just detta pass.
3. Lista vilka filer som berörs.
4. Implementera **endast** det aktuella passets omfång.
5. Kör lint, typkontroll (`tsc`) och relevanta tester.
6. Kontrollera att eventuella databasmigreringar är rimliga.
7. Beskriv pedagogiskt vad som byggts och varför — gå igenom den nya koden rad för rad, kopplat
   till affärsreglerna, så att en nybörjare förstår resonemanget (inte bara vad koden gör, utan
   varför den gör det på det sättet).
8. Ge en konkret manuell testlista användaren kan följa.
9. Lista kända begränsningar eller saker som medvetet skjutits upp.
10. **Vänta på användarens uttryckliga godkännande** innan nästa fas eller nästa dags arbete
    påbörjas.
11. Fyll i dagens rad i `docs/fas-logg.md` tillsammans med användaren.

En fas får aldrig markeras som "färdig" utan att både en testlista och en pedagogisk genomgång
har getts.
