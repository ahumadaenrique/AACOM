const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const agents = await prisma.agent.findMany({ take: 1 });
    if (agents.length > 0) {
      console.log("Agent to delete:", agents[0]);
      // Attempt to delete it inside a transaction that we rollback, just to see the error
      await prisma.$transaction(async (tx) => {
        await tx.agent.delete({ where: { id: agents[0].id } });
        throw new Error("ROLLBACK");
      });
    } else {
      console.log("No agents found");
    }
  } catch (err) {
    if (err.message === "ROLLBACK") console.log("Deletion would be SUCCESSFUL");
    else console.error("Error:", err);
  }
}
main().finally(() => prisma.$disconnect());
