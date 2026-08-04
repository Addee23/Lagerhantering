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

### Fas 3 (kodad 2026-07-31, testad 2026-08-01) – Externt lager och lagerhistorik

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

**Testresultat:** OK — testat i webbläsaren en dag tidigare än planerat (lördag istället för
måndag, på användarens initiativ): mottagning av lagerparti ökar saldot korrekt, lågt
saldo-varningen visas, korrigering och kassation fungerar och loggas i historiken, fel PIN
avvisas utan att spara, kassation kan inte överstiga aktuellt antal.

**Godkänt att gå vidare:** Ja

---

### Fas 4 (2026-08-01 till 2026-08-03) – Hämtlistor (lager → butik)

**Vad byggdes:**
- `PickupList`/`PickupListItem` med statusflödet **Utkast → Klar att hämta → Hämtning pågår →
  Slutförd** (plus Avbruten), som en riktig Prisma `enum`.
- Skapa hämtlista, lägga till flera produkter med antal, kommentar till listan.
- Virtuell reservation (`src/lib/stock.ts`, `getAvailableStock`): tillgängligt saldo = totalt
  saldo minus vad som redan är begärt i andra aktiva hämtlistor - inget låses fysiskt förrän
  listan slutförs.
- Hämtningsvy: markera varje rad som hämtad med faktiskt antal, "saknades helt" eller "bara
  delvis" - status byter automatiskt till "Hämtning pågår" vid första hanterade raden.
- Slutförande (PIN-skyddat): drar lagersaldo enligt **FEFO** (first expire, first out - partier
  utan bäst före-datum plockas sist), skriver `StockMovement` per påverkat parti samt en
  `ActivityLog`-post, sparar vem som slutförde och när.
- Avbryt-flöde för hela listan.

**Berörda filer:**
- `prisma/schema.prisma` (PickupList, PickupListItem, PickupListStatus) + migrering
- `src/lib/stock.ts`, `src/lib/actions/pickup-list-actions.ts`
- `src/app/(app)/pickup-lists/page.tsx`, `src/app/(app)/pickup-lists/[id]/page.tsx`
- `src/lib/pin-verification.ts` (ny delad `redirectWithPinError`, återanvänds nu av tre
  actions-filer)

**Vad du lärde dig idag:**
- Skillnaden mellan `$transaction([...])` (oberoende operationer) och `$transaction(async (tx) =>
  {...})` (steg som beror på varandra, t.ex. läsa ett lagerpartis antal innan man drar ifrån det).
- Varför man räknar ut tillgängligt saldo "live" istället för att fysiskt låsa lagerrader när en
  hämtlista skapas.
- FEFO-principen (first expire, first out) och hur den implementeras som en sortering i
  applikationskoden istället för i databasfrågan.

**Kända begränsningar / saker vi skjuter upp:**
- Ingen streckkodsskanning vid hämtning än (kameran) - manuell inmatning fungerar, skanning är en
  senare förbättring.
- Bäst före-information "förs över" till butiken bara som en textreferens i loggen - en riktig
  butiks-sida (ExpiryRecord) byggs i Fas 7.
- Om man skulle hämta mer än det virtuellt reserverade saldot tillåter systemet det ändå (ingen
  hård spärr) - en medveten avvägning för att inte blockera personalen i onödan.

**Testresultat:** OK — full genomgång i webbläsaren över tre dagar (skapa lista, lägga till/ta
bort produkter, klarmarkera, hämta rader inklusive avvikelser, slutföra med PIN, verifierat att
lagersaldot minskade rätt och att historiken visar uttaget kopplat till hämtlistan, samt
avbryt-flödet).

**Godkänt att gå vidare:** Ja

---

### Fas 5 (2026-08-03) – Manuell inleverans

**Vad byggdes:**
- `Delivery`/`DeliveryItem`/`DeliveryIssue`/`DamageImage`/`DeliveryDocument` - skapa leverans,
  välja leverantör, lägga till rader med dokumenterat/mottaget antal och bäst före-datum.
- Riktig filuppladdning (skadebilder + leveransdokument) till `public/uploads/`, med
  storleks-/filtypsvalidering.
- Avvikelser per rad (9 typer enligt projektplanen, bl.a. skadad vara med antal/kasserad/önskad
  åtgärd + bild), "Markera rad som klar" och "Markera alla rader utan avvikelse som klara".
- Kort bäst före-hantering vid inleverans (skills/expiry-rules.md, 15.2): fyra val, där
  "Acceptera leveransen" kräver PIN och loggas.
- Godkännande-gate: blockerar om rader är obehandlade, mottaget antal saknas, eller kort bäst
  före inte är hanterat. Godkännande (PIN) skapar `StockBatch`/`StockMovement` per rad och
  `ActivityLog` - lagret uppdateras först här, aldrig innan.

**Berörda filer:**
- `prisma/schema.prisma` (Delivery + 4 relaterade modeller) + migrering
- `src/lib/file-upload.ts`, `src/lib/actions/delivery-actions.ts`
- `src/app/(app)/deliveries/{page,new/page,[id]/page}.tsx`

**Verifiering (på begäran, utöver vanlig webbläsartest):**
Byggde ett tillfälligt Node-skript som körde hela flödet direkt mot databasen (skapa leverans,
4 rader, avvikelser inkl. riktig bilduppladdning, fel/rätt PIN, för-tidigt och korrekt
godkännande, dubbelgodkännande) - 20/20 kontroller godkända. Hittade och fixade en verklig bugg
på köpet: att lösa en kort-bäst-före-varning markerade inte raden som klar automatiskt, vilket
tvingade fram ett extra, förvirrande klick. Skriptet togs bort efter verifieringen (var bara ett
tillfälligt QA-verktyg, inte del av appen).

**Kodgranskning/optimering (på begäran):**
- Bugg: filuppladdning kraschade med ett ohanterat serverfel vid fel filtyp/för stor fil - nu
  fångas felet och visas som ett vanligt felmeddelande.
- Bröt ut duplicerad `inputClass`/`labelClass` (8 filer) till `src/lib/form-styles.ts`.
- Bröt ut duplicerad badge-/felruta-styling (~15 ställen, 6 filer) till nya
  `src/components/Alert.tsx` och `src/components/StatusBadge.tsx`.

**Kända begränsningar / saker vi skjuter upp:**
- "Lägg till i reklamationen" skapar bara en avvikelse-post - ingen riktig `Complaint`-post
  eller mejlutkast än, det byggs i Fas 9.
- Filer sparas lokalt på disk (`public/uploads`), inte i molnlagring - tillräckligt för
  projektets skala.

**Testresultat:** OK - webbläsartest av användaren (skapa leverans, rader, avvikelser, bilder,
kort bäst före, godkännande, lageruppdatering) + skriptbaserad totalverifiering (20/20) +
kodgranskning med en bugg hittad och fixad.

**Godkänt att gå vidare:** Ja

---

### Fas 6 (2026-08-03) – AI-tolkning av leveransdokument

**Vad byggdes:**
- `analyzeDeliveryDocument()` (OpenAI Responses API, `gpt-5.4-mini`, strikt JSON-schema): läser en
  uppladdad faktura/följesedel/orderbekräftelse (PDF eller bild) och föreslår leverantör,
  order-/fakturanummer, datum och produktrader (namn, artikelnummer, streckkod, antal, bäst
  före-datum, batchnummer, kommentar) - hittar aldrig på ett värde, sätter null när informationen
  saknas (skills/delivery-and-ai-rules.md).
- Matchningslogik (`src/lib/ai/match-product.ts`) enligt prioritetsordningen i projektplanen 12.5:
  sparad leverantörskoppling → artikelnummer → streckkod → exakt namn → liknande namn → omatchad.
  Varje rad får en `matchStatus` (Kopplad/Föreslagen/Ej kopplad) - en rad försvinner aldrig även om
  den inte kan matchas.
- Ny leverantör upptäcks automatiskt från dokumentet och kan registreras eller kopplas till en
  befintlig leverantör direkt på leveranssidan innan godkännande.
- UI för att lösa "Föreslagen koppling" (bekräfta eller koppla om) och "Ej kopplad" (koppla till
  befintlig produkt eller skapa ny, förifylld från dokumentraden) per rad.
- Godkännande-gaten (samma `approveDeliveryAction` som den manuella leveransen) utökad: kräver nu
  även att leverantör och alla produkter är kopplade innan lagret får uppdateras.
- Visning av AI:ns säkerhetsnivå per rad (gul varningstext) när tolkningen är osäker/okänd, så
  personalen vet vilka rader som behöver extra kontroll (projektplanen 12.4).

**Berörda filer:**
- `prisma/schema.prisma` (nullbara `Delivery.supplierId`/`DeliveryItem.productId`, `DeliverySource`,
  `DeliveryItemMatchStatus`, `rawSupplierName`/`rawProductName`/`fieldConfidence` m.fl.) + tre
  migreringar
- `src/lib/ai/analyze-delivery-document.ts`, `src/lib/ai/match-product.ts`
- `src/lib/actions/ai-delivery-actions.ts`
- `src/lib/product-duplicates.ts` (utbruten från `product-actions.ts` för återanvändning)
- `src/app/(app)/deliveries/upload/page.tsx`, `src/app/(app)/deliveries/[id]/page.tsx`,
  `src/app/(app)/deliveries/page.tsx`
- `src/components/FileInput.tsx` (ny), `next.config.ts`, `src/app/globals.css`

**Vad du lärde dig idag:**
- Skillnaden mellan API-betalning (platform.openai.com, pay-as-you-go) och en ChatGPT
  Plus-prenumeration - helt separata system, ingen automatisk återkommande dragning utan att
  "auto-recharge" aktiveras uttryckligen.
- Att strikt JSON-schema (`strict: true` i Responses API) tvingar modellen att svara i exakt den
  form appen förväntar sig, istället för att behöva tolka fritext.
- Varför delade hjälpfunktioner (t.ex. `findPossibleDuplicates`) måste ligga i en vanlig fil, inte
  i en `"use server"`-fil - annars blir de av misstag en anropbar Server Action.
- Att Next.js Server Actions har en egen kroppsstorlek-gräns (1 MB som standard) helt separat från
  applikationens egen filstorlekskontroll, och att den måste höjas separat
  (`experimental.serverActions.bodySizeLimit`) när man tillåter större filer.
- Att webbläsarens filväljartext ("Choose File") styrs av webbläsaren/OS, inte sidans språk, och
  att en gömd `<input>` + en `<label>`-knapp är standardlösningen för att få eget språk där.

**Kodgranskning (på begäran, innan godkännande):**
- Bugg: tomt/mycket kort produktnamn matchade i praktiken vilken produkt som helst
  (`contains: ""`) - nu krävs minst 3 tecken innan namn-matchning körs.
- Bugg: AI:n kunde i teorin returnera ett decimaltal eller negativt antal, vilket hade kraschat
  mot en Int-kolumn i databasen - nu städas antalet (`sanitizeQuantity`) innan det sparas.
- Bugg: godkännande av en leverans utan rader, eller utan kopplad leverantör, gav bara ett tyst
  no-op utan förklaring - ersatt med tydliga felmeddelanden.
- Brist: "Skapa produkt" i AI-flödet saknade den dubblettkontroll som redan fanns i den manuella
  produktsidan sedan Fas 2 - kontrollen bröts ut till en delad fil och återanvänds nu av båda.
- Förenkling: tog bort en gissning av MIME-typ från filändelsen till förmån för webbläsarens egen
  (redan validerade) `file.type`.
- Brist: AI:ns säkerhetsnivå per rad sparades men visades aldrig i gränssnittet - tillagd som en
  varningstext på osäkra rader.
- `npx tsc --noEmit` och `npm run lint` gröna efter samtliga fixar.

**Kända begränsningar / saker vi skjuter upp:**
- Ingen egentlig kostnads-/timeout-gräns på AI-anropet än - för projektets skala (enstaka dokument,
  manuellt uppladdade) bedöms det inte som ett problem nu.
- "Liknande namn"-matchningen är fortfarande en enkel `contains`-jämförelse, inte riktig
  fuzzy-matchning (samma medvetna avvägning som i Fas 2).
- Reklamationshantering av AI-tolkade avvikelser byggs fullt ut i Fas 9, precis som för den
  manuella leveransen.

**Testresultat:** OK - testat med ett riktigt leveransdokument (skarp faktura) via webbläsaren:
dokument tolkat, leverantör och produktrader föreslagna, matchning/koppling fungerade, ny
leverantör kunde registreras, säkerhetsvarning visades korrekt, godkännande uppdaterade lagret.
Under testet hittades och åtgärdades även två skarpa buggar: Server Actions kroppsstorlek-gräns
(1 MB) som stoppade större filer, och webbläsarens engelska filväljartext.

**Godkänt att gå vidare:** Ja

---

### Fas 7 (2026-08-04) – Bäst före i butiken

**Vad byggdes:**
- `ExpiryRecord` - butikens bäst före-poster (skills/expiry-rules.md): ungefärligt antal kvar,
  fritext-placering, status Aktiv/Avslutad. Historik skrivs aldrig över - en avslutad post
  uppdateras in-place men raderas aldrig (skills/business-rules.md, punkt 15).
- Kopplade ihop Fas 4 och Fas 7: `completePickupListAction` skapar nu en riktig `ExpiryRecord`-rad
  per lagerparti FEFO-uttaget faktiskt tog ifrån (med rätt antal och bäst före-datum), istället för
  att bara skriva en textrad i loggen som tidigare (känd begränsning sedan Fas 4/5).
- `/expiry`-sidan: aktiv lista som kombinerar butikens poster (`ExpiryRecord`) och lagrets partier
  med bäst före-datum (`StockBatch`) i en gemensam vy. Filter: 7/14/30/60/90 dagar (standard 30),
  eget datumintervall, kategori, varumärke, leverantör, produkt, plats (butik/lager), placering,
  aktiv/avslutad, endast utgångna.
- Per butikspost: uppdatera antal kvar, markera kontrollerad, Slut, Flyttad, Kasserad (kräver PIN).
  En post vars datum har passerat flaggas automatiskt "Utgången" och kassationen loggas då som en
  egen händelsetyp för spårbarhet. Lagrets rader länkar istället vidare till den befintliga
  `/warehouse/[id]`-sidan (Fas 3) - ingen duplicerad lagerlogik.

**Berörda filer:**
- `prisma/schema.prisma` (ExpiryRecord, ExpiryRecordStatus) + migrering
- `src/lib/actions/expiry-actions.ts` (ny)
- `src/lib/actions/pickup-list-actions.ts` (`deductStockFefo` returnerar nu vilka partier/datum
  som faktiskt konsumerades, `completePickupListAction` skapar `ExpiryRecord`-rader)
- `src/app/(app)/expiry/page.tsx`

**Vad du lärde dig idag:**
- Att en enda hämtlisterad kan plocka från flera olika lagerpartier med olika bäst före-datum, och
  varför FEFO-funktionen därför måste rapportera tillbaka *vilka* partier den tog ifrån - inte bara
  dra ner en totalsumma.
- Att butiken (Fas 7) och lagret (Fas 3) medvetet har olika detaljnivå - butiken får bara ett
  ungefärligt antal per bäst före-parti, aldrig ett exakt löpande saldo (skills/business-rules.md,
  punkt 3-4) - och att UI:t därför pekar vidare till lagrets sida istället för att bygga om samma
  logik för lagrets rader.
- Repeterade react-hooks/purity-mönstret från tidigare faser (egen icke-komponent-funktion för
  `Date.now()`) på en tredje sida.

**Kända begränsningar / saker vi skjuter upp:**
- "Kontrollerad" och "Flyttad" kräver inget PIN (bara Kasserad/Utgången gör det) - en medveten
  avvägning eftersom inget fysiskt kasseras i de fallen.
- Ingen streckkodsskanning vid hantering av en bäst före-post än, samma avgränsning som
  hämtlistorna i Fas 4.

**Testresultat:** OK - testat i webbläsaren av användaren: skapade lagerparti med bäst
före-datum, hämtlista med den produkten, slutförde hämtningen, verifierade att en ny post dök upp
på `/expiry` med rätt antal och datum, testade filter samt uppdatera antal/kontrollerad/kassera.

**Godkänt att gå vidare:** Ja

---

### Kodgranskning (2026-08-04) – Fas 1-4 samt kvarstående Fas 7-fixar

På begäran granskades även Fas 1-4 (som aldrig fått en dedikerad genomgång i den här
omgången), plus tre buggar kvar från Fas 7:s granskning.

**Hittat och fixat:**
- Fas 7: kassation av en bäst före-post validerade inte antalet mot vad som faktiskt fanns kvar,
  och uppdaterade aldrig `quantityRemaining` - en delvis kassation lämnade resten spårlöst.
- Fas 7: snabbfiltren och filterformuläret på `/expiry` nollställde varandra. Dubblerade
  `datalist`-id:n (ogiltig HTML) städades bort.
- Fas 1: PIN-panelen tillät en ogiltig 5-siffrig kod (bara 4/6 är giltiga), vilket slösade ett av
  de 5 tillåtna försöken. `?from=`-parametern som `proxy.ts` satte vid omdirigering till
  inloggning lästes aldrig - man hamnade alltid på dashboarden istället för sidan man försökte nå.

**Rapporterat men inte fixat (medvetna avvägningar):**
- `updateProductAction` kör inte samma dubblettkontroll som `createProductAction`.
- Kategori-/varumärkesskapande fångar alla databasfel som "namnet finns redan", även orelaterade
  fel.

**Testresultat:** OK - `npx tsc --noEmit` och `npm run lint` gröna efter samtliga fixar.

**Godkänt att gå vidare:** Ja

---

### Fas 8 (2026-08-04) – Butikens beställningslista

**Vad byggdes:**
- `OrderListItem` - en helt manuell beställningslista (docs/dagsplan.md, dag 14). Systemet skickar
  aldrig något automatiskt till en leverantör (skills/business-rules.md, avgränsningar) -
  personalen beställer själva utanför systemet och markerar sedan här vad som hänt.
- `/order-list`-sidan: lägg till produkt med valfri leverantör, orsak, prioritet (Låg/Normal/Hög)
  och antal. Statusflöde **Att beställa → Beställd → Mottagen** (eller **Avbruten**), listan
  grupperad per leverantör så det är tydligt vem man ska kontakta. Standardvyn visar bara aktiva
  poster, med en länk för att visa historiken (mottagna/avbrutna bevaras, raderas aldrig).

**Berörda filer:**
- `prisma/schema.prisma` (OrderListItem, OrderListPriority, OrderListStatus) + två migreringar
- `src/lib/actions/order-list-actions.ts` (ny)
- `src/app/(app)/order-list/page.tsx`

**Kodgranskning (samma pass):**
- Bugg: grupperna på sidan renderades med leverantörens **namn** som React-key istället för id,
  trots att grupperingslogiken redan använde id internt. `Supplier.name` saknar (till skillnad
  från Category/Brand) en unik-begränsning, så två leverantörer med samma namn hade gett en
  dubblerad key och risk för att fel grupp uppdateras i gränssnittet.
- Ett `comment`-fält lades till i schemat men användes aldrig av någon kod - togs bort igen med en
  egen migrering istället för att lämnas som död kolumn.

**Vad du lärde dig idag:**
- Varför React-nycklar måste vara garanterat unika (id, inte ett fritextfält utan unik-
  begränsning i databasen) - annars kan gränssnittet blanda ihop eller felrendera grupper.
- Skillnaden mellan att `updateMany` med ett statusvillkor i `where` (säker, tyst no-op om
  posten redan bytt status) och ett vanligt `update` (kan skriva över ett tillstånd som redan
  hunnit ändras av någon annan).

**Kända begränsningar / saker vi skjuter upp:**
- Ingen koppling mellan en mottagen beställningsradpost och en riktig `Delivery` - att markera
  "Mottagen" här uppdaterar inte lagret, det görs fortfarande via en vanlig inleverans (Fas 5/6).
- Ingen automatisk föreslagning från lågt lagersaldo (Fas 3) till beställningslistan - allt läggs
  till manuellt, per den här fasens medvetna, avgränsade scope.

**Testresultat:** OK - testat i webbläsaren av användaren: produkt tillagd med och utan vald
leverantör, gruppering per leverantör fungerade, hela statusflödet (beställd/mottagen/avbruten)
testat, "Visa alla" visar historiken korrekt.

**Godkänt att gå vidare:** Ja
