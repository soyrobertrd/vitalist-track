import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gift, Crown, Plus, CheckCircle2, Copy, Sparkles, CreditCard, Calendar, User, Heart } from "lucide-react";
import { toast } from "sonner";

export interface GiftCardSpa {
  id: string;
  codigo: string;
  comprador: string;
  beneficiario: string;
  montoInicial: number;
  saldoRestante: number;
  fechaEmision: string;
  fechaExpiracion: string;
  estado: "activa" | "canjeada" | "expirada";
}

export interface MembresiaVIP {
  id: string;
  clienteNombre: string;
  planNombre: string;
  cuotaMensual: number;
  serviciosMes: string;
  serviciosUsados: number;
  serviciosTotales: number;
  fechaRenovacion: string;
  estado: "activa" | "pausada";
}

const GIFT_CARDS_INICIALES: GiftCardSpa[] = [
  {
    id: "gc-1",
    codigo: "SPA-GIFT-5520",
    comprador: "Carlos Mendoza",
    beneficiario: "Laura Almonte",
    montoInicial: 6500,
    saldoRestante: 3000,
    fechaEmision: "15 Oct 2026",
    fechaExpiracion: "15 Ene 2027",
    estado: "activa",
  },
  {
    id: "gc-2",
    codigo: "SPA-RELAX-8812",
    comprador: "Empresas RD",
    beneficiario: "Yomaira Santos",
    montoInicial: 10000,
    saldoRestante: 10000,
    fechaEmision: "26 Oct 2026",
    fechaExpiracion: "26 Abr 2027",
    estado: "activa",
  },
];

const MEMBRESIAS_INICIALES: MembresiaVIP[] = [
  {
    id: "mem-1",
    clienteNombre: "Ana Patricia Cruz",
    planNombre: "Club Spa Relax Gold",
    cuotaMensual: 4500,
    serviciosMes: "2 Masajes Relajantes + 1 Hidratación Facial",
    serviciosUsados: 2,
    serviciosTotales: 3,
    fechaRenovacion: "05 Nov 2026",
    estado: "activa",
  },
  {
    id: "mem-2",
    clienteNombre: "Marcos De la Rosa",
    planNombre: "Club Maderoterapia & Silueta",
    cuotaMensual: 7500,
    serviciosMes: "4 Sesiones Maderoterapia + Presoterapia",
    serviciosUsados: 4,
    serviciosTotales: 4,
    fechaRenovacion: "01 Nov 2026",
    estado: "activa",
  },
];

export default function MembresiasGiftCardsSpa() {
  const [giftCards, setGiftCards] = useState<GiftCardSpa[]>(GIFT_CARDS_INICIALES);
  const [membresias, setMembresias] = useState<MembresiaVIP[]>(MEMBRESIAS_INICIALES);
  const [openModalGift, setOpenModalGift] = useState(false);
  const [openModalCanje, setOpenModalCanje] = useState(false);
  const [canjeCodigo, setCanjeCodigo] = useState("");
  const [canjeMonto, setCanjeMonto] = useState(1500);

  const [formGift, setFormGift] = useState({
    comprador: "",
    beneficiario: "",
    monto: 5000,
  });

  const handleCrearGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGift.beneficiario.trim()) {
      toast.error("El nombre del beneficiario es obligatorio");
      return;
    }
    const cod = `SPA-${Math.floor(1000 + Math.random() * 9000)}`;
    const nuevo: GiftCardSpa = {
      id: `gc-${Date.now()}`,
      codigo: cod,
      comprador: formGift.comprador || "Cliente Anónimo",
      beneficiario: formGift.beneficiario,
      montoInicial: Number(formGift.monto),
      saldoRestante: Number(formGift.monto),
      fechaEmision: new Date().toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }),
      fechaExpiracion: "En 90 días",
      estado: "activa",
    };
    setGiftCards([nuevo, ...giftCards]);
    toast.success(`Tarjeta de regalo ${cod} emitida con éxito`);
    setOpenModalGift(false);
    setFormGift({ comprador: "", beneficiario: "", monto: 5000 });
  };

  const handleCanjearGift = (e: React.FormEvent) => {
    e.preventDefault();
    const card = giftCards.find((g) => g.codigo.toUpperCase() === canjeCodigo.trim().toUpperCase());
    if (!card) {
      toast.error("Código de Gift Card no encontrado o inválido");
      return;
    }
    if (card.saldoRestante < canjeMonto) {
      toast.error(`Saldo insuficiente. Saldo disponible: $${card.saldoRestante.toLocaleString()}`);
      return;
    }

    const nuevoSaldo = card.saldoRestante - canjeMonto;
    setGiftCards((prev) =>
      prev.map((g) =>
        g.id === card.id
          ? {
              ...g,
              saldoRestante: nuevoSaldo,
              estado: nuevoSaldo === 0 ? "canjeada" : "activa",
            }
          : g
      )
    );
    toast.success(`Canje exitoso por $${canjeMonto.toLocaleString()}. Saldo restante: $${nuevoSaldo.toLocaleString()}`);
    setOpenModalCanje(false);
    setCanjeCodigo("");
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.info(`Código ${codigo} copiado al portapapeles`);
  };

  const totalRecaudadoGift = giftCards.reduce((acc, g) => acc + g.montoInicial, 0);
  const totalMembresiasMRR = membresias.reduce((acc, m) => acc + m.cuotaMensual, 0);

  return (
    <div className="space-y-6">
      {/* Header y KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-none col-span-1 md:col-span-2">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Tarjetas de Regalo (Gift Cards) & Membresías VIP
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Fidelización para centros de masajes, spas y medicina estética
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-center gap-2">
            <Dialog open={openModalGift} onOpenChange={setOpenModalGift}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl gap-1.5 shadow-none bg-pink-600 hover:bg-pink-700 text-white">
                  <Plus className="h-4 w-4" /> Emitir Gift Card
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Gift className="h-5 w-5 text-pink-500" />
                    Nueva Tarjeta de Regalo (Gift Card)
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCrearGift} className="space-y-3 pt-2 text-xs">
                  <div>
                    <Label className="text-xs">Nombre del Beneficiario (Quien la recibe)</Label>
                    <Input
                      placeholder="Ej. Laura Almonte"
                      value={formGift.beneficiario}
                      onChange={(e) => setFormGift({ ...formGift, beneficiario: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Comprador / Empresa</Label>
                    <Input
                      placeholder="Ej. Carlos Mendoza"
                      value={formGift.comprador}
                      onChange={(e) => setFormGift({ ...formGift, comprador: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Monto Inicial (DOP $)</Label>
                    <Input
                      type="number"
                      value={formGift.monto}
                      onChange={(e) => setFormGift({ ...formGift, monto: Number(e.target.value) })}
                      className="rounded-xl mt-1 h-8 text-xs font-semibold"
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl mt-2 bg-pink-600 hover:bg-pink-700 text-white">
                    Generar Código Digital
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={openModalCanje} onOpenChange={setOpenModalCanje}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 border-border/80 shadow-none">
                  <CreditCard className="h-4 w-4" /> Canjear en Caja
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Validación y Canje de Gift Card
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCanjearGift} className="space-y-3 pt-2 text-xs">
                  <div>
                    <Label className="text-xs">Código de Tarjeta de Regalo</Label>
                    <Input
                      placeholder="Ej. SPA-GIFT-5520"
                      value={canjeCodigo}
                      onChange={(e) => setCanjeCodigo(e.target.value)}
                      className="rounded-xl mt-1 h-8 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Monto a Consumir / Descontar (DOP $)</Label>
                    <Input
                      type="number"
                      value={canjeMonto}
                      onChange={(e) => setCanjeMonto(Number(e.target.value))}
                      className="rounded-xl mt-1 h-8 text-xs font-bold"
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                    Confirmar Descuento
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums leading-none">${totalRecaudadoGift.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Recaudado Gift Cards</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums leading-none text-purple-600 dark:text-purple-400">
                ${totalMembresiasMRR.toLocaleString()}/mes
              </p>
              <p className="text-xs text-muted-foreground mt-1">Ingresos Recurrentes (MRR)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Tablas: Gift Cards y Membresías VIP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla Gift Cards */}
        <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
          <div className="p-4 border-b border-border/70 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-pink-500" />
              Tarjetas de Regalo Emitidas
            </h3>
            <span className="text-xs text-muted-foreground">{giftCards.length} activas</span>
          </div>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs">Código</TableHead>
                <TableHead className="text-xs">Beneficiario</TableHead>
                <TableHead className="text-xs text-right">Saldo Disp.</TableHead>
                <TableHead className="text-xs">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {giftCards.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono font-semibold text-pink-600 dark:text-pink-400">
                      <span>{g.codigo}</span>
                      <button type="button" onClick={() => copiarCodigo(g.codigo)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="text-[10px] text-muted-foreground">De: {g.comprador}</div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{g.beneficiario}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    ${g.saldoRestante.toLocaleString()}
                    <span className="text-[10px] text-muted-foreground block font-normal">de ${g.montoInicial.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-md text-[10px] ${g.estado === "activa" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground"}`}>
                      {g.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Tabla Membresías VIP del Spa */}
        <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
          <div className="p-4 border-b border-border/70 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-600" />
              Suscripciones & Membresías VIP
            </h3>
            <span className="text-xs text-muted-foreground">{membresias.length} socios</span>
          </div>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs">Socio / Cliente</TableHead>
                <TableHead className="text-xs">Plan & Servicios</TableHead>
                <TableHead className="text-xs text-right">Cuota</TableHead>
                <TableHead className="text-xs text-center">Consumo Mes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {membresias.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{m.clienteNombre}</div>
                    <div className="text-[10px] text-muted-foreground">Renueva: {m.fechaRenovacion}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{m.planNombre}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{m.serviciosMes}</div>
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-purple-600 dark:text-purple-400">
                    ${m.cuotaMensual.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="rounded-md text-[10px] bg-secondary font-semibold">
                      {m.serviciosUsados}/{m.serviciosTotales} usados
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
