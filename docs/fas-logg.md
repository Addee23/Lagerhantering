# Faslogg

Detta är den oföränderliga loggen över varje avslutat dagspass/fas i projektet.
Fylls i tillsammans i slutet av varje pass, efter kodgenomgången, innan nästa dag/fas påbörjas.

Radera aldrig en rad härifrån — om något behöver rättas, lägg till en ny rad som beskriver rättelsen (samma princip som `ActivityLog` i själva systemet: historik skrivs inte över).

---

## Mall för varje rad

```
### Dag X – DATUM – Fas Y: <namn>

**Vad byggdes:**
-

**Berörda filer:**
-

**Vad du lärde dig idag:**
-

**Kända begränsningar / saker vi skjuter upp:**
-

**Testresultat:** OK / OK med anmärkning / Ej klar

**Godkänt att gå vidare:** Ja / Nej (datum + kommentar om Nej)
```

---

## Loggposter

*(Fylls i från och med dag 1, torsdag 30 juli 2026)*

### Dag 1 – 2026-07-30 – Fas 0 + start Fas 1: Projektregler, Next.js, Prisma, MySQL

**Vad byggdes:**
- `/skills`-mappen med 12 regeldokument (verksamhetsregler, teknikval, databas, PIN/auth,
  lager/hämtlista, AI/leveransregler, bäst före, reklamation/mejl, UI/mobil, loggning,
  fas-godkännande).
- Next.js-projekt initierat (senaste stabila 16.2.12, App Router, TypeScript, Tailwind CSS 4).
- Git-repo skapat med två commits.
- Prisma initierat med MySQL-datasource, driver-adapter (`@prisma/adapter-mariadb`) enligt
  Prisma 7:s nya krav, delad `PrismaClient`-singleton i `src/lib/prisma.ts`.
- Första modellen (`AppSetting`) och första migreringen, verifierad end-to-end mot en riktig
  lokal MySQL-databas (XAMPP).

**Berörda filer:**
- `skills/*.md` (12 nya filer)
- `prisma/schema.prisma`, `prisma.config.ts`, `.env`
- `src/lib/prisma.ts`
- `prisma/migrations/20260730081309_init_app_setting/`
- `.gitignore`, `package.json`

**Vad du lärde dig idag:**
- Skillnaden mellan projektets egna `/skills` (verksamhetsregler för appen) och Claude Codes
  generella skills, samt att tredjepartsverktyg (Prisma) kan installera sina egna skills.
- Att `.env` aldrig ska committas, och hur `.gitignore` styr det.
- Grundidén med en delad databas-klient (singleton) istället för att skapa en ny anslutning
  varje gång.

**Kända begränsningar / saker vi skjuter upp:**
- Datorn hade två separata MySQL-installationer som krockade (en gammal Windows-tjänst
  `MySQL80` med okänt lösenord, och XAMPP:s egen MariaDB som hade en trasig loggfil). Löst genom
  att reparera XAMPP:s datamapp och köra projektet på port **3307** istället för standard 3306.
  Den gamla `MySQL80`-tjänsten rördes aldrig och lämnades orörd.
- Detta tog betydligt längre än planerade 3 timmar på grund av MySQL-felsökningen – ingen
  kodbugg, rent miljöstrul. Imorgon (dag 2) börjar vi i tid igen med faktisk apputveckling
  (inloggning, PIN, navigation, dashboard-skal per `docs/dagsplan.md`).
- `AppSetting`-modellen är bara en teknisk verifiering, inte en riktig del av Fas 2:s datamodell.

**Testresultat:** OK — dev-server startar (`npm run dev`), lint och typkontroll gröna, migrering
applicerad, testrad skriven och läst från databasen.

**Godkänt att gå vidare:** Ja
