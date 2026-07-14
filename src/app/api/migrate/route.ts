import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        console.log('Running prisma db push on Vercel production database...');
        const output = execSync('npx prisma db push --accept-data-loss', { 
            encoding: 'utf-8',
            env: { ...process.env }
        });
        
        return NextResponse.json({
            success: true,
            message: "Database schema successfully synchronized on Vercel production DB!",
            output: output
        });
    } catch (e: any) {
        console.error('Migration error:', e);
        return NextResponse.json({ 
            success: false, 
            error: e.message,
            stderr: e.stderr?.toString(),
            stdout: e.stdout?.toString()
        });
    }
}
