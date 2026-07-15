import * as React from "react";
import { 
  useGetAktSverka,
  useListClients,
  exportAktSverkaExcel,
  exportAktSverkaPdf,
  getGetAktSverkaQueryKey,
  GetAktSverkaParams
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Check, ChevronsUpDown, FileText, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AktSverkaPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialClientId = urlParams.get('clientId') ? Number(urlParams.get('clientId')) : null;

  const [clientId, setClientId] = React.useState<number | null>(initialClientId);
  const [dateFrom, setDateFrom] = React.useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [open, setOpen] = React.useState(false);

  const { toast } = useToast();
  const { data: clients } = useListClients();

  const aktSverkaParams: GetAktSverkaParams | null = clientId ? {
    clientId,
    from: dateFrom,
    to: dateTo
  } : null;

  const { data: result, isLoading, isError, isFetching } = useGetAktSverka(aktSverkaParams!, {
    query: { enabled: !!aktSverkaParams, queryKey: getGetAktSverkaQueryKey(aktSverkaParams ?? undefined) }
  });

  const handleExportExcel = async () => {
    if (!aktSverkaParams) return;
    try {
      const blob = await exportAktSverkaExcel(aktSverkaParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Akt_Sverka_${result?.clientName}_${dateFrom}_${dateTo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ variant: "destructive", title: "Xatolik", description: "Excel eksportida xatolik yuz berdi." });
    }
  };

  const handleExportPdf = async () => {
    if (!aktSverkaParams) return;
    try {
      const blob = await exportAktSverkaPdf(aktSverkaParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Akt_Sverka_${result?.clientName}_${dateFrom}_${dateTo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ variant: "destructive", title: "Xatolik", description: "PDF eksportida xatolik yuz berdi." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Akt Sverka</h1>
        <p className="text-muted-foreground mt-1">
          Mijoz bilan o'zaro hisob-kitoblar solishtirma dalolatnomasi.
        </p>
      </div>

      <Card className="bg-card shadow-sm border">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:flex-1 space-y-1.5">
              <label className="text-sm font-medium">Mijozni tanlang</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between bg-background", !clientId && "text-muted-foreground")}>
                    {clientId ? clients?.find((c) => c.id === clientId)?.name : "Mijoz izlash..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Mijoz nomi bo'yicha..." />
                    <CommandList>
                      <CommandEmpty>Mijoz topilmadi.</CommandEmpty>
                      <CommandGroup>
                        {clients?.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setClientId(c.id);
                              setOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", c.id === clientId ? "opacity-100" : "opacity-0")} />
                            {c.name} ({c.territory})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="w-full md:w-auto space-y-1.5">
              <label className="text-sm font-medium">Boshlanish sana</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-background"/>
            </div>
            <div className="w-full md:w-auto space-y-1.5">
              <label className="text-sm font-medium">Tugash sana</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-background"/>
            </div>
          </div>
        </CardContent>
      </Card>

      {!clientId ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg bg-card/50">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">Solishtirma dalolatnoma</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Natijani ko'rish uchun yuqoridan mijoz va sana oralig'ini tanlang.
          </p>
        </div>
      ) : isFetching || isLoading ? (
        <Card>
          <CardHeader className="border-b"><Skeleton className="h-6 w-48 mb-2"/><Skeleton className="h-4 w-32"/></CardHeader>
          <CardContent className="p-0">
             <div className="p-4 flex justify-between bg-muted/20 border-b"><Skeleton className="h-6 w-48"/><Skeleton className="h-6 w-32"/></div>
             {Array.from({length: 5}).map((_, i) => <div key={i} className="p-4 border-b flex justify-between"><Skeleton className="h-4 w-full mr-12"/></div>)}
          </CardContent>
        </Card>
      ) : isError || !result ? (
        <div className="p-8 text-center bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          Ma'lumotni yuklashda xatolik.
        </div>
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Akt Sverka: {result.clientName}</CardTitle>
              <CardDescription className="mt-1">
                Davr: {formatDate(result.periodStart)} – {formatDate(result.periodEnd)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 bg-background">
                <Download className="h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-2 bg-background">
                <Download className="h-4 w-4" /> PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card">
                    <TableHead>Sana</TableHead>
                    <TableHead>Hujjat/Izoh</TableHead>
                    <TableHead>To'lov/Mas'ul</TableHead>
                    <TableHead className="text-right">Debet (Kirim)</TableHead>
                    <TableHead className="text-right">Kredit (Chiqim)</TableHead>
                    <TableHead className="text-right">Qoldiq</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Boshlang'ich qoldiq */}
                  <TableRow className="bg-muted/20 font-medium">
                    <TableCell colSpan={3}>Davr boshiga qoldiq ({formatDate(result.periodStart)})</TableCell>
                    <TableCell className="text-right text-success">{result.openingBalance > 0 ? formatCurrency(result.openingBalance) : ""}</TableCell>
                    <TableCell className="text-right text-destructive">{result.openingBalance < 0 ? formatCurrency(Math.abs(result.openingBalance)) : ""}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(result.openingBalance)}</TableCell>
                  </TableRow>
                  
                  {/* Tranzaksiyalar */}
                  {result.rows.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center h-20 text-muted-foreground">Bu davrda tranzaksiyalar yo'q</TableCell></TableRow>
                  ) : (
                    result.rows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-sm">{formatDate(row.date)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm" title={row.comment || ""}>{row.comment || "—"}</TableCell>
                        <TableCell className="text-sm">
                          <div className="capitalize">{row.paymentType === 'cash' ? 'Naqd' : row.paymentType === 'card' ? 'Karta' : 'O\'tkazma'}</div>
                          <div className="text-xs text-muted-foreground">{row.responsiblePerson}</div>
                        </TableCell>
                        <TableCell className="text-right text-success">{row.debit > 0 ? formatCurrency(row.debit) : ""}</TableCell>
                        <TableCell className="text-right text-destructive">{row.credit > 0 ? formatCurrency(row.credit) : ""}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.balance)}</TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Yakuniy qoldiq */}
                  <TableRow className="bg-muted/30 font-bold border-t-2">
                    <TableCell colSpan={3}>Davr oxiriga qoldiq ({formatDate(result.periodEnd)})</TableCell>
                    <TableCell className="text-right text-success">{result.closingBalance > 0 ? formatCurrency(result.closingBalance) : ""}</TableCell>
                    <TableCell className="text-right text-destructive">{result.closingBalance < 0 ? formatCurrency(Math.abs(result.closingBalance)) : ""}</TableCell>
                    <TableCell className="text-right text-lg">{formatCurrency(result.closingBalance)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
