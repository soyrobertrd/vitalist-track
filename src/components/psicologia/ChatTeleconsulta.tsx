import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Props {
  teleconsultaId: string;
  autorTipo: "paciente" | "terapeuta";
  autorUserId?: string;
}

interface Msg {
  id: string;
  autor_tipo: string;
  mensaje: string;
  created_at: string;
}

export default function ChatTeleconsulta({ teleconsultaId, autorTipo, autorUserId }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [txt, setTxt] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("chat_teleconsulta")
        .select("*")
        .eq("teleconsulta_id", teleconsultaId)
        .order("created_at");
      if (mounted) setMsgs((data as any) || []);
    })();

    const ch = supabase
      .channel(`chat-tc-${teleconsultaId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_teleconsulta",
        filter: `teleconsulta_id=eq.${teleconsultaId}`,
      }, (payload) => {
        setMsgs(m => [...m, payload.new as Msg]);
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [teleconsultaId]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!txt.trim()) return;
    const m = txt.trim();
    setTxt("");
    await supabase.from("chat_teleconsulta").insert({
      teleconsulta_id: teleconsultaId,
      autor_tipo: autorTipo,
      autor_user_id: autorUserId,
      mensaje: m,
    });
  };

  return (
    <div className="flex flex-col h-full border rounded bg-card">
      <div className="p-2 border-b text-xs font-medium">Chat seguro</div>
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {msgs.map(m => (
          <div key={m.id} className={`text-sm max-w-[80%] p-2 rounded ${
            m.autor_tipo === autorTipo ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
          }`}>
            <div>{m.mensaje}</div>
            <div className="text-[10px] opacity-70">{new Date(m.created_at).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="p-2 border-t flex gap-2">
        <Input value={txt} onChange={e => setTxt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Mensaje..." />
        <Button size="icon" onClick={send}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
