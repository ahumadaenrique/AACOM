import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const clients = await prisma.client.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { policies: true }
  })
  console.log("Matches:", JSON.stringify(clients, null, 2))
}
main().finally(() => prisma.$disconnect())
