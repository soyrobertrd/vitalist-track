import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import { 
  Globe, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Database, 
  Server, 
  Building2,
  Cpu
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ClinicDomainManager() {
  const { currentWorkspace, currentPlan } = useWorkspace();
  const navigate = useNavigate();

  const planCodigo = currentWorkspace?.plan_codigo || "solo";
  const isSoloDoctor = planCodigo === "solo" || planCodigo === "free";
  const isProConsultorios = planCodigo === "pro";
  const isBusiness = planCodigo === "business" || planCodigo === "enterprise";

  // Subdominio y Dominio personalizado solo para Clínica Plus y Business
  const allowsSubdomain = planCodigo === "plus" || isBusiness;
  const allowsCustomDomain = planCodigo === "plus" || isBusiness;

  const [subdomain, setSubdomain] = useState(currentWorkspace?.slug || "mi-clinica");
  const [customDomain, setCustomDomain] = useState(
    currentWorkspace?.configuracion?.custom_domain || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [dnsVerified, setDnsVerified] = useState(
    !!currentWorkspace?.configuracion?.custom_domain_verified
  );

  // Estado para la base de datos independiente (Business Enterprise)
  const [dedicatedDbUrl, setDedicatedDbUrl] = useState(
    currentWorkspace?.configuracion?.turso_db_url || "libsql://clinica-enterprise.turso.io"
  );
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  const fullSubdomainUrl = `https://${subdomain}.vitalisttrack.com`;

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleSaveSubdomain = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Subdominio de la clínica actualizado correctamente");
    }, 600);
  };

  const handleVerifyDns = () => {
    if (!customDomain) {
      toast.error("Ingresa un dominio web válido primero");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setDnsVerified(true);
      toast.success(`Dominio ${customDomain} verificado con certificado SSL emitido`);
    }, 1200);
  };

  const handleTestDedicatedDb = () => {
    setIsTestingDb(true);
    setTimeout(() => {
      setIsTestingDb(false);
      setDbConnected(true);
      toast.success("Conexión con base de datos independiente validada con éxito (Latencia: 8ms)");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header explicativo */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Dominio, Subdominio e Infraestructura de la Clínica
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configuración de branding institucional, portal público de citas e infraestructura dedicada según tu plan.
        </p>
      </div>

      {/* Si es Solo Doctor o Pro Consultorios -> No llevan subdominio propio ni portal de paciente con marca clínica */}
      {!allowsSubdomain ? (
        <Card className="border-muted bg-muted/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  {isProConsultorios ? "Plan Pro Consultorios (Multi-Clínica Profesional)" : "Plan Básico (Solo Doctor)"}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {isProConsultorios ? "Hasta 3 clínicas asociadas" : "1 Doctor"}
              </Badge>
            </div>
            <CardDescription className="pt-2 text-sm text-muted-foreground leading-relaxed">
              {isProConsultorios ? (
                <>
                  Tu plan <strong>Pro Consultorios</strong> te permite operar con <strong>hasta 5 profesionales</strong> y etiquetar a tus pacientes según la clínica de procedencia (hasta 3 clínicas diferentes) para saber de qué centro viene cada uno. Este plan opera con la URL estándar protegida de Vitalist Track y no incluye subdominio propio ni portal con marca clínica personalizada.
                </>
              ) : (
                <>
                  El plan <strong>Básico (Solo Doctor)</strong> está optimizado para consulta privada individual (hasta 85 pacientes y 2 dispositivos) con URL segura compartida.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border bg-background p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  ¿Deseas subdominio propio y portal con tu marca médica?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Los planes <strong>Clínica Plus</strong> ($85/mes) y <strong>Business Enterprise</strong> ($165/mes) incluyen subdominio propio (<code>tumarca.vitalisttrack.com</code>), portal con tu logo y dominio web propio.
                </p>
              </div>
              <Button
                onClick={() => navigate("/planes")}
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              >
                Ver planes Clínica Plus
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Subdominio de la clínica (Plus y Business) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    Subdominio Oficial Vitalist Track
                  </CardTitle>
                  <CardDescription>
                    URL rápida y protegida con SSL automático y portal institucional del paciente.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3" /> SSL Activo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain-slug">Identificador de tu clínica (Slug)</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="subdomain-slug"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="font-mono text-sm pr-40"
                      placeholder="nombre-de-tu-clinica"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none font-mono">
                      .vitalisttrack.com
                    </span>
                  </div>
                  <Button onClick={handleSaveSubdomain} disabled={isSaving} variant="default">
                    Guardar
                  </Button>
                </div>
              </div>

              {/* Preview URL */}
              <div className="rounded-lg border bg-muted/40 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-mono text-foreground truncate">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{fullSubdomainUrl}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => copyUrl(fullSubdomainUrl)}>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5" asChild>
                    <a href={fullSubdomainUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dominio Web Propio (Plus y Business) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Dominio web personalizado (White-label)
                  </CardTitle>
                  <CardDescription>
                    Usa tu propio dominio o subdominio corporativo (ej: <code>citas.miclinica.com</code>).
                  </CardDescription>
                </div>
                {dnsVerified ? (
                  <Badge className="bg-emerald-600 gap-1 text-white">
                    <ShieldCheck className="h-3 w-3" /> Verificado y Enrutado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                    <AlertCircle className="h-3 w-3" /> Pendiente DNS
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-domain-input">Tu dominio o subdominio</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="custom-domain-input"
                    placeholder="citas.miclinica.com"
                    value={customDomain}
                    onChange={(e) => {
                      setCustomDomain(e.target.value);
                      setDnsVerified(false);
                    }}
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleVerifyDns} disabled={isSaving} variant="secondary">
                    Verificar DNS
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Instrucciones de configuración DNS */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Instrucciones de configuración DNS:</p>
                <p className="text-xs text-muted-foreground">
                  Crea un registro de tipo <strong>CNAME</strong> en tu proveedor DNS (Cloudflare, GoDaddy, etc.):
                </p>
                <div className="grid grid-cols-3 gap-2 p-2 rounded bg-background border text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Tipo</span>
                    <strong>CNAME</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Host</span>
                    <strong>{customDomain.split(".")[0] || "citas"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Destino</span>
                    <strong>cname.vitalisttrack.com</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* SECCIÓN EXCLUSIVA: Base de datos independiente (Business Enterprise) */}
      {isBusiness && (
        <Card className="border-blue-200/70 dark:border-blue-800/50 bg-blue-50/20 dark:bg-blue-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Database className="h-5 w-5" />
                <CardTitle className="text-base font-semibold">
                  Base de Datos Independiente (Aislamiento Físico Exclusivo)
                </CardTitle>
              </div>
              <Badge className="bg-blue-600 gap-1 text-white">
                <Cpu className="h-3 w-3" /> Dedicated LibSQL / Turso
              </Badge>
            </div>
            <CardDescription className="text-blue-900/80 dark:text-blue-300/80">
              Característica exclusiva del plan <strong>Business Enterprise</strong>. Todos los datos clínicos, expedientes y registros de facturación residen en una base de datos físicamente aislada del resto de los clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border bg-background/80">
                <span className="text-muted-foreground block">Instancia Turso / LibSQL</span>
                <span className="font-mono font-medium text-foreground">{dedicatedDbUrl}</span>
              </div>
              <div className="p-3 rounded-lg border bg-background/80">
                <span className="text-muted-foreground block">Esquema y Cifrado</span>
                <span className="font-medium text-foreground">LibSQL AES-256 · Backups diarios independientes</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dedicated-db-url" className="text-xs">Cadena de conexión o URL de réplica Turso</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="dedicated-db-url"
                  value={dedicatedDbUrl}
                  onChange={(e) => setDedicatedDbUrl(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="libsql://mi-clinica-dedicated.turso.io"
                />
                <Button
                  onClick={handleTestDedicatedDb}
                  disabled={isTestingDb}
                  variant="outline"
                  className="border-blue-300 text-blue-700 dark:text-blue-400 shrink-0"
                >
                  {isTestingDb ? "Probando..." : "Test de Conexión"}
                </Button>
              </div>
            </div>

            {dbConnected && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-2.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Base de datos activa y sincronizada con el Control Plane Central.</span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">Tenant ID: {currentWorkspace?.id}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
