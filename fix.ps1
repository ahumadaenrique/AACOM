$file = "C:/Users/ahuma/OneDrive/Documentos/Google Antigravity/aacom-25/src/app/actions.ts"
$content = Get-Content $file -Raw

$target = @"
export async function getWeeklyReportData(startDate: string, endDate: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "No autenticado" };
        });

        // Parse CDMX dates to UTC for accurate AdnDiagnostic filtering
"@

$replacement = @"
export async function getWeeklyReportData(startDate: string, endDate: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "No autenticado" };

    try {
        const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!currentUser || currentUser.role !== 'ADMIN') return { success: false, message: "Permisos insuficientes" };

        const agents = await prisma.user.findMany({
            where: { active: true },
            select: { id: true, name: true, image: true }
        });

        const logs = await prisma.activityLog.findMany({
            where: {
                dateStr: { gte: startDate, lte: endDate }
            }
        });

        // Parse CDMX dates to UTC for accurate AdnDiagnostic filtering
"@

$content = $content.Replace($target, $replacement)
Set-Content $file -Value $content
