import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Printer, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface DicomStudyInfo {
  id: string;
  study_instance_uid: string;
  accession_number?: string;
  study_date?: string;
  modality: string;
  description?: string;
  pacientes?: {
    nombre: string;
    apellido: string;
  };
}

interface InformeRadiologicoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  study: DicomStudyInfo | null;
  onSaveReport?: (report: any) => void;
}

export const InformeRadiologicoModal: React.FC<InformeRadiologicoModalProps> = ({
  open,
  onOpenChange,
  study,
  onSaveReport,
}) => {
  const [tecnica, setTecnica] = useState(
    "Adquisición volumétrica helicoidal multicorte con cortes axiales reconstruidos a 1.25 mm y reformateos multiplanares (MPR) sagital y coronal."
  );
  const [comparativa, setComparativa] = useState("No se dispone de estudios imagenológicos previos para cotejo.");
  const [hallazgos, setHallazgos] = useState(
    "Estructuras anatómicas evaluadas conservan adecuada morfología y coeficientes de atenuación normales para la edad.\nNo se observan colecciones, masas hipo o hiperdensas patológicas, ni signos de sangrado agudo.\nRelaciones óseas alineadas sin trazos de fractura evidentes."
  );
  const [conclusion, setConclusion] = useState(
    "Estudio sin alteraciones morfológicas ni atenuación patológica aguda evidenciables en la presente exploración."
  );
  const [clasificacionRads, setClasificacionRads] = useState("sin_clasificacion");
  const [radiologoNombre, setRadiologoNombre] = useState("Dra. Elena Vasquez Ramos");
  const [radiologoExequatur, setRadiologoExequatur] = useState("EX-48910-RD");
  const [isSaved, setIsSaved] = useState(false);

  const handleGuardar = () => {
    const reportData = {
      studyId: study?.id,
      tecnica,
      comparativa,
      hallazgos,
      conclusion,
      clasificacionRads,
      radiologoNombre,
      radiologoExequatur,
      fechaFirma: new Date().toISOString(),
    };
    setIsSaved(true);
    toast.success("Informe radiológico estructurado firmado y archivado exitosamente");
    if (onSaveReport) {
      onSaveReport(reportData);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-5 w-5 text-primary" />
            Informe Radiológico Estructurado
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <span>
              Paciente:{" "}
              <strong className="text-foreground">
                {study?.pacientes ? `${study.pacientes.nombre} ${study.pacientes.apellido}` : "Paciente no asignado"}
              </strong>
            </span>
            <span>·</span>
            <span>
              Modalidad: <Badge variant="outline">{study?.modality || "DICOM"}</Badge>
            </span>
            <span>·</span>
            <span>Accession: <strong className="font-mono">{study?.accession_number || "S/N"}</strong></span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Técnica y Comparativa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Técnica del Estudio</Label>
              <Textarea
                rows={3}
                value={tecnica}
                onChange={(e) => setTecnica(e.target.value)}
                className="text-xs mt-1"
                placeholder="Detalle de adquisición y contrastes..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Comparativa Previa</Label>
              <Textarea
                rows={3}
                value={comparativa}
                onChange={(e) => setComparativa(e.target.value)}
                className="text-xs mt-1"
                placeholder="Estudios anteriores para cotejo..."
              />
            </div>
          </div>

          {/* Hallazgos Estructurados */}
          <div>
            <Label className="text-xs font-semibold">Hallazgos Imagenológicos</Label>
            <Textarea
              rows={5}
              value={hallazgos}
              onChange={(e) => setHallazgos(e.target.value)}
              className="text-xs mt-1 font-mono leading-relaxed"
              placeholder="Descripción sistemática de hallazgos por cuadrantes o regiones..."
            />
          </div>

          {/* Conclusión e Impresión */}
          <div>
            <Label className="text-xs font-semibold">Conclusión / Impresión Diagnóstica</Label>
            <Textarea
              rows={3}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="text-xs mt-1 font-semibold"
              placeholder="Síntesis diagnóstica para el médico solicitante..."
            />
          </div>

          {/* Clasificación RADS y Firma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-xl bg-muted/40 border border-border/80">
            <div>
              <Label className="text-xs font-semibold">Clasificación Estructurada (RADS)</Label>
              <Select value={clasificacionRads} onValueChange={setClasificacionRads}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Seleccionar escala..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_clasificacion">Sin clasificación específica</SelectItem>
                  <SelectItem value="birads_1">BI-RADS 1: Negativa / Normal</SelectItem>
                  <SelectItem value="birads_2">BI-RADS 2: Hallazgos benignos</SelectItem>
                  <SelectItem value="birads_3">BI-RADS 3: Probablemente benigno (&lt;2% riesgo)</SelectItem>
                  <SelectItem value="birads_4">BI-RADS 4: Sospecha de malignidad</SelectItem>
                  <SelectItem value="birads_5">BI-RADS 5: Altamente sugerente de malignidad</SelectItem>
                  <SelectItem value="lungrads_1">Lung-RADS 1: Negativo</SelectItem>
                  <SelectItem value="lungrads_2">Lung-RADS 2: Nódulo con apariencia benigna</SelectItem>
                  <SelectItem value="lungrads_4">Lung-RADS 4: Sospechoso</SelectItem>
                  <SelectItem value="tirads_2">TI-RADS 2: Benigno tiroideo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Firma Digital del Radiólogo
              </Label>
              <div className="mt-1 space-y-1.5">
                <Input
                  value={radiologoNombre}
                  onChange={(e) => setRadiologoNombre(e.target.value)}
                  className="h-7 text-xs"
                  placeholder="Médico Radiólogo"
                />
                <Input
                  value={radiologoExequatur}
                  onChange={(e) => setRadiologoExequatur(e.target.value)}
                  className="h-7 text-xs font-mono"
                  placeholder="Exequátur / No. Colegiatura"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleImprimir}>
            <Printer className="h-4 w-4 mr-1.5" />
            Imprimir Informe
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGuardar}
              className={isSaved ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Firmado & Guardado
                </>
              ) : (
                "Firmar y Validar Informe"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
