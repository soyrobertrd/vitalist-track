# Plan maestro: seguridad, migración Turso + Better Auth y rediseño del panel admin

> Encargo para un agente de código. Este documento unifica `plan-rediseno-admin.md`, el "Plan Maestro de Mejoras: Panel de Administración para Empresas de Salud" (Gemini) y lo pendiente de `adr/0001-migracion-turso-better-auth.md` (el ADR es el "por qué"; esto es el "qué y en qué orden").
> **Principio de diseño (heredado):** Modo B, "CRM médico limpio y plano": `shadow-none`, densidad equilibrada, respuesta < 150 ms, shadcn/ui, ningún archivo de más de 900 líneas.
> Rama de trabajo: `feat/plan-maestro`, con una rama o PR por fase. Commits pequeños.
> No hacer commit de `.env`, `local-*.db` ni de cambios ajenos (el árbol tiene mucho trabajo sin commitear).
> **El orden importa:** la Fase 0 bloquea todo lo demás.

---

## 1. Estado actual (verificado en el código, 2026-10-26)

### Migración Turso + Better Auth (ADR 0001): empezada, sin terminar

| Pieza del ADR | Estado | Evidencia |
|---|---|---|
| Esquemas Drizzle (control plane + tenant) | ✅ Hecho | `src/server/db/control-plane-schema.ts`, `tenant-schema.ts`, `drizzle.config.ts` |
| Pool LRU de conexiones | ✅ Hecho | `src/server/db/connection-manager.ts` |
| API v1 (patients, appointments, health) | 🟡 Parcial: 2 recursos | `api/v1/*` |
| Better Auth | ❌ No instalado | no está en `package.json`; el esquema tiene tablas compatibles, pero no hay servidor de auth |
| Autenticación en la API | ❌ **No existe** | ver S1 |
| Cifrado de tokens Turso por tenant | ❌ Texto plano | `connection-manager.ts:146` `// Will decrypt in production` |
| Migrar las 619 llamadas `supabase.from()` | ❌ 0% | `grep -c supabase.from src` |
| Script de migraciones en lote para tenants | ❌ No existe | ADR §3 |
| Sustituto de Realtime (SSE/polling) | ❌ | ADR §3 |
| Archivos → R2 / Vercel Blob | ❌ | ADR §3 |
| Migrar las 24 edge functions / crons de Supabase | ❌ | `supabase/functions/*` (ya tienen `cron-auth.ts` con `CRON_SECRET`) |
| Migración de datos Supabase → Turso | ❌ | `scripts/seed-local-environment.*` solo hace seed local |

### Plan de mejoras del panel admin (Gemini): mayormente hecho
| Punto | Estado | Evidencia |
|---|---|---|
| Rutas: `/app` es el dashboard; `/dashboard` y `/app/dashboard` redirigen; `/app/planes` y `/app/admin` | ✅ | `src/App.tsx:210-257` |
| Modelo de planes (Básico 15 / Pro 35 / Plus 85 / Enterprise 165 USD, prueba de 30 días → Gratuito) | ✅ en config | `src/config/planes.ts` |
| Matriz del sidebar por vertical y plan | ✅ | `src/config/sidebar-permissions.ts` → `Layout.tsx` |
| Selector de clínica de origen (Pro, hasta 3 clínicas) | 🟡 Componente creado; falta confirmar que se integra en el formulario **y en la tabla** de pacientes, y que se guarda | `src/components/pacientes/ClinicaOrigenSelect.tsx` |
| Degradación automática al plan Gratuito al vencer la prueba | ❓ Sin verificar: buscar el cron o webhook que lo haga | `supabase/functions/payments-webhook`, crons |
| Límite de 900 líneas | 🟡 `EditPacienteDialog.tsx` 888 y `ConfiguracionAdmin.tsx` 860 están al borde; esta fase les añade código | `wc -l` |
| Verificación visual en vivo | ❌ Pendiente, y además el despliegue de Vercel está en blanco (ver S9) | — |
| Matriz del sidebar aplicada **en el servidor** | ❌ Solo se oculta en la UI; las rutas siguen accesibles por URL y los datos por API | ver S5 |

### Panel admin y diseño (rediseño): 1 de 5 fases hechas
- ✅ Navegación lateral agrupada, `?tab=` en la URL y header con plan/uso (`src/pages/ConfiguracionAdmin.tsx`).
- ❌ Todo lo de las fases de diseño de abajo (colores por vertical, tarjetas, permisos, etc.).

---

## 2. Hallazgos de seguridad (prioridad)

| ID | Severidad | Hallazgo | Evidencia |
|---|---|---|---|
| **S1** | 🔴 Crítica | La API v1 confía en la cabecera `x-clinic-id` sin autenticar a nadie. **Cualquiera puede leer o crear pacientes de cualquier clínica** si conoce o adivina su id. Contradice la promesa del ADR de "aislamiento total". | `src/server/middleware/tenant-context.ts`, `api/v1/patients/index.ts` |
| **S2** | 🔴 Crítica | Los tokens de Turso por clínica se guardan y usan en texto plano, aunque la columna se llama `..._encrypted`. Una fuga del control plane = acceso a todas las clínicas. | `connection-manager.ts:146`, `control-plane-schema.ts:97` |
| **S3** | 🟠 Alta | `.env`, `local-control-plane.db` y `local-tenant.db` **no están en `.gitignore`**. `.env` ya estuvo versionado (commits `2c23f5d` → `bc20cf8`). Las bases locales pueden tener datos de pacientes. | `.gitignore`, `git log -- .env` |
| **S4** | 🟠 Alta | Hoy, en Supabase, la lista de usuarios del admin no se filtra por centro (`fetchUsuarios` lee todos los `profiles`). Hay que verificar la RLS de `profiles`. | `ConfiguracionAdmin.tsx` |
| **S5** | 🟠 Alta | El admin se protege solo con `isAdmin` global en el cliente. No mira `currentWorkspace.role`, ni el plan. La protección real tiene que estar en el servidor. | `ConfiguracionAdmin.tsx` |
| **S6** | 🟡 Media | La API v1 hace `req.json()` y pasa el body directo al servicio, sin validar el esquema; `limit` no tiene tope. | `api/v1/patients/index.ts` |
| **S7** | 🟡 Media | Hay 5 usos de `dangerouslySetInnerHTML` y `src/lib/sanitize.ts` solo se usa en 3 archivos. Hay que confirmar que los 5 sanitizan. | `grep dangerouslySetInnerHTML src` |
| **S9** | 🔴 Bloqueante | El despliegue en Vercel sale en blanco: `supabaseUrl is required`. El frontend aún depende de Supabase (619 llamadas), y las variables `VITE_SUPABASE_*` no están en Vercel. | `src/integrations/supabase/client.ts` |
| **S10** | 🟠 Alta | El límite de pacientes, usuarios y dispositivos por plan parece aplicarse solo en la UI. Un cliente modificado podría superarlo. | `src/config/planes.ts` |
| **S8** | 🟡 Media | No hay rate limiting, ni cabeceras de seguridad (CSP, HSTS, X-Frame-Options), ni registro de auditoría en la API nueva. | `vercel.json` / `api/` |

---

## 3. Fases

Cada fase tiene un **"Hecho cuando"**. No pasar a la siguiente sin cumplirlo.

### Fase 0 — Contención de seguridad (bloqueante, ~1 día)
0. **S9:** mientras exista código de Supabase, en Vercel hacen falta `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. La anon key es pública por diseño; en Vercel, marcarlas como no sensibles ("Config"). Si se decide no usar Supabase nunca más, la app no puede desplegarse con login funcional hasta terminar las Fases 1 y 3. Hay que elegir:
   - (a) mantener Supabase mientras dura la migración (recomendado), o
   - (b) desplegar solo la landing.

   `vercel.json` ya incluye el rewrite de SPA.
1. **S3:** añadir a `.gitignore`: `.env`, `.env.*`, `!.env.example`, `*.db`, `*.db-*`. Hacer `git rm --cached` si alguno está en el índice.
   - **Rotar** cualquier secreto que haya estado en `.env` en el historial (Supabase service role si estuvo, tokens de Turso). La anon key es pública, pero igual hay que revisar que no hubiera otra cosa.
   - Si hay que reescribir el historial, **no hacerlo sin permiso del dueño**: avisar y proponer.
2. **S1:** hasta que exista Better Auth, la API v1 **no se despliega**. Que `resolveTenantContext` falle cerrado (401) si no hay sesión, y agregar un test que lo pruebe.
3. **S4:** revisar la RLS de `profiles` en `supabase/migrations`. Si deja ver perfiles de otros workspaces: crear una migración que los limite a los miembros del mismo workspace, y filtrar `fetchUsuarios` por `workspace_members.workspace_id`.

**Hecho cuando:** `git status` no muestra `.env` ni `.db`, una llamada a `/api/v1/patients` sin sesión devuelve 401 y un admin del centro A no ve usuarios del centro B.

### Fase 1 — Autenticación con Better Auth (núcleo del ADR)
1. Instalar `better-auth` con el adaptador Drizzle sobre el control plane. Usar las tablas que ya existen en `control-plane-schema.ts` y ajustarlas si el adaptador lo pide.
2. Ruta `api/auth/[...all].ts`. Cookies `httpOnly; Secure; SameSite=Lax`. Plugins: `organization` (clínicas y roles owner/admin/member) y `twoFactor` (TOTP), con **2FA obligatorio para owner y admin**.
3. `resolveTenantContext`:
   - sesión → `userId`;
   - `clinicId` de la cabecera;
   - **comprobar la membresía** en el control plane; si no es miembro → 403;
   - devolver `{ clinicId, db, userId, role }`.
4. Helper `requireRole(ctx, "admin")` para las rutas de administración, y `requireFeature(ctx, "facturacion_ars")`, que lee el plan del control plane con las mismas claves de `src/config/sidebar-permissions.ts` (una sola fuente de verdad; mover el archivo a un lugar compartido entre cliente y servidor).
4b. **S10:** comprobar en el servidor los límites del plan (pacientes, usuarios, dispositivos) al crear. Si se supera → 402/403 con el problem-detail.
5. **S2:** cifrar los tokens de Turso con AES-256-GCM (`node:crypto`), con la clave en `TENANT_TOKEN_KEY` y un IV por registro. Descifrar en `getTenantDb`. Escribir un script para recifrar los registros que ya existen.
6. Tests: sin sesión → 401; sesión de otra clínica → 403; member en una ruta de admin → 403; un token cifrado se descifra igual al original.

**Hecho cuando:** los 4 tests pasan y el login funciona en local contra `local-control-plane.db`.

### Fase 2 — Endurecer la API
1. **S6:** validar con `zod`, que ya es dependencia (confirmarlo en `package.json`), cada body y cada query. `limit` con máximo de 100.
2. **S8:** cabeceras en `vercel.json`: CSP (`default-src 'self'` + los orígenes reales), HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
3. Rate limit en `api/auth/*` (login, 2FA) por IP + email. Usar Upstash si ya está; si no, una tabla en el control plane. `shortcut:` documentar el límite.
4. Auditoría: una tabla `audit_log` en el **tenant** (quién, qué, cuándo, recurso) para escrituras sobre pacientes y expedientes. Es obligatorio en salud.
5. **S7:** revisar los 5 `dangerouslySetInnerHTML` y pasarlos por `src/lib/sanitize.ts`.

### Fase 3 — Migrar datos y llamadas (la más larga, por módulo)
1. Herramienta `scripts/migrate-tenants.ts`: aplica las migraciones de Drizzle al control plane y luego, en lote, a cada tenant activo. Tiene que ser idempotente, registrar la versión por tenant y poder ejecutarse en modo `--dry-run`.
2. Script de export Supabase → Turso por clínica, verificando conteos por tabla.
3. Migrar las 619 `supabase.from()` **por módulo** (pacientes → citas → expedientes → facturación → el resto), cada uno a `src/lib/api-client.ts` + React Query (`staleTime: 5000`, como dice el ADR). Un PR por módulo.
4. Realtime → polling con React Query. Usar SSE solo donde el polling no alcance (por ejemplo la agenda en vivo).
5. Archivos → R2 o Vercel Blob con URLs firmadas de vida corta (≤ 5 min).
6. Las 24 edge functions → `api/cron/*` con Vercel Cron, conservando el patrón `CRON_SECRET` + comparación en tiempo constante de `_shared/cron-auth.ts`.
7. Retirar Supabase solo cuando `grep -r supabase src` dé 0.

**Hecho cuando:** cada módulo funciona en local contra Turso y sus tests de aislamiento entre tenants pasan.

### Fase 4 — Sistema visual: colores por tipo de centro
Diagnóstico:
- Un solo `--primary` azul (`src/index.css` líneas 20 y 79).
- Unos 1.100 colores Tailwind escritos a mano.
- `--admin-primary` y `--admin-secondary` no están definidos (el badge del admin sale sin fondo).
- `GlassCard` (`bg-white/10`) casi no se ve sobre fondo blanco.

1. Bloques `[data-vertical="…"]` y `.dark [data-vertical="…"]` en `index.css`, que sobrescriben `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring`, `--accent` y `--chart-1`. Los colores semánticos (success, warning, destructive) **no cambian**.

   | Vertical | `--primary` claro | oscuro | `--accent` |
   |---|---|---|---|
   | clinica / todas | `217 91% 52%` azul | `217 91% 62%` | `199 89% 48%` |
   | dental | `188 86% 36%` cian | `188 80% 50%` | `172 66% 40%` |
   | aesthetic | `330 65% 50%` frambuesa | `330 75% 65%` | `275 60% 60%` |
   | recovery | `158 64% 34%` salvia | `158 55% 48%` | `142 50% 45%` |
   | vision | `245 58% 55%` índigo | `245 70% 70%` | `217 80% 60%` |
   | psicologia | `265 45% 52%` lavanda | `265 60% 70%` | `199 50% 55%` |

   Verificar el contraste: blanco sobre `--primary` ≥ 4.5:1. Ajustar la luminosidad (L) si alguno no pasa.
2. `--admin-primary: var(--primary); --admin-secondary: var(--accent);`
3. En `VerticalProvider` (`src/contexts/VerticalContext.tsx`), un `useEffect` → `document.documentElement.dataset.vertical`. Si es `"todas"`, usar la vertical principal del centro (`workspaces.configuracion.vertical_principal`); si no hay, el azul.
4. `GlassCard` → `rounded-xl border bg-card text-card-foreground shadow-none` (Modo B: plano, sin sombras), y en hover solo `hover:border-primary/40`. **Misma API**, para no tocar sus ~115 usos. Revisar `Landing.tsx` y `Auth.tsx`, que pueden depender del vidrio.
5. Mover `verticalLabel`, `verticalIcon` y `verticalRoot` de `Layout.tsx` a `src/config/verticales.ts`. Incluir `psicologia`, que hoy falta en `VerticalesAdmin.tsx`.

**Hecho cuando:** al cambiar de vertical cambian el sidebar, los botones y los focos sin recargar, en claro y oscuro.

### Fase 5 — Panel admin limpio y adaptado a rol y plan
1. `SectionHeader({ title, description, actions })` dentro de `ConfiguracionAdmin.tsx`, reemplazando los 12 encabezados `text-2xl font-bold mb-2` por `text-lg font-semibold`. Formularios con `max-w-3xl`.
2. Item activo de la navegación: `bg-primary/10 text-primary border-l-2 border-primary`.
3. Chip con el tipo de centro en el header.
4. Tarjeta "Plan y uso" con `ui/progress` para usuarios, pacientes y profesionales contra los límites. CTA a `/planes` cuando pase del 80%.
5. **S5:**
   - `member` → redirigir;
   - `admin` → todo menos plan y facturación;
   - `owner` → todo.
   - Las secciones que el plan no incluye se muestran con candado y una tarjeta de upsell, nunca vacías. Usar solo claves que existan en `planes.caracteristicas` y `src/config/planes.ts`. **Tras la Fase 1, la misma regla tiene que aplicarse en el servidor con `requireRole`.**
6. "General" guarda de verdad en `workspaces.configuracion` (nombre, formato de fecha, vertical principal) y después llama a `refresh()`. Hoy el botón no hace nada.
7. Nuevas secciones de seguridad (dependen de la Fase 1):
   - **Sesiones activas** (Better Auth `listSessions` / `revokeSession`);
   - **2FA del equipo**: quién lo tiene activo, con opción de exigirlo;
   - **Registro de auditoría** que lee `audit_log`.
8. `VerticalesAdmin.tsx`: el mismo header, y una muestra del color de cada vertical (`<div data-vertical="dental">` con un círculo `bg-primary`).

### Fase 5b — Pendientes del plan de mejoras del panel admin
1. Terminar el selector de clínica de origen: integrarlo en `NuevoPacienteForm`, `EditPacienteDialog` y una columna con filtro en la tabla de pacientes. Mostrarlo solo en el plan Pro. Guardar la lista en `workspaces.configuracion.clinicas_asociadas` (máximo 3) y editarla desde `/app/admin` → General.
2. Degradación al plan Gratuito: si no existe, un cron diario (`CRON_SECRET`) que pase a `gratuito` los workspaces con `trial_ends_at < now()` y sin pago. Avisar al owner 7, 3 y 1 días antes.
3. Dividir `ConfiguracionAdmin.tsx` y `EditPacienteDialog.tsx` antes de agregarles nada: una sección o pestaña por archivo en `src/components/admin/`, siguiendo el patrón `Configuracion*Tab.tsx` que ya se usó en `Configuracion.tsx`.
4. Las secciones de dominio propio (Plus) y de base de datos dedicada (Enterprise) del admin muestran un candado y upsell en los planes inferiores, según la matriz.

### Fase 6 — Pulido de diseño general
1. Reemplazar los colores escritos a mano **solo** en `DentalCarePro`, `AestheticPro`, `VisionCarePro`, `RecoveryCare`, `PsicologiaPro`, `ConfiguracionAdmin` y `VerticalesAdmin`:
   - azul, morado o rosa usados como marca → `primary`;
   - verde, ámbar o rojo que indican estado → `success`, `warning` y `destructive`.
   - No tocar `src/components/ui/*`.
2. Estados vacíos, de carga y de error consistentes: `Skeleton` en lugar de "Cargando..." en texto.
3. Accesibilidad: `aria-label` en los botones que solo tienen icono, foco visible, `prefers-reduced-motion`.
4. Tipografía: una sola escala (página `text-2xl`, sección `text-lg`, cuerpo `text-sm`) y números tabulares (`tabular-nums`) en tablas y métricas.

---

### Fase 7 — Dashboards con gráficos (circulares, barras y proyección)
Estado actual:
- `src/pages/Dashboard.tsx` (477 líneas) solo tiene KPIs en tarjetas, sin gráficos (el `LineChart` que importa es un icono de lucide).
- `recharts` 2.15 ya está instalado y existe el wrapper de shadcn `src/components/ui/chart.tsx` (`ChartContainer`, `ChartTooltip`, `ChartLegend`), pero **nadie lo usa**.

Reglas:
- **No agregar librerías.** Todo con `ChartContainer` + recharts.
- Los colores salen de `--chart-1..5`, con `--chart-1` igual a `--primary` de la vertical (Fase 4). Así cada tipo de centro ve sus gráficos en su color.
- Modo B: sin sombras, cuadrícula tenue (`stroke-border`), ejes en `text-muted-foreground text-xs`, números con `tabular-nums`.
- Cada gráfico tiene título, el periodo visible, un estado de carga (`Skeleton`), un estado vacío ("Sin datos en este periodo") y una tabla accesible oculta (`sr-only`) o `aria-label` con el resumen.

1. **Componentes reutilizables** en `src/components/charts/`: `DonutCard`, `BarCard`, `TrendCard`. Cada uno recibe `{ title, data, config, loading }` y tiene menos de 150 líneas.
   - **Circular (donut, no pie lleno):**
     - máximo 5 segmentos más "Otros";
     - el total va en el centro;
     - la leyenda muestra el porcentaje.
   - **Barras:**
     - verticales para series de tiempo;
     - horizontales para rankings (top profesionales, top servicios);
     - barras apiladas solo si hay ≤ 3 series.
   - **Línea con proyección:**
     - línea sólida para los datos reales y línea punteada (`strokeDasharray="4 4"`) para la proyección;
     - banda sombreada (`Area` con `fillOpacity 0.1`) para el rango de confianza;
     - `ReferenceLine` vertical en "hoy";
     - la leyenda dice "Proyección" de forma explícita.
2. **Cálculo de proyección** en `src/lib/forecast.ts`:
   - regresión lineal simple sobre las últimas N semanas, más una banda de ±1 desviación estándar de los residuos;
   - funciones puras y **con test** (serie constante → proyección plana; serie lineal → la continúa exacta; menos de 4 puntos → no proyecta y lo indica).
   - `shortcut:` regresión lineal, sin estacionalidad. Pasar a Holt-Winters si hay más de 1 año de datos.
3. **Dashboard general** (`/app`), en una cuadrícula `lg:grid-cols-3`:
   - Donut: pacientes por estado (`status_px`), con los datos que ya se cargan.
   - Barras: citas por día de las últimas 4 semanas (atendidas vs canceladas/no-show).
   - Línea + proyección: ingresos mensuales de los últimos 6 meses, proyectados 3 meses. **Solo para owner/admin**; los profesionales ven su volumen de citas.
   - Selector de periodo (7d / 30d / 90d / 12m) guardado en `?periodo=`.
4. **Gráficos por vertical** (en la página Pro de cada una, usando los mismos componentes):

   | Vertical | Donut | Barras | Proyección |
   |---|---|---|---|
   | dental | Tratamientos por tipo | Presupuestos aceptados vs rechazados | Ingresos por tratamientos |
   | aesthetic | Procedimientos más vendidos | Membresías nuevas vs bajas | Ingresos por membresías (MRR) |
   | vision | Tipo de receta (lejos/cerca/progresivo) | Ventas de óptica por mes | Ventas de monturas/lentes |
   | recovery | Ocupación de camas | Altas vs ingresos por semana | Ocupación proyectada |
   | psicologia | Pacientes por motivo de consulta | Asistencia vs inasistencia por semana | Sesiones proyectadas |
   | clinica | Pacientes por servicio | Citas por especialidad | Pacientes nuevos |

   Usar solo tablas y columnas que existan. Si falta un dato, omitir ese gráfico y anotarlo en el PR; **no inventar datos de ejemplo** en producción.
5. **Rendimiento:**
   - consultas agregadas en el servidor (RPC/vista en Supabase ahora, endpoint en `api/v1/metrics` tras la Fase 3), nunca descargar todas las filas para contar en el cliente;
   - React Query con `staleTime` de 60 s;
   - los gráficos se cargan con `lazy()` para no engordar el bundle principal (el build ya avisa de chunks de más de 500 kB).
6. Respetar el plan: los gráficos de ingresos y de proyección aparecen desde el plan **Pro** en adelante; en Básico se muestran con candado y upsell, según `sidebar-permissions.ts`.

**Hecho cuando:**
- `/app` muestra los 3 gráficos con datos reales;
- cambian de color al cambiar de vertical;
- funcionan en claro y oscuro, y a 375px se apilan en 1 columna;
- `forecast.ts` tiene sus tests en verde.

## 4. Verificación (en cada fase)
- `npx tsc --noEmit -p tsconfig.app.json` sin errores nuevos. Los tests de la fase, en verde.
- Fases de seguridad: probar los casos 401 y 403 con `scripts/test-api-flow.mjs` (ampliarlo).
- Fases visuales: `npm run dev`, abrir `/app/admin` y `VerticalesAdmin`:
  - en 6 verticales × claro/oscuro;
  - a 375px y a 1280px, sin scroll horizontal;
  - navegación solo con teclado.

  Adjuntar al PR una cuadrícula de capturas.
- Probar con tres usuarios (owner, admin, member) y con dos planes (básico y alto).

## 5. Fuera de alcance
- Colores o logo personalizados por clínica. Si se pide más adelante, reutilizar el mismo mecanismo `data-*` con `workspaces.configuracion.color`.
- Rediseñar las pantallas clínicas: solo heredan el color.
- Nuevas librerías de UI.

## 6. Riesgos y decisiones abiertas (para el dueño del producto)
- **Contradicción entre el ADR y el modelo de planes:** el ADR dice "una base de datos física por clínica" para todas, pero el plan de precios reserva la "base de datos dedicada" a Enterprise (USD 165), y el resto la tiene "compartida". Hay que elegir una:
  - (a) BD por clínica para todas, y en Enterprise se vende otra cosa (región o réplica propia, backups exportables); o
  - (b) BD compartida con aislamiento por `clinic_id` en los planes inferiores, lo que obliga a un filtro obligatorio en cada consulta y tests de aislamiento.

  **Esto define la Fase 1 y la 3; decidirlo antes de empezarlas.**
- **Reescribir el historial de git** para borrar `.env`: requiere force-push y coordinación con el equipo. Alternativa: rotar los secretos y no reescribir.
- **Convivencia Supabase/Turso** durante la Fase 3: hay que decidir si migrar todas las clínicas a la vez o una por una, con una bandera (`clinic.backend = "supabase" | "turso"`).
- La Fase 4 cambia el aspecto de toda la app (GlassCard).
- Cumplimiento: los datos de salud pueden requerir retención y auditoría según la normativa local (RD: Ley 172-13 de datos personales). Validarlo con legal antes de definir la retención del `audit_log`.
