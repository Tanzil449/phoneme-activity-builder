
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL must be a valid SQLite file URL."
    );
  }

  const databaseLocation = databaseUrl.slice(5);

  const databasePath = path.isAbsolute(databaseLocation)
    ? databaseLocation
    : path.resolve(process.cwd(), databaseLocation);

  const adapter = new PrismaBetterSqlite3({
    url: `file:${databasePath}`,
  });

  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}