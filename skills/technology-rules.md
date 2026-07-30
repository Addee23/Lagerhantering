# Technology rules

## Stack
- **Next.js**, senaste stabila version (App Router), installerad via `next@latest` vid
  projektstart — inte en hårdkodad gammal version.
- **TypeScript** överallt (inga `.js`-filer för applikationskod).
- **Tailwind CSS** för styling.
- **MySQL** som databas (lokalt via XAMPP under utveckling).
- **Prisma ORM** för databasschema, migreringar och queries.
- **Git + GitHub** för versionshantering.
- **OpenAI API** för dokumenttolkning (fakturor/följesedlar/orderbekräftelser) och textförslag
  (reklamationsmejl, svarsförslag).
- **IMAP** för att läsa inkommande reklamationsmejl, **SMTP** (eller lämpligt mejl-API) för
  utgående mejl.

## Regler
- Projektet får **inte** byggas mot en canary- eller beta-version av Next.js utan separat
  godkännande.
- Inga stora ramverksbyten eller omstruktureringar "för säkerhets skull" — håll dig till stacken
  ovan om inget annat uttryckligen godkänns.
- Miljövariabler (databas-URL, OpenAI-nyckel, IMAP/SMTP-uppgifter) ligger i `.env` och committas
  **aldrig** till Git (`.env` ska stå i `.gitignore`).
- Kör lint + typkontroll innan en fas rapporteras som klar (se `testing-and-phase-approval.md`).
