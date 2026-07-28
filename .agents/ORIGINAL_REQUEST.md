# Original User Request

## 2026-07-28T04:31:30Z

<USER_REQUEST>
# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Realizar una auditoría profunda de procesos, seguridad, arquitectura de base de datos y flujos de código de la aplicación web AACOM (Next.js, Prisma, PostgreSQL). El objetivo es identificar redundancias en el guardado de información, procesos ociosos, vulnerabilidades de seguridad y asegurar un rendimiento óptimo de los módulos.

Working directory: C:/Proyectos Antigravity/Google Antigravity/aacom-25
Integrity mode: development

## Requirements

### R1. Reporte de Auditoría (Solo Lectura)
El equipo de agentes debe analizar de manera exhaustiva el código fuente completo (Front-end, Back-end y esquemas de base de datos) operando de manera strictly de solo lectura. No se debe modificar, refactorizar ni eliminar ningún archivo de código del proyecto.

### R2. Entrega de Hallazgos
El entregable final debe ser un único archivo markdown llamado `audit_report_final.md` generado en la raíz del directorio de trabajo. Este reporte debe estructurar los hallazgos en al menos tres categorías obligatorias: 1. Vulnerabilidades de Seguridad, 2. Redundancias de Datos, 3. Cuellos de botella y procesos ociosos. Cada hallazgo debe citar el archivo o componente específico.

## Acceptance Criteria

### Verificación de Entregable
- [ ] Existe el archivo `audit_report_final.md` en la raíz del proyecto.
- [ ] El reporte contiene las secciones: Seguridad, Redundancia de Datos, y Cuellos de Botella.
- [ ] El reporte menciona rutas de archivos específicos donde se encontraron las áreas de mejora.

### Verificación de Integridad
- [ ] Ningún archivo fuente de la aplicación (`.ts`, `.tsx`, `.prisma`, etc.) fue modificado o alterado por los agentes (se puede comprobar verificando que el árbol de git no tenga archivos modificados generados por los agentes).

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*
</USER_REQUEST>

## 2026-07-28T04:32:12Z

<USER_REQUEST>
# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Realizar una auditoría profunda de procesos, arquitectura de base de datos y flujos de código de la aplicación web AACOM (Next.js, Prisma, PostgreSQL). El objetivo es identificar redundancias en el guardado de información, procesos ociosos, cuellos de botella y asegurar un rendimiento óptimo de los módulos.

Working directory: C:/Proyectos Antigravity/Google Antigravity/aacom-25
Integrity mode: development

## Requirements

### R1. Reporte de Auditoría (Solo Lectura)
El equipo de agentes debe analizar de manera exhaustiva el código fuente completo (Front-end, Back-end y esquemas de base de datos) operando de manera estrictamente de solo lectura. No se debe modificar, refactorizar ni eliminar ningún archivo de código del proyecto.

### R2. Entrega de Hallazgos
El entregable final debe ser un único archivo markdown llamado `audit_report_final.md` generado en la raíz del directorio de trabajo. Este reporte debe estructurar los hallazgos en al menos dos categorías obligatorias: 1. Redundancias de Datos, 2. Cuellos de botella y procesos ociosos (Rendimiento). Cada hallazgo debe citar el archivo o componente específico.

## Acceptance Criteria

### Verificación de Entregable
- [ ] Existe el archivo `audit_report_final.md` en la raíz del proyecto.
- [ ] El reporte contiene las secciones: Redundancia de Datos, y Cuellos de Botella (Rendimiento).
- [ ] El reporte menciona rutas de archivos específicos donde se encontraron las áreas de mejora.

### Verificación de Integridad
- [ ] Ningún archivo fuente de la aplicación (`.ts`, `.tsx`, `.prisma`, etc.) fue modificado o alterado por los agentes (se puede comprobar verificando que el árbol de git no tenga archivos modificados generados por los agentes).

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*
</USER_REQUEST>
