'use client';

import { useState } from 'react';
import { resolveTicket } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResolveButton({ ticketId }: { ticketId: string }) {
    const [isResolving, setIsResolving] = useState(false);
    const router = useRouter();

    const handleResolve = async () => {
        setIsResolving(true);
        const res = await resolveTicket(ticketId);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.message || 'Error al resolver el ticket');
            setIsResolving(false);
        }
    };

    return (
        <Button 
            onClick={handleResolve} 
            disabled={isResolving}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
        >
            <CheckCircle className="w-4 h-4 mr-1" />
            {isResolving ? 'Resolviendo...' : 'Marcar Resuelto'}
        </Button>
    );
}
