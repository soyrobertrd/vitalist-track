/**
 * Generador y gestor de impresión / exportación a PDF para documentos clínicos.
 * Compatible con la marca del centro médico y colores de la vertical activa (Fase 8.6).
 */

import type { VerticalTipo } from "@/contexts/VerticalContext";

export interface DatosPacienteImpresion {
  nombre: string;
  apellido: string;
  cedula?: string | null;
  fecha_nacimiento?: string | null;
  edad?: number | string | null;
  sexo?: string | null;
  ars?: string | null;
  numero_afiliado?: string | null;
  alergias?: string | null;
  telefono?: string | null;
  direccion?: string | null;
}

export interface DatosProfesionalImpresion {
  nombre: string;
  apellido: string;
  especialidad?: string | null;
  exequatur?: string | null;
  colegiatura?: string | null;
}

export interface ItemDocumento {
  titulo: string;
  descripcion?: string;
  cantidad?: number;
  precioUnitario?: number;
  coberturaArs?: number;
  total?: number;
}

export interface DocumentoClinicoParams {
  tipo: "receta" | "presupuesto" | "ficha" | "constancia";
  titulo?: string;
  paciente: DatosPacienteImpresion;
  profesional?: DatosProfesionalImpresion | null;
  items?: ItemDocumento[];
  diagnosticos?: string[];
  indicacionesGenerales?: string;
  notasEvolucion?: string;
  centroNombre?: string;
  centroDireccion?: string;
  centroTelefono?: string;
  centroRnc?: string;
  vertical?: VerticalTipo;
  colorPrimarioHex?: string;
}

// Colores primarios hex representativos de cada vertical médica
const VERTICAL_COLORS: Record<string, string> = {
  clinica: "#2563eb",
  dental: "#0891b2",
  aesthetic: "#db2777",
  recovery: "#059669",
  vision: "#4f46e5",
  psicologia: "#7c3aed",
};

export function imprimirDocumentoClinico(params: DocumentoClinicoParams) {
  const {
    tipo,
    titulo,
    paciente,
    profesional,
    items = [],
    diagnosticos = [],
    indicacionesGenerales,
    notasEvolucion,
    centroNombre = "Centro Médico Especializado",
    centroDireccion = "Santo Domingo, República Dominicana",
    centroTelefono = "(809) 555-0199",
    centroRnc = "RNC: 1-32-45678-9",
    vertical = "clinica",
  } = params;

  const colorTema = params.colorPrimarioHex || VERTICAL_COLORS[vertical] || "#2563eb";
  const fechaHoy = new Date().toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const docTitulo =
    titulo ||
    (tipo === "receta"
      ? "Receta Médica Oficial"
      : tipo === "presupuesto"
      ? "Presupuesto de Tratamiento"
      : tipo === "ficha"
      ? "Resumen de Expediente Clínico"
      : "Constancia de Atención Médica");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor permita las ventanas emergentes para imprimir el documento.");
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${docTitulo} - ${paciente.nombre} ${paciente.apellido}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 15mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      color: #1e293b;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.4;
      padding: 10px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid ${colorTema};
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-info h1 {
      font-size: 16pt;
      font-weight: 700;
      color: ${colorTema};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-info p {
      font-size: 9pt;
      color: #64748b;
      margin-top: 2px;
    }
    .header-badge {
      text-align: right;
    }
    .badge-tipo {
      display: inline-block;
      background-color: ${colorTema};
      color: #ffffff;
      font-size: 9pt;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .fecha-emision {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 4px;
    }
    .paciente-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 12px;
      font-size: 9.5pt;
    }
    .paciente-field span {
      display: block;
      font-size: 7.5pt;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .paciente-field strong {
      color: #0f172a;
    }
    .alergia-badge {
      color: #dc2626;
      font-weight: bold;
      background: #fee2e2;
      padding: 2px 6px;
      border-radius: 3px;
      display: inline-block;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: ${colorTema};
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .tabla-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 9.5pt;
    }
    .tabla-items th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
    }
    .tabla-items td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .tabla-items tr:last-child td {
      border-bottom: none;
    }
    .item-titulo {
      font-weight: 600;
      color: #0f172a;
    }
    .item-desc {
      font-size: 8.5pt;
      color: #64748b;
    }
    .total-box {
      margin-left: auto;
      width: 260px;
      border-top: 2px solid #e2e8f0;
      padding-top: 8px;
      font-size: 10pt;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .total-row.final {
      font-size: 12pt;
      font-weight: bold;
      color: ${colorTema};
      border-top: 1px dashed #cbd5e1;
      padding-top: 4px;
    }
    .indicaciones-box {
      background: #ffffff;
      border-left: 3px solid ${colorTema};
      padding: 8px 12px;
      font-size: 10pt;
      color: #334155;
      white-space: pre-line;
      margin-bottom: 16px;
    }
    .footer-firmas {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .firma-box {
      width: 240px;
      text-align: center;
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      font-size: 9pt;
    }
    .firma-box strong {
      display: block;
      color: #0f172a;
    }
    .legal-notice {
      margin-top: 25px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 7.5pt;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="header-info">
      <h1>${centroNombre}</h1>
      <p>${centroDireccion} · Tel: ${centroTelefono}</p>
      <p>${centroRnc}</p>
    </div>
    <div class="header-badge">
      <div class="badge-tipo">${docTitulo}</div>
      <div class="fecha-emision">Emisión: ${fechaHoy}</div>
    </div>
  </div>

  <!-- DATOS PACIENTE -->
  <div class="paciente-card">
    <div class="paciente-field">
      <span>Paciente</span>
      <strong>${paciente.nombre} ${paciente.apellido}</strong>
    </div>
    <div class="paciente-field">
      <span>Cédula / Identidad</span>
      <strong>${paciente.cedula || "No especificada"}</strong>
    </div>
    <div class="paciente-field">
      <span>Edad / Sexo</span>
      <strong>${paciente.edad ? `${paciente.edad} años` : "—"} / ${paciente.sexo || "—"}</strong>
    </div>
    <div class="paciente-field">
      <span>Aseguradora / ARS</span>
      <strong>${paciente.ars || "Privado / Sin Seguro"}</strong>
    </div>
    <div class="paciente-field">
      <span>No. Afiliado</span>
      <strong>${paciente.numero_afiliado || "—"}</strong>
    </div>
    <div class="paciente-field">
      <span>Alergias Conocidas</span>
      <strong class="${paciente.alergias && paciente.alergias !== 'Ninguna' ? 'alergia-badge' : ''}">
        ${paciente.alergias || "Ninguna reportada"}
      </strong>
    </div>
  </div>

  ${
    diagnosticos.length > 0
      ? `
  <div class="section-title">Diagnósticos Clínicos (CIE-10)</div>
  <ul style="padding-left: 20px; font-size: 9.5pt; margin-bottom: 12px; color: #334155;">
    ${diagnosticos.map((d) => `<li>${d}</li>`).join("")}
  </ul>
  `
      : ""
  }

  ${
    items.length > 0
      ? `
  <div class="section-title">${tipo === "receta" ? "Medicamentos y Posología" : "Procedimientos y Conceptos"}</div>
  <table class="tabla-items">
    <thead>
      <tr>
        <th style="width: 45%;">Descripción</th>
        <th style="text-align: center; width: 15%;">Cantidad</th>
        ${tipo === "presupuesto" ? `<th style="text-align: right; width: 20%;">Precio Unit.</th><th style="text-align: right; width: 20%;">Total</th>` : `<th style="text-align: left; width: 40%;">Indicaciones</th>`}
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (it) => `
        <tr>
          <td>
            <div class="item-titulo">${it.titulo}</div>
            ${it.descripcion ? `<div class="item-desc">${it.descripcion}</div>` : ""}
          </td>
          <td style="text-align: center;">${it.cantidad ?? 1}</td>
          ${
            tipo === "presupuesto"
              ? `
            <td style="text-align: right;">RD$ ${(it.precioUnitario ?? 0).toLocaleString()}</td>
            <td style="text-align: right; font-weight: 600;">RD$ ${(it.total ?? (it.cantidad || 1) * (it.precioUnitario || 0)).toLocaleString()}</td>
          `
              : `
            <td style="text-align: left; color: #475569;">${it.descripcion || "Según indicación médica"}</td>
          `
          }
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  ${
    tipo === "presupuesto" && items.length > 0
      ? `
  <div class="total-box">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>RD$ ${items.reduce((s, i) => s + (i.total || (i.cantidad || 1) * (i.precioUnitario || 0)), 0).toLocaleString()}</span>
    </div>
    <div class="total-row final">
      <span>Total a Pagar:</span>
      <span>RD$ ${items.reduce((s, i) => s + (i.total || (i.cantidad || 1) * (i.precioUnitario || 0)), 0).toLocaleString()}</span>
    </div>
  </div>
  `
      : ""
  }

  ${
    indicacionesGenerales
      ? `
  <div class="section-title">Recomendaciones y Plan Terapéutico</div>
  <div class="indicaciones-box">${indicacionesGenerales}</div>
  `
      : ""
  }

  ${
    notasEvolucion
      ? `
  <div class="section-title">Evolución Clínica</div>
  <div class="indicaciones-box">${notasEvolucion}</div>
  `
      : ""
  }

  <!-- FIRMAS -->
  <div class="footer-firmas">
    <div class="firma-box">
      <br>
      <strong>${paciente.nombre} ${paciente.apellido}</strong>
      Firma del Paciente / Tutor
    </div>
    <div class="firma-box">
      <br>
      <strong>Dr(a). ${profesional?.nombre || "Especialista"} ${profesional?.apellido || ""}</strong>
      ${profesional?.especialidad || "Médico Tratante"}<br>
      ${profesional?.exequatur ? `Exeq. No. ${profesional.exequatur}` : "Colegiatura Médica Dominicana"}
    </div>
  </div>

  <div class="legal-notice">
    Documento emitido electrónicamente por el sistema clínico integral. Conforme a las directrices de salud y ley de protección de datos médicos.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
