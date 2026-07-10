const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: "enrique.ahumada@aacommx.com" },
        include: { agency: true }
    });
    console.log("USER ENRIQUE:", {
        email: user.email,
        agencyId: user.agencyId,
        agencyName: user.agency?.name,
        agencySlug: user.agency?.slug,
        agencyColor: user.agency?.primaryColor
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
