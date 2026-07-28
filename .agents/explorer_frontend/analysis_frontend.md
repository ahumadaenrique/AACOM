# Auditoría de Frontend, Estado Cliente y Rendimiento de Renderizado — AACOM

**Fecha**: 2026-07-27  
**Área de Auditoría**: React Components (`src/app`, `src/components`), Estado Cliente, Renderizado y Dependencias  
**Estado**: Finalizado (Read-Only Investigation)

---

## Resumen Ejecutivo

La investigación del frontend de la aplicación AACOM (Next.js 14 App Router + React 18) revela una arquitectura fuertemente acoplada a componentes cliente monolíticos sin capa centralizada de gestión de estado o caché de datos en cliente (ausencia de TanStack Query, SWR, Zustand o React Context global). 

Se identificaron **redundancias severas en la consulta de datos**, **monolitos de cliente de más de 5,000 líneas sin memorización (`useMemo`/`useCallback`)**, **waterfalls de datos secuenciales en `useEffect`**, **fugas de memoria en eventos/recursos** y **dependencias pesadas empaquetadas estáticamente en el bundle cliente inicial**.

---

## 1. Redundancias de Datos y Estado Cliente

### 1.1 Consulta Duplicada de Entidades en Servidor/Layouts (SSR)
- **Archivos e Impacto**:
  - `src/app/layout.tsx` (Líneas 17-20 y 127-130): En `generateMetadata` y en `RootLayout`, si la agencia no se encuentra inicialmente por slug, ejecuta **exactamente la misma consulta** `prisma.agency.findUnique({ where: { slug } })` dos veces seguidas por renderizado.
  - `src/app/(dashboard)/layout.tsx` (Líneas 58, 69, 121): `DashboardLayout` realiza hasta 3 verificaciones/consultas redundantes a `prisma.agency` para resolver la agencia del usuario/slug en una misma petición.
- **Detalle de evidencia**:
  ```ts
  // src/app/layout.tsx (líneas 17-20 y 127-130)
  agency = await prisma.agency.findUnique({ where: { slug } });
  if (!agency) {
      agency = await prisma.agency.findUnique({ where: { slug } }); // Consulta idéntica duplicada
  }
  ```

### 1.2 Ausencia de Caché Global Cliente / Peticiones API Repetidas por Componente
Al no contar con una librería de estado/caché cliente (como React Query o SWR), múltiples componentes re-solicitan los mismos recursos desde cero en `useEffect` al montarse:
- **Configuración UDI (`getUdiSetting`)**:
  - `src/app/(dashboard)/admin/AdminClient.tsx` (Línea 695)
  - `src/app/(dashboard)/cotizador/CotizadorClient.tsx` (Línea 145)
  - `src/app/(dashboard)/adn/AdnClient.tsx` (Línea 147)
- **Usuario Actual (`getCurrentUser` / `auth`)**:
  - Re-consultado independientemente en `RootLayout`, `DashboardLayout`, `AdminClient.tsx` (Línea 679), `TeamClient.tsx` (Línea 106), `AgentPlanClient.tsx`.
- **Directorio de Agentes / Usuarios (`getAgents`, `getUsers`)**:
  - Re-consultado de forma aislada en `CotizadorClient.tsx` (Línea 140), `AdminClient.tsx` (Línea 705), `BibliotecaAdmin.tsx` y `CarteraTableClient.tsx`.

### 1.3 Estado Monolítico Duplicado en Componentes Gigantes
- **Archivo**: `src/app/(dashboard)/admin/AdminClient.tsx` (5,063 líneas)
- **Detalle**: El componente administra más de 40 estados `useState` individuales en la raíz del componente. Las respuestas de Server Actions (como `getAdminDashboardStats()`) se desglosan en 4 variables de estado paralelas (`agentStatsList`, `globalProductCounts`, `globalTotalCount`, `globalTotalPrimasPesos`) en lugar de mantener un objeto unificado o sub-componentes modulares.

---

## 2. Cuellos de Botella de Rendimiento y Procesos Ociosos

### 2.1 Re-renderizados Masivos sin Memorización (`useMemo` / `useCallback`)
Los componentes cliente principales operan como gigantescos árboles monolithic donde cualquier cambio en un `input` de texto (como una búsqueda o un formulario) provoca el re-renderizado de **todo el árbol de componentes cliente**:
1. `src/app/(dashboard)/admin/AdminClient.tsx` (5,063 líneas):
   - Cada pulsación en cualquier buscador de tabla (`searchQuery`, `searchUsers`, `searchDocs`, etc.) o campo de texto provoca la re-ejecución de 5,000+ líneas de código JSX y filtrado sincrónico de listas sin ningún `useMemo` ni `useCallback`.
2. `src/app/(dashboard)/cotizador/CotizadorClient.tsx` (2,218 líneas):
   - Mantiene tablas de cálculo financiero masivas (UDIs, amortizaciones, coberturas) que se recalculan en cada frame de render sin `useMemo`.
3. `src/app/(dashboard)/cartera/CarteraTableClient.tsx` (Líneas 17, 19-30):
   - `uniqueAgents` (mapeo y creación de `Set`) y `filteredPolicies` se recalculan sincrónicamente en cada render cuando el usuario escribe en el input de búsqueda `searchTerm`.
4. `src/components/SoftAurora.tsx` (Línea 280):
   - Matriz de dependencias de `useEffect` con 14 propiedades (`[speed, scale, brightness, color1, color2, noiseFrequency, noiseAmplitude, bandHeight, bandSpread, octaveDecay, layerOffset, colorSpeed, enableMouseInteraction, mouseInfluence]`).
   - Cada cambio de prop destruye el lienzo WebGL, destruye los shaders, elimina el nodo DOM y vuelve a inicializar el contexto WebGL desde cero.

### 2.2 Waterfalls de Carga de Datos en Cliente (Secuenciales en `useEffect`)
Múltiples componentes ejecutan llamadas asíncronas secuenciales con `await` encadenado, bloqueando la carga completa cuando podrían ejecutarse en paralelo con `Promise.all`:
- **`src/app/(dashboard)/activity/ActivityClient.tsx`** (Líneas 94 & 101):
  ```ts
  const daily = await getDailyActivitySummary(); // Petición 1
  const hist = await getActivityHistory();     // Petición 2 (espera a que termine la 1)
  ```
- **`src/app/(dashboard)/team/TeamClient.tsx`** (Líneas 105 & 106):
  ```ts
  const teamRes = await getTeamDirectory();   // Petición 1
  const userRes = await getCurrentUser();     // Petición 2 (espera a que termine la 1)
  ```
- **`src/app/(dashboard)/admin/AdminClient.tsx`** (Líneas 665, 669, 674, 232):
  - Ejecuta múltiples `useEffect` independientes que disparan peticiones a la base de datos consecutivamente al cambiar de pestaña o filtro (`fetchCotizacionesRaw()`, `fetchAdnRaw()`, `loadData()`, `fetchSurveys()`).

### 2.3 Fugas de Memoria, Eventos No Limpiados y Procesos Ociosos
- **Speech Recognition en Chat**:
  - `src/app/agents/[id]/chat/ChatInterface.tsx` (Líneas 166-197):
  - La instancia de `SpeechRecognition` creada en `useEffect` **no** ejecuta `recognition.abort()` o `recognition.stop()` en la función de limpieza `return () => {}`. Si el usuario navega fuera de la vista de chat mientras el micrófono está activo, el proceso del navegador permanece escuchando en segundo plano.
- **Fuga de Blob URLs en Carga de Imágenes**:
  - `src/app/(dashboard)/admin/agencia/AgencySettingsForm.tsx` (Líneas 56-57):
  - Se genera un objeto temporal con `URL.createObjectURL(file)` para el preview del logo, pero **nunca** se invoca `URL.revokeObjectURL(objectUrl)` al desmontar o reemplazar la imagen.
- **Recarga Completa de Página (Full Page Reload)**:
  - `src/app/(dashboard)/newsletters/NewslettersClient.tsx` (Línea 51):
  - Al refrescar la curación de noticias se ejecuta `window.location.reload()`, perdiendo todo el estado React cliente y forzando la redescarga completa del documento HTML y los assets del sitio.

### 2.4 Bloat de Dependencias y Paquetes Pesados en Bundle Cliente
- **`xlsx` (~1.5 MB uncompressed)**:
  - Importado estáticamente con `import * as XLSX from "xlsx"` en `src/app/(dashboard)/cotizador/CotizadorClient.tsx` (Línea 4) y `src/app/(dashboard)/cartera/importar/page.tsx` (Línea 5).
  - Incluye todo el parser de hojas de cálculo Excel en el bundle inicial de JavaScript del cliente en lugar de importarlo dinámicamente (`await import('xlsx')`) únicamente cuando el usuario presiona "Exportar" o "Importar".
- **`html-to-image` (Paquete Ocioso)**:
  - Declarado en `package.json` (Línea 49), pero **no se utiliza en ningún archivo** de la carpeta `src/`.
- **`canvas-confetti`**:
  - Importado estáticamente en `src/app/(dashboard)/plan-arranque/AgentPlanClient.tsx` (Línea 11) en lugar de utilizar `await import('canvas-confetti')` sólo al momento del triunfo.

---

## 3. Matriz de Hallazgos y Severidad

| ID | Categoría | Archivo y Línea | Problema / Riesgo | Severidad |
|---|---|---|---|---|
| FRONT-01 | Redundancia DB | `src/app/layout.tsx:17-20, 127-130` | Duplicidad exacta de `prisma.agency.findUnique` en SSR | **Alta** |
| FRONT-02 | Redundancia DB | `src/app/(dashboard)/layout.tsx:58,69,121` | Hasta 3 queries redundantes a Agency en dashboard layout | **Alta** |
| FRONT-03 | Componente Monolito | `src/app/(dashboard)/admin/AdminClient.tsx:1-5063` | Componente cliente de 5,063 líneas sin memorización ni modularidad | **Crítica** |
| FRONT-04 | Re-renders | `src/app/(dashboard)/cotizador/CotizadorClient.tsx:1-2218` | Recálculo de tablas financieras en cada render sin `useMemo` | **Alta** |
| FRONT-05 | Waterfall API | `src/app/(dashboard)/activity/ActivityClient.tsx:94,101` | Peticiones secuenciales `await` en `loadData` | **Media** |
| FRONT-06 | Waterfall API | `src/app/(dashboard)/team/TeamClient.tsx:105-106` | Peticiones secuenciales `await` en `loadData` | **Media** |
| FRONT-07 | Bundle Bloat | `src/app/(dashboard)/cotizador/CotizadorClient.tsx:4` | Importación estática de `xlsx` (~1.5MB) en bundle cliente | **Alta** |
| FRONT-08 | Bundle Bloat | `package.json:49` | Paquete `html-to-image` sin ningún uso en el código fuente | **Baja** |
| FRONT-09 | Fuga de Recursos | `src/app/agents/[id]/chat/ChatInterface.tsx:166-197` | Instancia de SpeechRecognition sin cleanup en unmount | **Media** |
| FRONT-10 | Fuga de Memoria | `src/app/(dashboard)/admin/agencia/AgencySettingsForm.tsx:56-57` | `URL.createObjectURL` sin `URL.revokeObjectURL` | **Baja** |
| FRONT-11 | Performance WebGL | `src/components/SoftAurora.tsx:280` | Destrucción/Recreación de WebGL por cambios de props | **Media** |
| FRONT-12 | Recarga de Página | `src/app/(dashboard)/newsletters/NewslettersClient.tsx:51` | Uso de `window.location.reload()` para refrescar noticias | **Media** |

---

## 4. Propuestas de Mejora y Acciones Recomendadas

1. **Modularización de Componentes Monolíticos**:
   - Dividir `AdminClient.tsx` en componentes independientes por pestaña (`AdminProductividad`, `AdminAgentes`, `AdminVotaciones`, `AdminComunicados`), aislando el estado `useState` al alcance de cada submódulo.
2. **Implementación de Caché de Datos Cliente**:
   - Adoptar TanStack Query (React Query) o SWR para deduplicar peticiones API en cliente (`getUdiSetting`, `getCurrentUser`, `getAgents`) y evitar re-fetchings innecesarios.
3. **Optimización de Bundle con Dynamic Imports**:
   - Reemplazar `import * as XLSX from "xlsx"` por llamadas dinámicas `const XLSX = await import("xlsx")` únicamente en las funciones que procesan archivos Excel.
   - Eliminar `html-to-image` de `package.json`.
4. **Paralelización de Peticiones (Eliminación de Waterfalls)**:
   - Utilizar `Promise.all([getDailyActivitySummary(), getActivityHistory()])` en `ActivityClient` y `TeamClient`.
5. **Limpieza de Recursos (Cleanups)**:
   - Añadir `return () => { if (rec) rec.abort(); }` en `ChatInterface.tsx`.
   - Añadir `URL.revokeObjectURL` en `AgencySettingsForm.tsx`.
