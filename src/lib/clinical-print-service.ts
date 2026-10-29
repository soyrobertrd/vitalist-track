import { escapeDeep, safeColor } from "@/lib/escape-html";
/**
 * Servicio unificado de impresión y exportación clínica oficial (Fase 8.6)
 * Genera hojas de membrete hospitalario para Fichas 360, Recetas Médicas y Presupuestos
 * respetando el nombre del centro, la vertical activa y el color institucional.
 */

export interface PrintBrandingOptions {
  centroNombre?: string;
  sucursalNombre?: string;
  verticalNombre?: string;
  primaryColor?: string; // Hex color, por defecto #2563eb (Azul médico)
  telefonoContacto?: string;
  direccionCentro?: string;
}

export interface PacientePrintData {
  nombre: string;
  apellido: string;
  cedula?: string | null;
  fecha_nacimiento?: string | null;
  sexo?: string | null;
  contacto_px?: string | null;
  contacto_cuidador?: string | null;
  direccion_domicilio?: string | null;
  zona?: string | null;
  historia_medica_basica?: string | null;
  alergias?: Array<{ sustancia: string; severidad: string }> | null;
  medicamentos?: Array<{ nombre: string; dosis?: string; frecuencia?: string }> | null;
  diagnosticos?: Array<{ codigo?: string; descripcion: string }> | null;
  seguro?: { aseguradora?: string; numero_afiliado?: string } | null;
}

export function printFichaClinica360(
  pacienteRaw: PacientePrintData,
  optionsRaw: PrintBrandingOptions = {}
) {
  // Todo lo que se interpola en el HTML se escapa: los campos son texto libre editable (XSS almacenado).
  const paciente = escapeDeep(pacienteRaw);
  const options = escapeDeep(optionsRaw);
  const w = window.open("", "_blank");
  if (!w) return;

  const centro = options.centroNombre || "Vitalist Track - Centro Clínico Especializado";
  const sucursal = options.sucursalNombre || "Sede Principal";
  const primary = safeColor(optionsRaw.primaryColor, "#1d4ed8");
  const hoy = new Date().toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const edad = paciente.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(pacienteRaw.fecha_nacimiento!).getTime()) / 31_557_600_000)
    : "—";

  const alergiasHtml = (paciente.alergias && paciente.alergias.length > 0)
    ? paciente.alergias.map(a => `<span class="badge badge-alert">⚠ ${a.sustancia} (${a.severidad})</span>`).join(" ")
    : '<span class="text-muted">Ninguna alergia registrada conocida (NKDA)</span>';

  const medicamentosHtml = (paciente.medicamentos && paciente.medicamentos.length > 0)
    ? `<table class="print-table">
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Dosis</th>
            <th>Frecuencia / Indicaciones</th>
          </tr>
        </thead>
        <tbody>
          ${paciente.medicamentos.map(m => `
            <tr>
              <td><strong>${m.nombre}</strong></td>
              <td>${m.dosis || "—"}</td>
              <td>${m.frecuencia || "Según prescripción"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`
    : '<p class="empty-note">Sin fármacos continuos activos en ficha.</p>';

  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ficha Clínica 360 - ${paciente.nombre} ${paciente.apellido}</title>
  <style>
    @page { size: letter; margin: 18mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      font-size: 12px;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2.5px solid ${primary};
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo-area h1 {
      margin: 0;
      color: ${primary};
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .logo-area p {
      margin: 2px 0 0;
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .patient-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 20px;
    }
    .patient-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .field-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .field-value {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: ${primary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 20px 0 10px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-alert {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
    }
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .print-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 8px;
      font-size: 11px;
      border-bottom: 2px solid #cbd5e1;
    }
    .print-table td {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .empty-note {
      color: #64748b;
      font-style: italic;
      margin: 6px 0;
    }
    .signatures {
      margin-top: 45px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .sig-line {
      width: 200px;
      border-top: 1px solid #334155;
      text-align: center;
      padding-top: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .footer-note {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 9px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <h1>${centro}</h1>
      <p>${sucursal} · Expediente Clínico Digital</p>
    </div>
    <div class="doc-meta">
      <p style="margin:0;"><strong>Emisión:</strong> ${hoy}</p>
      <p style="margin:2px 0 0;"><strong>Confidencialidad:</strong> HIPAA / Ley Sanitaria</p>
    </div>
  </div>

  <div class="patient-card">
    <div class="patient-grid">
      <div>
        <div class="field-label">Paciente</div>
        <div class="field-value">${paciente.nombre} ${paciente.apellido}</div>
      </div>
      <div>
        <div class="field-label">Identificación (Cédula/Doc)</div>
        <div class="field-value">${paciente.cedula || "No registrada"}</div>
      </div>
      <div>
        <div class="field-label">Edad / Sexo</div>
        <div class="field-value">${edad} años · ${paciente.sexo || "No especificado"}</div>
      </div>
      <div>
        <div class="field-label">Teléfono de Contacto</div>
        <div class="field-value">${paciente.contacto_px || paciente.contacto_cuidador || "—"}</div>
      </div>
      <div>
        <div class="field-label">Seguro de Salud / ARS</div>
        <div class="field-value">${paciente.seguro?.aseguradora || "Privado / Sin Seguro"}</div>
      </div>
      <div>
        <div class="field-label">Municipio / Zona</div>
        <div class="field-value">${paciente.zona || paciente.direccion_domicilio || "—"}</div>
      </div>
    </div>
  </div>

  <div class="section-title">Alergias y Alertas Médicas</div>
  <div>${alergiasHtml}</div>

  <div class="section-title">Historia Médica y Antecedentes</div>
  <p style="margin: 4px 0 10px;">${paciente.historia_medica_basica || "Sin antecedentes patológicos relevantes documentados."}</p>

  <div class="section-title">Tratamientos Farmacológicos Activos</div>
  ${medicamentosHtml}

  <div class="signatures">
    <div>
      <div class="sig-line">Médico Tratante / Firma y Sello</div>
    </div>
    <div>
      <div class="sig-line">Recepción / Archivo Clínico</div>
    </div>
  </div>

  <div class="footer-note">
    Documento oficial emitido mediante Vitalist Track · Validez médica legal de uso confidencial.
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`);

  w.document.close();
}
