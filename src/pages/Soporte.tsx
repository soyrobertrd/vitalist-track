import { GlassCard } from "@/components/GlassCard";
import { Mail, Phone, Clock, MapPin, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const Soporte = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate sending support request
    setTimeout(() => {
      toast({
        title: "Solicitud enviada",
        description: "Nos pondremos en contacto contigo pronto.",
      });
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Centro de Soporte</h1>
        <p className="text-muted-foreground">Estamos aquí para ayudarte</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Email</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Envíanos un correo y te responderemos en menos de 24 horas
              </p>
              <a href="mailto:soporte@sistema.com" className="text-sm text-primary hover:underline">
                soporte@sistema.com
              </a>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Teléfono</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Llámanos durante nuestro horario de atención
              </p>
              <a href="tel:+18095551234" className="text-sm text-primary hover:underline">
                +1 (809) 555-1234
              </a>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Horario</h3>
              <p className="text-sm text-muted-foreground">
                Lunes a Viernes: 8:00 AM - 6:00 PM<br />
                Sábados: 9:00 AM - 2:00 PM<br />
                Domingos: Cerrado
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Ubicación</h3>
              <p className="text-sm text-muted-foreground">
                Santo Domingo, República Dominicana<br />
                Calle Principal #123<br />
                Zona Sanitaria
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Enviar Solicitud de Soporte</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input id="nombre" name="nombre" required placeholder="Tu nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asunto">Asunto *</Label>
            <Input id="asunto" name="asunto" required placeholder="¿En qué podemos ayudarte?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje *</Label>
            <Textarea
              id="mensaje"
              name="mensaje"
              required
              placeholder="Describe tu problema o pregunta con el mayor detalle posible..."
              rows={6}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Preguntas Frecuentes</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-foreground mb-1">¿Cómo agendar una llamada?</h3>
            <p className="text-sm text-muted-foreground">
              Ve al módulo de "Llamadas" y haz clic en "Agendar Llamada". Completa los datos requeridos y guarda.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">¿Cómo agregar un nuevo paciente?</h3>
            <p className="text-sm text-muted-foreground">
              En el módulo "Pacientes", haz clic en "Nuevo Paciente" o "Importar" para cargar múltiples pacientes desde un archivo.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">¿Cómo cambiar mi contraseña?</h3>
            <p className="text-sm text-muted-foreground">
              Ve a "Configuración" {">"} "Mi Perfil" {">"} pestaña "Seguridad" y sigue las instrucciones.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Soporte;
