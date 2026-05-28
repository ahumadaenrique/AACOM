"use client";

import { saveActivity } from "@/app/actions";

import { useState, useEffect } from "react";
import { ActivityTable, ActivityRecord } from "@/components/activity/activity-table";
import { TrafficLight } from "@/components/activity/traffic-light";
import { SALES_ACTIVITIES } from "@/lib/constants";

export default function ActivityPage() {
    const [records, setRecords] = useState<ActivityRecord[]>([]);
    const [totalPoints, setTotalPoints] = useState(0);

    // Initialize
    useEffect(() => {
        // In a real app, verify we are loading for "today"
        const initialRecords = SALES_ACTIVITIES.map((act) => ({
            activityId: act.id,
            planned: 0,
            real: 0,
        }));
        setRecords(initialRecords);
    }, []);

    const handleUpdate = (activityId: string, field: "planned" | "real", value: number) => {
        setRecords((prev) => {
            const newRecords = prev.map((rec) =>
                rec.activityId === activityId ? { ...rec, [field]: value } : rec
            );
            return newRecords;
        });
    };

    useEffect(() => {
        // Calculate total points
        const total = records.reduce((acc, rec) => {
            const activity = SALES_ACTIVITIES.find((a) => a.id === rec.activityId);
            if (!activity) return acc;
            return acc + (rec.real * activity.value);
        }, 0);
        setTotalPoints(total);
    }, [records]);

    const handleSave = async () => {
        try {
            const result = await saveActivity(records);
            if (result.success) {
                alert(result.message);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor");
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-card rounded-xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Actividad Diaria</h1>
                    <p className="text-muted-foreground">Registra tu actividad del día {new Date().toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-6 bg-muted/40 p-4 rounded-xl border">
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Puntos Hoy</p>
                        <p className="text-4xl font-extrabold">{totalPoints}</p>
                    </div>
                    <div className="h-16 w-px bg-border mx-2"></div>
                    <TrafficLight points={totalPoints} />
                </div>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6">
                <ActivityTable records={records} onUpdate={handleUpdate} onSave={handleSave} />
            </div>
        </div>
    );
}
