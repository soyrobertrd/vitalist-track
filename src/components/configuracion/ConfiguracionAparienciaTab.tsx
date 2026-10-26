import { GlassCard } from "@/components/GlassCard";

interface ConfiguracionAparienciaTabProps {
  theme: "light" | "dark" | "standard";
  setTheme: (theme: "light" | "dark" | "standard") => void;
}

export function ConfiguracionAparienciaTab({
  theme,
  setTheme,
}: ConfiguracionAparienciaTabProps) {
  return (
    <GlassCard className="p-6 space-y-6 shadow-none">
      <div>
        <h2 className="text-2xl font-bold mb-2">Interfaz y Productividad</h2>
        <p className="text-muted-foreground">Personaliza tu experiencia visual de trabajo</p>
      </div>
      <div>
        <h3 className="font-medium mb-4">Tema de la Aplicación</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 border-2 rounded-lg transition-colors text-left ${
              theme === "light" ? "border-primary" : "border-border"
            }`}
          >
            <div className="bg-white rounded-md p-4 mb-2 border">
              <div className="space-y-2">
                <div className="h-2 bg-slate-300 rounded" />
                <div className="h-2 bg-slate-300 rounded w-2/3" />
              </div>
            </div>
            <p className="text-sm font-medium">Claro</p>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 border-2 rounded-lg transition-colors text-left ${
              theme === "dark" ? "border-primary" : "border-border"
            }`}
          >
            <div className="bg-slate-900 rounded-md p-4 mb-2 border border-slate-800">
              <div className="space-y-2">
                <div className="h-2 bg-slate-700 rounded" />
                <div className="h-2 bg-slate-700 rounded w-2/3" />
              </div>
            </div>
            <p className="text-sm font-medium">Oscuro</p>
          </button>

          <button
            type="button"
            onClick={() => setTheme("standard")}
            className={`p-4 border-2 rounded-lg transition-colors text-left ${
              theme === "standard" ? "border-primary" : "border-border"
            }`}
          >
            <div className="rounded-md overflow-hidden mb-2 border">
              <div className="bg-slate-900 h-8" />
              <div className="bg-white p-2">
                <div className="space-y-1">
                  <div className="h-1 bg-slate-300 rounded" />
                  <div className="h-1 bg-slate-300 rounded w-2/3" />
                </div>
              </div>
            </div>
            <p className="text-sm font-medium">Estándar</p>
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
