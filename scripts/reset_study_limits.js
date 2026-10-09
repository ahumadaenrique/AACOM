const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getPlanAndLimit(agency) {
  if (['aacom', 'aacomsoft', 'demo'].includes(agency.slug)) {
    return { plan: 'ANNUAL', limit: 52 };
  }

  const plan = agency.subscriptionPlan ? agency.subscriptionPlan.toUpperCase() : null;
  if (plan === 'ANNUAL' || plan === '12M') return { plan: 'ANNUAL', limit: 52 };
  if (plan === 'SEMIANNUAL' || plan === '6M') return { plan: 'SEMIANNUAL', limit: 25 };
  if (plan === 'QUARTERLY' || plan === '3M') return { plan: 'QUARTERLY', limit: 12 };

  if (agency.subscriptionEndDate) {
    const end = new Date(agency.subscriptionEndDate).getTime();
    const now = Date.now();
    const daysRemaining = (end - now) / (1000 * 60 * 60 * 24);
    if (daysRemaining > 200) return { plan: 'ANNUAL', limit: 52 };
    if (daysRemaining > 100) return { plan: 'SEMIANNUAL', limit: 25 };
    return { plan: 'QUARTERLY', limit: 12 };
  }

  return { plan: 'QUARTERLY', limit: 12 };
}

async function main() {
  console.log("=== RESETEANDO SALDOS DE SIMULADORES CÉDULA A Y B ===");
  const agencies = await prisma.agency.findMany();
  console.log(`Se encontraron ${agencies.length} agencias.`);

  for (const agency of agencies) {
    const { plan, limit } = getPlanAndLimit(agency);
    console.log(`Agencia: ${agency.name} (${agency.slug}) -> Plan: ${plan}, Nuevo Límite: ${limit} días`);

    // Actualizar plan en Agency si está nulo
    if (!agency.subscriptionPlan) {
      try {
        await prisma.agency.update({
          where: { id: agency.id },
          data: { subscriptionPlan: plan }
        });
      } catch (e) {
        console.warn(`No se pudo actualizar subscriptionPlan en agency ${agency.id}:`, e.message);
      }
    }

    // Resetear saldo a nivel de agencia
    const agencyKey = `agency_${agency.id}`;
    await prisma.promotorSaldo.upsert({
      where: { promotor_email: agencyKey },
      update: {
        dias_disponibles: limit,
        fecha_actualizacion: new Date()
      },
      create: {
        promotor_email: agencyKey,
        dias_disponibles: limit,
        fecha_actualizacion: new Date()
      }
    });
    console.log(` -> Saldo reseteado para ${agencyKey}: ${limit} días.`);
  }

  // Verificar si hay promotores individuales huérfanos sin prefijo agency_
  const allSaldos = await prisma.promotorSaldo.findMany();
  for (const s of allSaldos) {
    if (!s.promotor_email.startsWith('agency_')) {
      const user = await prisma.user.findUnique({
        where: { email: s.promotor_email },
        include: { agency: true }
      });
      if (user && user.agency) {
        const { limit } = getPlanAndLimit(user.agency);
        await prisma.promotorSaldo.update({
          where: { promotor_email: s.promotor_email },
          data: {
            dias_disponibles: limit,
            fecha_actualizacion: new Date()
          }
        });
        console.log(` -> Saldo de promotor individual ${s.promotor_email} actualizado a ${limit} días.`);
      }
    }
  }

  console.log("\n=== RESET COMPLETADO CON ÉXITO ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
