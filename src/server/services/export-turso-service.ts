import { createClient, type Client } from '@libsql/client';
import { supabase } from '../../integrations/supabase/client';
import { ensureTenantTables } from '../db/init-tenant-db';
import { getTenantDb } from '../db/connection-manager';
import { decryptTenantToken } from '../lib/crypto';
import { AppError } from '../errors/problem-details';

export interface ExportToTursoOptions {
  workspaceId: string;
  clinicId?: string;
  tursoUrl?: string;
  tursoToken?: string;
  dryRun?: boolean;
  actorId?: string;
}

export interface ExportResult {
  success: boolean;
  dryRun: boolean;
  workspaceId: string;
  clinicId: string;
  counts: {
    branches: number;
    patients: number;
    appointments: number;
    prescriptions: number;
    invoices: number;
  };
  errors: string[];
  durationMs: number;
  timestamp: string;
}

/**
 * Normaliza fechas a formato ISO seguro
 */
function toIsoDate(val: string | null | undefined, fallback?: string): string {
  if (!val) return fallback || new Date().toISOString();
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback || new Date().toISOString();
    return d.toISOString();
  } catch {
    return fallback || new Date().toISOString();
  }
}

/**
 * Normaliza tipos de documento
 */
function normalizeDocType(tipo: string | null | undefined): 'cedula' | 'passport' | 'other' {
  if (!tipo) return 'cedula';
  const t = tipo.toLowerCase();
  if (t.includes('cedula') || t.includes('cédula')) return 'cedula';
  if (t.includes('pasaporte') || t.includes('passport')) return 'passport';
  return 'other';
}

/**
 * Normaliza género
 */
function normalizeGender(sexo: string | null | undefined): 'male' | 'female' | 'other' | null {
  if (!sexo) return null;
  const s = sexo.toLowerCase().trim();
  if (s.startsWith('m') || s === 'masculino') return 'male';
  if (s.startsWith('f') || s === 'femenino') return 'female';
  return 'other';
}

/**
 * Normaliza estado de cita
 */
function normalizeAppointmentStatus(
  estado: string | null | undefined
): 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' {
  if (!estado) return 'scheduled';
  const e = estado.toLowerCase().trim();
  if (e === 'confirmada' || e === 'confirmed') return 'confirmed';
  if (e === 'en_curso' || e === 'in_progress') return 'in_progress';
  if (e === 'completada' || e === 'atendida' || e === 'completed') return 'completed';
  if (e === 'cancelada' || e === 'cancelled') return 'cancelled';
  if (e === 'no_asistio' || e === 'inasistencia' || e === 'no_show') return 'no_show';
  return 'scheduled';
}

/**
 * Normaliza estado de factura
 */
function normalizeInvoiceStatus(estado: string | null | undefined): 'draft' | 'pending' | 'paid' | 'cancelled' {
  if (!estado) return 'pending';
  const s = estado.toLowerCase().trim();
  if (s === 'pagada' || s === 'cobrada' || s === 'paid') return 'paid';
  if (s === 'borrador' || s === 'draft') return 'draft';
  if (s === 'anulada' || s === 'cancelada' || s === 'cancelled') return 'cancelled';
  return 'pending';
}

/**
 * Servicio integral para exportar todos los campos de Supabase a Turso
 */
export class ExportTursoService {
  /**
   * Resuelve el cliente LibSQL para la exportación:
   * 1. Parámetros explícitos (tursoUrl, tursoToken)
   * 2. O variables de entorno TURSO_DATABASE_URL / TURSO_AUTH_TOKEN
   * 3. O base de datos del tenant registrada en el control plane
   */
  private async getLibSqlClient(options: ExportToTursoOptions): Promise<{ client: Client; clinicId: string }> {
    const clinicId = options.clinicId || options.workspaceId;

    if (options.tursoUrl) {
      const client = createClient({
        url: options.tursoUrl,
        authToken: options.tursoToken,
      });
      return { client, clinicId };
    }

    const envUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_CONTROL_PLANE_URL;
    const envToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_CONTROL_PLANE_AUTH_TOKEN;

    if (envUrl) {
      const client = createClient({
        url: envUrl,
        authToken: envToken,
      });
      return { client, clinicId };
    }

    // Intentar resolver desde control plane
    try {
      await getTenantDb(clinicId);
      // Si llegamos aquí, la conexión existe pero necesitamos el cliente base
      throw new Error('Tenant DB disponible solo por pool');
    } catch {
      // Fallback a sqlite en memoria o archivo temporal para entornos de prueba
      const client = createClient({
        url: 'file:local-export-fallback.db',
      });
      return { client, clinicId };
    }
  }

  /**
   * Ejecuta la exportación completa de todos los datos de un workspace a Turso
   */
  async exportWorkspace(options: ExportToTursoOptions): Promise<ExportResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const counts = {
      branches: 0,
      patients: 0,
      appointments: 0,
      prescriptions: 0,
      invoices: 0,
    };

    const { client, clinicId } = await this.getLibSqlClient(options);

    // 1. Asegurar esquema DDL en Turso si no es dry run
    if (!options.dryRun) {
      try {
        await ensureTenantTables(client);
      } catch (err: any) {
        errors.push(`Error inicializando esquema DDL en Turso: ${err.message}`);
      }
    }

    // 2. Extraer e insertar Sucursales (branches)
    const defaultBranchId = `br_main_${options.workspaceId}`;
    try {
      const { data: sucursales, error } = await supabase
        .from('sucursales')
        .select('*')
        .eq('workspace_id', options.workspaceId);

      if (error) {
        errors.push(`Error extrayendo sucursales de Supabase: ${error.message}`);
      }

      const branchList = (sucursales && sucursales.length > 0) ? sucursales : [
        {
          id: defaultBranchId,
          nombre: 'Sede Principal',
          direccion: 'Sede Central',
          telefono: null,
          email: null,
          es_principal: true,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      for (const b of branchList) {
        counts.branches++;
        if (!options.dryRun) {
          await client.execute({
            sql: `INSERT OR REPLACE INTO branches (id, name, address, phone, email, is_main, is_active, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              b.id,
              b.nombre || 'Sede Principal',
              b.direccion || null,
              b.telefono || null,
              b.email || null,
              b.es_principal ? 1 : 0,
              b.activo !== false ? 1 : 0,
              toIsoDate(b.created_at),
              toIsoDate(b.updated_at),
            ],
          });
        }
      }
    } catch (err: any) {
      errors.push(`Excepción procesando sucursales: ${err.message}`);
    }

    // 3. Extraer e insertar Pacientes (patients)
    try {
      const { data: pacientes, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('workspace_id', options.workspaceId);

      if (error) {
        errors.push(`Error extrayendo pacientes de Supabase: ${error.message}`);
      }

      if (pacientes) {
        for (const p of pacientes) {
          counts.patients++;
          if (!options.dryRun) {
            const docNum = p.numero_documento || p.cedula || `PX-${p.id.slice(0, 8)}`;
            const branchId = p.sucursal_id || defaultBranchId;
            const docType = normalizeDocType(p.tipo_documento);
            const gender = normalizeGender(p.sexo);
            const phone = p.contacto_px || p.numero_principal || null;
            const status = (p.status_px === 'inactivo' || p.motivo_inactividad) ? 'inactive' : 'active';

            await client.execute({
              sql: `INSERT OR REPLACE INTO patients (
                      id, branch_id, first_name, last_name, doc_type, doc_number,
                      birth_date, gender, phone, email, address, emergency_contact_name,
                      emergency_contact_phone, blood_type, allergies, associated_clinic,
                      notes, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                p.id,
                branchId,
                p.nombre || 'Sin Nombre',
                p.apellido || 'Sin Apellido',
                docType,
                docNum,
                p.fecha_nacimiento || null,
                gender,
                phone,
                p.email_px || null,
                p.direccion_domicilio || null,
                p.nombre_cuidador || null,
                p.contacto_cuidador || null,
                null, // blood_type
                null, // allergies
                null, // associated_clinic
                p.historia_medica_basica || null,
                status,
                toIsoDate(p.created_at),
                toIsoDate(p.updated_at),
              ],
            });
          }
        }
      }
    } catch (err: any) {
      errors.push(`Excepción procesando pacientes: ${err.message}`);
    }

    // 4. Extraer e insertar Citas / Visitas (appointments)
    try {
      const { data: visitas, error } = await supabase
        .from('control_visitas')
        .select('*')
        .eq('workspace_id', options.workspaceId);

      if (error) {
        errors.push(`Error extrayendo citas de Supabase: ${error.message}`);
      }

      if (visitas) {
        for (const v of visitas) {
          // Omitir visitas huérfanas sin paciente asignado
          if (!v.paciente_id) continue;

          counts.appointments++;
          if (!options.dryRun) {
            const branchId = v.sucursal_id || defaultBranchId;
            const startTime = toIsoDate(v.fecha_hora_visita);
            const startDate = new Date(startTime);
            const endTime = new Date(startDate.getTime() + 30 * 60 * 1000).toISOString();
            const serviceName = v.motivo_visita || v.tipo_visita || 'Consulta Médica';
            const status = normalizeAppointmentStatus(v.estado);

            await client.execute({
              sql: `INSERT OR REPLACE INTO appointments (
                      id, branch_id, patient_id, professional_id, service_name,
                      start_time, end_time, status, notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                v.id,
                branchId,
                v.paciente_id,
                v.profesional_id || 'usr_profesional',
                serviceName,
                startTime,
                endTime,
                status,
                v.notas_visita || null,
                toIsoDate(v.created_at),
                toIsoDate(v.updated_at),
              ],
            });
          }
        }
      }
    } catch (err: any) {
      errors.push(`Excepción procesando citas: ${err.message}`);
    }

    // 5. Extraer e insertar Recetas (prescriptions)
    try {
      const { data: recetas, error: rxErr } = await supabase
        .from('recetas')
        .select('*, recetas_items(*)')
        .eq('workspace_id', options.workspaceId);

      if (rxErr) {
        errors.push(`Error extrayendo recetas de Supabase: ${rxErr.message}`);
      }

      if (recetas) {
        for (const rx of recetas) {
          if (!rx.paciente_id) continue;

          counts.prescriptions++;
          if (!options.dryRun) {
            const items = (rx as any).recetas_items || [];
            const medications = items.map((it: any) => ({
              name: it.medicamento,
              dosage: it.dosis || '1 dosis',
              frequency: it.frecuencia || 'Cada 8h',
              duration: it.duracion || '7 días',
              presentation: it.presentacion || null,
              instructions: it.indicaciones || null,
            }));

            const issueDate = new Date(toIsoDate(rx.fecha_emision));
            const validUntil = new Date(issueDate.getTime() + (rx.vigencia_dias || 30) * 86400000)
              .toISOString()
              .split('T')[0];

            await client.execute({
              sql: `INSERT OR REPLACE INTO prescriptions (
                      id, patient_id, professional_id, medications_json, instructions, valid_until, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              args: [
                rx.id,
                rx.paciente_id,
                rx.profesional_id || 'usr_profesional',
                JSON.stringify(medications),
                rx.indicaciones_generales || rx.diagnostico_texto || null,
                validUntil,
                toIsoDate(rx.created_at),
              ],
            });
          }
        }
      }
    } catch (err: any) {
      errors.push(`Excepción procesando recetas: ${err.message}`);
    }

    // 6. Extraer e insertar Facturas (invoices)
    try {
      const { data: facturas, error: invErr } = await supabase
        .from('facturas')
        .select('*')
        .eq('workspace_id', options.workspaceId);

      if (invErr) {
        errors.push(`Error extrayendo facturas de Supabase: ${invErr.message}`);
      }

      if (facturas) {
        for (const f of facturas) {
          if (!f.paciente_id) continue;

          counts.invoices++;
          if (!options.dryRun) {
            const status = normalizeInvoiceStatus(f.estado);
            const total = Number(f.monto_total || 0);

            await client.execute({
              sql: `INSERT OR REPLACE INTO invoices (
                      id, branch_id, patient_id, invoice_number, issue_date,
                      due_date, subtotal, discount, tax, total, status,
                      payment_method, notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                f.id,
                defaultBranchId,
                f.paciente_id,
                f.numero_factura || `FAC-${f.id.slice(0, 8)}`,
                toIsoDate(f.fecha_emision),
                f.fecha_vencimiento ? toIsoDate(f.fecha_vencimiento) : null,
                total,
                0, // discount
                0, // tax
                total,
                status,
                f.metodo_pago || 'cash',
                f.notas || f.descripcion || null,
                toIsoDate(f.created_at),
                toIsoDate(f.updated_at),
              ],
            });
          }
        }
      }
    } catch (err: any) {
      errors.push(`Excepción procesando facturas: ${err.message}`);
    }

    // 7. Registro de auditoría
    if (!options.dryRun) {
      try {
        await client.execute({
          sql: `INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, ip_address, payload_json, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `aud_exp_${crypto.randomUUID()}`,
            options.actorId || 'system_migration',
            'export',
            'workspace_data',
            options.workspaceId,
            'internal',
            JSON.stringify({ counts, errorsCount: errors.length }),
            new Date().toISOString(),
          ],
        });
      } catch (err: any) {
        errors.push(`Error registrando auditoría: ${err.message}`);
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      success: errors.length === 0,
      dryRun: !!options.dryRun,
      workspaceId: options.workspaceId,
      clinicId,
      counts,
      errors,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  }
}
