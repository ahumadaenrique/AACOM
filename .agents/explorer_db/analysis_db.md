# Reporte de Auditoría de Base de Datos y Esquema Prisma (AACOM)

**Fecha:** 2026-07-28  
**Agente Explorador:** `explorer_db`  
**Ruta del Proyecto:** `c:\Proyectos Antigravity\Google Antigravity\aacom-25`  
**Archivo Principal de Esquema:** `prisma/schema.prisma`  

---

## RESUMEN EJECUTIVO

Se realizó una auditoría exhaustiva y estrictamente **READ-ONLY** del esquema de base de datos (`prisma/schema.prisma`) y del patrón de consultas Prisma a través de las rutas de API, Server Actions, componentes de página y servicios en la aplicación AACOM.

### Hallazgos Principales:
1. **Falta Masiva de Índices en Claves Foráneas (FKs) y Filtros Críticos**: En PostgreSQL, definir una relación `fields: [foreignKey]` en Prisma **NO** crea automáticamente un índice en la columna de la base de datos. De **35 modelos**, más de **25 modelos** carecen de índices `@index` en sus llaves foráneas (`agencyId`, `userId`, `sellerId`, `clientId`, `aiAgentId`, `evaluatorId`, etc.), ocasionando **Full Table Scans** sistemáticos en cada JOIN, filtrado de tenencia por agencia/usuario y eliminación en cascada.
2. **Redundancias de Datos y Modelos Duplicados**:
   - **Branding Triplicado**: Las propiedades corporativas (`primaryColor`, `secondaryColor`, `logoUrl`) existen simultáneamente en `Agency` (líneas 35-37), `User` (`brandColor`, `brandLogo`, líneas 129-130) y `CompanyProfile` (líneas 639-641).
   - **Saldo de Minutos Duplicado**: El modelo `User` cuenta con dos campos independientes para el mismo propósito: `voiceSecondsBalance` (línea 148) y `freeSecondsBalance` (línea 187).
   - **Agentes Triplicados**: Existen 3 modelos/conceptos de agentes disjuntos: `User` (con `role = "AGENTE"`), `Agent` (línea 335, catálogo simple para autocompletado en `Agency`) y `AIAgent` (línea 587, agentes virtuales para redes sociales).
   - **Módulo Cédula A Desconectado**: Las tablas `preguntas`, `estudio_progreso`, `examen_intentos`, `estudio_licencias` y `promotor_saldos` usan strings de `email` en lugar de llaves foráneas ligadas al modelo `User`, rompiendo la integridad referencial.
   - **Desnormalización Innecesaria**: `ActivityLog` almacena de forma redundante `activityName` y `points` duplicando la tabla catálogo `Activity`. `Cotizacion` almacena la string `agente` además de la relación opcional `userId`.
3. **Cuellos de Botella y Patrones Anti-Rendimiento en Consultas Prisma**:
   - **Consultas No Paginas y Filtrado en Memoria (JS)**: Múltiples dashboards (`/admin/cartera`, `/cartera`, `getCurrentMonthStats`, `/pea-prp`) ejecutan `findMany()` trayendo miles de registros completos a la memoria Node.js para aplicar `.reduce()`, `.filter()` o conteos en JavaScript en lugar de `prisma.aggregate`, `prisma.count` o paginación `take/skip`.
   - **Fuga de Seguridad y Consulta Masiva Sin Scope**: `src/app/api/agents/chat/route.ts` (línea 239) ejecuta `prisma.knowledgeAsset.findMany()` **sin cláusula `where`**, cargando toda la base de datos de assets de conocimiento de todos los usuarios/agentes en cada mensaje de chat.
   - **Bucles N+1 y Modificaciones Secuenciales**: CSV bulk import en `/cartera/actions.ts` (líneas 370-419) y `saveDailyPlan` en `/actions.ts` (líneas 1408-1446) ejecutan cientos de llamadas individuales a la base de datos en bucles `for...of` sin transacciones en lote ni batching.
   - **Incompatibilidad de Tipos entre Esquema y Código**: `daily-plan-report/route.ts` (línea 67) intenta parsear `DailyRecord.planned` como un objeto JSON cuando en el esquema Prisma `planned` está definido como `Int @default(0)`.
   - **Riesgo de Extinción de Pool de Conexiones en Vercel**: `src/lib/prisma.ts` desactiva el almacenamiento singleton de `PrismaClient` en producción (`if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;`), provocando la instanciación de nuevos clientes Prisma por cada invocación serverless.

---

## 1. REDUNDANCIAS DE DATOS Y MODELOS SOBREPUUESTOS

### 1.1 Redundancia de Atributos de Identidad Visual y Branding
Existen 3 estructuras en el esquema almacenando la misma información de identidad gráfica y logotipo sin fronteras claras de dominio:
- **`Agency`** (`prisma/schema.prisma`: líneas 35-37):
  ```prisma
  logoUrl        String?
  primaryColor   String?   @default("#4f46e5")
  secondaryColor String?
  ```
- **`User`** (`prisma/schema.prisma`: líneas 129-130):
  ```prisma
  brandColor   String? // Color corporativo individual del Agente
  brandLogo    String? // Logo corporativo individual del Agente
  ```
- **`CompanyProfile`** (`prisma/schema.prisma`: líneas 639-641):
  ```prisma
  primaryColor   String?   @default("#4f46e5")
  secondaryColor String?   @default("#10b981")
  logoUrl        String?
  ```
*Impacto*: Duplicación de almacenamiento de datos de personalización visual, falta de fuente única de verdad para la marca en la aplicación.

### 1.2 Duplicación de Campos de Saldo de Voz en `User`
El modelo `User` contiene dos campos distintos para el saldo inicial de voz ElevenLabs:
- **`User.voiceSecondsBalance`** (`prisma/schema.prisma`: línea 148): `voiceSecondsBalance Int @default(300)`
- **`User.freeSecondsBalance`** (`prisma/schema.prisma`: línea 187): `freeSecondsBalance Int @default(300)`
*Impacto*: Desincronización de saldos entre diferentes controladores que modifican `voiceSecondsBalance` o `freeSecondsBalance`.

### 1.3 Redundancia de Referidos en `Agency`
El modelo `Agency` mantiene dos sistemas paralelos de referencia:
- **`referredByAgencyId`** (`prisma/schema.prisma`: línea 41): `referredByAgencyId String?` (campo String sin relación de clave foránea).
- **`referredById`** (`prisma/schema.prisma`: línea 69-70): `referredById String?` + `referrer User? @relation("AgencyReferrer", fields: [referredById], references: [id])`.
*Impacto*: Ambigüedad en la trazabilidad del sistema de afiliados entre referencias por Agencia id o por Usuario id.

### 1.4 Redundancia en `Cotizacion` y `ActivityLog`
- **`Cotizacion`** (`prisma/schema.prisma`: líneas 311-315): Almacena `userId String?`, relación `user User?` y además el string desnormalizado `agente String` y `cliente String`.
- **`ActivityLog`** (`prisma/schema.prisma`: líneas 416-418):
  ```prisma
  activityId   String // ID de la actividad del catálogo ('1' a '7')
  activityName String // Nombre descriptivo
  points       Int    // Puntos otorgados
  ```
  Esto duplica la información que ya existe en el modelo catálogo `Activity` (`prisma/schema.prisma`: líneas 203-208: `id`, `name`, `value`).
- **`DailyRecord` vs `ActivityLog`**: `DailyRecord` agrega `planned` vs `real` por `(userId, activityId, date)`, mientras `ActivityLog` registra eventos individuales. Sin embargo, no hay sincronización atómica entre la inserción de un `ActivityLog` y el conteo `real` en `DailyRecord`.

### 1.5 Modelos de Datos Duplicados o Sobrepuestos
1. **Entidades `Agent`, `User` y `AIAgent`**:
   - `User` (`role = "AGENTE"`): Agentes humanos del sistema.
   - `Agent` (`prisma/schema.prisma`: líneas 335-343): Modelo secundario `model Agent { id, agencyId, name }` usado únicamente para autocompletado de nombres en la agencia.
   - `AIAgent` (`prisma/schema.prisma`: líneas 587-608): Agentes virtuales para el módulo de redes sociales e IA.
2. **Entidades `KnowledgeDocument` vs `KnowledgeAsset`**:
   - `KnowledgeDocument` (`prisma/schema.prisma`: líneas 425-435): Almacena documentos de conocimiento por agencia (`agencyId`, `title`, `content`, `isGlobalTemplate`).
   - `KnowledgeAsset` (`prisma/schema.prisma`: líneas 652-661): Almacena documentos de conocimiento por agente de IA (`agentId`, `title`, `content`, `url`).
3. **Módulo Cédula A Mapeado Directamente con Emails**:
   - Tablas `preguntas`, `estudio_progreso`, `examen_intentos`, `estudio_licencias`, `promotor_saldos` (`prisma/schema.prisma`: líneas 696-751) operan aisladas utilizando `email` o `promotor_email`/`agente_email` como llaves en lugar de relaciones de clave foránea con el modelo `User.id`.

### 1.6 Almacenamiento de Datos Pesados (Base64) en Base de Datos
- **`AdnDiagnostic.evidenciaBase64`** (`prisma/schema.prisma`: línea 401): Campo `evidenciaBase64 String?` que almacena imágenes codificadas en Base64 directamente dentro de las filas de la tabla PostgreSQL.
*Impacto*: Ocasiona hinchamiento masivo (*table bloat*) en PostgreSQL, ralentizando cualquier consulta `findMany` o `findUnique` que traiga el diagnóstico completo.

---

## 2. CUELLOS DE BOTELLA Y RENDIMIENTO

### 2.1 AUSENCIA CRÍTICA DE ÍNDICES EN CLAVES FORÁNEAS Y FILTROS DE BÚSQUEDA

En PostgreSQL con Prisma, definir `fields: [foreignKey]` **NO** genera índices automáticamente. A continuación se detallan las tablas y columnas que sufren de **Full Table Scans** debido a la falta de la directiva `@index`:

| Modelo (`prisma/schema.prisma`) | Columna Afectada | Uso Frecuente en Consultas / Impacto |
| :--- | :--- | :--- |
| `User` (línea 96) | `agencyId` | **CRÍTICO**: Usado en casi todas las consultas multitenant (`where: { agencyId }`). |
| `User` (línea 138) | `reportsToId` | Consultas de jerarquía de agentes. |
| `CommissionLedger` (líneas 15, 17, 26) | `sellerId`, `agencyId`, `sourceAgencyId` | Reportes financieros y comisiones por agente/agencia. |
| `Agency` (línea 69) | `referredById` | Consultas del sistema de afiliados. |
| `DiscountCode` (línea 87) | `sellerId` | Validación de códigos de descuento por vendedor. |
| `Client` (líneas 232, 239) | `agencyId`, `userId` | Filtrado de cartera por cliente, agencia o agente. |
| `Policy` (líneas 250, 275, 278) | `agencyId`, `clientId`, `userId` | **CRÍTICO**: Consultas de cartera y borrado en cascada `Client` -> `Policy`. |
| `Cotizacion` (líneas 309, 311) | `agencyId`, `userId` | Listado de cotizaciones guardadas por agente/agencia. |
| `AdnDiagnostic` (líneas 347, 349) | `agencyId`, `userId` | Listado de diagnósticos financieros ADN. |
| `ActivityLog` (líneas 413, 415, 421) | `agencyId`, `userId`, `dateStr` | **CRÍTICO**: Cálculo de puntos diarios y reportes de actividad por fecha. |
| `KnowledgeDocument` (línea 427) | `agencyId` | Carga de documentos de conocimiento de la agencia. |
| `PushSubscription` (línea 439) | `userId` | Envío masivo de notificaciones Push por usuario. |
| `PackDocument` (línea 476) | `packId` | Carga de documentos por paquete. |
| `AgencyDocument` (línea 498) | `agencyId` | Carga de documentos propios de la agencia. |
| `PerformanceReview` (líneas 514, 516, 518) | `agencyId`, `agentId`, `evaluatorId` | Evaluaciones de desempeño PEA/PRP. |
| `Ticket` (líneas 541, 543) | `userId`, `agencyId` | Dashboard de soporte y tickets de agencia. |
| `PollOption` (línea 566) | `pollId` | Obtención de opciones de votación. |
| `PollVote` (línea 580) | `optionId`, `agencyId` | Conteo de votos de encuestas por opción o agencia. |
| `AIAgent` (línea 598) | `userId` | Carga de agente IA por usuario. |
| `DraftPost` (líneas 612, 618) | `aiAgentId`, `status`, `scheduledAt` | Cron de publicación programada de redes sociales. |
| `InteractionLog` (líneas 625, 627) | `aiAgentId`, `userId` | Historial de interacción con el asistente de IA. |
| `Meeting` (líneas 670, 666) | `userId`, `date` | Agenda de citas y calendario de usuario. |
| `Task` (líneas 686, 684) | `userId`, `dueDate` | Lista de tareas pendientes por usuario y fecha. |
| `ExamenIntento` (línea 722) | `email` | **CRÍTICO**: Búsqueda masiva en dashboard Cédula A (`where: { email: { in: emails } }`). |
| `EstudioLicencia` (líneas 735, 736) | `promotor_email`, `agente_email` | Verificación de licencias asignadas. |
| `AppErrorLog` (líneas 828, 830) | `userId`, `agencyId` | Auditoría de errores en producción. |

---

### 2.2 PATRONES N+1 Y BUCLES DE CONSULTAS SECUENCIALES

1. **Importación Masiva de CSV de Pólizas** (`src/app/(dashboard)/cartera/actions.ts`: líneas 370-419):
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
   *Evidencia*: En un archivo CSV con 500 filas, esto dispara hasta **2,000 consultas SQL secuenciales** individuales a la base de datos sin batching ni `$transaction`.

2. **Guardado de Plan Diario** (`src/app/actions.ts`: líneas 1408-1446):
   ```typescript
   for (const [activityId, plannedCount] of Object.entries(plan)) {
       await prisma.activity.upsert({ ... });
       await prisma.dailyRecord.upsert({ ... });
   }
   ```
   *Evidencia*: Se ejecutan hasta 14 consultas de actualización/inserción secuenciales dentro de un bucle `for...of` por cada guardado de plan en lugar de utilizar `upsertMany` o `prisma.$transaction`.

---

### 2.3 CONSULTAS NO PAGINADAS Y PROCESAMIENTO EN MEMORIA (JAVASCRIPT)

1. **Dashboard de Cartera Global Admin** (`src/app/(dashboard)/admin/cartera/page.tsx`: línea 26-40):
   ```typescript
   const allClients = await prisma.client.findMany({
     where: { agencyId: userRole.agencyId },
     include: { policies: true, user: { select: { name: true, email: true } } },
     orderBy: { createdAt: "desc" },
   });
   const totalClients = allClients.length;
   const totalPolicies = allClients.reduce((acc, client) => acc + client.policies.length, 0);
   const globalPremium = allClients.reduce((acc, client) => { ... }, 0);
   ```
   *Evidencia*: Carga en memoria la totalidad de los clientes y sus pólizas de toda la agencia sin paginación (`take`/`skip`), agregando los totales en JavaScript.

2. **Dashboard de Cartera de Agente** (`src/app/(dashboard)/cartera/page.tsx`: líneas 42-52):
   Carga todas las pólizas del agente (`prisma.policy.findMany`) sin límite para calcular sumatorias y próximos aniversarios mediante `.reduce()` y `.filter()` en JavaScript.

3. **Cálculo de Estadísticas de Actividad Mensual** (`src/app/(dashboard)/pea-prp/actions.ts`: líneas 36-42 y `src/app/actions.ts`: línea 1362):
   ```typescript
   const logs = await prisma.activityLog.findMany({ where: { userId, dateStr: { gte: startStr, lte: endStr } } });
   const totalPoints = logs.reduce((acc, log) => acc + log.points, 0);
   ```
   *Evidencia*: Trae todos los registros de actividad a Node.js únicamente para sumar los puntos en JavaScript, ignorando `prisma.activityLog.aggregate({ _sum: { points: true } })`.

---

### 2.4 CONSULTAS SIN SCOPE Y RIESGOS DE SEGURIDAD / RENDIMIENTO

1. **Fuga de Conocimiento Global en Chat de Agente IA** (`src/app/api/agents/chat/route.ts`: línea 239):
   ```typescript
   const knowledgeAssets = await prisma.knowledgeAsset.findMany()
   ```
   *Evidencia*: La consulta `findMany()` **carece totalmente de filtro `where`**. Esto causa que en cada interacción del chat con el asistente virtual se extraigan todos los activos de conocimiento existentes en el sistema para todos los agentes y agencias, vulnerando el aislamiento multitenant y recargando la memoria Node.js.

---

### 2.5 INCOMPATIBILIDAD DE TIPOS (SCHEMA VS CODE MISMATCH)

1. **Reporte Diario de WhatsApp Cron** (`src/app/api/cron/daily-plan-report/route.ts`: líneas 60 y 67-68):
   ```typescript
   // Esquema: DailyRecord.planned es de tipo Int @default(0)
   // Código en route.ts:
   const record = user.dailyRecords[0];
   const plannedObj = record?.planned ? (typeof record.planned === "string" ? JSON.parse(record.planned) : record.planned) : {};
   ```
   *Evidencia*: El código asume que `DailyRecord.planned` almacena un string JSON con un objeto de actividades, mientras que en `prisma/schema.prisma` (línea 221) `planned` está definido como `Int`. Esto causa fallos silenciosos o comportamiento inesperado al ejecutar el reporte.

---

### 2.6 CONFIGURACIÓN DE CONEXIÓN PRISMA Y POOL EXHAUSTION EN VERCEL

1. **Instanciación Inadecuada de PrismaClient en Producción** (`src/lib/prisma.ts`: líneas 5-11):
   ```typescript
   export const prisma =
       globalForPrisma.prisma ||
       new PrismaClient({ log: ["query"] });

   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```
   *Evidencia*: Al omitir guardar la instancia en `globalForPrisma` cuando `process.env.NODE_ENV === "production"`, cada invocación de función Serverless en Vercel crea una **nueva instancia de `PrismaClient`**. En picos de tráfico, esto agota en segundos el pool de conexiones de PostgreSQL. Además, `log: ["query"]` en producción genera sobrecostos de I/O en logs.

---

## SÍNTESIS Y RECOMENDACIONES DE OPTIMIZACIÓN

1. **Indexación Inmediata de Claves Foráneas**:
   Agregar directivas `@@index` a `schema.prisma` para todas las llaves foráneas (`agencyId`, `userId`, `clientId`, `sellerId`, `aiAgentId`, `evaluatorId`, `email`) para eliminar los Full Table Scans en PostgreSQL.
2. **Consolidación de Modelos Duplicados**:
   - Unificar branding entre `Agency` y `CompanyProfile`.
   - Eliminar `User.freeSecondsBalance` reteniendo solo `voiceSecondsBalance`.
   - Limpiar o migrar los modelos de soporte o autocompletado hacia `User`.
3. **Optimización de Consultas Prisma**:
   - Implementar `prisma.aggregate` y `prisma.count` para reportes en dashboards en lugar de `findMany` + `.reduce()` en JavaScript.
   - Reemplazar bucles `for...of` de inserción/actualización con `createMany`, `updateMany` o `prisma.$transaction`.
   - Corregir el filtro `where` en `KnowledgeAsset.findMany({ where: { agentId } })`.
4. **Persistencia del Singleton de Prisma**:
   Asegurar que `globalForPrisma.prisma` retenga la instancia de `PrismaClient` independientemente del ambiente (`NODE_ENV`) y deshabilitar `log: ["query"]` en producción.
