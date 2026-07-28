import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import PremiumGuard from "@/components/PremiumGuard";

export default function Loading() {
  return (
    <PremiumGuard userRole={null} moduleName="Cargando...">
        <DashboardSkeleton />
    </PremiumGuard>
  );
}
