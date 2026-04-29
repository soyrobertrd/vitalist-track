import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Cie10Codigo {
  id: string;
  codigo: string;
  descripcion: string;
  capitulo: string | null;
  categoria: string | null;
}

interface Props {
  value?: { codigo: string; descripcion: string } | null;
  onSelect: (c: Cie10Codigo) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function Cie10Buscador({ value, onSelect, onClear, placeholder = "Buscar código o diagnóstico...", className }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Cie10Codigo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const term = query.trim();
      const { data } = await supabase
        .from("cie10_codigos")
        .select("id, codigo, descripcion, capitulo, categoria")
        .eq("activo", true)
        .or(`codigo.ilike.${term}%,descripcion.ilike.%${term}%`)
        .order("codigo")
        .limit(20);
      setResults((data as any) || []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      {value?.codigo ? (
        <div className="flex items-center gap-2 rounded-md border border-input bg-background p-2">
          <Badge variant="secondary" className="font-mono">{value.codigo}</Badge>
          <span className="text-sm flex-1 truncate">{value.descripcion}</span>
          <button
            type="button"
            onClick={() => { onClear?.(); setQuery(""); }}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Quitar diagnóstico"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="pl-8"
            />
            {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {open && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-md border bg-popover shadow-lg">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { onSelect(r); setOpen(false); setQuery(""); }}
                  className="flex w-full items-start gap-2 p-2 text-left hover:bg-accent transition-colors"
                >
                  <Badge variant="outline" className="font-mono shrink-0">{r.codigo}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{r.descripcion}</div>
                    {r.categoria && <div className="text-xs text-muted-foreground">{r.capitulo} · {r.categoria}</div>}
                  </div>
                  <Check className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
          {open && query.length >= 2 && !loading && results.length === 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
              Sin resultados para "{query}"
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Cie10Buscador;
