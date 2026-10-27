import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, FileText, Receipt, Stethoscope, Plus, Trash2 } from "lucide-react";
import { imprimirDocumentoClinico, type ItemDocumento } from "@/lib/documentosImpresion";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useVerticalFilter } from "@/hooks/useVerticalFilter";

interface ImprimirDocumentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoInicial?: "receta" | "presupuesto" | "ficha";
  paciente: {
    id?: string;
    nombre: string;
    apellido: string;
    cedula?: string | null;
    edad?: number | string | null;
    sexo?: string | null;
    ars?: string | null;
    alergias?: string | null;
    telefono?: string | null;
  };
  profesional?: {
    nombre: string;
    apellido: string;
    especialidad?: string | null;
    exequatur?: string | null;
  } | null;
  itemsIniciales?: ItemDocumento[];
}

export function ImprimirDocumentoDialog({
  open,
  onOpenChange,
  tipoInicial = "receta",
  paciente,
  profesional,
  itemsIniciales = [],
}: ImprimirDocumentoDialogProps) {
  const { currentWorkspace } = useWorkspace();
  const { verticalActiva } = useVerticalFilter();

  const [tipo, setTipo] = useState<"receta" | "presupuesto" | "ficha">(tipoInicial);
  const [indicaciones, setIndicaciones] = useState("Tomar con alimentos. En caso de reacción adversa suspender y comunicarse de inmediato.");
  const [items, setItems] = useState<ItemDocumento[]>(
    itemsIniciales.length > 0
      ? itemsIniciales
      : [
          { titulo: "Amoxicilina + Ác. Clavulánico 875/125mg", descripcion: "1 comprimido cada 12 horas por 7 días", cantidad: 1, precioUnitario: 850 },
          { titulo: "Ibuprofeno 600mg", descripcion: "1 comprimido cada 8 horas según dolor", cantidad: 1, precioUnitario: 420 },
        ]
  );
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDesc, setNuevaDesc] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("500");

  const agregarItem = () => {
    if (!nuevoTitulo.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        titulo: nuevoTitulo.trim(),
        descripcion: nuevaDesc.trim() || undefined,
        cantidad: 1,
        precioUnitario: parseFloat(nuevoPrecio) || 0,
      },
    ]);
    setNuevoTitulo("");
    setNuevaDesc("");
  };

  const eliminarItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImprimir = () => {
    imprimirDocumentoClinico({
      tipo,
      paciente: {
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        cedula: paciente.cedula,
        edad: paciente.edad,
        sexo: paciente.sexo,
        ars: paciente.ars,
        alergias: paciente.alergias,
        telefono: paciente.telefono,
      },
      profesional: profesional
        ? {
            nombre: profesional.nombre,
            apellido: profesional.apellido,
            especialidad: profesional.especialidad,
            exequatur: profesional.exequatur,
          }
        : null,
      items,
      indicacionesGenerales: indicaciones,
      centroNombre: currentWorkspace?.nombre || "Centro Médico Integral",
      vertical: verticalActiva !== "todas" ? verticalActiva : "clinica",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Imprimir Documento Oficial con Marca
          </DialogTitle>
          <DialogDescription>
            Genere un documento profesional con membrete del centro, colores de la especialidad y firma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Selector de Tipo de Documento */}
          <div className="space-y-1.5">
            <Label>Tipo de Documento</Label>
            <Select value={tipo} onValueChange={(val: any) => setTipo(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receta">
                  <span className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Receta Médica</span>
                </SelectItem>
                <SelectItem value="presupuesto">
                  <span className="flex items-center gap-2"><Receipt className="h-4 w-4" /> Presupuesto / Cotización</span>
                </SelectItem>
                <SelectItem value="ficha">
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Resumen de Expediente</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Datos Paciente Badge */}
          <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
            <p><strong>Paciente:</strong> {paciente.nombre} {paciente.apellido} {paciente.cedula ? `(Cédula: ${paciente.cedula})` : ""}</p>
            <p><strong>ARS:</strong> {paciente.ars || "Privado"} | <strong>Alergias:</strong> {paciente.alergias || "Ninguna"}</p>
          </div>

          {/* Items / Medicamentos / Procedimientos */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tipo === "receta" ? "Medicamentos" : "Procedimientos y Conceptos"}
            </Label>
            <div className="space-y-2 border rounded-lg p-2 max-h-48 overflow-y-auto">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded bg-card border text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{it.titulo}</p>
                    {it.descripcion && <p className="text-[11px] text-muted-foreground">{it.descripcion}</p>}
                    {tipo === "presupuesto" && it.precioUnitario && (
                      <p className="text-[11px] font-mono font-medium text-primary">RD$ {it.precioUnitario.toLocaleString()}</p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => eliminarItem(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Agregar nuevo item */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <Input
                placeholder="Nombre de fármaco o procedimiento"
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                className="text-xs col-span-2"
              />
              <Input
                placeholder="Dosis / Indicación"
                value={nuevaDesc}
                onChange={(e) => setNuevaDesc(e.target.value)}
                className="text-xs"
              />
            </div>
            <Button size="sm" variant="outline" onClick={agregarItem} className="w-full text-xs gap-1 mt-1">
              <Plus className="h-3.5 w-3.5" /> Agregar a la lista
            </Button>
          </div>

          {/* Indicaciones Generales */}
          <div className="space-y-1.5">
            <Label>Instrucciones y Recomendaciones</Label>
            <Textarea
              rows={2}
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              placeholder="Recomendaciones generales para el paciente..."
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImprimir} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir / Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
