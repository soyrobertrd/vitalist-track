# Glosario de Dominio - Vitalist Track
**Versión:** 1.0  
**Estándar:** Dominio Clínico Multi-Tenant (Ubiquitous Language)

Este glosario define los términos oficiales utilizados en bases de datos, APIs, tipos de TypeScript y componentes de interfaz de usuario. Ningún modelo ni endpoint debe usar terminología alternativa o ambigua.

---

## 1. Organización y Estructura Organizativa (Control Plane)

| Término | Definición | Nivel de Persistencia | Nombre de Campo / Tipo |
| :--- | :--- | :--- | :--- |
| **Clínica / Organización** | Entidad legal o consultorio médico contratante. Cada clínica cuenta con su propia base de datos física aislada en Turso. | Control Plane DB (`clinics`) | `clinic_id` (UUID / CUID2) |
| **Sucursal (Branch)** | Sede física o consultorio dependiente de una clínica. Comparte la base de datos de la clínica pero segmenta inventarios, agendas y citas. | Tenant DB (`branches`) | `branch_id` |
| **Usuario (Account)** | Cuenta humana de acceso al sistema con credenciales gestionadas por Better Auth. | Control Plane DB (`users`) | `user_id` |
| **Membresía (Membership)** | Vínculo entre un Usuario y una Clínica, especificando su rol y permisos de acceso. | Control Plane DB (`memberships`) | `role`: `owner`, `admin`, `doctor`, `specialist`, `receptionist`, `nurse` |
| **Base de Datos de Tenant** | Credenciales de conexión cifradas a la base de datos Turso LibSQL asignada a cada clínica. | Control Plane DB (`clinic_databases`) | `turso_db_url`, `turso_auth_token`, `status` |

---

## 2. Dominio Clínico y Asistencial (Tenant DB)

| Término | Definición | Entidad | Identificador |
| :--- | :--- | :--- | :--- |
| **Paciente (Patient)** | Individuo que recibe atención médica, dental o terapéutica en la clínica. | `patients` | `patient_id` |
| **Expediente / Historia Clínica** | Historial continuo de atenciones, antecedentes médicos y evolución del paciente. | `medical_records` | `record_id` |
| **Cita (Appointment)** | Reserva temporal programada entre un paciente y un especialista en una sucursal. | `appointments` | `appointment_id` |
| **Consulta / Encuentro** | Registro específico de una sesión clínica (anamnesis, constantes vitales, diagnóstico y evolución). | `consultations` | `consultation_id` |
| **Odontograma** | Representación gráfica y estado de cada pieza dental del paciente (Odontología). | `dental_records` | `dental_record_id` |
| **Ficha Psicológica** | Sesión de psicoterapia, notas de evolución y escalas de evaluación (Psicología). | `psychology_notes` | `psychology_note_id` |
| **Receta / Prescripción** | Indicación formal de medicamentos o terapias emitida por el profesional facultado. | `prescriptions` | `prescription_id` |

---

## 3. Dominio Administrativo y Financiero (Tenant DB)

| Término | Definición | Entidad | Identificador |
| :--- | :--- | :--- | :--- |
| **Factura (Invoice)** | Comprobante fiscal o interno de cobro por servicios médicos prestados o insumos. | `invoices` | `invoice_id` |
| **Línea de Factura** | Detalle de un ítem facturado con cantidad, precio unitario y descuento. | `invoice_items` | `item_id` |
| **Pago (Payment)** | Registro de una transacción monetaria aplicada a una o varias facturas. | `payments` | `payment_id` |
| **Ítem de Inventario** | Medicamento, material quirúrgico o insumo clínico controlado por stock y fecha de vencimiento. | `inventory_items` | `inventory_item_id` |
| **Movimiento de Stock** | Entrada, salida, ajuste o transferencia de insumos entre sucursales. | `stock_movements` | `movement_id` |

---

## 4. Invariantes de Términos (Reglas de Nomenclatura)
1. **No mezclar "Usuario" con "Paciente":** Un `Usuario` es quien inicia sesión en el software (empleado, doctor, administrador). Un `Paciente` es quien recibe el tratamiento médico.
2. **"Clínica" vs. "Sucursal":** La `Clínica` es el inquilino (Tenant) a nivel de facturación y base de datos física. La `Sucursal` es la ubicación física donde se prestan las atenciones.
3. **Soft Deletes Obligatorios:** En registros médicos nunca se ejecuta `DELETE`. Se utiliza `deleted_at: timestamp` y `deleted_by: user_id` para garantizar cumplimiento médico-legal.
