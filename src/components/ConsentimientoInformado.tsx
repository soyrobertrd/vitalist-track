import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ConsentimientoData {
  aceptado: boolean;
  firmado_por: string;
  parentesco_firmante?: string | null;
  version_documento: string;
}

interface Props {
  value: ConsentimientoData;
  onChange: (next: ConsentimientoData) => void;
  /** Optional: pre-fill firmante with the patient name */
  defaultFirmante?: string;
}

const TERMS_VERSION = "v1.0-2026";

const TERMS_HTML = `
<p><strong>Tratamiento de datos personales y de salud</strong></p>
<p>El paciente (o su representante legal) acepta que la clínica recolecte, almacene y procese sus datos personales y de salud con la finalidad de:</p>
<ul class="list-disc pl-5 space-y-1">
  <li>Brindar atención clínica, incluyendo visitas domiciliarias, llamadas de seguimiento y comunicaciones por correo o WhatsApp.</li>
  <li>Coordinar al equipo asistencial y mantener el historial médico del paciente.</li>
  <li>Enviar recordatorios de citas, encuestas de satisfacción y resultados.</li>
  <li>Cumplir con obligaciones legales y regulatorias de salud.</li>
</ul>
<p>El tratamiento se realiza conforme a las leyes locales aplicables (ej. Ley 172-13 RD, GDPR, HIPAA cuando corresponda) y a la política de privacidad de la clínica.</p>
<p><strong>Derechos del paciente:</strong> acceso, rectificación, oposición, portabilidad y supresión. Para ejercerlos, contactar a la clínica.</p>
<p><strong>Conservación:</strong> los datos clínicos se conservan por el plazo legal mínimo aplicable.</p>
<p>Al marcar la casilla, el firmante declara haber leído, entendido y aceptado este consentimiento informado.</p>
`;

/**
 * Patient informed-consent capture block.
 * Required by HIPAA / GDPR / RD Ley 172-13 before storing PHI.
 *
 * Renders inline (not a dialog) so the user must explicitly tick before
 * the parent form's submit button is enabled.
 */
export function ConsentimientoInformado({ value, onChange, defaultFirmante }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id="consent_check"
          checked={value.aceptado}
          onCheckedChange={(c) =>
            onChange({
              ...value,
              aceptado: Boolean(c),
              version_documento: TERMS_VERSION,
              firmado_por: value.firmado_por || defaultFirmante || "",
            })
          }
          className="mt-0.5"
        />
        <div className="flex-1 space-y-1">
          <Label htmlFor="consent_check" className="text-sm leading-snug cursor-pointer">
            El paciente (o su representante) acepta el{" "}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button type="button" className="text-primary underline underline-offset-2">
                  consentimiento informado
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Consentimiento informado · {TERMS_VERSION}</DialogTitle>
                </DialogHeader>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none mt-4"
                  dangerouslySetInnerHTML={{ __html: TERMS_HTML }}
                />
              </DialogContent>
            </Dialog>{" "}
            para el tratamiento de sus datos clínicos.
          </Label>
          <p className="text-xs text-muted-foreground">
            Requerido por ley para almacenar datos de salud (HIPAA / GDPR / Ley 172-13).
          </p>
        </div>
      </div>

      {value.aceptado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 pl-7">
          <div className="space-y-1">
            <Label htmlFor="firmado_por" className="text-xs">
              Firmado por (nombre completo) *
            </Label>
            <Input
              id="firmado_por"
              value={value.firmado_por}
              onChange={(e) => onChange({ ...value, firmado_por: e.target.value })}
              placeholder="Nombre legal del firmante"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="parentesco_firmante" className="text-xs">
              ¿Quién firma?
            </Label>
            <Select
              value={value.parentesco_firmante || "paciente"}
              onValueChange={(v) =>
                onChange({ ...value, parentesco_firmante: v === "paciente" ? null : v })
              }
            >
              <SelectTrigger id="parentesco_firmante">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paciente">El propio paciente</SelectItem>
                <SelectItem value="cuidador">Cuidador</SelectItem>
                <SelectItem value="tutor_legal">Tutor legal</SelectItem>
                <SelectItem value="familiar">Familiar</SelectItem>
                <SelectItem value="representante">Representante legal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export const TERMS_VERSION_CURRENT = TERMS_VERSION;
export const TERMS_HTML_CURRENT = TERMS_HTML;
