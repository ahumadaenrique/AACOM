import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"

export default async function AdnPage() {
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mt-4">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-bold">ADN - AACOM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{session?.user?.email}</span>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <Button variant="outline" size="sm">Cerrar Sesión</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-slate-800 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Simulador Cédula A</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Accede al portal interactivo de estudio, repasa los 6 módulos con audio explicativo y realiza simulacros de examen con la estructura oficial de la CNSF.
            </p>
            <a 
              href="/cedula-a/index.html" 
              className="mt-4 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-center transition-colors duration-200 shadow-lg shadow-purple-900/30"
            >
              Ingresar al Portal
            </a>
          </div>
          
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold text-slate-400">Módulo de Captura</h3>
            <p className="text-sm text-slate-500">Módulo de captura en construcción...</p>
          </div>
        </div>
      </main>
    </div>
  )
}
