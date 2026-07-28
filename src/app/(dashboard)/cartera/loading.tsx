import DashboardSkeleton from "@/components/ui/DashboardSkeleton";
import PremiumGuard from "@/components/PremiumGuard";

export default function Loading() {
  // Using PremiumGuard to keep the layout structure consistent if needed, 
  // though loading.tsx naturally replaces the children of the layout.
  return (
    <PremiumGuard userRole={null} moduleName="Cargando...">
        <DashboardSkeleton />
    </PremiumGuard>
  );
}
