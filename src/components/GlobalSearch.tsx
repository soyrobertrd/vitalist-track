import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, User, Calendar, Phone, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const { query, setQuery, results, isSearching, isOpen, setIsOpen } = useGlobalSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setIsOpen]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "paciente":
        return <User className="h-4 w-4 text-primary" />;
      case "profesional":
        return <Stethoscope className="h-4 w-4 text-secondary" />;
      case "visita":
        return <Calendar className="h-4 w-4 text-accent" />;
      case "llamada":
        return <Phone className="h-4 w-4 text-warning" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar en todo el sistema... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 h-10 bg-card border-border"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto animate-fade-in">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Buscando...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{result.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-muted rounded">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No se encontraron resultados</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
