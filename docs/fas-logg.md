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

---

### Dag 2 – 2026-07-31 – Fas 1 klar: Inloggning, PIN, navigation, dashboard-skal

**Vad byggdes:**
- `SystemUser` (gemensam systeminloggning) + `/login`-sida + signerad session-cookie
  (Web Crypto, funkar i både proxy och server actions) + `src/proxy.ts` som skyddar alla sidor
  utom `/login`. Next.js 16 döpte om "Middleware" till **"Proxy"** (samma funktion, nytt namn) -
  precis den typen av ändring AGENTS.md varnade för.
- `StaffMember` + PIN-verifiering: bcrypt-hash, blockering i 30 sekunder efter 5 felaktiga
  försök, `lastUsedAt` uppdateras vid lyckad kod.
- `PinPad`-komponenten: personalval, sifferknappar, prickindikator som visar exakt så många
  prickar som du skrivit (PIN får vara 4 *eller* 6 siffror, så ett fast antal platser hade varit
  missvisande).
- Mobilnavigation (hamburgermeny) + permanent sidomeny på dator, via en `(app)`-routegrupp så att
  `/login` slipper visa Nav-menyn.
- Dashboard-skal med platshållarkort för kommande faser, en live PIN-testwidget, och en riktig
  `/activity-log`-sida som visar `ActivityLog` från databasen.
- Engångsskript (`scripts/create-system-user.ts`, `scripts/create-staff-member.ts`) för att
  bootstrappa första inloggningen/personalen - det finns medvetet ingen självregistrering i
  appen.

**Berörda filer:**
- `src/proxy.ts`, `src/lib/session.ts`, `src/lib/actions/auth-actions.ts`,
  `src/lib/actions/staff-actions.ts`
- `src/components/{Nav,PinPad,DashboardPinTest,ComingSoonPage}.tsx`
- `src/app/login/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`,
  `src/app/(app)/activity-log/page.tsx` + 13 platshållarsidor för resten av navigationen
- `prisma/schema.prisma` (SystemUser, StaffMember, ActivityLog) + två migreringar
- `scripts/create-system-user.ts`, `scripts/create-staff-member.ts`

**Vad du lärde dig idag:**
- Skillnaden mellan `proxy.ts` (den faktiska säkerhetsspärren, körs på varje request) och
  `(app)`-routegruppen (bara layout/utseende - ingen säkerhet).
- Skillnaden mellan `session.ts` ("verktygslådan": signera/verifiera cookien) och
  `auth-actions.ts` (Server Actions som knappar/formulär faktiskt anropar).
- Varför PIN-koder visar ett dynamiskt antal prickar istället för ett fast antal (4 vs 6 siffror
  är båda giltiga längder).

**Kända begränsningar / saker vi skjuter upp:**
- MySQL (XAMPP) startar inte automatiskt vid omstart av datorn - måste startas manuellt i XAMPP
  Control Panel varje gång innan `npm run dev` används.
- Inget UI för att byta systemlösenord eller skapa fler personalprofiler än via
  engångsskripten - det byggs i Fas 2 (riktiga register).
- 13 av 15 sidor i navigationen är just nu bara "Kommer i en senare fas"-platshållare.

**Testresultat:** OK — samtliga testpunkter godkända av dig i webbläsaren: ingen sida nåbar utan
inloggning, navigation funkar på mobil (hamburgermeny) och dator (sidomeny), personal kan väljas,
rätt PIN loggas, fel PIN hanteras/blockeras, händelser syns i aktivitetsloggen.

**Godkänt att gå vidare:** Ja

---

### Fas 2 (samma dag, 2026-07-31) – Grundregister: Produkter, Kategorier, Varumärken, Leverantörer

**Vad byggdes:**
- `Category`/`Brand`: enkla register med namn + aktiv/inaktiv, skapas och inaktiveras direkt i
  listan.
- `Supplier`: skapas med bara namn (skills, 8.1) - övriga uppgifter (reklamationsmejl,
  standardgräns för kort bäst före, kontaktperson m.m.) fylls i på en separat redigeringssida.
- `Product`: namn, valfri streckkod, kategori, varumärke, lägsta önskade lagersaldo, normalt
  beställningsantal. Inget "enhet"-fält alls - flak/pall är implicit och behöver inte väljas
  (skills/business-rules.md, punkt 2).
- `SupplierProduct`: kopplar en produkt till flera leverantörer, varje koppling med sitt eget
  artikelnummer/namn - testat med två leverantörer på samma produkt.
- Dubblettkontroll vid produktskapande (samma streckkod eller liknande namn) - varnar men
  blockerar inte, med ett "Skapa ändå"-läge.
- Sökning över produkter på namn, streckkod och leverantörsartikelnummer.

**Berörda filer:**
- `prisma/schema.prisma` (Category, Brand, Supplier, Product, SupplierProduct) + migrering
- `src/lib/actions/{category,brand,supplier,product,supplier-product}-actions.ts`
- `src/app/(app)/{categories,brands,suppliers,products}/page.tsx` +
  `suppliers/[id]/edit`, `products/new`, `products/[id]/edit`

**Vad du lärde dig idag (utöver Fas 1):**
- Varför en cachad Prisma-klient (`globalThis`-singleton) kräver en full omstart av dev-servern
  efter schemaändringar - inte bara en vanlig kodändring/hot-reload.
- Server Actions kan bekräfta lyckad sparning genom en redirect med `?saved=true` + en grön
  banderoll, istället för att bara tyst returnera till samma formulär.
- Vikten av tydlig navigation direkt på sidan (inte bara i hamburgermenyn) efter en åtgärd som
  spara/skapa.

**Kända begränsningar / saker vi skjuter upp:**
- Ingen paginering på produktlistan än (inget problem förrän vi har många produkter).
- Leverantörslistan saknar sökfunktion (kommer vid behov).
- Automatisk "liknande namn"-matchning är enkel (`contains`, skiftlägesokänslig substr) - inte en
  riktig fuzzy-matchning. Tillräckligt för nu, kan förfinas senare.

**Testresultat:** OK — kategori/varumärke/leverantör kan skapas och inaktiveras, leverantör kan
skapas med bara namn och sedan kompletteras, produkt kan skapas/redigeras med kategori och
varumärke, dubblettvarningen dyker upp och går att förbikoppla medvetet, samma produkt kopplad
till två leverantörer, sökning fungerar.

**Godkänt att gå vidare:** Ja

---

### Fas 3 (samma dag, 2026-07-31) – Externt lager och lagerhistorik (KOD KLAR, TESTNING PÅGÅR)

**Vad byggdes:**
- `StockBatch` (lagerparti med antal + valfritt bäst före-datum) och `StockMovement`
  (oföränderlig lagerhistorik - "mottagen", "korrigering", "kassation").
- Lagerförteckning (`/warehouse`) som visar totalt saldo per produkt (summan av dess aktiva
  lagerpartier) och flaggar produkter under "lägsta önskade lagersaldo".
- Produktens lagersida (`/warehouse/[id]`): ta emot nytt lagerparti, korrigera eller kassera ett
  befintligt parti, samt historik.
- Alla lagerförändringar kräver PIN-bekräftelse (skills/authentication-and-pin.md) och skriver
  både en `StockMovement`- och en `ActivityLog`-rad.
- Negativt saldo förhindras: kassation kan aldrig ta bort fler än vad som finns kvar i partiet.
- Delade upp PIN-verifieringslogiken (`src/lib/pin-verification.ts`) så både dashboardens
  PIN-test och de nya lageråtgärderna återanvänder samma kontroll, istället för att duplicera
  den.

**Berörda filer:**
- `prisma/schema.prisma` (StockBatch, StockMovement) + migrering
- `src/lib/pin-verification.ts`, `src/lib/actions/warehouse-actions.ts`
- `src/components/StaffPinFields.tsx`
- `src/app/(app)/warehouse/page.tsx`, `src/app/(app)/warehouse/[id]/page.tsx`

**Kända begränsningar / saker vi skjuter upp:**
- "Mottaget lagerparti" är fristående än - riktig koppling till en faktisk inleverans (Delivery)
  byggs i Fas 5.
- Lagersaldot beräknas alltid live (summa av lagerpartier) istället för att cachas - enklare och
  garanterat korrekt i den här skalan, kan optimeras senare om det behövs.

**Testresultat:** Väntar — koden är klar, typkontroll och lint är gröna, men du testar det
faktiska flödet i webbläsaren på måndag istället för idag.

**Godkänt att gå vidare:** Nej, väntar på din testning måndag 3/8 innan Fas 4 påbörjas.
