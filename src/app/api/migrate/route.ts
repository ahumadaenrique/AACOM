import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const posts = await prisma.draftPost.findMany({
            include: {
                AIAgent: {
                    select: {
                        name: true,
                        userId: true
                    }
                }
            }
        });
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                phone: true,
                role: true
            }
        });

        return NextResponse.json({
            success: true,
            posts,
            users
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
