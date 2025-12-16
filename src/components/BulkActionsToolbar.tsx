import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, CheckSquare, UserPlus, Calendar, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type BulkActionType = 
  | "assign_professional"
  | "change_status"
  | "schedule_call"
  | "schedule_visit"
  | "cancel"
  | "delete";

interface BulkAction {
  type: BulkActionType;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "outline";
  requiresValue?: boolean;
  options?: { value: string; label: string }[];
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAction: (action: BulkActionType, value?: string) => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onAction,
  actions,
  className,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
      "bg-card border shadow-lg rounded-lg p-3",
      "flex items-center gap-3 flex-wrap justify-center",
      "animate-in slide-in-from-bottom-4 duration-200",
      className
    )}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span>{selectedCount} seleccionado{selectedCount > 1 ? "s" : ""}</span>
      </div>
      
      <div className="h-4 w-px bg-border" />
      
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action) => {
          if (action.requiresValue && action.options) {
            return (
              <Select
                key={action.type}
                onValueChange={(value) => onAction(action.type, value)}
              >
                <SelectTrigger className="w-auto h-8 text-xs">
                  <div className="flex items-center gap-1.5">
                    {action.icon}
                    <span>{action.label}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {action.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          return (
            <Button
              key={action.type}
              size="sm"
              variant={action.variant || "outline"}
              onClick={() => onAction(action.type)}
              className="h-8 text-xs"
            >
              {action.icon}
              <span className="ml-1.5">{action.label}</span>
            </Button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-border" />
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        className="h-8 text-xs"
      >
        <X className="h-3 w-3 mr-1" />
        Cancelar
      </Button>
    </div>
  );
}

// Pre-defined action configurations
export const PACIENTE_BULK_ACTIONS = (professionals: { id: string; nombre: string; apellido: string }[]): BulkAction[] => [
  {
    type: "assign_professional",
    label: "Asignar Profesional",
    icon: <UserPlus className="h-3.5 w-3.5" />,
    requiresValue: true,
    options: professionals.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido}` })),
  },
  {
    type: "change_status",
    label: "Cambiar Estado",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    requiresValue: true,
    options: [
      { value: "activo", label: "Activo" },
      { value: "inactivo", label: "Inactivo" },
    ],
  },
];

export const LLAMADA_BULK_ACTIONS = (professionals: { id: string; nombre: string; apellido: string }[]): BulkAction[] => [
  {
    type: "assign_professional",
    label: "Reasignar",
    icon: <UserPlus className="h-3.5 w-3.5" />,
    requiresValue: true,
    options: professionals.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido}` })),
  },
  {
    type: "change_status",
    label: "Estado",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    requiresValue: true,
    options: [
      { value: "cancelada", label: "Cancelar" },
      { value: "realizada", label: "Marcar Realizada" },
    ],
  },
];

export const VISITA_BULK_ACTIONS = (professionals: { id: string; nombre: string; apellido: string }[]): BulkAction[] => [
  {
    type: "assign_professional",
    label: "Reasignar",
    icon: <UserPlus className="h-3.5 w-3.5" />,
    requiresValue: true,
    options: professionals.map(p => ({ value: p.id, label: `${p.nombre} ${p.apellido}` })),
  },
  {
    type: "change_status",
    label: "Estado",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
    requiresValue: true,
    options: [
      { value: "cancelada", label: "Cancelar" },
      { value: "realizada", label: "Marcar Realizada" },
    ],
  },
];
