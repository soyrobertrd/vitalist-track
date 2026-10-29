import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ShieldCheck, CheckCircle2, UserCheck, Calendar } from "lucide-react";

export interface EpicrisisItem {
  id: string;
  episodioNumero: string;
  servicio: string;
  fechaIngreso: string;
  fechaEgreso: string;
  diagnosticoEgreso: string;
  medicoTratante: string;
  estado: "alta_definitiva" | "alta_traslado" | "alta_voluntaria";
}

export interface ConsentimientoFirmadoItem {
  id: string;
  procedimiento: string;
  servicio: string;
  fechaFirma: string;
  medicoResponsable: string;
  testigo?: string;
  valido: boolean;
}

interface EpicrisisConsentimientosTabProps {
  epicrisisList?: EpicrisisItem[];
  consentimientosList?: ConsentimientoFirmadoItem[];
}

const DEFAULT_EPICRISIS: EpicrisisItem[] = [
  {
    id: "epi-1",
    episodioNumero: "HOSP-2026-4412",
    servicio: "Medicina Interna - Cama 304",
    fechaIngreso: "2026-10-18",
    fechaEgreso: "2026-10-24",
    diagnosticoEgreso: "Neumonía adquirida en la comunidad resuelta. Hipertensión arterial estadio 1 controlada.",
    medicoTratante: "Dr. Marco Aurelio Pérez (Internista)",
    estado: "alta_definitiva",
  },
];

const DEFAULT_CONSENTIMIENTOS: ConsentimientoFirmadoItem[] = [
  {
    id: "cons-1",
    procedimiento: "Consentimiento Informado para Procedimiento Quirúrgico e Invasivo",
    servicio: "Cirugía General & Laparoscópica",
    fechaFirma: "2026-10-19 08:30",
    medicoResponsable: "Dra. Sofía Mendoza Peña",
    testigo: "Lic. Carmen Ortiz (Enfermera)",
    valido: true,
  },
  {
    id: "cons-2",
    procedimiento: "Consentimiento Informado para Administración de Anestesia General y Sedación",
    servicio: "Anestesiología",
    fechaFirma: "2026-10-19 08:45",
    medicoResponsable: "Dr. Jorge Castillo (Anestesiólogo)",
    testigo: "Lic. Carmen Ortiz",
    valido: true,
  },
];

export const EpicrisisConsentimientosTab: React.FC<EpicrisisConsentimientosTabProps> = ({
  epicrisisList = DEFAULT_EPICRISIS,
  consentimientosList = DEFAULT_CONSENTIMIENTOS,
}) => {
  const handleDescargar = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sección 1: Epicrisis de Alta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Epicrisis e Informes de Alta Hospitalaria
            </h3>
            <p className="text-xs text-muted-foreground">
              Documentos oficiales de egreso con plan de cuidados y farmacoterapia
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {epicrisisList.map((epi) => (
            <Card key={epi.id} className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {epi.episodioNumero}
                      </span>
                      <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px]">
                        Alta Médica Aprobada
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Servicio: <strong className="text-foreground">{epi.servicio}</strong> · Médico: {epi.medicoTratante}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-8 text-xs shrink-0"
                    onClick={handleDescargar}
                  >
                    <Download className="h-3.5 w-3.5 mr-1 text-primary" />
                    Descargar Epicrisis PDF
                  </Button>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1.5 border border-border/60">
                  <span className="font-semibold text-foreground block">Diagnóstico al Egreso:</span>
                  <p className="text-muted-foreground leading-relaxed">{epi.diagnosticoEgreso}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Ingreso: {epi.fechaIngreso}
                  </span>
                  <span>Egreso: <strong className="text-foreground">{epi.fechaEgreso}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sección 2: Consentimientos Informados Firmados */}
      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Consentimientos Informados Digitales
          </h3>
          <p className="text-xs text-muted-foreground">
            Actas firmadas digitalmente por usted o su tutor legal previo a cirugías y procedimientos
          </p>
        </div>

        <div className="space-y-3">
          {consentimientosList.map((c) => (
            <Card key={c.id} className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-sm text-foreground">{c.procedimiento}</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Servicio: {c.servicio} · Médico a cargo: <strong className="text-foreground">{c.medicoResponsable}</strong>
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-8 text-xs shrink-0"
                    onClick={handleDescargar}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Descargar Acta
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Firma Paciente/Tutor: <strong className="text-foreground">Registrada Táctil</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Testigo: <strong className="text-foreground">{c.testigo || "Enfermería"}</strong></span>
                  </div>
                  <div className="text-right sm:text-right">
                    <span>Fecha & Hora: <strong className="font-mono text-foreground">{c.fechaFirma}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
