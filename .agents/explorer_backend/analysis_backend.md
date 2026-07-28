# Auditoría de Rendimiento Backend y API (AACOM)

**Fecha:** 2026-07-27  
**Auditor:** Backend & API Performance Explorer  
**Directorio de Trabajo:** `c:\Proyectos Antigravity\Google Antigravity\aacom-25\.agents\explorer_backend`  
**Estatus:** Finalizado (Read-Only)

---

## Resumen Ejecutivo

Se realizó una auditoría completa y exhaustiva del backend de la aplicación AACOM, cubriendo las **42 rutas de API** en `src/app/api`, los controladores de Server Actions (`src/app/actions.ts`, `src/app/sellerActions.ts`, `src/app/(dashboard)/**/actions.ts`), el `middleware.ts`, las configuraciones de Vercel Cron (`vercel.json`) y el esquema ORM Prisma (`prisma/schema.prisma`).

Se identificaron **alertas críticas de arquitectura y rendimiento**, catalogadas bajo 2 categorías principales:
1. **Redundancias de Datos**: Duplicación de tablas y motores de IA en paralelo, refetching redundante de usuarios y objetos en base de datos, estructuraciones duplicadas en handlers.
2. **Cuellos de Botella y Procesos Ociosos**: Operaciones síncronas bloqueantes (lecturas de archivo por petición, inserciones masivas fila por fila en Excel), anti-patrones *Write-on-Read* (ejecución de `updateMany` dentro de llamadas de lectura), cascadas asíncronas secuenciales (*waterfalls*) en webhooks de Stripe y crons de notificación, falta de almacenamiento en caché en operaciones costosas (reportes, generación de PDF, chequeos de estado del sistema), e ineficiencias críticas de lógica de tipos en reportes cron.

---

## 1. Redundancias de Datos

### 1.1 Duplicación de Rutas de API y Lógica de Servidor Traslapada

#### A. Arquitectura Dual de Asistente de Inteligencia Artificial (IA)
- **Archivos Afectados:**
  - `src/app/api/agents/chat/route.ts` (Líneas 1-1587)
  - `src/app/api/assistant/route.ts` (Líneas 1-116)
  - `prisma/schema.prisma` (Líneas 425-435 y 652-661)
- **Observación:**
  Existen dos sistemas independientes y traslapados para el manejo de chats con IA:
  1. `src/app/api/agents/chat/route.ts`: Utiliza el SDK de Vercel AI (`@ai-sdk/google`), consulta la tabla `AIAgent`, `CompanyProfile` y la tabla `KnowledgeAsset` (`prisma.knowledgeAsset`).
  2. `src/app/api/assistant/route.ts`: Realiza llamadas HTTP directas con `fetch` a la REST API de Gemini (`https://generativelanguage.googleapis.com/v1beta/models/...`), consulta la tabla `KnowledgeDocument` (`prisma.knowledgeDocument`).
- **Impacto:**
  Duplicación de tablas en el esquema de base de datos (`KnowledgeAsset` vs `KnowledgeDocument`), inconsistencia en modelos de IA consultados, mantenimiento duplicado de prompts del sistema y confusión en la gestión del conocimiento de la agencia.

#### B. Duplicación en Endpoints de Generación y Proxy de PDFs
- **Archivos Afectados:**
  - `src/app/api/generate-pdf/route.ts` (Líneas 4-69)
  - `src/app/api/pdf/route.ts` (Líneas 4-48)
- **Observación:**
  Ambos endpoints administran operaciones con PDFs. `generate-pdf` invoca la API externa PDFShift para renderizar cotizaciones a PDF, mientras que `pdf/route.ts` actúa como un proxy inverso para servir archivos PDF privados desde Vercel Blob.
- **Impacto:**
  Lógica dispersa de gestión de documentos PDF que incrementa la superficie de ataque y el mantenimiento.

---

### 1.2 Transformación Redundante de Datos y Estructuras de Objetos Duplicadas

#### A. Diccionarios Múltiples Redundantes en Handler de Cédula A
- **Archivo Afectado:** `src/app/api/cedula-a/agent-data/route.ts` (Líneas 55-104)
- **Observación:**
  ```typescript
  // Líneas 55-62:
  const timesPerModule: Record<string, number> = {
    "Aspectos Generales": 0, "Regulación CNSF": 0, "Vida Individual": 0,
    "Accidentes y Enfermedades": 0, "Seguros de Daños": 0, "Sistema y Mercados Financieros": 0
  };
  // Líneas 64-71:
  const studyProgress: Record<string, number> = {
    "Aspectos Generales": 0, "Regulación CNSF": 0, "Vida Individual": 0,
    "Accidentes y Enfermedades": 0, "Seguros de Daños": 0, "Sistema y Mercados Financieros": 0
  };
  // Líneas 97-104:
  const moduleScores: Record<string, number> = { ... };
  ```
  Se inicializan manualmente 3 objetos con exactamente las mismas 6 llaves de módulo en código duro en 3 lugares separados del mismo manejador de petición.
- **Impacto:** Redundancia en memoria de objetos idénticos y riesgo de divergencia si se modifica un módulo.

---

### 1.3 Consultas Repetidas y Re-fetching Innecesario de Datos del Servidor

#### A. Re-consultas Duplicadas sobre `ExamenIntento` en la misma Petición
- **Archivo Afectado:** `src/app/api/cedula-a/agent-data/route.ts` (Líneas 83-121)
- **Observación:**
  ```typescript
  // Líneas 83-87: Primera consulta de todos los intentos del usuario
  const attemptsRows = await prisma.examenIntento.findMany({
    where: { email: emailLower },
    orderBy: { fecha: 'asc' },
    select: { calificacion: true, aprobado: true, fecha: true, detalles_modulos: true }
  });

  // Líneas 106-111: Segunda consulta a la misma tabla para traer solo el último intento
  const latestAttemptRows = await prisma.examenIntento.findMany({
    where: { email: emailLower },
    orderBy: { fecha: 'desc' },
    take: 1,
    select: { detalles_modulos: true }
  });
  ```
- **Impacto:**
  Consulta redundante a la base de datos PostgreSQL. El último intento ya está contenido en `attemptsRows[attemptsRows.length - 1]`.

#### B. Re-fetching de Usuario por Email en Server Actions
- **Archivo Afectado:** `src/app/actions.ts` (Múltiples funciones, p. ej. Líneas 174-176, 223-225, 280-282, 571-573, 641-643, 726-729, 907-909, 1230-1232, 1385-1387, etc.)
- **Observación:**
  Casi todas las Server Actions ejecutan la secuencia:
  ```typescript
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  ```
  Incluso cuando `session.user.id` y `session.user.agencyId` ya se encuentran almacenados y firmados en el token JWT/Session de NextAuth.
- **Impacto:**
  Genera 1 viaje redondo (*roundtrip*) extra e innecesario a la base de datos en cada invocación de Server Action en la plataforma.

---

## 2. Cuellos de Botella y Procesos Ociosos (Rendimiento)

### 2.1 Operaciones Síncronas Bloqueantes y Computación Pesada en Handlers

#### A. Lectura Síncrona de Disco (`fs.readFileSync`) en Cada Petición HTTP de Chat
- **Archivo Afectado:** `src/app/api/agents/chat/route.ts` (Líneas 172-195)
- **Observación:**
  ```typescript
  if (!process.env.TAVILY_API_KEY || !process.env.FAL_KEY) {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        // Iteración y parseo síncrono línea por línea...
      }
    } catch (envError) { ... }
  }
  ```
- **Impacto:**
  En cada mensaje de chat entrante, si alguna variable opcional falta, Node.js lee síncronamente el archivo `.env` del disco con I/O bloqueante, deteniendo el event loop del servidor para todas las peticiones concurrentes.

#### B. Bucle de Inserción Masiva Fila por Fila en Carga de Pólizas (Excel Layout)
- **Archivo Afectado:** `src/app/(dashboard)/cartera/actions.ts` (Líneas 370-420)
- **Observación:**
  En `uploadPoliciesLayout(parsedData: any[])`:
  ```typescript
  for (const row of parsedData) {
    let client = await prisma.client.findFirst({ ... });
    if (!client) client = await prisma.client.create({ ... });
    if (row.policyNumber) {
      const existingPolicy = await prisma.policy.findFirst({ ... });
      if (!existingPolicy) await prisma.policy.create({ ... });
    }
  }
  ```
- **Impacto:**
  Para un archivo Excel de 500 filas, ejecuta hasta **2,000 consultas secuenciales a la base de datos con `await` dentro del bucle**. Esto provoca un tiempo de respuesta de más de 30 a 60 segundos y puede agotar el pool de conexiones de PostgreSQL.

#### C. Comparación de Similaridad Jaccard O(N*M) en Servidor durante Newsletter Cron
- **Archivo Afectado:** `src/app/api/cron/newsletters/route.ts` (Líneas 7-27, 205-208)
- **Observación:**
  Para cada artículo recuperado de la API externa, se calcula el coeficiente de Jaccard tokenizando el título y comparándolo contra los 100 artículos más recientes de la BD en un bucle en memoria.
- **Impacto:** Consumo elevado de CPU en el proceso de Node.js durante la ejecución del cron.

---

### 2.2 Procesos Ociosos, Crons Ineficientes y Vulnerabilidades de Bypass

#### A. Vulnerabilidad de Bypass de Seguridad en Crons Públicos
- **Archivos Afectados:**
  - `src/app/api/cron/newsletters/route.ts` (Línea 101)
  - `src/app/api/cron/publish/route.ts` (Línea 10)
  - `src/app/api/cron/update-udi/route.ts` (Línea 10)
  - `src/app/api/cron/clear-mocks/route.ts` (Línea 12)
- **Observación:**
  Los endpoints de cron contienen una verificación con clave quemada en código: `if (bypass !== 'aacom123' && ...)`.
- **Impacto:**
  Cualquier usuario anónimo en internet puede enviar la URL `GET /api/cron/clear-mocks?bypass=aacom123` o `/api/cron/newsletters?bypass=aacom123` y forzar la ejecución de tareas pesadas o la eliminación de registros de la base de datos sin autenticación.

#### B. Error de Lógica y Desalineación de Tipos en `daily-plan-report`
- **Archivo Afectado:** `src/app/api/cron/daily-plan-report/route.ts` (Línea 68)
- **Observación:**
  ```typescript
  const record = user.dailyRecords[0];
  const plannedObj = record?.planned ? (typeof record.planned === "string" ? JSON.parse(record.planned) : record.planned) : {};
  ```
  En el esquema de Prisma (`schema.prisma` línea 220), `planned` en `DailyRecord` está definido como un número entero (`Int @default(0)`). El código intenta parsear `planned` como una cadena JSON y acceder a `plannedObj[act.id]`.
- **Impacto:**
  `plannedObj[act.id]` resulta siempre en `undefined`, lo que hace que `totalPts` se calcule siempre como `0` para todos los usuarios. El cron ejecuta iteraciones ociosas e intenta enviar mensajes de alerta incorrectos ("Hoy no planeó nada, seguro está de vacaciones") a todos los agentes.

---

### 2.3 Operaciones Costosas Sin Caché (Response / Edge / Memory Caching)

#### A. Chequeo de Estado del Sistema Sin Caché ni Paralelismo (`checkAllSystemsStatus`)
- **Archivo Afectado:** `src/app/(dashboard)/admin/system-status/actions.ts` (Líneas 8-235)
- **Observación:**
  `checkAllSystemsStatus()` ejecuta 9 comprobaciones externas en serie:
  1. Stripe `balance.retrieve`
  2. Twilio `balance.fetch`
  3. Neon DB `SELECT 1`
  4. Banxico API fetch
  5. Vercel Blob env check
  6. Resend API key fetch
  7. **Inferencia con Gemini AI (`generateText` usando `gemini-2.5-flash`)**
  8. **Búsqueda de pago con Tavily API (POST HTTP)**
  9. Newsdata API fetch
- **Impacto:**
  Cada vez que un administrador abre la pantalla o el cron lo invoca, se ejecutan de forma sincrónica e incondicional 9 llamadas externas (incluyendo inferencia de IA y búsqueda pagada en Tavily). Al no estar envueltas en `Promise.allSettled`, la latencia total es la suma de los 9 tiempos de respuesta (aprox. 8 a 15 segundos).

#### B. Falta de Caché en Estadísticas de Dashboard y Rankings
- **Archivo Afectado:** `src/app/actions.ts` (`getAdminDashboardStats` líneas 273-384, `getMonthlyAdnRankings` líneas 1513-1632)
- **Observación:**
  Se consulta la tabla completa de `Cotizacion` y `AdnDiagnostic` sin límites ni caché de respuesta (`unstable_cache` o React `cache`), realizando agrupamientos e iteraciones completas en Javascript en cada renderizado o cambio de pestaña.

---

### 2.4 Pipelines Lentos, Anti-patrón Write-on-Read y Cascadas Asíncronas (Waterfalls)

#### A. Anti-patrón *Write-on-Read* en Server Actions de Lectura
- **Archivo Afectado:** `src/app/actions.ts` (Líneas 1524-1533, 2101-2106, 2409-2420)
- **Observación:**
  En funciones destinadas a consultar datos (lectura), se ejecutan operaciones de escritura masiva (`updateMany`) en la base de datos antes de retornar la respuesta:
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
  ```typescript
  // getWeeklyReportData (líneas 2412-2419):
  await prisma.user.updateMany({ where: { agencyId: null }, data: { agencyId: 'aacom' } });
  await prisma.activityLog.updateMany({ where: { agencyId: null }, data: { agencyId: 'aacom' } });
  ```
- **Impacto:**
  Cada consulta de rankings o reportes semanales bloquea la tabla con transacciones de escritura SQL, incrementando el tiempo de bloqueo (*lock contention*) y ralentizando drásticamente la interfaz.

#### B. Cascadas Asíncronas en Bucle (Waterfalls) en Notificaciones y Crons
- **Archivos Afectados:**
  - `src/app/api/cron/check-apis/route.ts` (Líneas 42-65): Bucle `for (const admin of superAdmins)` con `await client.messages.create(...)` secuencial.
  - `src/app/api/cron/daily-plan-report/route.ts` (Líneas 38-118): Bucle anidado de 3 niveles (`agencies` -> `users` -> `phones`) ejecutando `await twilioClient.messages.create(...)` uno por uno.
  - `src/app/api/webhooks/stripe/route.ts` (`logCommission`, Líneas 83-203): Consultas jerárquicas secuenciales para comisiones Nivel 1, Nivel 2 y Nivel 3 (hasta 6 consultas `findUnique` y 3 `create` con `await` en cadena).

---

## Matriz Resumen de Hallazgos y Rutas de Archivos

| ID | Categoría | Descripción del Problema | Archivo Afectado | Líneas |
|---|---|---|---|---|
| **RD-01** | Redundancia | Sistema Dual de Asistentes IA y Tablas duplicadas (`KnowledgeAsset` vs `KnowledgeDocument`) | `src/app/api/agents/chat/route.ts`<br>`src/app/api/assistant/route.ts` | `chat: 1-1587`<br>`assistant: 1-116` |
| **RD-02** | Redundancia | Re-fetching de `examenIntento` 2 veces en la misma petición HTTP | `src/app/api/cedula-a/agent-data/route.ts` | `83-121` |
| **RD-03** | Redundancia | Re-query redundante de `User` en Server Actions teniendo el token de sesión | `src/app/actions.ts` | Múltiples (ej. `174, 223, 280`) |
| **CB-01** | Rendimiento | Lectura síncrona de `.env` con `readFileSync` en cada POST de Chat | `src/app/api/agents/chat/route.ts` | `172-195` |
| **CB-02** | Rendimiento | Carga masiva de Excel con bucle `for` y `await` fila por fila (hasta 2000 queries) | `src/app/(dashboard)/cartera/actions.ts` | `370-420` |
| **CB-03** | Rendimiento | Secretos de Bypass en Crons expuestos públicamente (`?bypass=aacom123`) | `src/app/api/cron/*/route.ts` | Newsletters: 101, Publish: 10, UDI: 10 |
| **CB-04** | Rendimiento | Error de tipo en `daily-plan-report` parseando `Int` como `JSON` (Puntos siempre 0) | `src/app/api/cron/daily-plan-report/route.ts` | `68` |
| **CB-05** | Rendimiento | Chequeo de estado (`checkAllSystemsStatus`) con 9 llamadas externas secuenciales | `src/app/(dashboard)/admin/system-status/actions.ts` | `8-235` |
| **CB-06** | Rendimiento | Anti-patrón *Write-on-Read*: `updateMany` ejecutándose en Server Actions de lectura | `src/app/actions.ts` | `1524-1533, 2409-2420` |
| **CB-07** | Rendimiento | Cascadas asíncronas (*waterfalls*) en envío de SMS/WhatsApp dentro de crons | `src/app/api/cron/daily-plan-report/route.ts`<br>`src/app/api/cron/check-apis/route.ts` | `daily: 38-118`<br>`check: 42-65` |

---

## Recomendaciones de Refactorización

1. **Eliminar Anti-patrones Write-on-Read**: Trasladar las actualizaciones de migración masiva de `updateMany` a scripts de migración de Prisma independientes o crons de mantenimiento de una sola ejecución.
2. **Paralelizar Llamadas Externas (`Promise.all` / `Promise.allSettled`)**:
   - En `checkAllSystemsStatus`, ejecutar las 9 verificaciones concurrentemente.
   - En el webhook de Stripe y en los crons de mensajería, despachar mensajes de Twilio y WebPush en lotes paralelos.
3. **Optimizar Cargas Masivas en Cartera**: Reemplazar las consultas individuales en bucle en `uploadPoliciesLayout` por un mecanismo de resolución de clientes y pólizas en lote con `findMany({ where: { name: { in: names } } })` y `createMany`.
4. **Remover Secreto Bypass en Código**: Eliminar las claves `aacom123` expuestas en URL y requerir únicamente la cabecera `Authorization: Bearer CRON_SECRET` de Vercel.
5. **Consolidar el Módulo de Asistente IA**: Unificar la tabla de base de conocimientos (`KnowledgeDocument` vs `KnowledgeAsset`) y estandarizar en un solo endpoint la integración con Gemini.
6. **Implementar Caché de Servidor**: Utilizar `unstable_cache` de Next.js o `React.cache` para consultas pesadas como `getAdminDashboardStats` y `getMonthlyAdnRankings`.
