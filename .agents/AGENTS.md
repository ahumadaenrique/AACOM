# Reglas del Proyecto AACOM

## Desarrollo y Ambientes
- Siempre que vayamos a desarrollar una funcionalidad nueva, pregunta explícitamente al usuario si se realiza en **Dev** o en **Producción** (a menos que pida explícitamente corregir un error crítico directamente en producción).
- Antes de iniciar cualquier desarrollo mediano o mayor, siempre revisa y confirma que los entornos de **Dev** y **Producción** estén completamente copiados, alineados y al día.

## Bases de Datos y Prisma (Reglas de Oro)
- **NUNCA** utilices el comando `--accept-data-loss` en los scripts de Vercel ni localmente contra producción. Si hay un conflicto de esquema (drift), repáralo manualmente usando SQL crudo o `prisma migrate resolve`, pero JAMÁS fuerces un `db push` destructivo porque borra las tablas completas.
- **Neon Branching:** Si la base de datos de producción es restaurada en el tiempo (Time Travel), las columnas más recientes desaparecerán de Postgres pero el código de Vercel seguirá esperándolas. Siempre inyecta los `ALTER TABLE ADD COLUMN IF NOT EXISTS` manualmente mediante un script para reconectar el código moderno con la base restaurada, o desactiva temporalmente `prisma db push` en Vercel.

## Creación de Archivos en Windows (PowerShell)
- **NUNCA** utilices comandos como `echo "codigo" > archivo.ts` en la terminal de Windows para crear código fuente. PowerShell guarda por defecto en UTF-16, lo que rompe los compiladores web (Webpack, Next.js) lanzando el error `stream did not contain valid UTF-8`. Utiliza SIEMPRE la herramienta dedicada `write_to_file` para asegurar la codificación UTF-8.

## Aislamiento Multi-Inquilino (SaaS Multi-Tenancy)
- **NUNCA** permitas que se filtren o mezclen agentes, usuarios, pólizas, carteras o diagnósticos de distintas agencias en consultas o dashboards.
- En una arquitectura SaaS, las consultas a la base de datos SIEMPRE deben estar estrictamente acotadas por `agencyId` (ej. `where: { agencyId: effectiveAgencyId }`).
- Los administradores regulares (`ADMIN`) tienen estrictamente prohibido consultar datos fuera de su `user.agencyId`.
- Para Super Administradores (`SUPER_ADMIN`), la vista y los filtros predeterminados SIEMPRE deben ser la agencia principal del usuario (`user.agencyId`, típicamente `"aacom"`), NUNCA `"ALL"` o un barrido abierto que agrupe a todos los inquilinos de la base de datos.
- Cada promotoría/agencia es un espacio de trabajo aislado; la navegación entre agencias para Super Admin debe ser selector por agencia específica, sin vistas combinadas que expongan agentes de otras organizaciones.
