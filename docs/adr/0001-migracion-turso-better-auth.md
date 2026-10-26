# ADR 0001: Migración de Supabase a Turso (Database-per-Tenant) con Better Auth

**Estado:** Aprobado  
**Fecha:** 2026-10-26  
**Autores:** Arquitectura Vitalist Track  
**Pila Objetivo:** Turso (LibSQL Serverless) + Drizzle ORM + Better Auth + Vercel Edge / Serverless Functions

---

## 1. Contexto y Problema

Vitalist Track es un software de gestión clínica (SaaS) que maneja expedientes médicos, odontológicos, psicológicos y facturación. El prototipo original dependía fuertemente de Supabase:
- Más de 600 consultas cliente directas con `supabase.from()`.
- RLS complejo y propenso a errores humanos o filtraciones accidentales entre clínicas en una base de datos PostgreSQL compartida.
- Riesgo de cuellos de botella por cuotas de conexión de PostgreSQL.
- Dependencia de un proveedor con costos elevados de escalabilidad multi-inquilino.
- Requisito de negocio: **Cada cliente (clínica) debe tener sus datos completamente aislados**, con soporte para múltiples sucursales y accesos concurrentes de personal.

---

## 2. Decisión Tomada

Se decide migrar la persistencia y la capa de autenticación a una arquitectura **Database-per-Tenant** sobre **Turso (LibSQL Serverless)** y **Better Auth**:

### Componentes de la Solución:
1. **Control Plane DB (Central en Turso):**
   - Aloja la autenticación (Better Auth), catálogo de usuarios, organizaciones (clínicas), membresías/roles, suscripciones y el registro de credenciales de conexión a las bases de datos de cada clínica (`clinic_databases`).
2. **Tenant DB (Por Clínica en Turso):**
   - Una base de datos LibSQL física dedicada e independiente por cada clínica registrada.
   - Aloja sucursales, pacientes, consultas, expedientes clínicos, facturación e inventario.
3. **Better Auth (Autohospedado en Vercel Functions):**
   - Autenticación segura mediante cookies `httpOnly`, sesión en base de datos central, soporte TOTP/2FA y roles organizacionales sin costo por usuario activo.
4. **Drizzle ORM:**
   - Tipado estricto extremo y compatibilidad directa con `@libsql/client`.
5. **Caché de Conexiones LRU en Edge/Serverless:**
   - Pool ligero en memoria que reutiliza las instancias del cliente LibSQL para evitar sobrecarga en invocaciones serverless en Vercel.

---

## 3. Consecuencias y Compensaciones

### Ventajas (Pros):
- **Aislamiento Físico Total:** Imposible que un fallo de consulta o un bug de software filtre historias clínicas de una clínica a otra.
- **Rendimiento Ultrarrápido:** Latencia de milisegundos mediante la replicación geográfica de Turso/LibSQL.
- **Costos Prácticamente Nulos al Iniciar:** Turso ofrece miles de bases de datos serverless gratuitas, ideal para arrancar sin costos fijos de servidores.
- **Backups y Portabilidad Individual:** Posibilidad de exportar o restaurar la base de datos de una sola clínica en un archivo SQLite estándar.

### Desventajas y Mitigaciones (Cons):
- **Gestión de Migraciones Multi-Tenant:** Se requiere un script de migración que ejecute Drizzle migrations en el Control Plane y luego en lote a través de todas las Tenant DBs activas.
- **Falta de Funciones Nativas de Realtime:** Supabase Realtime se sustituye por Server-Sent Events (SSE) o polling optimizado con React Query (`staleTime: 5000`).
- **Almacenamiento de Archivos:** Las imágenes médicas y adjuntos se moverán a Cloudflare R2 / Vercel Blob con firmas presignadas.
