
"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SALES_ACTIVITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export interface ActivityRecord {
    activityId: string;
    planned: number;
    real: number;
}

interface ActivityTableProps {
    records: ActivityRecord[];
    onUpdate: (activityId: string, field: "planned" | "real", value: number) => void;
    onSave: () => void;
}

export function ActivityTable({ records, onUpdate, onSave }: ActivityTableProps) {
    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Actividad</TableHead>
                        <TableHead>Valor Puntos</TableHead>
                        <TableHead>Planeación (Cant.)</TableHead>
                        <TableHead>Real (Cant.)</TableHead>
                        <TableHead className="text-right">Total Puntos</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {SALES_ACTIVITIES.map((activity) => {
                        const record = records.find((r) => r.activityId === activity.id) || { planned: 0, real: 0 };
                        const rowPoints = record.real * activity.value;

                        return (
                            <TableRow key={activity.id}>
                                <TableCell className="font-medium">{activity.name}</TableCell>
                                <TableCell>{activity.value}</TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={record.planned || ""}
                                        onChange={(e) => onUpdate(activity.id, "planned", parseInt(e.target.value) || 0)}
                                        className="w-20"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={record.real || ""}
                                        onChange={(e) => onUpdate(activity.id, "real", parseInt(e.target.value) || 0)}
                                        className="w-20"
                                    />
                                </TableCell>
                                <TableCell className="text-right font-bold text-gray-600 dark:text-gray-300">
                                    {rowPoints}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <div className="flex justify-end mt-6 items-center">
                <Button onClick={onSave} size="lg" className="px-8 font-bold text-md">
                    Guardar Actividad
                </Button>
            </div>
        </div>
    );
}

