# Reporte Final de Auditoría de Código y Arquitectura — AACOM Web Application

## Resumen Ejecutivo

El presente documenta el **Reporte Final de Auditoría de Código, Esquema y Arquitectura** realizado sobre la plataforma web **AACOM** (desarrollada con Next.js 14 App Router, React 18, PostgreSQL y Prisma ORM). La investigación se llevó a cabo mediante un análisis estático de código en modalidad estrictamente **READ-ONLY**, cubriendo de forma exhaustiva los componentes del esquema de base de datos (`prisma/schema.prisma`), la totalidad de las 42 rutas de API (`src/app/api`), los manejadores de Server Actions (`src/app/actions.ts`, `src/app/sellerActions.ts`, etc.), los componentes de cliente React en la capa visual (`src/app`, `src/components`), el middleware de autenticación y las dependencias del proyecto (`package.json`).

El objetivo central de la auditoría es identificar **redundancias de datos**, **cuellos de botella de rendimiento**, **anti-patrones de arquitectura**, **fugas de memoria/seguridad** y **procesos ociosos**, fundamentando cada hallazgo con la ruta exacta del archivo fuente y los números de línea o nombres de componente correspondientes.

### Principales Conclusiones de la Auditoría:

1. **Ausencia Masiva de Índices en Base de Datos (PostgreSQL / Prisma)**: De 35 modelos definidos en el esquema Prisma, más de 25 carecen de la directiva `@index` en sus llaves foráneas (`agencyId`, `userId`, `clientId`, `sellerId`, `evaluatorId`, etc.). En PostgreSQL, las relaciones de clave foránea en Prisma **no** crean índices implícitos en la base de datos, lo que provoca **Full Table Scans** continuos en operaciones multitenant, filtros de cartera y eliminaciones en cascada.
2. **Anti-patrones de Servidor y Escrituras Bloqueantes en Lecturas (*Write-on-Read*)**: Varios Server Actions dedicados a la lectura de datos (como `getMonthlyAdnRankings` y `getWeeklyReportData`) ejecutan mutaciones masivas `updateMany` a la base de datos previa a la entrega de respuestas. Asimismo, se identificaron lecturas síncronas de archivo por petición HTTP (`fs.readFileSync`), bucles N+1 en cargas masivas CSV (hasta 2,000 consultas individuales consecutivas) y consultas globales de base de datos sin filtro `where` en el módulo de chat con IA (`src/app/api/agents/chat/route.ts:239`).
3. **Redundancia y Desalineación Arquitectónica**: Existen múltiples subsistemas duplicados en paralelo, tales como una arquitectura dual para chatbots de Inteligencia Artificial (SDK de Vercel AI vs API REST directa de Gemini), modelos de conocimiento redundantes (`KnowledgeAsset` vs `KnowledgeDocument`), marcas corporativas triplicadas (`Agency`, `User`, `CompanyProfile`), saldos duplicados (`voiceSecondsBalance` vs `freeSecondsBalance`) y endpoints redundantes para generación y proxificación de PDFs.
4. **Fallas de Seguridad en Crons y Desincronización de Tipos**: Los endpoints de tareas cron (`/api/cron/*`) contienen claves de omisión (*bypass*) quemadas en código duro (`?bypass=aacom123`), permitiendo a cualquier usuario no autenticado forzar la ejecución de crons pesados o borrados de base de datos. Además, existen incoherencias críticas entre el esquema Prisma y el código de crons (`daily-plan-report/route.ts` parseando enteros `Int` como objetos JSON).
5. **Monolitos Cliente, Re-renderizados Masivos y Waterfalls**: El frontend carece de una capa centralizada de caché cliente (como TanStack Query o SWR). Componentes cliente monolíticos de más de 5,000 líneas (`AdminClient.tsx`) operan sin memorización (`useMemo`/`useCallback`), desencadenando recálculos completos del árbol React ante cualquier entrada de texto. Se detectaron encadenamientos secuenciales (*waterfalls*) en `useEffect`, fugas de memoria en Web Speech API y empaquetamiento estático de librerías pesadas (`xlsx` ~1.5 MB) en el bundle cliente inicial.

---

## 1. Redundancias de Datos

### 1.1 Redundancias de Esquema y Modelos de Base de Datos (Prisma)

El análisis del archivo `prisma/schema.prisma` reveló múltiples duplicaciones de atributos, tablas sobrepuestas y desnormalizaciones innecesarias:

1. **Triplicación de Atributos de Identidad Visual y Branding**:
   Existen tres estructuras independientes almacenando la misma información de personalización visual (colores y logotipos):
   - `Agency` (`prisma/schema.prisma`: líneas 35-37):
     ```prisma
     logoUrl        String?
     primaryColor   String?   @default("#4f46e5")
     secondaryColor String?
     ```
   - `User` (`prisma/schema.prisma`: líneas 129-130):
     ```prisma
     brandColor   String? // Color corporativo individual del Agente
     brandLogo    String? // Logo corporativo individual del Agente
     ```
   - `CompanyProfile` (`prisma/schema.prisma`: líneas 639-641):
     ```prisma
     primaryColor   String?   @default("#4f46e5")
     secondaryColor String?   @default("#10b981")
     logoUrl        String?
     ```
   *Impacto*: Ausencia de una fuente única de verdad para la marca en la plataforma y almacenamiento desincronizado de assets gráficos.

2. **Duplicación de Saldo de Minutos de Voz en `User`**:
   El modelo `User` posee dos campos numéricos para registrar el saldo inicial de voz (ElevenLabs):
   - `User.voiceSecondsBalance` (`prisma/schema.prisma`: línea 148): `Int @default(300)`
   - `User.freeSecondsBalance` (`prisma/schema.prisma`: línea 187): `Int @default(300)`
   *Impacto*: Riesgo de desincronización de saldos cuando diferentes controladores decrementan o incrementan uno u otro campo.

3. **Redundancia en el Sistema de Afiliados/Referidos de `Agency`**:
   El modelo `Agency` mantiene dos mecanismos paralelos para registrar la agencia o usuario referente:
   - `referredByAgencyId` (`prisma/schema.prisma`: línea 41): `String?` (campo String sin relación FK).
   - `referredById` (`prisma/schema.prisma`: líneas 69-70): `String?` con `@relation("AgencyReferrer", fields: [referredById], references: [id])` hacia el modelo `User`.
   *Impacto*: Ambigüedad y duplicación de columnas para rastrear la procedencia de una agencia.

4. **Desnormalización Duplicada en `Cotizacion` y `ActivityLog`**:
   - `Cotizacion` (`prisma/schema.prisma`: líneas 311-315): Almacena `userId String?` junto a su relación `user User?`, pero desnormaliza redundantemente los campos de texto `agente String` y `cliente String`.
   - `ActivityLog` (`prisma/schema.prisma`: líneas 416-418): Almacena `activityId`, `activityName String` y `points Int`, duplicando la información que ya reside formalmente en la tabla catálogo `Activity` (`prisma/schema.prisma`: líneas 203-208: `id`, `name`, `value`).

5. **Entidades Sobrepuestas y Duplicación de Modelos de Dominio**:
   - **Agentes Humanos vs Agentes IA vs Catálogos**: `User` (con `role = "AGENTE"`), `Agent` (`prisma/schema.prisma`: líneas 335-343, utilizado únicamente para autocompletado de texto en la agencia) y `AIAgent` (`prisma/schema.prisma`: líneas 587-608, para asistentes de IA).
   - **Documentos de Conocimiento**: `KnowledgeDocument` (`prisma/schema.prisma`: líneas 425-435, por agencia) versus `KnowledgeAsset` (`prisma/schema.prisma`: líneas 652-661, por agente de IA).
   - **Módulo Cédula A Desconectado**: Las tablas `preguntas`, `estudio_progreso`, `examen_intentos`, `estudio_licencias` y `promotor_saldos` (`prisma/schema.prisma`: líneas 696-751) operan de forma aislada vinculándose mediante cadenas de texto de `email` en lugar de llaves foráneas ligadas al ID del modelo `User`.

6. **Almacenamiento de Datos Pesados (Base64) en Base de Datos**:
   - `AdnDiagnostic.evidenciaBase64` (`prisma/schema.prisma`: línea 401): Campo `String?` reservado para almacenar archivos de imagen completos codificados en Base64 directamente dentro de las filas de PostgreSQL.
   - *Impacto*: Hinchamiento masivo de la base de datos (*table bloat*), incrementando dramáticamente el uso de I/O y memoria RAM durante cualquier consulta de diagnósticos ADN.

---

### 1.2 Redundancias de Flujo y Transformación de Datos en Backend/API

1. **Arquitectura Dual para el Asistente de Inteligencia Artificial**:
   Se identificaron dos implementaciones de backend totalmente independientes y desconectadas para gestionar la interacción de chat con IA:
   - `src/app/api/agents/chat/route.ts` (Líneas 1-1587): Implementado mediante el SDK de Vercel AI (`@ai-sdk/google`), consulta los modelos `AIAgent`, `CompanyProfile` y la tabla `KnowledgeAsset`.
   - `src/app/api/assistant/route.ts` (Líneas 1-116): Implementado mediante peticiones HTTP directas `fetch` a la API REST de Google Gemini (`generativelanguage.googleapis.com`), consulta la tabla `KnowledgeDocument`.
   *Impacto*: Inconsistencia en la selección de modelos de IA, duplicación de código para gestión de prompts, y redundancia de las tablas de conocimiento en PostgreSQL.

2. **Rutas Duplicadas para Operaciones con Archivos PDF**:
   - `src/app/api/generate-pdf/route.ts` (Líneas 4-69): Integra el servicio externo PDFShift para renderizar plantillas de cotización a PDF.
   - `src/app/api/pdf/route.ts` (Líneas 4-48): Actúa como un proxy inverso HTTP para servir archivos PDF almacenados de forma privada en Vercel Blob.
   *Impacto*: Dispersión de controladores PDF que incrementa innecesariamente el mantenimiento y la superficie de exposición del sistema.

3. **Estructuras de Objetos Duplicadas en Handlers de API**:
   - `src/app/api/cedula-a/agent-data/route.ts` (Líneas 55-104): Se inicializan manualmente 3 diccionarios JavaScript independientes con exactamente las mismas 6 llaves de módulo en código duro (`timesPerModule`, `studyProgress`, `moduleScores`).

4. **Consultas Repetidas y Re-fetching Redundante en Servidor**:
   - `src/app/api/cedula-a/agent-data/route.ts` (Líneas 83-121): Ejecuta dos consultas consecutivas a la base de datos sobre la tabla `ExamenIntento`. La primera (`attemptsRows`, líneas 83-87) recupera todos los intentos del usuario; la segunda (`latestAttemptRows`, líneas 106-111) consulta nuevamente la misma tabla con `take: 1` ordenado por fecha, a pesar de que dicho último registro ya se encontraba presente en el arreglo de la primera consulta (`attemptsRows[attemptsRows.length - 1]`).
   - `src/app/actions.ts` (Múltiples funciones: líneas 174-176, 223-225, 280-282, 571-573, 641-643, 726-729, 907-909, 1230-1232, 1385-1387): Prácticamente todas las Server Actions re-consultan a la base de datos mediante `prisma.user.findUnique({ where: { email: session.user.email } })`, aun cuando `session.user.id` y `session.user.agencyId` ya están presentes y firmados dentro de la sesión / JWT de NextAuth.

---

### 1.3 Redundancias de Estado y Consultas Repetidas en Frontend

1. **Consultas Duplicadas de Entidades en Servidor/Layouts (SSR)**:
   - `src/app/layout.tsx` (Líneas 17-20 y 127-130): En `generateMetadata` y en `RootLayout`, si la agencia no se encuentra inicialmente por slug, el servidor ejecuta **dos veces consecutivas la misma consulta** `prisma.agency.findUnique({ where: { slug } })` durante la generación del mismo HTML.
   - `src/app/(dashboard)/layout.tsx` (Líneas 58, 69, 121): `DashboardLayout` realiza hasta 3 peticiones/verificaciones redundantes a la tabla `Agency` para resolver la agencia del usuario dentro de una misma petición de renderizado.

2. **Ausencia de Caché Global en Cliente y Consultas API Repetidas por Componente**:
   La plataforma carece de una biblioteca de gestión de estado o caché de datos cliente (ausencia de TanStack Query, SWR o Zustand). Esto provoca que múltiples componentes re-soliciten de forma aislada e independiente los mismos recursos en sus hooks `useEffect` al montarse:
   - **Configuración UDI (`getUdiSetting`)**: Re-solicitado en `src/app/(dashboard)/admin/AdminClient.tsx` (línea 695), `src/app/(dashboard)/cotizador/CotizadorClient.tsx` (línea 145) y `src/app/(dashboard)/adn/AdnClient.tsx` (línea 147).
   - **Usuario Actual (`getCurrentUser`)**: Re-consultado de manera independiente en `RootLayout`, `DashboardLayout`, `AdminClient.tsx` (línea 679), `TeamClient.tsx` (línea 106) y `AgentPlanClient.tsx`.
   - **Directorio de Agentes/Usuarios (`getAgents` / `getUsers`)**: Solicitado de forma desarticulada en `CotizadorClient.tsx` (línea 140), `AdminClient.tsx` (línea 705), `BibliotecaAdmin.tsx` y `CarteraTableClient.tsx`.

3. **Estado Monolítico Duplicado en Componentes Gigantes**:
   - `src/app/(dashboard)/admin/AdminClient.tsx` (Líneas 1-5063): El componente administra más de 40 hooks `useState` en su nodo raíz. Al recibir las respuestas de los Server Actions (como `getAdminDashboardStats()`), el resultado se desglosa manualmente en 4 variables de estado paralelas (`agentStatsList`, `globalProductCounts`, `globalTotalCount`, `globalTotalPrimasPesos`) en lugar de preservar la respuesta en una estructura unificada o delegar en subcomponentes modulares.

---

## 2. Cuellos de Botella y Procesos Ociosos (Rendimiento)

### 2.1 Ausencia Masiva de Índices en Base de Datos y Consultas Sin Scope

1. **Ausencia Crítica de Índices en Claves Foráneas y Filtros en Prisma**:
   En PostgreSQL a través de Prisma, la declaración `fields: [foreignKey]` define una restricción referencial, pero **NO** genera automáticamente un índice secundario en la tabla. En la plataforma AACOM, **más de 25 modelos** carecen de directivas `@index` en sus llaves foráneas y columnas de filtrado frecuente. Esto fuerza al motor PostgreSQL a realizar **Full Table Scans** (lecturas secuenciales completas de disco/tabla) en cada operación multitenant, listado de cartera o borrado en cascada.

   *Detalle de tablas y columnas críticas sin indexar en `prisma/schema.prisma`*:
   - `User` (línea 96: `agencyId`, línea 138: `reportsToId`): **CRÍTICO**. Usado en casi la totalidad de consultas por agencia y árbol jerárquico.
   - `CommissionLedger` (líneas 15, 17, 26: `sellerId`, `agencyId`, `sourceAgencyId`): Consultas financieras y comisiones.
   - `Agency` (línea 69: `referredById`): Sistema de afiliados.
   - `DiscountCode` (línea 87: `sellerId`): Validación de cupones.
   - `Client` (líneas 232, 239: `agencyId`, `userId`): Filtrado de clientes por agente o agencia.
   - `Policy` (líneas 250, 275, 278: `agencyId`, `clientId`, `userId`): **CRÍTICO**. Consultas de cartera y borrado en cascada `Client` -> `Policy`.
   - `Cotizacion` (líneas 309, 311: `agencyId`, `userId`): Cotizaciones guardadas por usuario/agencia.
   - `AdnDiagnostic` (líneas 347, 349: `agencyId`, `userId`): Diagnósticos ADN.
   - `ActivityLog` (líneas 413, 415, 421: `agencyId`, `userId`, `dateStr`): **CRÍTICO**. Cálculo de puntos diarios y reportes por fecha.
   - `KnowledgeDocument` (línea 427: `agencyId`)
   - `PushSubscription` (línea 439: `userId`)
   - `PackDocument` (línea 476: `packId`)
   - `AgencyDocument` (línea 498: `agencyId`)
   - `PerformanceReview` (líneas 514, 516, 518: `agencyId`, `agentId`, `evaluatorId`): Evaluaciones PEA/PRP.
   - `Ticket` (líneas 541, 543: `userId`, `agencyId`)
   - `PollOption` (línea 566: `pollId`)
   - `PollVote` (líneas 580: `optionId`, `agencyId`)
   - `AIAgent` (línea 598: `userId`)
   - `DraftPost` (líneas 612, 618: `aiAgentId`, `status`, `scheduledAt`): Cron de publicación en redes sociales.
   - `InteractionLog` (líneas 625, 627: `aiAgentId`, `userId`)
   - `Meeting` (líneas 666, 670: `date`, `userId`): Agenda y calendario.
   - `Task` (líneas 684, 686: `dueDate`, `userId`): Tareas pendientes.
   - `ExamenIntento` (línea 722: `email`): **CRÍTICO**. Búsqueda de intentos en Cédula A (`where: { email: { in: emails } }`).
   - `EstudioLicencia` (líneas 735, 736: `promotor_email`, `agente_email`)
   - `AppErrorLog` (líneas 828, 830: `userId`, `agencyId`)

2. **Consulta Masiva Sin Scope en Chat de IA**:
   - `src/app/api/agents/chat/route.ts` (Línea 239):
     ```typescript
     const knowledgeAssets = await prisma.knowledgeAsset.findMany()
     ```
   - *Impacto*: La llamada `findMany()` **carece por completo de filtro `where`**. En cada interacción de chat se recuperan todos los registros de conocimiento de todos los usuarios y agencias del sistema, vulnerando la privacidad multitenant y sobrecargando la memoria Node.js.

---

### 2.2 Operaciones Síncronas Bloqueantes, Bucles N+1 y Anti-patrones Write-on-Read en Servidor

1. **Lectura Síncrona de Disco (`fs.readFileSync`) en Handler HTTP de Chat**:
   - `src/app/api/agents/chat/route.ts` (Líneas 172-195):
     ```typescript
     if (!process.env.TAVILY_API_KEY || !process.env.FAL_KEY) {
       try {
         const fs = require('fs');
         const path = require('path');
         const envPath = path.resolve(process.cwd(), '.env');
         if (fs.existsSync(envPath)) {
           const envFile = fs.readFileSync(envPath, 'utf8');
           // Parseo síncrono línea por línea...
         }
       } catch (envError) { ... }
     }
     ```
   - *Impacto*: Ante cada mensaje entrante, si alguna variable opcional no está en memoria, el servidor Node.js ejecuta I/O de disco bloqueante con `readFileSync`, congelando el event loop para todas las solicitudes concurrentes.

2. **Bucles N+1 en Importación Masiva de CSV de Pólizas**:
   - `src/app/(dashboard)/cartera/actions.ts` (Líneas 370-419):
     ```typescript
     for (const row of parsedData) {
       let client = await prisma.client.findFirst({ where: { name: row.clientName, userId: session.user.id } });
       if (!client) client = await prisma.client.create(...);
       if (row.policyNumber) {
         const existingPolicy = await prisma.policy.findFirst({ where: { policyNumber: String(row.policyNumber) } });
         if (!existingPolicy) await prisma.policy.create(...);
       }
     }
     ```
   - *Impacto*: Para un archivo CSV de 500 filas, la función dispara hasta **2,000 consultas SQL secuenciales** a la base de datos con `await` dentro del bucle, sin procesamiento por lotes (*batching*) ni `$transaction`.

3. **Bucles N+1 en Guardado de Plan Diario**:
   - `src/app/actions.ts` (Líneas 1408-1446): En `saveDailyPlan`, se ejecutan hasta 14 llamadas individuales de `upsert` dentro de un bucle `for...of` secuencial.

4. **Consultas No Paginadas y Procesamiento Masivo en Memoria (JavaScript)**:
   - `src/app/(dashboard)/admin/cartera/page.tsx` (Líneas 26-40): Carga la totalidad de clientes y pólizas de la agencia con `prisma.client.findMany` sin paginación (`take`/`skip`), calculando totales y primas con `.reduce()` en JavaScript.
   - `src/app/(dashboard)/cartera/page.tsx` (Líneas 42-52): Trae todas las pólizas del agente para calcular acumulados mediante `.reduce()` y `.filter()`.
   - `src/app/(dashboard)/pea-prp/actions.ts` (Líneas 36-42) y `src/app/actions.ts` (Línea 1362): Recuperan todos los registros de `ActivityLog` para sumar puntos mediante `.reduce()`, ignorando el operador `prisma.activityLog.aggregate({ _sum: { points: true } })`.

5. **Anti-patrón *Write-on-Read* en Server Actions de Lectura**:
   - `src/app/actions.ts` (Líneas 1524-1533, 2101-2106, 2409-2420): En funciones destinadas únicamente a consultar información para la interfaz (`getMonthlyAdnRankings`, `getWeeklyReportData`), se introducen operaciones masivas de escritura (`updateMany`) antes de retornar los datos:
     ```typescript
     // getMonthlyAdnRankings (líneas 1524-1533):
     await prisma.adnDiagnostic.updateMany({
       where: { agencyId: null },
       data: { agencyId: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }
     });
     await prisma.cotizacion.updateMany({
       where: { agencyId: null },
       data: { agencyId: process.env.NEXT_PUBLIC_DEFAULT_AGENCY_SLUG || 'aacom' }
     });
     ```
   - *Impacto*: Cada consulta de rankings o reportes semanales bloquea las tablas SQL con escrituras, ralentizando la respuesta y generando contención de bloqueos (*lock contention*).

6. **Incapacidad de Singleton de Prisma en Producción (Vercel Pool Exhaustion)**:
   - `src/lib/prisma.ts` (Líneas 5-11):
     ```typescript
     export const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["query"] });
     if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
     ```
   - *Impacto*: Al omitir la asignación a `globalForPrisma` cuando `process.env.NODE_ENV === "production"`, cada invocación Serverless en Vercel crea una **nueva instancia de `PrismaClient`**, agotando en segundos el pool de conexiones de PostgreSQL.

---

### 2.3 Re-renderizados Masivos, Monolitos Cliente y Waterfalls de Carga en Frontend

1. **Re-renderizados Masivos en Componentes Cliente Monolíticos**:
   - `src/app/(dashboard)/admin/AdminClient.tsx` (Líneas 1-5063): Componente de 5,063 líneas sin modularización ni memorización (`useMemo`/`useCallback`). Cualquier pulsación en un campo de búsqueda o entrada de texto re-ejecuta la totalidad del árbol de componentes cliente y sus 40+ hooks `useState`.
   - `src/app/(dashboard)/cotizador/CotizadorClient.tsx` (Líneas 1-2218): Mantiene tablas de cálculo financiero masivas que se recalculan en cada frame de renderizado sin `useMemo`.
   - `src/app/(dashboard)/cartera/CarteraTableClient.tsx` (Líneas 17, 19-30): La construcción del conjunto de agentes únicos (`uniqueAgents`) y el filtrado de pólizas (`filteredPolicies`) se recalculan sincrónicamente en cada render sin memorización.
   - `src/components/SoftAurora.tsx` (Línea 280): Hook `useEffect` con 14 dependencias. Cada cambio de prop destruye el lienzo WebGL, elimina los shaders y reconstruye el contexto WebGL desde cero.

2. **Cascadas de Carga de Datos en Cliente (*Waterfalls* en `useEffect`)**:
   - `src/app/(dashboard)/activity/ActivityClient.tsx` (Líneas 94 & 101):
     ```typescript
     const daily = await getDailyActivitySummary(); // Petición 1
     const hist = await getActivityHistory();     // Petición 2 (bloqueada esperando a la 1)
     ```
   - `src/app/(dashboard)/team/TeamClient.tsx` (Líneas 105 & 106):
     ```typescript
     const teamRes = await getTeamDirectory();   // Petición 1
     const userRes = await getCurrentUser();     // Petición 2 (bloqueada esperando a la 1)
     ```
   - `src/app/(dashboard)/admin/AdminClient.tsx` (Líneas 232, 665, 669, 674): Múltiples hooks `useEffect` independientes disparan consultas consecutivas al cambiar de pestaña (`fetchCotizacionesRaw()`, `fetchAdnRaw()`, `loadData()`, `fetchSurveys()`).

---

### 2.4 Procesos Ociosos, Fugas de Memoria, Seguridad en Crons y Bloat de Dependencias

1. **Vulnerabilidad de Bypass de Seguridad en Crons Públicos**:
   - `src/app/api/cron/newsletters/route.ts` (Línea 101)
   - `src/app/api/cron/publish/route.ts` (Línea 10)
   - `src/app/api/cron/update-udi/route.ts` (Línea 10)
   - `src/app/api/cron/clear-mocks/route.ts` (Línea 12)
   - *Observación*: Los endpoints verifican una clave en código duro: `if (bypass !== 'aacom123' && ...)`.
   - *Impacto*: Cualquier usuario anónimo en internet puede invocar `GET /api/cron/clear-mocks?bypass=aacom123` y forzar la eliminación de registros o el disparo de procesos pesados sin autenticación.

2. **Error de Lógica y Desalineación de Tipos en Cron `daily-plan-report`**:
   - `src/app/api/cron/daily-plan-report/route.ts` (Líneas 60, 67-68):
     ```typescript
     const record = user.dailyRecords[0];
     const plannedObj = record?.planned ? (typeof record.planned === "string" ? JSON.parse(record.planned) : record.planned) : {};
     ```
   - *Observación*: En el esquema Prisma (`schema.prisma` línea 221), `planned` en `DailyRecord` está definido como un número entero (`Int @default(0)`). El código intenta parsearlo como JSON y acceder a `plannedObj[act.id]`, lo cual resulta siempre en `undefined`.
   - *Impacto*: `totalPts` se calcula siempre como `0` para todos los usuarios. El cron efectúa iteraciones ociosas y envía falsas alertas de inactividad a los agentes.

3. **Chequeo de Estado del Sistema Sin Caché ni Paralelismo**:
   - `src/app/(dashboard)/admin/system-status/actions.ts` (Líneas 8-235): `checkAllSystemsStatus()` ejecuta 9 comprobaciones externas en serie (incluyendo inferencia con Gemini AI y búsqueda web con Tavily API). Al ejecutarse de forma secuencial y sin caché (`unstable_cache`), cada apertura de la pantalla o llamada del cron demora de 8 a 15 segundos.

4. **Fugas de Memoria y Recursos en Frontend**:
   - `src/app/agents/[id]/chat/ChatInterface.tsx` (Líneas 166-197): La instancia de `SpeechRecognition` creada en `useEffect` carece de función de limpieza (`recognition.abort()`). Si el usuario navega a otra vista, el micrófono permanece escuchando en segundo plano.
   - `src/app/(dashboard)/admin/agencia/AgencySettingsForm.tsx` (Líneas 56-57): Genera previsualizaciones con `URL.createObjectURL(file)`, pero **nunca** invoca `URL.revokeObjectURL(objectUrl)`, reteniendo los archivos de imagen en la memoria del navegador.
   - `src/app/(dashboard)/newsletters/NewslettersClient.tsx` (Línea 51): Utiliza `window.location.reload()`, provocando la destrucción completa del DOM y forzando la redescarga de assets.

5. **Bloat de Dependencias en Bundle Cliente**:
   - `xlsx` (~1.5 MB uncompressed): Importado estáticamente con `import * as XLSX from "xlsx"` en `src/app/(dashboard)/cotizador/CotizadorClient.tsx` (Línea 4) y `src/app/(dashboard)/cartera/importar/page.tsx` (Línea 5), inflando el bundle de JavaScript inicial.
   - `html-to-image`: Incluido en `package.json` (línea 49) sin ser utilizado en ningún archivo fuente.
   - `canvas-confetti`: Importado estáticamente en `src/app/(dashboard)/plan-arranque/AgentPlanClient.tsx` (línea 11) en lugar de utilizar carga dinámica (*dynamic import*).

---

## 3. Matriz Consolidada de Hallazgos y Prioridades de Corrección

| ID | Dominio | Tipo de Problema | Archivo Afectado | Líneas / Componente | Descripción del Hallazgo | Impacto / Riesgo | Prioridad |
|---|---|---|---|---|---|---|---|
| **SEC-01** | Backend / Cron | Seguridad | `src/app/api/cron/*/route.ts` | Newsletters: 101, Publish: 10, UDI: 10, Mocks: 12 | Secreto de bypass quemado en código (`bypass=aacom123`). | Ejecución no autorizada de procesos y borrado de BD por terceros. | **CRÍTICA** |
| **SEC-02** | Backend / IA | Seguridad / Scope | `src/app/api/agents/chat/route.ts` | Línea 239 | `knowledgeAsset.findMany()` sin cláusula `where`. | Fuga de assets de conocimiento entre agencias y recarga masiva de RAM. | **CRÍTICA** |
| **DB-01** | Base de Datos | Rendimiento DB | `prisma/schema.prisma` | 25+ modelos (User:96, Policy:250, Client:232, etc.) | Ausencia de directivas `@index` en claves foráneas y campos de búsqueda. | Full Table Scans sistemáticos en PostgreSQL durante filtros y JOINs. | **CRÍTICA** |
| **PERF-01** | Base de Datos | Pool Exhaustion | `src/lib/prisma.ts` | Líneas 5-11 | Omición de asignación a `globalForPrisma` cuando `NODE_ENV === "production"`. | Creación indiscriminada de instancias `PrismaClient` en Serverless, agotando el pool de PostgreSQL. | **CRÍTICA** |
| **PERF-02** | Backend / Action | Write-on-Read | `src/app/actions.ts` | Líneas 1524-1533, 2409-2420 | `updateMany` masivos dentro de Server Actions de lectura (`getMonthlyAdnRankings`). | Contención de bloqueos SQL (*lock contention*) y degradación de la interfaz. | **ALTA** |
| **PERF-03** | Backend / Action | Bucles N+1 | `src/app/(dashboard)/cartera/actions.ts` | Líneas 370-420 | Carga masiva CSV ejecutando hasta 2,000 consultas individuales secuenciales. | Tiempos de espera de 30-60s en importación de cartera y agotamiento de conexiones. | **ALTA** |
| **PERF-04** | Backend / API | I/O Bloqueante | `src/app/api/agents/chat/route.ts` | Líneas 172-195 | Lectura síncrona de disco (`fs.readFileSync`) dentro del handler POST de chat. | Bloqueo del event loop de Node.js para peticiones concurrentes. | **ALTA** |
| **FRONT-01** | Frontend | Monolito Cliente | `src/app/(dashboard)/admin/AdminClient.tsx` | Líneas 1-5063 | Componente cliente de 5,063 líneas sin memorización ni modularidad. | Re-renderizado total de 5,000+ líneas JSX ante cualquier tipeo en inputs. | **ALTA** |
| **FRONT-02** | Frontend | Bundle Bloat | `src/app/(dashboard)/cotizador/CotizadorClient.tsx`<br>`src/app/(dashboard)/cartera/importar/page.tsx` | Cotizador: 4<br>Importar: 5 | Importación estática de `xlsx` (~1.5 MB) en el bundle cliente inicial. | Carga inicial lenta de la aplicación JavaScript en cliente. | **ALTA** |
| **BUG-01** | Backend / Cron | Desincronización Tipos | `src/app/api/cron/daily-plan-report/route.ts` | Línea 68 | Intento de parsear `DailyRecord.planned` (`Int`) como un objeto JSON. | `totalPts` se calcula siempre en 0, enviando falsas alertas de inactividad. | **ALTA** |
| **ARCH-01** | Arquitectura | Redundancia IA | `src/app/api/agents/chat/route.ts`<br>`src/app/api/assistant/route.ts` | Chat: 1-1587<br>Assistant: 1-116 | Dos motores de IA paralelos y tablas de conocimiento duplicadas (`KnowledgeAsset` vs `KnowledgeDocument`). | Duplicación de lógica, esquemas y mantenimiento de prompts. | **MEDIA** |
| **DB-02** | Base de Datos | Redundancia Marca | `prisma/schema.prisma` | Agency: 35-37, User: 129-130, CompanyProfile: 639-641 | Branding (colores/logos) almacenado en 3 tablas independientes. | Desincronización visual y almacenamiento duplicado. | **MEDIA** |
| **DB-03** | Base de Datos | Redundancia Saldo | `prisma/schema.prisma` | User: 148, 187 | Campos `voiceSecondsBalance` y `freeSecondsBalance` duplicados en `User`. | Inconsistencia de saldos de minutos de voz. | **MEDIA** |
| **DB-04** | Base de Datos | Data Bloat | `prisma/schema.prisma` | Línea 401 | Almacenamiento de imágenes Base64 pesadas en `AdnDiagnostic.evidenciaBase64`. | Hinchamiento masivo de PostgreSQL (*table bloat*) e I/O lento. | **MEDIA** |
| **PERF-05** | Backend / Action | Waterfalls / External | `src/app/(dashboard)/admin/system-status/actions.ts` | Líneas 8-235 | `checkAllSystemsStatus` ejecuta 9 llamadas externas secuenciales sin caché. | Latencia de 8 a 15 segundos al abrir la vista de estado de sistema. | **MEDIA** |
| **PERF-06** | Backend / API | Consultas Repetidas | `src/app/api/cedula-a/agent-data/route.ts` | Líneas 83-121 | Dos consultas consecutivas a `ExamenIntento` en la misma petición HTTP. | Consultas innecesarias a PostgreSQL. | **MEDIA** |
| **FRONT-03** | Frontend / SSR | Redundancia SSR | `src/app/layout.tsx`<br>`src/app/(dashboard)/layout.tsx` | Layout: 17-20, 127-130<br>Dash Layout: 58, 69, 121 | Consulta duplicada a `prisma.agency.findUnique` en SSR. | Retraso en el tiempo de renderizado de la primera página (TTFB). | **MEDIA** |
| **FRONT-04** | Frontend | Waterfalls Cliente | `src/app/(dashboard)/activity/ActivityClient.tsx`<br>`src/app/(dashboard)/team/TeamClient.tsx` | Activity: 94, 101<br>Team: 105, 106 | Llamadas `await` secuenciales en `useEffect`. | Carga lenta en cascada de los datos del dashboard cliente. | **MEDIA** |
| **FRONT-05** | Frontend | Fuga de Recurso | `src/app/agents/[id]/chat/ChatInterface.tsx` | Líneas 166-197 | Web Speech `SpeechRecognition` sin función de limpieza (`cleanup`). | Micrófono activo escuchando en segundo plano tras desmontar componente. | **MEDIA** |
| **FRONT-06** | Frontend | Fuga de Memoria | `src/app/(dashboard)/admin/agencia/AgencySettingsForm.tsx` | Líneas 56-57 | Uso de `URL.createObjectURL` sin ejecutar `URL.revokeObjectURL`. | Retención de objetos Blob en memoria RAM del navegador. | **BAJA** |
| **FRONT-07** | Frontend | Recarga de Página | `src/app/(dashboard)/newsletters/NewslettersClient.tsx` | Línea 51 | Uso de `window.location.reload()` para actualizar noticias. | Pérdida de estado cliente y descarga completa de assets estáticos. | **BAJA** |
| **DEP-01** | Dependencias | Paquete Ocioso | `package.json` | Línea 49 | Paquete `html-to-image` instalado sin uso en el proyecto. | Bloat menor del árbol `node_modules`. | **BAJA** |

---

## 4. Plan de Acción y Recomendaciones de Optimización

Para solventar los hallazgos descritos y elevar la arquitectura de AACOM a estándares de nivel producción, se establece el siguiente **Plan de Acción Estructurado por Fases**:

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │ FASE 1: Seguridad y Estabilidad Crítica (Semana 1)                       │
 │  • Remoción de claves bypass en Crons & Token Bearer                    │
 │  • Scope de multitenancy en Chat IA                                     │
 │  • Singleton de PrismaClient en producción                             │
 │  • Corrección de tipos en daily-plan-report                             │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │ FASE 2: Optimización de Base de Datos y Servidor (Semana 2)             │
 │  • Despliegue de índices @index en Prisma                               │
 │  • Eliminación de anti-patrones Write-on-Read en Server Actions         │
 │  • Refactorización de cargas masivas (createMany/findMany)              │
 │  • Paginación SQL y uso de aggregations nativas                         │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │ FASE 3: Paralelización, Caché de Servidor y Unificación (Semana 3)     │
 │  • Paralelización con Promise.allSettled en system-status               │
 │  • Caché de servidor (unstable_cache / React.cache)                     │
 │  • Consolidación de motores IA y PDF                                    │
 │  • Remoción de fs.readFileSync en Handlers                             │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │ FASE 4: Refactorización de Frontend y Bundle (Semana 4)                │
 │  • Modularización de AdminClient y CotizadorClient                      │
 │  • Carga dinámica (Dynamic Imports) para xlsx y canvas-confetti         │
 │  • Adopción de React Query / SWR para caché cliente                     │
 │  • Eliminación de Waterfalls y Cleanups de recursos                     │
 └─────────────────────────────────────────────────────────────────────────┘
```

### Detalle de Tareas por Fase:

#### Fase 1: Correcciones Críticas de Seguridad y Estabilidad (Semana 1)
1. **Aseguramiento de Endpoints Cron**:
   - Eliminar el parámetro `?bypass=aacom123` de `src/app/api/cron/newsletters/route.ts:101`, `publish/route.ts:10`, `update-udi/route.ts:10` y `clear-mocks/route.ts:12`.
   - Requerir estrictamente la cabecera `Authorization: Bearer ${process.env.CRON_SECRET}` inyectada de forma segura por Vercel Cron.
2. **Aislamiento Multitenant en Asistente de IA**:
   - Modificar `src/app/api/agents/chat/route.ts:239` para agregar la cláusula de filtrado por agencia/agente: `prisma.knowledgeAsset.findMany({ where: { agentId } })`.
3. **Persistencia de Instancia Singleton de Prisma**:
   - Ajustar `src/lib/prisma.ts:5-11` eliminando la condición `if (process.env.NODE_ENV !== "production")` para garantizar que `globalForPrisma.prisma` reutilice el pool de conexiones tanto en desarrollo como en producción.
4. **Reparación de Tipo en Cron de Reporte Diario**:
   - Corregir `src/app/api/cron/daily-plan-report/route.ts:68` para que no intente ejecutar `JSON.parse` sobre `DailyRecord.planned`, alineando la lógica con el tipo entero `Int` definido en el esquema Prisma.

#### Fase 2: Optimización de Base de Datos y Servidor (Semana 2)
1. **Despliegue de Índices Referenciales en Prisma**:
   - Incorporar directivas `@@index([agencyId])`, `@@index([userId])`, `@@index([clientId])`, `@@index([sellerId])`, `@@index([email])`, etc., a los 25+ modelos afectados en `prisma/schema.prisma`. Generar la migración de estructura correspondiente con `npx prisma migrate dev`.
2. **Remoción de Anti-patrones *Write-on-Read***:
   - Extraer las mutaciones `updateMany` presentes en `src/app/actions.ts` (líneas 1524-1533, 2409-2420) fuera de las Server Actions de lectura (`getMonthlyAdnRankings`, `getWeeklyReportData`) y trasladarlas a scripts de migración o tareas de mantenimiento programadas.
3. **Refactorización de Carga Masiva CSV a Operaciones en Lote**:
   - Reescribir `uploadPoliciesLayout` en `src/app/(dashboard)/cartera/actions.ts:370-420` reemplazando las consultas individuales en bucle por un mapeo en lote: resolver clientes existentes mediante `prisma.client.findMany({ where: { name: { in: names } } })` e insertar pólizas masivamente mediante `prisma.policy.createMany`.
4. **Paginación y Agregaciones Nativas SQL**:
   - Implementar `take` y `skip` en los endpoints y páginas de cartera (`src/app/(dashboard)/admin/cartera/page.tsx:26-40`).
   - Sustituir los cálculos manuales `.reduce()` por agregaciones nativas de Prisma (`prisma.activityLog.aggregate({ _sum: { points: true } })`).

#### Fase 3: Paralelización, Caché de Servidor y Unificación Backend (Semana 3)
1. **Paralelización de Verificaciones Externas**:
   - Refactorizar `checkAllSystemsStatus()` en `src/app/(dashboard)/admin/system-status/actions.ts:8-235` envolviendo las 9 comprobaciones externas en un bloque `Promise.allSettled`, reduciendo la latencia de 15 segundos a menos de 2 segundos.
2. **Caché de Servidor para Dashboards**:
   - Envolver las consultas pesadas de estadísticas (`getAdminDashboardStats`, `getMonthlyAdnRankings`) en `unstable_cache` de Next.js o React `cache` con una ventana de revalidación basada en tiempo (ej. 60 segundos).
3. **Unificación del Asistente de IA y PDFs**:
   - Consolidar la arquitectura de chat integrando la gestión de conocimientos bajo una sola tabla (`KnowledgeAsset`) y unificando el endpoint de API.
   - Centralizar las utilidades de generación de PDF en un único módulo.
4. **Remoción de I/O Bloqueante de Disco**:
   - Eliminar la llamada síncrona `fs.readFileSync` en `src/app/api/agents/chat/route.ts:172-195`, confiando exclusivamente en las variables de entorno precargadas en `process.env`.

#### Fase 4: Refactorización de Frontend, Estado Cliente y Rendimiento de Bundle (Semana 4)
1. **Modularización de Componentes Monolíticos**:
   - Dividir `src/app/(dashboard)/admin/AdminClient.tsx` (5,063 líneas) y `src/app/(dashboard)/cotizador/CotizadorClient.tsx` (2,218 líneas) en sub-componentes independientes por pestaña, aislando las variables de `useState` a sus respectivos ámbitos.
2. **Carga Dinámica (*Code Splitting*) de Librerías Pesadas**:
   - Sustituir las importaciones estáticas de `xlsx` en `CotizadorClient.tsx` y `importar/page.tsx` por importaciones dinámicas (`const XLSX = await import("xlsx")`) al momento de exportar/importar.
   - Cargar `canvas-confetti` dinámicamente.
   - Desinstalar la dependencia no utilizada `html-to-image` de `package.json`.
3. **Introducción de Caché de Datos Cliente**:
   - Adoptar TanStack Query (React Query) para gestionar y deduplicar las peticiones cliente (`getUdiSetting`, `getCurrentUser`, `getAgents`), eliminando peticiones redundantes.
4. **Eliminación de Waterfalls y Limpieza de Recursos**:
   - Utilizar `Promise.all` en `ActivityClient.tsx` y `TeamClient.tsx` para ejecutar las peticiones cliente en paralelo.
   - Implementar la función de limpieza `recognition.abort()` en `ChatInterface.tsx` y `URL.revokeObjectURL()` en `AgencySettingsForm.tsx`.
