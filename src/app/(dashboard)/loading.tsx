export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full space-y-4">
      <div className="relative flex items-center justify-center w-16 h-16">
        <div className="absolute w-full h-full border-4 border-slate-100 dark:border-zinc-800 rounded-full"></div>
        <div className="absolute w-full h-full border-4 border-indigo-600 dark:border-indigo-400 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
        Cargando...
      </div>
    </div>
  );
}
