# Database rules

## Huvudobjekt (datamodell)
`SystemUser`, `StaffMember`, `Brand`, `Category`, `Supplier`, `Product`, `SupplierProduct`,
`WarehouseLocation`, `StockBatch`, `StockMovement`, `PickupList`, `PickupListItem`, `Delivery`,
`DeliveryDocument`, `DeliveryItem`, `DeliveryIssue`, `DamageImage`, `ExpiryRecord`,
`StoreOrderRequest`, `Complaint`, `ComplaintItem`, `ComplaintEmail`, `EmailAttachment`,
`UnmatchedEmail`, `ActivityLog`, `AppSetting`.

Det exakta schemat (fält, relationer, index) tas fram och byggs ut fas för fas i
`prisma/schema.prisma` — modeller läggs till i den fas de faktiskt behövs, inte alla på en gång.

## Grundprinciper
- **Historik skrivs aldrig över.** Rättelser av t.ex. lagersaldo eller bäst före-antal görs genom
  att skapa en **ny** rad (`StockMovement`, `ActivityLog`-post) — inte genom att uppdatera och
  därmed förlora det gamla värdet.
- **`ActivityLog` är append-only** — inga UPDATE/DELETE på loggrader från applikationskoden.
- Migrationer hanteras med `prisma migrate dev` under utveckling. Varje fas som ändrar schemat
  ska ha en egen, namngiven migration (t.ex. `add_product_and_category`).
- Fast enhet **flak/pall** representeras inte som en enum med flera val — det finns bara en
  enhet, så fältet kan vara implicit eller en konstant, inte ett användarval.
- `Product.brandId` och `Product.supplierId` hålls isär — ett varumärke är inte samma sak som en
  leverantör (se `business-rules.md`, punkt 5).
