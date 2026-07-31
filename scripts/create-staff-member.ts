// Engångsverktyg för att skapa en personalprofil med PIN-kod, för att kunna
// testa PIN-komponenten innan Fas 2 bygger en riktig "Personal"-sida.
//
// Körs med: npx tsx scripts/create-staff-member.ts "Förnamn Efternamn" 1234

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [name, pin] = process.argv.slice(2);

  if (!name || !pin || !/^\d{4,6}$/.test(pin)) {
    console.error('Användning: npx tsx scripts/create-staff-member.ts "Namn" <4-6 siffror>');
    process.exit(1);
  }

  const pinHash = await bcrypt.hash(pin, 10);

  const staffMember = await prisma.staffMember.create({
    data: { name, pinHash },
  });

  console.log(`Klart. Personalprofil "${staffMember.name}" skapad (id ${staffMember.id}).`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("FEL:", err);
  await prisma.$disconnect();
  process.exit(1);
});
