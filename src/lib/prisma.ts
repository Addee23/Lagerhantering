import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Next.js laddar om moduler ofta under utveckling (hot reload). Utan detta
// skulle varje omladdning skapa en ny databasanslutning och till slut fylla
// upp MySQL:s anslutningsgräns. Vi sparar därför klienten på `globalThis` så
// samma instans återanvänds mellan omladdningarna.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
