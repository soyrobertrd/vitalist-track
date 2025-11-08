import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Pregunta {
  id: string;
  tipo: string;
  texto: string;
  opciones?: string[];
  requerida: boolean;
  variables?: string[];
}

interface EncuestaBuilderProps {
  preguntas: Pregunta[];
  onChange: (preguntas: Pregunta[]) => void;
}

const VARIABLES_DISPONIBLES = [
  { value: "{{paciente_nombre}}", label: "Nombre del Paciente" },
  { value: "{{paciente_apellido}}", label: "Apellido del Paciente" },
  { value: "{{paciente_cedula}}", label: "Cédula del Paciente" },
  { value: "{{profesional_nombre}}", label: "Nombre del Profesional" },
  { value: "{{profesional_apellido}}", label: "Apellido del Profesional" },
  { value: "{{profesional_especialidad}}", label: "Especialidad del Profesional" },
  { value: "{{fecha_actual}}", label: "Fecha Actual" },
  { value: "{{fecha_visita}}", label: "Fecha de la Visita" },
  { value: "{{fecha_llamada}}", label: "Fecha de la Llamada" },
  { value: "{{tipo_atencion}}", label: "Tipo de Atención" },
];

export const EncuestaBuilder = ({ preguntas, onChange }: EncuestaBuilderProps) => {
  const agregarPregunta = () => {
    const nuevaPregunta: Pregunta = {
      id: `pregunta-${Date.now()}`,
      tipo: "texto",
      texto: "",
      requerida: false,
    };
    onChange([...preguntas, nuevaPregunta]);
  };

  const eliminarPregunta = (id: string) => {
    onChange(preguntas.filter(p => p.id !== id));
  };

  const actualizarPregunta = (id: string, campo: string, valor: any) => {
    onChange(
      preguntas.map(p =>
        p.id === id ? { ...p, [campo]: valor } : p
      )
    );
  };

  const agregarOpcion = (preguntaId: string) => {
    onChange(
      preguntas.map(p => {
        if (p.id === preguntaId) {
          const opciones = p.opciones || [];
          return { ...p, opciones: [...opciones, ""] };
        }
        return p;
      })
    );
  };

  const actualizarOpcion = (preguntaId: string, index: number, valor: string) => {
    onChange(
      preguntas.map(p => {
        if (p.id === preguntaId && p.opciones) {
          const nuevasOpciones = [...p.opciones];
          nuevasOpciones[index] = valor;
          return { ...p, opciones: nuevasOpciones };
        }
        return p;
      })
    );
  };

  const eliminarOpcion = (preguntaId: string, index: number) => {
    onChange(
      preguntas.map(p => {
        if (p.id === preguntaId && p.opciones) {
          return { ...p, opciones: p.opciones.filter((_, i) => i !== index) };
        }
        return p;
      })
    );
  };

  const insertarVariable = (preguntaId: string, variable: string) => {
    onChange(
      preguntas.map(p => {
        if (p.id === preguntaId) {
          return { ...p, texto: p.texto + " " + variable };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Constructor de Preguntas</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">
                Las variables se reemplazarán automáticamente con datos reales al enviar la encuesta.
                Ejemplo: Hola paciente_nombre se convertirá en Hola Juan
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {preguntas.map((pregunta, index) => (
        <Card key={pregunta.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                Pregunta {index + 1}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => eliminarPregunta(pregunta.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Pregunta</Label>
              <Select
                value={pregunta.tipo}
                onValueChange={(value) => actualizarPregunta(pregunta.id, "tipo", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto Corto</SelectItem>
                  <SelectItem value="textarea">Texto Largo</SelectItem>
                  <SelectItem value="opcion_multiple">Opción Múltiple</SelectItem>
                  <SelectItem value="escala">Escala (1-5)</SelectItem>
                  <SelectItem value="si_no">Sí/No</SelectItem>
                  <SelectItem value="fecha">Fecha</SelectItem>
                  <SelectItem value="numero">Número</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Texto de la Pregunta</Label>
              <Textarea
                value={pregunta.texto}
                onChange={(e) => actualizarPregunta(pregunta.id, "texto", e.target.value)}
                placeholder="¿Cuál es tu pregunta?"
                rows={2}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Variables disponibles:</span>
                {VARIABLES_DISPONIBLES.map((variable) => (
                  <Badge
                    key={variable.value}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => insertarVariable(pregunta.id, variable.value)}
                  >
                    {variable.label}
                  </Badge>
                ))}
              </div>
            </div>

            {pregunta.tipo === "opcion_multiple" && (
              <div className="space-y-2">
                <Label>Opciones</Label>
                {pregunta.opciones?.map((opcion, opcionIndex) => (
                  <div key={opcionIndex} className="flex gap-2">
                    <Input
                      value={opcion}
                      onChange={(e) => actualizarOpcion(pregunta.id, opcionIndex, e.target.value)}
                      placeholder={`Opción ${opcionIndex + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarOpcion(pregunta.id, opcionIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => agregarOpcion(pregunta.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Opción
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`required-${pregunta.id}`}
                checked={pregunta.requerida}
                onChange={(e) => actualizarPregunta(pregunta.id, "requerida", e.target.checked)}
                className="rounded"
              />
              <Label htmlFor={`required-${pregunta.id}`} className="cursor-pointer">
                Pregunta requerida
              </Label>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={agregarPregunta} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar Pregunta
      </Button>
    </div>
  );
};
