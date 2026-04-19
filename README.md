# Health App - Sistema de Gestión de Salud

Sistema integral de gestión de pacientes, visitas, llamadas y atención médica desarrollado con React, TypeScript, Tailwind CSS y Supabase.

![Health App Logo](src/assets/logo-horizontal.png)

## 📋 Tabla de Contenidos

- [Características Principales](#características-principales)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Módulos del Sistema](#módulos-del-sistema)
- [Guía de Uso](#guía-de-uso)
- [Roles y Permisos](#roles-y-permisos)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Contribución](#contribución)

## ✨ Características Principales

### 🏥 Gestión de Pacientes
- Registro completo de pacientes con datos demográficos
- Historial médico básico
- Gestión de medicamentos y muestras médicas
- Seguimiento por profesional asignado
- Clasificación por grado de dificultad y zona
- Importación masiva desde CSV/Excel/JSON

### 📞 Registro de Llamadas
- Agendamiento de llamadas de seguimiento
- Tracking de resultados (contactado, no contesta, etc.)
- Registro de duración y notas
- Indicadores de rendimiento (tasa de contacto, duración promedio)
- Sistema de recordatorios
- Reagendamiento automático
- Importación masiva de llamadas
- Alertas de llamadas retrasadas

### 🏠 Control de Visitas
- Programación de visitas ambulatorias y domiciliarias
- Asignación de múltiples profesionales por visita
- Estados: pendiente, realizada, cancelada
- Registro de visitas no agendadas
- Alertas de visitas vencidas (código de colores)
- Importación masiva de visitas

### 💊 Atención al Paciente
- Registro de diferentes tipos de atención:
  - Medicación
  - Cura
  - Toma de muestra
  - Control general
- Programación recurrente automática
- Gestión de periodicidad (única, semanal, quincenal, mensual, bimestral, trimestral)
- Archivo de documentos adjuntos
- Historial completo de atenciones

### 📊 Encuestas
- Constructor visual de encuestas
- Múltiples tipos de preguntas:
  - Texto corto y largo
  - Opción múltiple
  - Escala 1-5
  - Sí/No
  - Fecha
  - Número
- Sistema de variables dinámicas:
  - `{{paciente_nombre}}`, `{{paciente_apellido}}`
  - `{{profesional_nombre}}`, `{{profesional_especialidad}}`
  - `{{fecha_actual}}`, `{{fecha_visita}}`, `{{fecha_llamada}}`
  - `{{tipo_atencion}}`
- Análisis de resultados con gráficos
- Encuestas de satisfacción, seguimiento y autoconsulta

### 🤖 Automatizaciones
- Triggers basados en eventos:
  - Después de visita
  - Después de llamada
  - Fecha programada
  - Cambio de estado
- Acciones automáticas:
  - Envío de correos
  - Envío de encuestas
  - Creación de tareas
- Configuración de tiempo de ejecución
- Selección de destinatarios (paciente, profesional, cuidador)
- Condiciones personalizables

### 📧 Plantillas de Correo
- Editor de plantillas HTML
- Sistema de variables para personalización
- Categorización por tipo
- Versionado de plantillas
- Vista previa antes de enviar

### 👥 Gestión de Personal
- Registro de personal de salud
- Especialidades y contactos
- Vinculación con usuarios del sistema
- Estados activo/inactivo

### 📈 Dashboard y Reportes
- Estadísticas en tiempo real
- Indicadores clave de rendimiento (KPIs)
- Gráficos de tendencias
- Filtros avanzados por fecha, profesional, estado
- Exportación de datos

### 👤 Perfil de Usuario
- Información personal y profesional
- Configuración de cuenta (contraseña, preferencias)
- Resumen de actividad y desempeño
- Agenda y recordatorios personales
- Gestión de documentos
- Configuración de interfaz (tema, idioma)
- Historial de acceso y seguridad

### 🎨 Interfaz Moderna
- Diseño glassmorphism
- Modo claro/oscuro
- Responsive (móvil y desktop)
- Sidebar colapsable
- Animaciones suaves
- Sistema de notificaciones (toast)

## 🛠️ Tecnologías

- **Frontend:**
  - React 18.3
  - TypeScript
  - Vite
  - Tailwind CSS
  - Shadcn/ui Components
  - Tanstack Query (React Query)
  - React Router DOM
  - date-fns
  - Recharts (gráficos)
  - XLSX (importación/exportación Excel)

- **Backend:**
  - Supabase (PostgreSQL)
  - Row Level Security (RLS)
  - Edge Functions
  - Realtime subscriptions
  - Storage (archivos)

- **Autenticación:**
  - Supabase Auth
  - Email/Password
  - Auto-creación de perfiles

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- Bun (recomendado) o npm
- Cuenta de Supabase

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd health-app
```

2. **Instalar dependencias**
```bash
bun install
# o
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

4. **Ejecutar migraciones de base de datos**

Las migraciones se encuentran en `supabase/migrations/`. Ejecutar desde el dashboard de Supabase o usando CLI:
```bash
supabase db push
```

5. **Iniciar servidor de desarrollo**
```bash
bun dev
# o
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
health-app/
├── public/
│   ├── favicon.png          # Favicon de la aplicación
│   └── robots.txt
├── src/
│   ├── assets/              # Logos e imágenes
│   │   ├── logo-horizontal.png
│   │   ├── logo-vertical.png
│   │   └── isotipo.png
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Componentes base (shadcn)
│   │   ├── AgendarLlamadaDialog.tsx
│   │   ├── EditPacienteDialog.tsx
│   │   ├── EncuestaBuilder.tsx
│   │   ├── GlassCard.tsx
│   │   ├── ImportLlamadasDialog.tsx
│   │   ├── ImportPacientesDialog.tsx
│   │   ├── ImportVisitasDialog.tsx
│   │   ├── Layout.tsx
│   │   └── ...
│   ├── contexts/           # Contextos de React
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useUserProfile.tsx
│   │   ├── useUserRole.tsx
│   │   └── use-mobile.tsx
│   ├── integrations/       # Integraciones externas
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/                # Utilidades
│   │   └── utils.ts
│   ├── pages/              # Páginas principales
│   │   ├── Dashboard.tsx
│   │   ├── Pacientes.tsx
│   │   ├── Llamadas.tsx
│   │   ├── Visitas.tsx
│   │   ├── AtencionPaciente.tsx
│   │   ├── Encuestas.tsx
│   │   ├── Automatizaciones.tsx
│   │   ├── Personal.tsx
│   │   ├── PlantillasCorreo.tsx
│   │   ├── Configuracion.tsx
│   │   ├── Reportes.tsx
│   │   └── Auth.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── config.toml
│   ├── functions/          # Edge Functions
│   │   └── consultar-cedula/
│   └── migrations/         # Migraciones SQL
├── .env                    # Variables de entorno
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

## 🎯 Módulos del Sistema

### 1. Dashboard
- Vista general del sistema
- Estadísticas clave
- Accesos rápidos
- Actividad reciente

### 2. Pacientes
- Lista completa de pacientes
- Búsqueda y filtros
- Vista detallada
- Edición de datos
- Gestión de medicamentos
- Importación masiva

### 3. Llamadas
- Lista de llamadas agendadas
- Historial de llamadas realizadas
- Indicadores de rendimiento
- Filtros avanzados
- Reagendamiento
- Importación masiva

### 4. Visitas
- Calendario de visitas
- Programación de citas
- Visitas no agendadas
- Estadísticas
- Importación masiva

### 5. Atención al Paciente
- Registro de atenciones
- Tipos de atención
- Programación recurrente
- Archivos adjuntos
- Historial

### 6. Encuestas
- Constructor de encuestas
- Gestión de variables
- Análisis de resultados
- Exportación de datos

### 7. Personal
- Gestión de profesionales
- Especialidades
- Estados
- Horarios

### 8. Automatizaciones
- Configuración de reglas
- Triggers y acciones
- Plantillas asociadas
- Historial de ejecuciones

### 9. Plantillas de Correo
- Editor HTML
- Variables dinámicas
- Categorías
- Versiones

### 10. Reportes
- Generación de informes
- Exportación a Excel/PDF
- Filtros personalizados
- Gráficos interactivos

### 11. Configuración
- Perfil de usuario
- Preferencias del sistema
- Seguridad
- Integraciones

## 📚 Guía de Uso

### Registro de Usuario

1. Acceder a la página de registro
2. Completar formulario con:
   - Nombre y apellido
   - Cédula
   - Email
   - Contraseña
   - Especialidad (opcional)
3. El sistema creará automáticamente:
   - Perfil de usuario
   - Rol por defecto (médico)
   - Configuraciones iniciales

### Gestión de Pacientes

#### Agregar Paciente
1. Ir a **Pacientes** > **Agregar Paciente**
2. Completar formulario:
   - Datos personales (nombre, apellido, cédula)
   - Fecha de nacimiento
   - Sexo
   - Contactos (paciente y cuidador)
   - Dirección
   - Historia médica básica
   - Profesional asignado
   - Zona y grado de dificultad
3. Guardar

#### Importar Pacientes Masivamente
1. Ir a **Pacientes** > **Importar Masivo**
2. Seleccionar archivo (JSON, CSV o Excel)
3. El sistema validará y procesará los datos
4. Se mostrarán los resultados de la importación

### Programar Llamada

1. Ir a **Llamadas** > **Agendar Llamada**
2. Seleccionar:
   - Paciente
   - Profesional
   - Fecha y hora
   - Duración estimada
   - Motivo
3. Guardar

#### Importar Llamadas
1. **Llamadas** > **Importar Masivo**
2. Archivo debe contener:
   - `paciente_cedula`
   - `profesional_cedula`
   - `fecha_agendada`
   - `motivo` (opcional)
   - `duracion_estimada` (opcional)

### Programar Visita

1. Ir a **Visitas** > **Programar Visita**
2. Completar:
   - Paciente
   - Profesional principal
   - Profesionales adicionales (opcional)
   - Fecha y hora
   - Tipo (ambulatorio/domicilio)
   - Motivo
3. Guardar

### Registrar Atención

1. Ir a **Atención al Paciente** > **Registrar Atención**
2. Seleccionar:
   - Paciente
   - Tipo de atención:
     - **Cura**: Programa visita automática
     - **Medicación**: Programa visita automática
     - **Toma de muestra**: Programa visita automática
     - **Control general**: No programa visita
   - Periodicidad (si aplica):
     - Única
     - Semanal
     - Quincenal
     - Mensual
     - Bimestral
     - Trimestral
   - Profesional
   - Descripción
3. Si es recurrente, el sistema creará automáticamente hasta 12 visitas

### Crear Encuesta

1. **Encuestas** > **Nueva Encuesta**
2. Configurar:
   - Nombre y descripción
   - Tipo (satisfacción, seguimiento, autoconsulta)
3. Agregar preguntas:
   - Seleccionar tipo de pregunta
   - Escribir texto (usar variables si es necesario)
   - Configurar opciones (si aplica)
   - Marcar como requerida
4. **Variables disponibles:**
   - `{{paciente_nombre}}` - Se reemplaza con el nombre del paciente
   - `{{profesional_especialidad}}` - Se reemplaza con la especialidad
   - `{{fecha_visita}}` - Se reemplaza con la fecha de la visita
   - Y más...
5. Activar encuesta

### Configurar Automatización

1. **Automatizaciones** > **Nueva Automatización**
2. Configurar:
   - Nombre y descripción
   - Evento trigger (ej: después de visita)
   - Tiempo de ejecución (inmediato, 30 min, 1 hora, etc.)
   - Acción (enviar correo, enviar encuesta)
   - Si es correo: seleccionar plantilla
   - Si es encuesta: seleccionar encuesta
   - Destinatarios (paciente, profesional, cuidador)
3. Activar

## 🔐 Roles y Permisos

El sistema maneja tres roles principales:

### 1. Admin
- Acceso completo al sistema
- Gestión de usuarios y roles
- Configuración del sistema
- Todas las funciones de médico

### 2. Médico (Por defecto)
- Gestión de pacientes asignados
- Registro de llamadas y visitas
- Atención al paciente
- Ver encuestas y reportes
- Editar su propio perfil

### 3. Asistente
- Visualización de datos
- Agendamiento de llamadas y visitas
- Sin permisos de edición de configuración

## 🔧 Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Opcional - Para edge functions
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🗄️ Base de Datos

### Tablas Principales

#### `profiles`
- Información de usuarios del sistema
- Vinculado con `auth.users`
- Campos: nombre, apellido, cedula, email, especialidad, avatar_url

#### `user_roles`
- Roles de usuarios
- Tipos: admin, medico, asistente

#### `pacientes`
- Datos completos de pacientes
- Estados: activo, inactivo
- Grados de dificultad: bajo, medio, alto

#### `registro_llamadas`
- Llamadas telefónicas
- Estados: agendada, realizada, cancelada, no_contesta
- Resultados: contactado, no_contesta, mensaje_dejado, etc.

#### `control_visitas`
- Visitas programadas y realizadas
- Tipos: ambulatorio, domicilio
- Estados: pendiente, realizada, cancelada, no_realizada

#### `atencion_paciente`
- Registro de atenciones
- Tipos: medicacion, cura, toma_muestra, control_general
- Periodicidad: unica, semanal, quincenal, mensual, bimestral, trimestral

#### `encuestas`
- Definición de encuestas
- Estructura de preguntas en JSON
- Tipos: satisfaccion, seguimiento, autoconsulta

#### `respuestas_encuestas`
- Respuestas de pacientes
- Puntuación general
- Token de acceso

#### `automatizaciones`
- Reglas de automatización
- Condiciones y parámetros en JSON
- Vinculación con plantillas y encuestas

#### `plantillas_correo`
- Templates de email
- Variables de reemplazo
- Versionado

#### `personal_salud`
- Profesionales de la salud
- Especialidades
- Vinculado con profiles

### Funciones de Base de Datos

#### `handle_new_user()`
Crea automáticamente perfil y rol cuando un usuario se registra.

#### `calcular_indicadores_llamadas()`
Calcula estadísticas de llamadas:
- Total de llamadas
- Tasa de contacto
- Duración promedio
- Llamadas pendientes
- Requieren seguimiento

#### `has_role()`
Valida si un usuario tiene un rol específico (usado en RLS).

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS configuradas:

- **Profiles**: Los usuarios pueden ver y editar su propio perfil; admins pueden ver todos
- **Pacientes**: Autenticados pueden CRUD
- **Llamadas**: Autenticados pueden CRUD
- **Visitas**: Autenticados pueden CRUD
- **Encuestas**: Autenticados pueden ver; admins pueden gestionar
- **Automatizaciones**: Autenticados pueden ver; admins pueden gestionar

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Deploy automático

### Build Local

```bash
bun run build
# o
npm run build
```

Los archivos se generarán en `/dist`

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo licencia propietaria. Todos los derechos reservados.

## 👨‍💻 Soporte

Para soporte y consultas:
- Email: support@healthapp.com
- Documentación: [docs.healthapp.com](https://docs.healthapp.com)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🎨 Créditos

Desarrollado con ❤️ por el equipo de Health App

---

**Versión:** 2.0.0.0  
**Última actualización:** Abril 2026

### 📌 Changelog v2.0.0.0
- **Fase 1**: Ficha clínica unificada del paciente (alergias, antecedentes, seguros)
- **Fase 2**: Vinculación masiva de pacientes a profesional asignado
- **Fase 3**: Módulo de Cobros (facturas, pagos, automatización de estados)
- **Fase 4**: PWA instalable + Gestión de roles UI (admin, coordinador, médico, enfermera)
