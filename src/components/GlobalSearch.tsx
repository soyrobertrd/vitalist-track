import { useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, User, Calendar, Phone, Stethoscope, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function GlobalSearch() {
  const { query, setQuery, results, isSearching, isOpen, setIsOpen, clearSearch } = useGlobalSearch();
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setIsOpen]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(result.url);
    clearSearch();
  }, [navigate, clearSearch]);

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "paciente":
        return <User className="h-4 w-4 text-primary" />;
      case "profesional":
        return <Stethoscope className="h-4 w-4 text-emerald-500" />;
      case "visita":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "llamada":
        return <Phone className="h-4 w-4 text-amber-500" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "paciente": return "Paciente";
      case "profesional": return "Profesional";
      case "visita": return "Visita";
      case "llamada": return "Llamada";
      default: return type;
    }
  };

  const getStatusBadge = (metadata: string | undefined, type: SearchResult["type"]) => {
    if (!metadata) return null;
    
    if (type === 'visita' || type === 'llamada') {
      const colors: Record<string, string> = {
        pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        agendada: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        realizada: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      };
      return (
        <Badge variant="secondary" className={cn("text-xs capitalize", colors[metadata] || "")}>
          {metadata}
        </Badge>
      );
    }
    
    // For pacientes - show location
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {metadata}
      </span>
    );
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeOrder: SearchResult["type"][] = ['paciente', 'profesional', 'visita', 'llamada'];

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput 
          placeholder="Buscar pacientes, profesionales, visitas, llamadas..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isSearching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Buscando...</span>
            </div>
          )}
          
          {!isSearching && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>
              <div className="flex flex-col items-center py-6">
                <Search className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">No se encontraron resultados para "{query}"</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            </CommandEmpty>
          )}

          {!isSearching && query.length < 2 && (
            <CommandEmpty>
              <div className="flex flex-col items-center py-6 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p>Escribe al menos 2 caracteres para buscar</p>
              </div>
            </CommandEmpty>
          )}

          {!isSearching && typeOrder.map((type) => {
            const items = groupedResults[type];
            if (!items || items.length === 0) return null;

            return (
              <CommandGroup key={type} heading={getTypeLabel(type) + "s"}>
                {items.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.title} ${result.subtitle}`}
                    onSelect={() => handleResultClick(result)}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{result.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                    {getStatusBadge(result.metadata, result.type)}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
