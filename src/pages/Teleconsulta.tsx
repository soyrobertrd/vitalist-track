import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Plus, Copy } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTranslation } from "react-i18next";

type Sesion = {
  id: string;
  sala_codigo: string;
  estado: string;
  profesional_id: string;
  paciente_id: string | null;
  iniciada_at: string | null;
  finalizada_at: string | null;
};

const ICE_SERVERS = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };

export default function Teleconsulta() {
  const { t: tr } = useTranslation(["teleconsulta", "common"]);
  const qc = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const [activeSala, setActiveSala] = useState<Sesion | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);

  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  const { data: sesiones } = useQuery({
    queryKey: ["teleconsulta-sesiones", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teleconsulta_sesiones")
        .select("*")
        .eq("workspace_id", currentWorkspace!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Sesion[];
    },
  });

  async function crearSesion() {
    if (!currentWorkspace?.id) return;
    const { data: pers } = await supabase
      .from("personal_salud").select("id").eq("user_id", (await supabase.auth.getUser()).data.user?.id).maybeSingle();
    if (!pers) { toast.error(t("only_professionals")); return; }
    const { data, error } = await supabase
      .from("teleconsulta_sesiones")
      .insert({ workspace_id: currentWorkspace.id, profesional_id: pers.id })
      .select().single();
    if (error) { toast.error(error.message); return; }
    toast.success(t("room_created"));
    qc.invalidateQueries({ queryKey: ["teleconsulta-sesiones"] });
    setActiveSala(data as Sesion);
  }

  async function unirsePorCodigo() {
    if (!joinCode.trim()) return;
    const { data, error } = await supabase
      .from("teleconsulta_sesiones").select("*").eq("sala_codigo", joinCode.trim()).maybeSingle();
    if (error || !data) { toast.error(t("room_not_found")); return; }
    setActiveSala(data as Sesion);
  }

  async function iniciarLlamada() {
    if (!activeSala) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideo.current) localVideo.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => { if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0]; };

      const user = (await supabase.auth.getUser()).data.user;
      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          await supabase.from("teleconsulta_signaling").insert({
            sesion_id: activeSala.id, emisor_user_id: user!.id,
            tipo: "ice", payload: e.candidate.toJSON() as any,
          });
        }
      };

      const channel = supabase
        .channel(`tc-${activeSala.id}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "teleconsulta_signaling", filter: `sesion_id=eq.${activeSala.id}` },
          async (payload) => {
            const msg: any = payload.new;
            if (msg.emisor_user_id === user!.id) return;
            if (msg.tipo === "offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await supabase.from("teleconsulta_signaling").insert({
                sesion_id: activeSala.id, emisor_user_id: user!.id, tipo: "answer", payload: answer as any,
              });
            } else if (msg.tipo === "answer") {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            } else if (msg.tipo === "ice") {
              try { await pc.addIceCandidate(new RTCIceCandidate(msg.payload)); } catch {}
            }
          })
        .subscribe();
      channelRef.current = channel;

      // Quien inicia envía offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await supabase.from("teleconsulta_signaling").insert({
        sesion_id: activeSala.id, emisor_user_id: user!.id, tipo: "offer", payload: offer as any,
      });

      await supabase.from("teleconsulta_sesiones").update({
        estado: "en_curso", iniciada_at: new Date().toISOString(),
      }).eq("id", activeSala.id);

      setConnected(true);
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  }

  async function colgar() {
    pcRef.current?.close();
    localStream.current?.getTracks().forEach((t) => t.stop());
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    if (activeSala) {
      await supabase.from("teleconsulta_sesiones").update({
        estado: "finalizada", finalizada_at: new Date().toISOString(),
      }).eq("id", activeSala.id);
    }
    setConnected(false);
    setActiveSala(null);
    qc.invalidateQueries({ queryKey: ["teleconsulta-sesiones"] });
  }

  function toggleMic() {
    localStream.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
  }
  function toggleCam() {
    localStream.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn(!camOn);
  }

  useEffect(() => () => { pcRef.current?.close(); localStream.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teleconsulta</h1>
        <p className="text-muted-foreground">Videoconsultas WebRTC entre profesional y paciente.</p>
      </div>

      {!activeSala && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Crear sala</CardTitle></CardHeader>
            <CardContent>
              <Button onClick={crearSesion}><Plus className="h-4 w-4 mr-2" />Nueva sala</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Unirse por código</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input placeholder="Código de sala" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
              <Button onClick={unirsePorCodigo}>Unirme</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSala && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sala: <code className="text-sm">{activeSala.sala_codigo}</code></span>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(activeSala.sala_codigo); toast.success("Copiado"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-black rounded-lg overflow-hidden">
              <video ref={localVideo} autoPlay playsInline muted className="w-full aspect-video bg-muted" />
              <video ref={remoteVideo} autoPlay playsInline className="w-full aspect-video bg-muted" />
            </div>
            <div className="flex gap-2 justify-center">
              {!connected ? (
                <Button onClick={iniciarLlamada}><Video className="h-4 w-4 mr-2" />Iniciar</Button>
              ) : (
                <>
                  <Button variant={micOn ? "default" : "secondary"} onClick={toggleMic}>
                    {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button variant={camOn ? "default" : "secondary"} onClick={toggleCam}>
                    {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="destructive" onClick={colgar}>
                    <PhoneOff className="h-4 w-4 mr-2" />Colgar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Sesiones recientes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sesiones?.map((s) => (
              <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <code className="text-sm">{s.sala_codigo}</code>
                  <div className="text-xs text-muted-foreground">{s.iniciada_at ? new Date(s.iniciada_at).toLocaleString() : "Sin iniciar"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.estado === "finalizada" ? "secondary" : "default"}>{s.estado}</Badge>
                  {s.estado !== "finalizada" && (
                    <Button size="sm" onClick={() => setActiveSala(s)}>Entrar</Button>
                  )}
                </div>
              </div>
            ))}
            {!sesiones?.length && <p className="text-sm text-muted-foreground">Sin sesiones aún.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
