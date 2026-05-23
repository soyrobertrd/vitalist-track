import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Pregunta = { id: string; texto: string; tipo: "escala" | "texto" | "si_no"; min?: number; max?: number };

export default function CuestionarioPublico() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await (supabase.rpc as any)("leer_cuestionario_por_token", { _token: token });
      if (error) toast.error(error.message);
      else setData(data);
      setLoading(false);
    })();
  }, [token]);

  const submit = async () => {
    const preguntas: Pregunta[] = (data?.preguntas as any) || [];
    let puntaje = 0; let alerta = false;
    preguntas.forEach(p => {
      if (p.tipo === "escala") {
        const v = Number(respuestas[p.id] || 0);
        puntaje += v;
        if (typeof p.max === "number" && v >= p.max * 0.8) alerta = true;
      }
    });
    const { error } = await (supabase.rpc as any)("responder_cuestionario_publico", {
      _token: token, _respuestas: respuestas, _puntaje: puntaje, _alerta: alerta,
    });
    if (error) return toast.error(error.message);
    setSent(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center"><Card className="max-w-md"><CardContent className="py-12 text-center"><p className="font-medium">Cuestionario no disponible</p><p className="text-sm text-muted-foreground">El link es inválido o ya expiró.</p></CardContent></Card></div>;
  if (data.respondido || sent) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full"><CardContent className="py-12 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
        <p className="font-medium text-lg">¡Gracias por responder!</p>
        <p className="text-sm text-muted-foreground">Tu terapeuta revisará tus respuestas antes de la sesión.</p>
      </CardContent></Card>
    </div>
  );

  const preguntas: Pregunta[] = data.preguntas || [];

  return (
    <div className="min-h-screen bg-muted/30 p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center mb-4">
          <Brain className="h-8 w-8 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold">{data.plantilla_nombre}</h1>
          {data.plantilla_descripcion && <p className="text-sm text-muted-foreground mt-1">{data.plantilla_descripcion}</p>}
        </div>

        {preguntas.map((p, i) => (
          <Card key={p.id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{i + 1}. {p.texto}</CardTitle></CardHeader>
            <CardContent>
              {p.tipo === "escala" && (
                <div className="space-y-2">
                  <Input type="range" min={p.min ?? 0} max={p.max ?? 10}
                    value={respuestas[p.id] ?? p.min ?? 0}
                    onChange={e => setRespuestas({ ...respuestas, [p.id]: Number(e.target.value) })} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{p.min ?? 0}</span><b className="text-foreground">{respuestas[p.id] ?? p.min ?? 0}</b><span>{p.max ?? 10}</span></div>
                </div>
              )}
              {p.tipo === "texto" && (
                <Textarea value={respuestas[p.id] || ""} onChange={e => setRespuestas({ ...respuestas, [p.id]: e.target.value })} />
              )}
              {p.tipo === "si_no" && (
                <div className="flex gap-2">
                  {["si", "no"].map(v => (
                    <Button key={v} variant={respuestas[p.id] === v ? "default" : "outline"} size="sm" onClick={() => setRespuestas({ ...respuestas, [p.id]: v })} className="capitalize">{v}</Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Button onClick={submit} className="w-full" size="lg">Enviar respuestas</Button>
        <p className="text-center text-xs text-muted-foreground"><Label className="text-xs">🔒 Tus respuestas son confidenciales y solo las verá tu terapeuta.</Label></p>
      </div>
    </div>
  );
}
