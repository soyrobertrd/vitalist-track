import { cn } from "@/lib/utils";

export type Cara = "oclusal" | "mesial" | "distal" | "vestibular" | "lingual" | "palatina" | "incisal";
export interface HallazgoDiente {
  id: string;
  tipo: string;
  cara: Cara | null;
  estado: string;
}

/** Color por tipo de hallazgo, sobre tokens del tema (claro/oscuro y verticales). */
export const COLOR_HALLAZGO: Record<string, { fill: string; label: string }> = {
  caries: { fill: "hsl(var(--destructive))", label: "Caries" },
  fractura: { fill: "hsl(var(--chart-4))", label: "Fractura" },
  obturacion: { fill: "hsl(var(--primary))", label: "Obturación" },
  sellante: { fill: "hsl(var(--success))", label: "Sellante" },
  endodoncia: { fill: "hsl(var(--chart-5))", label: "Endodoncia" },
  corona: { fill: "hsl(var(--warning))", label: "Corona" },
  implante: { fill: "hsl(var(--chart-3))", label: "Implante" },
  protesis: { fill: "hsl(var(--chart-2))", label: "Prótesis" },
  movilidad: { fill: "hsl(var(--chart-5))", label: "Movilidad" },
  ausente: { fill: "hsl(var(--muted-foreground))", label: "Ausente" },
};

type Forma = "molar" | "premolar" | "canino" | "incisivo";
const forma = (n: number): Forma => {
  const p = n % 10;
  return p >= 6 ? "molar" : p >= 4 ? "premolar" : p === 3 ? "canino" : "incisivo";
};

// Siluetas simples de corona + raíz (viewBox 40x60, corona arriba, raíz abajo). Se reflejan para el maxilar superior.
const SILUETA: Record<Forma, string> = {
  molar: "M6 4 Q20 0 34 4 Q37 14 33 22 L31 56 Q28 58 26 50 L22 34 Q20 30 18 34 L14 50 Q12 58 9 56 L7 22 Q3 14 6 4Z",
  premolar: "M9 4 Q20 0 31 4 Q34 14 29 22 L24 56 Q20 59 16 56 L11 22 Q6 14 9 4Z",
  canino: "M12 6 Q20 -2 28 6 Q31 15 27 22 L23 57 Q20 60 17 57 L13 22 Q9 15 12 6Z",
  incisivo: "M11 3 L29 3 Q31 14 27 22 L23 56 Q20 59 17 56 L13 22 Q9 14 11 3Z",
};

interface DientePiezaProps {
  numero: number;
  superior: boolean;
  hallazgos: HallazgoDiente[];
  seleccionado: boolean;
  caraSeleccionada: Cara | null;
  onSeleccionar: (numero: number, cara: Cara | null) => void;
}

/**
 * Pieza dental: silueta anatómica + diagrama de 5 caras clicable (estilo odontograma clínico).
 * Mesial apunta a la línea media: cuadrantes 1 y 4 a la derecha del diagrama, 2 y 3 a la izquierda.
 */
export function DientePieza({ numero, superior, hallazgos, seleccionado, caraSeleccionada, onSeleccionar }: DientePiezaProps) {
  const f = forma(numero);
  const cuadrante = Math.floor(numero / 10);
  const mesialDerecha = cuadrante === 1 || cuadrante === 4;
  const anterior = f === "incisivo" || f === "canino";
  const centro: Cara = anterior ? "incisal" : "oclusal";
  const interna: Cara = superior ? "palatina" : "lingual";

  const ausente = hallazgos.some((h) => h.tipo === "ausente");
  const general = hallazgos.find((h) => !h.cara && h.tipo !== "ausente");
  const colorCara = (c: Cara) => {
    const h = hallazgos.find((x) => x.cara === c);
    return h ? COLOR_HALLAZGO[h.tipo]?.fill : undefined;
  };

  // Diagrama 5 caras (viewBox 30x30): arriba = vestibular en superiores / lingual en inferiores, como se ve en boca.
  const arriba: Cara = superior ? "vestibular" : interna;
  const abajo: Cara = superior ? interna : "vestibular";
  const izquierda: Cara = mesialDerecha ? "distal" : "mesial";
  const derecha: Cara = mesialDerecha ? "mesial" : "distal";
  const caras: { cara: Cara; d: string }[] = [
    { cara: arriba, d: "M1 1 L29 1 L21 9 L9 9Z" },
    { cara: abajo, d: "M9 21 L21 21 L29 29 L1 29Z" },
    { cara: izquierda, d: "M1 1 L9 9 L9 21 L1 29Z" },
    { cara: derecha, d: "M29 1 L29 29 L21 21 L21 9Z" },
    { cara: centro, d: "M9 9 L21 9 L21 21 L9 21Z" },
  ];

  const resumen = hallazgos.length
    ? hallazgos.map((h) => `${COLOR_HALLAZGO[h.tipo]?.label ?? h.tipo}${h.cara ? ` (${h.cara})` : ""}`).join(", ")
    : "Sano";

  const silueta = (
    <button
      type="button"
      onClick={() => onSeleccionar(numero, null)}
      aria-label={`Diente ${numero}: ${resumen}`}
      aria-pressed={seleccionado && !caraSeleccionada}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <svg viewBox="0 0 40 60" className={cn("h-14 w-9", superior && "rotate-180")} aria-hidden="true">
        <path
          d={SILUETA[f]}
          fill={general ? COLOR_HALLAZGO[general.tipo]?.fill : seleccionado ? "hsl(var(--primary) / 0.15)" : "hsl(var(--destructive) / 0.08)"}
          fillOpacity={general ? 0.55 : 1}
          stroke={seleccionado ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.6)"}
          strokeWidth={seleccionado ? 2 : 1.2}
          opacity={ausente ? 0.25 : 1}
        />
        {ausente && <path d="M6 6 L34 54 M34 6 L6 54" stroke="hsl(var(--destructive))" strokeWidth="2.5" strokeLinecap="round" />}
      </svg>
    </button>
  );

  const diagrama = (
    <svg viewBox="0 0 30 30" className="h-7 w-7" role="group" aria-label={`Caras del diente ${numero}`}>
      {caras.map(({ cara, d }) => {
        const activa = seleccionado && caraSeleccionada === cara;
        return (
          <path
            key={cara}
            d={d}
            role="button"
            tabIndex={0}
            aria-label={`Diente ${numero}, cara ${cara}`}
            aria-pressed={activa}
            onClick={() => onSeleccionar(numero, cara)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSeleccionar(numero, cara); } }}
            fill={colorCara(cara) ?? (activa ? "hsl(var(--primary) / 0.25)" : "hsl(var(--card))")}
            stroke={activa ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.7)"}
            strokeWidth={activa ? 1.6 : 0.9}
            className="cursor-pointer outline-none transition-[fill] hover:fill-[hsl(var(--primary)/0.15)] focus-visible:stroke-[hsl(var(--ring))]"
          />
        );
      })}
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-1">
      {superior && (
        <span className={cn("text-xs font-medium tabular-nums", seleccionado ? "text-primary" : "text-muted-foreground")}>{numero}</span>
      )}
      {superior ? <>{silueta}{diagrama}</> : <>{diagrama}{silueta}</>}
      {!superior && (
        <span className={cn("text-xs font-medium tabular-nums", seleccionado ? "text-primary" : "text-muted-foreground")}>{numero}</span>
      )}
    </div>
  );
}
