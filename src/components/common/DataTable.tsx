import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { EmptyState } from "./EmptyState";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (row: T) => React.ReactNode;
}

export interface FilterChipConfig {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterChips?: FilterChipConfig[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  title?: string;
  description?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Buscar registros...",
  filterChips = [],
  pageSize: initialPageSize = 10,
  emptyMessage = "No se encontraron registros.",
  onRowClick,
  actions,
  title,
  description,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filtrado de datos
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Filtro de búsqueda
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (searchKey) {
          const val = String(row[searchKey] || "").toLowerCase();
          if (!val.includes(query)) return false;
        } else {
          // Buscar en todas las propiedades del objeto si no se especifica searchKey
          const match = Object.values(row).some((val) =>
            String(val || "").toLowerCase().includes(query)
          );
          if (!match) return false;
        }
      }

      // Filtros de chips
      for (const filter of filterChips) {
        const activeVal = activeFilters[filter.key];
        if (activeVal && activeVal !== "all") {
          const rowVal = String(row[filter.key] ?? "");
          if (rowVal.toLowerCase() !== activeVal.toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, searchTerm, searchKey, activeFilters, filterChips]);

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB), "es", { numeric: true });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Manejar cambio de orden
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Encabezado opcional */}
      {(title || description) && (
        <div className="space-y-0.5">
          {title && <h3 className="text-base font-semibold">{title}</h3>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Barra de Búsqueda y Filtros en Chips */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 h-8 text-xs shadow-none border-border"
          />
        </div>

        {filterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filterChips.map((chip) => (
              <Select
                key={chip.key}
                value={activeFilters[chip.key] || "all"}
                onValueChange={(val) => handleFilterChange(chip.key, val)}
              >
                <SelectTrigger className="h-8 text-xs shadow-none w-auto min-w-[120px] bg-background">
                  <SelectValue placeholder={chip.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos ({chip.label})</SelectItem>
                  {chip.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </div>

      {/* Contenedor de Tabla Plano (Modo B) */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b border-border">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <TableHead
                    key={col.key}
                    className={`text-xs font-semibold text-muted-foreground h-9 px-3 ${
                      col.sortable ? "cursor-pointer select-none hover:text-foreground" : ""
                    } ${col.headerClassName || ""}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-muted-foreground/60">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
              {actions && <TableHead className="text-right text-xs font-semibold h-9 px-3">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-10"
                >
                  <EmptyState
                    icon={Inbox}
                    title={emptyMessage}
                    description="No hay información disponible que coincida con los filtros seleccionados."
                    className="border-none bg-transparent p-4"
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-border/50 transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-muted/40" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={`text-xs py-2.5 px-3 ${col.className || ""}`}>
                      {col.render ? col.render(row) : (row[col.key] ?? "—")}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación y Resumen */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-2 tabular-nums">
          <span>
            Mostrando {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} registros
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-7 w-16 text-xs shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span>por pág.</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="h-7 px-2 text-xs shadow-none gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </Button>
          <span className="tabular-nums px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-7 px-2 text-xs shadow-none gap-1"
          >
            Siguiente <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
