// Engångsverktyg för att skapa den gemensamma systeminloggningen
// (skills/authentication-and-pin.md, 21.1). Det finns medvetet ingen
// självregistrering i appen - kontot skapas en gång av den som sätter upp systemet.
//
// Körs med: npx tsx scripts/create-system-user.ts <användarnamn> <lösenord>

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [username, password] = process.argv.slice(2);

  if (!username || !password) {
    console.error("Användning: npx tsx scripts/create-system-user.ts <användarnamn> <lösenord>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.systemUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`Klart. Systeminloggning för "${user.username}" är skapad/uppdaterad.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("FEL:", err);
  await prisma.$disconnect();
  process.exit(1);
});
