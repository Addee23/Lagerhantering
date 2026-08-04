# Fas 6 – hur AI-tolkningen fungerar (pedagogisk referens)

Den här filen förklarar, i ordning, vilka funktioner som faktiskt kör AI-tolkningen av
leveransdokument och varför de är byggda som de är. Tänkt som ett snabbt uppslagsverk inför t.ex.
handledarsamtal, inte som teknisk dokumentation för framtida utveckling.

## Flödet i korthet

```
Du laddar upp en faktura
        ↓
analyzeDeliveryDocument()          – pratar med OpenAI, får strukturerad JSON tillbaka
        ↓
matchSupplierByName() / matchProductForDeliveryItem()  – kopplar texten till riktiga rader i databasen
        ↓
analyzeDeliveryDocumentAction()    – sparar allt som ett UTKAST i databasen (rör aldrig lagret)
        ↓
Du granskar och bekräftar/kopplar om manuellt i gränssnittet
        ↓
approveDeliveryAction() (samma som i Fas 5)  – FÖRST HÄR uppdateras lagret
```

## 1. `analyzeDeliveryDocument(file)`
**Fil:** `src/lib/ai/analyze-delivery-document.ts:95`

Den funktion som faktiskt pratar med OpenAI (Responses API, modell `gpt-5.4-mini`). Skickar filen
som base64 tillsammans med ett **strikt JSON-schema** som tvingar svaret till exakt den struktur
appen förväntar sig - annars hade vi behövt tolka fri text, vilket är opålitligt.

Returnerar leverantörsnamn, org-/kundnummer, order-/fakturanummer, datum och en lista med
produktrader. Varje fält kan vara `null` - AI:n är **instruerad att aldrig hitta på ett värde** den
inte kan läsa av i dokumentet (`skills/delivery-and-ai-rules.md`). Varje rad får också en
`confidence` ("hog"/"medelhog"/"lag"/"okand") som senare visas som en varningstext i gränssnittet om
den är låg.

## 2. `matchSupplierByName(supplierName)` och `matchProductForDeliveryItem(supplierId, input)`
**Fil:** `src/lib/ai/match-product.ts`

Tar det AI:n *läste* (fritext, t.ex. "Coca-Cola 33cl 24-p") och försöker koppla det till en *riktig*
rad i databasen. Produktmatchningen följer en bestämd prioritetsordning (projektplanen 12.5):

1. Sparad leverantörskoppling (`SupplierProduct`)
2. Leverantörens artikelnummer
3. Streckkod
4. Exakt produktnamn
5. Liknande produktnamn (enkel textmatchning, inte riktig fuzzy-sökning)
6. Ingen träff → raden markeras "Ej kopplad" men **försvinner aldrig**

Ett litet men viktigt skydd här: ett tomt eller väldigt kort produktnamn (< 3 tecken) hoppar
matchningen helt över, annars hade det matchat i princip vilken produkt som helst.

## 3. `analyzeDeliveryDocumentAction(formData)`
**Fil:** `src/lib/actions/ai-delivery-actions.ts:29`

Server Actionen bakom uppladdningsknappen på `/deliveries/upload`. Kopplar ihop punkt 1 och 2:
sparar filen, anropar AI:n, matchar varje rad mot databasen, och skapar en `Delivery` +
`DeliveryItem`-rader som ett **granskningsutkast**. Rör aldrig lagersaldot.

## 4. De fem "lös det manuellt"-actionerna
**Samma fil:** `linkExistingSupplierAction`, `createSupplierFromDeliveryAction`,
`linkDeliveryItemToProductAction`, `confirmSuggestedMatchAction`, `createProductFromDeliveryItemAction`

Körs när du klickar i gränssnittet för att registrera/koppla leverantören, bekräfta en föreslagen
produktkoppling, koppla om till en annan produkt, eller skapa en helt ny produkt (med
dubblettkontroll återanvänd från Fas 2, via `src/lib/product-duplicates.ts`).

## Varför det här är säkert
- AI:n skapar **bara ett utkast** - inget når lagret förrän en människa godkänner via
  `approveDeliveryAction`, exakt samma godkännande-gate som den manuella leveransen i Fas 5.
- Nullbara fält överallt i schemat (steg 1) gör att AI:n aldrig tvingas gissa.
- Matchningen (steg 2) kräver antingen en riktig träff eller markerar raden öppet som osäker -
  aldrig en tyst felaktig koppling.
- Städning av AI:ns svar innan det når databasen: t.ex. `sanitizeQuantity()` avrundar/nollar
  decimaltal eller negativa antal som AI:n i teorin skulle kunna returnera, så att Prismas
  Int-kolumner aldrig kraschar.
