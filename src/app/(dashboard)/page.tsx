import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import ClientHome from "./ClientHome"
import { headers } from "next/headers"

export default async function HomePage() {
    const session = await auth();
    const headersList = headers();
    let agency = null;
    if (session?.user?.agencyId) {
        agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } });
    }
    if (!agency) {
        const slug = headersList.get('x-agency-slug') || process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';
        agency = await prisma.agency.findUnique({ where: { slug } });
    }
    if (!agency) {
        agency = await prisma.agency.findUnique({ where: { slug: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' } });
    }
    const agencyName = agency?.name || "SYSGPYA";
    let isBirthday = false;
    let currentUser = null;

    if (session?.user?.email) {
        currentUser = await prisma.user.findUnique({
            where: { email: session.user.email.toLowerCase() },
            select: {
                name: true,
                image: true,
                birthDate: true,
                role: true
            }
        });

        if (currentUser?.role === 'SELLER') {
            const { redirect } = await import("next/navigation");
            redirect("/vendedor");
        }

        if (currentUser?.birthDate) {
            // Calculate Mexico City date YYYY-MM-DD
            const cdmxTodayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
            const [_, todayMonth, todayDay] = cdmxTodayStr.split('-').map(Number); // month is 1-indexed

            const bDate = new Date(currentUser.birthDate);
            // We use getUTCDate/getUTCMonth to avoid local server timezone offsets when parsing database timestamps
            const bMonth = bDate.getUTCMonth() + 1; // 1-indexed
            const bDay = bDate.getUTCDate();

            if (bMonth === todayMonth && bDay === todayDay) {
                isBirthday = true;
            }
        }
    }

    const defaultAgencySlug = process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom';
    const isDefaultAgency = agency?.slug === defaultAgencySlug;

    const announcements = await prisma.content.findMany({
        where: {
            type: 'HOME_AD',
            active: true,
            OR: isDefaultAgency 
                ? [ { agencyId: agency?.id || undefined }, { agencyId: null } ]
                : [ { agencyId: agency?.id || undefined } ]
        },
        orderBy: [
            { order: 'asc' },
            { createdAt: 'desc' }
        ]
    });

    const activeUsers = await prisma.user.findMany({
        where: {
            active: true,
            birthDate: { not: null },
            OR: isDefaultAgency 
                ? [ { agencyId: agency?.id || undefined }, { agencyId: null } ]
                : [ { agencyId: agency?.id || undefined } ]
        },
        select: {
            id: true,
            name: true,
            image: true,
            birthDate: true
        }
    });

    const cdmxTodayStrForBday = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    const [todayYear, todayMonthRaw, todayDayRaw] = cdmxTodayStrForBday.split('-').map(Number);
    const todayForBday = new Date(todayYear, todayMonthRaw - 1, todayDayRaw);
    
    const todayBirthdays: any[] = [];
    const upcomingBirthdays: any[] = [];

    activeUsers.forEach(u => {
        if (!u.birthDate) return;
        const bDate = new Date(u.birthDate);
        const bMonth = bDate.getUTCMonth();
        const bDay = bDate.getUTCDate();
        
        if (bMonth === todayMonthRaw - 1 && bDay === todayDayRaw) {
            todayBirthdays.push({ id: u.id, name: u.name, image: u.image, birthDate: u.birthDate.toISOString() });
        } else {
            let nextBday = new Date(todayYear, bMonth, bDay);
            if (nextBday < todayForBday) {
                nextBday = new Date(todayYear + 1, bMonth, bDay);
            }
            const diffTime = nextBday.getTime() - todayForBday.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0 && diffDays <= 30) {
                upcomingBirthdays.push({
                    id: u.id,
                    name: u.name,
                    image: u.image,
                    birthDate: u.birthDate.toISOString(),
                    daysUntil: diffDays,
                    nextBirthday: nextBday.toISOString()
                });
            }
        }
    });

    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-4 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">Inicio</h1>
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Bienvenido a SYSGPYA (Sistema de gestión de promotorías y agencias).</p>
            </div>

            <ClientHome 
                announcements={announcements} 
                isBirthday={isBirthday} 
                currentUser={currentUser ? { name: currentUser.name, image: currentUser.image } : null} 
                agencyName={agencyName}
                isAdmin={currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'}
                todayBirthdays={todayBirthdays}
                upcomingBirthdays={upcomingBirthdays}
            />
        </div>
    )
}
