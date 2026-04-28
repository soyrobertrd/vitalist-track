/**
 * Widget para Dashboard: alertas de inventario.
 * Muestra ítems con bajo stock y lotes próximos a vencer.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, CalendarClock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useItemsBajoStock, useLotesProximosVencer } from "@/hooks/useInventario";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function InventarioAlertasWidget() {
  const { data: bajoStock = [] } = useItemsBajoStock();
  const { data: vencimientos = [] } = useLotesProximosVencer(60);

  if (bajoStock.length === 0 && vencimientos.length === 0) return null;

  return (
    <Card className="border-warning/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Alertas de inventario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bajoStock.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Package className="h-4 w-4" />
              Bajo stock
              <Badge variant="destructive" className="text-xs">{bajoStock.length}</Badge>
            </div>
            <ul className="space-y-1 text-sm">
              {bajoStock.slice(0, 5).map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span className="truncate">{i.nombre}</span>
                  <span className="text-muted-foreground">
                    {i.stock_actual} / {i.stock_minimo} {i.unidad_medida}
                  </span>
                </li>
              ))}
              {bajoStock.length > 5 && (
                <li className="text-xs text-muted-foreground">
                  +{bajoStock.length - 5} más…
                </li>
              )}
            </ul>
          </div>
        )}

        {vencimientos.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <CalendarClock className="h-4 w-4" />
              Próximos a vencer (60 días)
              <Badge className="bg-warning text-warning-foreground text-xs">{vencimientos.length}</Badge>
            </div>
            <ul className="space-y-1 text-sm">
              {vencimientos.slice(0, 5).map((l: any) => (
                <li key={l.id} className="flex justify-between">
                  <span className="truncate">
                    {l.inventario_items?.nombre} · Lote {l.numero_lote}
                  </span>
                  <span className="text-muted-foreground">
                    {l.fecha_vencimiento &&
                      format(new Date(l.fecha_vencimiento + "T12:00:00"), "PP", { locale: es })}
                  </span>
                </li>
              ))}
              {vencimientos.length > 5 && (
                <li className="text-xs text-muted-foreground">
                  +{vencimientos.length - 5} más…
                </li>
              )}
            </ul>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/inventario">
            Ir a inventario <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
