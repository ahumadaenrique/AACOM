"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function logErrorToDatabase(errorInfo: { message: string; stack?: string; path?: string }) {
  try {
    const session = await auth();
    
    await prisma.appErrorLog.create({
      data: {
        message: errorInfo.message || "Unknown error",
        stack: errorInfo.stack || "",
        path: errorInfo.path || "unknown",
        userId: session?.user?.id || null,
        userName: session?.user?.name || null,
        agencyId: session?.user?.agencyId || null,
      },
    });
    console.log("[Error Logged to DB successfully]");
  } catch (err) {
    console.error("Failed to log error to database:", err);
  }
}
