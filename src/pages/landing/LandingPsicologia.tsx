import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function LandingPsicologia() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-5xl mx-auto px-6 py-20 text-center space-y-6">
        <Brain className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-5xl font-bold">Psicología & Psiquiatría Pro</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Salud mental completa: sesiones, notas privadas, escalas PHQ-9/GAD-7, seguimiento emocional,
          psiquiatría, telepsicología y paquetes de terapia.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild size="lg"><Link to="/auth">Comenzar gratis</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/">Volver</Link></Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4 pt-12 text-left">
          {[
            ["Notas ultra-privadas","Solo el terapeuta y el supervisor pueden acceder. Registro de accesos."],
            ["Escalas integradas","PHQ-9, GAD-7, BDI, PCL-5, ASRS y más con severidad automática."],
            ["Telepsicología","Videollamada cifrada, sala de espera virtual y consentimiento."],
            ["Multi-profesional","Psicólogo, psiquiatra, terapeuta familiar, coach y supervisor."],
            ["Submódulos nicho","Infantil, adicciones, pareja y EAP corporativo."],
            ["Paquetes y bonos","Bonos 4/8 sesiones, membresías mensuales, cobro automático."],
          ].map(([t,d])=> (
            <div key={t} className="p-4 rounded-lg border bg-card">
              <p className="font-medium">{t}</p>
              <p className="text-sm text-muted-foreground mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
