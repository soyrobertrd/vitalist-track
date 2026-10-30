import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Sun, Moon, ShieldAlert, Share2, Printer, CheckCircle2, AlertTriangle, Droplets, Clock, Heart, Plus, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

interface PautaPostOp {
  procedimiento: string;
  restriccionesHoras: number;
  prohibiciones: string[];
  rutinaManana: { paso: number; producto: string; instruccion: string }[];
  rutinaNoche: { paso: number; producto: string; instruccion: string }[];
  signosAlarma: string[];
}

const PROTOCOLOS_BASE: Record<string, PautaPostOp> = {
  peeling: {
    procedimiento: "Peeling Químico / Microneedling",
    restriccionesHoras: 72,
    prohibiciones: [
      "No exponerse al sol directo ni usar camas de bronceado.",
      "Prohibido arrancar o tirar de las pielecitas que se estén descamando.",
      "Evitar saunas, baños turcos, jacuzzis y piscinas por 72 horas.",
      "No realizar ejercicio físico vigoroso que induzca sudoración profusa.",
      "Suspender ácidos exfoliantes (Glicólico, Retinol, Salicílico) por 7 días.",
    ],
    rutinaManana: [
      { paso: 1, producto: "Limpiador suave syndet (sin jabón ni fragancia)", instruccion: "Lavar con agua templada y secar con toques suaves de toalla limpia." },
      { paso: 2, producto: "Sérum Hidratante Ácido Hialurónico Puro", instruccion: "Aplicar 3 a 4 gotas sobre piel ligeramente húmeda." },
      { paso: 3, producto: "Crema Cicatrizante & Reparadora de Barrera (Cicalfate / Cicaplast)", instruccion: "Capa fina para calmar enrojecimiento y tirantez." },
      { paso: 4, producto: "Fotoprotector Mineral / Físico SPF 50+ Amplio Espectro", instruccion: "Obligatorio cada 3 horas, incluso en interiores o días nublados." },
    ],
    rutinaNoche: [
      { paso: 1, producto: "Limpiador syndet suave", instruccion: "Limpieza suave para retirar restos de protector e impurezas." },
      { paso: 2, producto: "Sérum calmante / Pantenol B5", instruccion: "Regeneración epidérmica nocturna." },
      { paso: 3, producto: "Bálsamo ultra-reparador de barrera", instruccion: "Sellar la hidratación antes de dormir." },
    ],
    signosAlarma: [
      "Ampollas o costras con secreción purulenta amarillenta.",
      "Dolor urente pulsátil que no cede con analgésico común.",
      "Edema asimétrico severo o fiebre superior a 38°C.",
    ],
  },
  inyectables: {
    procedimiento: "Toxina Botulínica & Rellenos (Ácido Hialurónico)",
    restriccionesHoras: 48,
    prohibiciones: [
      "No acostarse ni apoyar la cabeza durante las primeras 4 a 6 horas.",
      "No masajear ni frotar las zonas de inyección (riesgo de migración de producto).",
      "Evitar cascos ajustados, gorras o gafas que presionen las áreas tratadas.",
      "Cero consumo de alcohol o anticoagulantes (aspirina) las primeras 24h para evitar hematomas.",
      "No realizar vuelos de larga distancia en las primeras 48 horas.",
    ],
    rutinaManana: [
      { paso: 1, producto: "Limpieza facial con agua fresca y gel neutro", instruccion: "Acariciar la piel sin frotar con fuerza." },
      { paso: 2, producto: "Sérum antioxidante Vitamina C 10%", instruccion: "Protección contra estrés oxidativo." },
      { paso: 3, producto: "Protector Solar SPF 50+ toque seco", instruccion: "Aplicación ligera en rostro y cuello." },
    ],
    rutinaNoche: [
      { paso: 1, producto: "Agua micelar para pieles sensibles", instruccion: "Remover suavemente con disco de algodón." },
      { paso: 2, producto: "Emulsión hidratante no comedogénica", instruccion: "Mantener turgencia dérmica." },
    ],
    signosAlarma: [
      "Blanqueamiento cutáneo intenso o livedo reticularis (riesgo de compromiso vascular).",
      "Dolor agudo desproporcionado en la zona de punción.",
      "Ptosis palpebral (caída del párpado) o visión doble.",
    ],
  },
  laser: {
    procedimiento: "Láser Diodo / Fotodepilación / Rejuvenecimiento IPL",
    restriccionesHoras: 48,
    prohibiciones: [
      "No tomar baños con agua muy caliente; preferir agua tibia o fresca.",
      "Evitar desodorantes con alcohol o fragancia si se trató la zona axilar.",
      "No utilizar ropa sintética muy ajustada en la zona tratada.",
      "Prohibido arrancar vellos con pinza o cera entre sesiones; solo rasurado con cuchilla.",
    ],
    rutinaManana: [
      { paso: 1, producto: "Gel calmante de Aloe Vera 100% puro o caléndula", instruccion: "Aplicar generosamente en el área tratada." },
      { paso: 2, producto: "Protector Solar Corporal / Facial SPF 50+", instruccion: "Cubrir todas las zonas expuestas." },
    ],
    rutinaNoche: [
      { paso: 1, producto: "Loción hidratante enriquecida con urea o avena", instruccion: "Restaurar confort dérmico." },
    ],
    signosAlarma: [
      "Quemadura superficial con ampolla o flictena.",
      "Hiperpigmentación postinflamatoria marcada.",
    ],
  },
  masajes: {
    procedimiento: "Masaje Reductivo / Drenaje Linfático / Maderoterapia",
    restriccionesHoras: 24,
    prohibiciones: [
      "Ingesta alta de sodio (sal), embutidos o alcohol las primeras 48h.",
      "Permanecer más de 3 horas continuas sentado o de pie sin caminar.",
      "No saltarse la ingesta hídrica recomendada para eliminar toxinas.",
    ],
    rutinaManana: [
      { paso: 1, producto: "Hidratación hídrica (2 a 3 litros de agua al día)", instruccion: "Facilitar el drenaje metabólico y eliminación urinaria." },
      { paso: 2, producto: "Crema reafirmante con cafeína / centella asiática", instruccion: "Masajear en sentido ascendente hacia ganglios linfáticos." },
    ],
    rutinaNoche: [
      { paso: 1, producto: "Ducha de contraste tibio-fresco en piernas y abdomen", instruccion: "Estimula la circulación de retorno." },
      { paso: 2, producto: "Aceite nutritivo reafirmante (almendras o rosa mosqueta)", instruccion: "Nutrición profunda para elasticidad tisular." },
    ],
    signosAlarma: [
      "Hematoma extenso que aumente de tamaño progresivamente.",
      "Dolor muscular agudo que impida la marcha normal.",
    ],
  },
};

export default function ProtocoloCosmeceuticoPostTratamiento() {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>("peeling");
  const [pacienteNombre, setPacienteNombre] = useState<string>("Carla Mercedes");
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState<string>("809-555-0142");
  const [protocolo, setProtocolo] = useState<PautaPostOp>(PROTOCOLOS_BASE["peeling"]);
  const [notasAdicionales, setNotasAdicionales] = useState<string>("Beber abundante agua y acudir a su cita de revisión en 15 días.");

  const handleCambioTipo = (tipo: string) => {
    setTipoSeleccionado(tipo);
    if (PROTOCOLOS_BASE[tipo]) {
      setProtocolo(PROTOCOLOS_BASE[tipo]);
    }
  };

  const enviarWhatsApp = () => {
    const texto = `🌟 *INDICACIONES POST-TRATAMIENTO & RUTINA EN CASA* 🌟
Hola *${pacienteNombre}*, aquí tienes las recomendaciones clínicas tras tu sesión de *${protocolo.procedimiento}*:

⚠️ *CUIDADOS CRÍTICOS (Primeras ${protocolo.restriccionesHoras} horas):*
${protocolo.prohibiciones.map((p) => `• ${p}`).join("\n")}

☀️ *RUTINA DE MAÑANA:*
${protocolo.rutinaManana.map((m) => `${m.paso}. *${m.producto}*: ${m.instruccion}`).join("\n")}

🌙 *RUTINA DE NOCHE:*
${protocolo.rutinaNoche.map((n) => `${n.paso}. *${n.producto}*: ${n.instruccion}`).join("\n")}

🚨 *SIGNOS DE ALARMA:*
${protocolo.signosAlarma.map((s) => `• ${s}`).join("\n")}

📝 *Nota del profesional:* ${notasAdicionales}

Cualquier duda o molestia imprevista, escríbenos directamente por esta vía. ¡Que tengas una excelente recuperación! ✨`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    toast.success("Indicaciones generadas y abiertas en WhatsApp.");
  };

  const imprimirProtocolo = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Protocolo Cosmecéutico & Cuidados Domiciliarios Post-Tratamiento
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Prescripción de rutina en casa, pautas restrictivas y comunicación instantánea al WhatsApp del paciente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={imprimirProtocolo}
            className="rounded-xl h-9 text-xs gap-1.5 shadow-none"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Hoja
          </Button>

          <Button
            size="sm"
            onClick={enviarWhatsApp}
            className="rounded-xl h-9 text-xs gap-1.5 shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="h-3.5 w-3.5" />
            Enviar por WhatsApp
          </Button>
        </div>
      </div>

      {/* Selector de Paciente y Procedimiento */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Paciente / Cliente</Label>
            <Input
              value={pacienteNombre}
              onChange={(e) => setPacienteNombre(e.target.value)}
              placeholder="Nombre del paciente"
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Teléfono / WhatsApp</Label>
            <Input
              value={telefonoWhatsApp}
              onChange={(e) => setTelefonoWhatsApp(e.target.value)}
              placeholder="Ej. 809-555-0142"
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Tratamiento Realizado</Label>
            <Select value={tipoSeleccionado} onValueChange={handleCambioTipo}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="peeling">Peeling Químico / Microneedling</SelectItem>
                <SelectItem value="inyectables">Toxina / Rellenos de Ácido Hialurónico</SelectItem>
                <SelectItem value="laser">Láser Diodo / Fotodepilación / IPL</SelectItem>
                <SelectItem value="masajes">Masaje Reductivo / Drenaje Linfático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Pautas: Restricciones + Rutinas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restricciones y Prohibiciones Inmediatas */}
        <Card className="rounded-2xl border-border/80 shadow-none border-amber-500/20 bg-amber-50/10 dark:bg-amber-950/5">
          <CardHeader className="p-4 pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              Restricciones Críticas (Primeras {protocolo.restriccionesHoras} Horas)
            </CardTitle>
            <CardDescription className="text-xs">
              Pautas esenciales para evitar complicaciones, quemaduras o asimetrías.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {protocolo.prohibiciones.map((prohibicion, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-foreground">{prohibicion}</span>
              </div>
            ))}

            <div className="pt-3 border-t border-border/60 space-y-2">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                Signos de Alarma que Requieren Contacto Médico Inmediato:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                {protocolo.signosAlarma.map((alarma, idx) => (
                  <li key={idx}>{alarma}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Rutina Cosmecéutica en Casa (Día & Noche) */}
        <div className="space-y-4">
          {/* Rutina Mañana */}
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-amber-500/5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Sun className="h-4 w-4" />
                Rutina de Mañana (Protección & Reparación)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {protocolo.rutinaManana.map((p) => (
                <div key={p.paso} className="flex items-start gap-2.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {p.paso}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{p.producto}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{p.instruccion}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rutina Noche */}
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="p-4 pb-2 border-b border-border/60 bg-indigo-500/5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Moon className="h-4 w-4" />
                Rutina de Noche (Regeneración & Calma)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {protocolo.rutinaNoche.map((p) => (
                <div key={p.paso} className="flex items-start gap-2.5 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {p.paso}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{p.producto}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{p.instruccion}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notas Adicionales Personalizadas */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-4 space-y-2">
          <Label className="text-xs font-semibold">Instrucciones o Recomendaciones Específicas del Profesional</Label>
          <Textarea
            value={notasAdicionales}
            onChange={(e) => setNotasAdicionales(e.target.value)}
            rows={2}
            className="text-xs rounded-xl"
            placeholder="Escriba aquí notas personalizadas para este paciente..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
