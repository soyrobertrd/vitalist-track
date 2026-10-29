import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Syringe, Download, ShieldCheck, QrCode, CheckCircle2 } from "lucide-react";

export interface VacunaRegistro {
  id: string;
  nombre: string;
  dosis: string;
  fechaAplicacion: string;
  lote: string;
  fabricante: string;
  centroVacunacion: string;
  profesional: string;
  valido: boolean;
}

interface CarnetVacunacionTabProps {
  pacienteNombre: string;
  pacienteDoc?: string;
  vacunas?: VacunaRegistro[];
}

const DEFAULT_VACUNAS: VacunaRegistro[] = [
  {
    id: "vac-1",
    nombre: "Toxoide Tetánico - Diftérico (Td)",
    dosis: "Refuerzo decenal",
    fechaAplicacion: "2025-04-12",
    lote: "TD-8842-BIO",
    fabricante: "Sanofi Pasteur",
    centroVacunacion: "Centro Médico Principal - Vacunatorio",
    profesional: "Lic. Carmen Ortiz (Enf. Reg. 4812)",
    valido: true,
  },
  {
    id: "vac-2",
    nombre: "Influenza Trivalente Estacional",
    dosis: "Dosis Anual 2026",
    fechaAplicacion: "2026-02-18",
    lote: "INF-2026-X9",
    fabricante: "GSK Vaccines",
    centroVacunacion: "Centro Médico Principal - Vacunatorio",
    profesional: "Lic. Carmen Ortiz (Enf. Reg. 4812)",
    valido: true,
  },
  {
    id: "vac-3",
    nombre: "Hepatitis B Recombinante",
    dosis: "Esquema Completo (3/3)",
    fechaAplicacion: "2024-09-05",
    lote: "HB-7721-ENG",
    fabricante: "Merck Sharp & Dohme",
    centroVacunacion: "Hospital Universitario",
    profesional: "Lic. Marco Durán",
    valido: true,
  },
  {
    id: "vac-4",
    nombre: "Neumococo Polisacárido 23-Valente",
    dosis: "Dosis Única Adulto",
    fechaAplicacion: "2025-11-20",
    lote: "PNEUMO-339",
    fabricante: "Pfizer Biopharma",
    centroVacunacion: "Centro Médico Principal",
    profesional: "Lic. Carmen Ortiz",
    valido: true,
  },
];

export const CarnetVacunacionTab: React.FC<CarnetVacunacionTabProps> = ({
  pacienteNombre,
  pacienteDoc = "001-XXXXXXX-X",
  vacunas = DEFAULT_VACUNAS,
}) => {
  const handleDescargarCertificado = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header del Carnet Digital */}
      <Card className="rounded-2xl border-border/80 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
        <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <Syringe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Carnet Digital Oficial de Inmunización
                </h3>
                <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verificado MSP
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Titular: <span className="font-semibold text-foreground">{pacienteNombre}</span> · Documento: <span className="font-mono">{pacienteDoc}</span>
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleDescargarCertificado}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Descargar Certificado PDF
          </Button>
        </CardContent>
      </Card>

      {/* Tarjeta de Validación QR */}
      <Card className="rounded-2xl border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <QrCode className="h-4 w-4 text-emerald-600" />
            Código QR de Validación Sanitaria
          </CardTitle>
          <CardDescription className="text-xs">
            Presenta este código en aeropuertos, centros de empleo o instituciones sanitarias para verificación digital instantánea.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <div className="p-3 bg-white rounded-xl border shadow-sm shrink-0">
            {/* SVG Simulación QR de Alta Calidad */}
            <svg className="h-28 w-28 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
              {/* Pattern QR esquinas */}
              <rect x="5" y="5" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="13" y="13" width="10" height="10" />
              <rect x="69" y="5" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="77" y="13" width="10" height="10" />
              <rect x="5" y="69" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="13" y="77" width="10" height="10" />
              {/* Data matrix dots */}
              <rect x="38" y="10" width="6" height="6" />
              <rect x="48" y="10" width="6" height="6" />
              <rect x="58" y="10" width="6" height="6" />
              <rect x="38" y="24" width="6" height="6" />
              <rect x="50" y="24" width="12" height="6" />
              <rect x="10" y="42" width="8" height="8" />
              <rect x="26" y="42" width="6" height="12" />
              <rect x="38" y="42" width="24" height="6" />
              <rect x="70" y="42" width="8" height="8" />
              <rect x="84" y="42" width="6" height="18" />
              <rect x="42" y="56" width="14" height="8" />
              <rect x="60" y="60" width="6" height="12" />
              <rect x="38" y="72" width="10" height="16" />
              <rect x="56" y="76" width="16" height="8" />
              <rect x="76" y="72" width="14" height="6" />
              <rect x="76" y="84" width="8" height="6" />
            </svg>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground w-full">
            <div className="flex items-center justify-between border-b pb-1">
              <span>Token Criptográfico:</span>
              <span className="font-mono text-foreground font-semibold">VAC-DO-2026-X889</span>
            </div>
            <div className="flex items-center justify-between border-b pb-1">
              <span>Firma Digital:</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> SHA-256 Validado
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-1">
              <span>Registro Nacional:</span>
              <span className="text-foreground">PAI (Programa Ampliado Inmunización)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Última Actualización:</span>
              <span className="text-foreground">28 Octubre 2026</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vacunas Registradas */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Historial de Inoculaciones ({vacunas.length})
        </h4>

        {vacunas.map((v) => (
          <Card key={v.id} className="rounded-xl border-border/80 shadow-none">
            <CardContent className="p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="font-bold text-sm text-foreground">{v.nombre}</h5>
                  <Badge variant="outline" className="text-[11px] font-normal mt-0.5">
                    {v.dosis}
                  </Badge>
                </div>
                <div className="text-right text-xs">
                  <span className="font-medium text-foreground">{v.fechaAplicacion}</span>
                  <div className="text-[11px] text-emerald-600 font-medium flex items-center justify-end gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Aplicada
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-foreground/70">Lote Biológico</span>
                  <span className="font-mono text-foreground">{v.lote}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-foreground/70">Fabricante</span>
                  <span className="text-foreground">{v.fabricante}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-foreground/70">Centro Vacunador</span>
                  <span className="text-foreground truncate block">{v.centroVacunacion}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-foreground/70">Profesional</span>
                  <span className="text-foreground truncate block">{v.profesional}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
