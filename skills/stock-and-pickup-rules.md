# Stock and pickup rules

## De två lagren
- **Lager** (externt lager): exakt saldo. Håller produkter, antal flak/pall, bäst före-datum,
  leveransparti, senaste förändringar, vad som är reserverat för hämtning, vad som flyttats till
  butik.
- **Butik**: inget exakt löpande saldo. Håller bäst före-datum, ungefärligt antal kvar per parti,
  fritext-placering (tidigare använda placeringar visas som förslag), samt vilka produkter som är
  slut/behöver beställas.

Enheten är alltid **flak/pall** — aldrig styck, paket eller annan enhet.

## Hämtlista (PickupList) — lager → butik
Statusflöde: **Utkast → Klar att hämta → Hämtning pågår → Slutförd** (kan även **Avbrytas**).

Skapa: sök produkt → se tillgängligt antal → ange antal att hämta → lägg till fler rader →
valfri kommentar → spara.

Vid hämtning (mobil vy) kan personen per rad: markera som hämtad, ange faktiskt hämtat antal,
markera att produkten saknades eller att bara en del fanns, skriva kommentar, skanna streckkod
för kontroll.

Vid slutförande (kräver PIN):
- Lagersaldot minskar med **faktiskt hämtat antal** (inte det ursprungligt begärda).
- Flytten till butik registreras, inklusive vem som godkände samt datum/tid och ev. avvikelser.
- Relevant bäst före-info förs över till butiken.
- Listan bevaras i historiken — kan inte ändras i efterhand utan ett separat korrigeringsflöde.
- Överföringen lovar **inte** att antalet fortfarande finns kvar i butiken efter försäljning
  (eftersom butiken saknar exakt löpande saldo).

## Lagerkorrigeringar
Manuella korrigeringar och kassationer på lagret kräver PIN och skapar en ny loggrad — skriver
aldrig över tidigare historik. Negativt saldo ska förhindras eller kräva särskild bekräftelse.
