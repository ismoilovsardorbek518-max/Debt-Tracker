import * as React from "react";
import { 
  useListTransactions, 
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useListClients,
  exportTransactions,
  useGetCurrentUser,
  getListTransactionsQueryKey,
  TransactionType,
  PaymentType
} from "@workspace/api-client-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Download, Plus, CalendarIcon, Edit, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const transactionSchema = z.object({
  clientId: z.number({ required_error: "Mijozni tanlang" }),
  type: z.enum(["income", "expense"] as const),
  amount: z.coerce.number().positive("Summa 0 dan katta bo'lishi kerak"),
  date: z.string(),
  paymentType: z.enum(["cash", "card", "transfer"] as const),
  responsiblePerson: z.string().min(1, "Mas'ul shaxsni kiriting"),
  comment: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [paymentType, setPaymentType] = React.useState<PaymentType | "all">("all");
  const [type, setType] = React.useState<TransactionType | "all">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  
  const [editId, setEditId] = React.useState<number | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetCurrentUser();
  const isAdmin = user?.role === "admin";

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = {
    search: debouncedSearch || undefined,
    paymentType: paymentType === "all" ? undefined : paymentType,
    // Add custom type filter logic if API supports it, assuming it searches globally for now
  };

  const { data: transactions, isLoading } = useListTransactions(queryParams);
  const { data: clients } = useListClients();
  
  const createTx = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        // Also invalidate clients and dashboard to reflect balance updates
        queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        setIsCreateModalOpen(false);
        form.reset();
        toast({ title: "Muvaffaqiyatli!", description: "Operatsiya qo'shildi." });
      },
      onError: () => toast({ variant: "destructive", title: "Xatolik!" })
    }
  });

  const updateTx = useUpdateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        setEditId(null);
        toast({ title: "Muvaffaqiyatli!", description: "Operatsiya tahrirlandi." });
      },
      onError: () => toast({ variant: "destructive", title: "Xatolik!" })
    }
  });

  const deleteTx = useDeleteTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        setDeleteId(null);
        toast({ title: "Muvaffaqiyatli!", description: "Operatsiya o'chirildi." });
      },
      onError: () => toast({ variant: "destructive", title: "Xatolik!" })
    }
  });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "income",
      amount: 0,
      date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
      paymentType: "cash",
      responsiblePerson: "",
      comment: "",
    },
  });

  function onSubmit(data: TransactionFormValues) {
    if (editId) {
      updateTx.mutate({ id: editId, data });
    } else {
      createTx.mutate({ data });
    }
  }

  const handleExport = async () => {
    try {
      const blob = await exportTransactions(queryParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Operatsiyalar_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ variant: "destructive", title: "Xatolik" });
    }
  };

  const openEdit = (tx: any) => {
    form.reset({
      clientId: tx.clientId,
      type: tx.type,
      amount: tx.amount,
      date: tx.date.split('T')[0],
      paymentType: tx.paymentType,
      responsiblePerson: tx.responsiblePerson,
      comment: tx.comment || "",
    });
    setEditId(tx.id);
  };

  // Client combobox component
  const ClientCombobox = ({ field }: any) => {
    const [open, setOpen] = React.useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
              {field.value ? clients?.find((c) => c.id === field.value)?.name : "Mijozni tanlang"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Mijozni izlash..." />
            <CommandList>
              <CommandEmpty>Mijoz topilmadi.</CommandEmpty>
              <CommandGroup>
                {clients?.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => {
                      field.onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", c.id === field.value ? "opacity-100" : "opacity-0")} />
                    {c.name} ({c.territory})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const isModalOpen = isCreateModalOpen || editId !== null;
  const onModalChange = (open: boolean) => {
    if (!open) {
      setIsCreateModalOpen(false);
      setEditId(null);
      form.reset({
        type: "income",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentType: "cash",
        responsiblePerson: "",
        comment: "",
      });
    } else {
      setIsCreateModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operatsiyalar</h1>
          <p className="text-muted-foreground mt-1">Kirim va chiqimlar tarixi.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Eksport
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={onModalChange}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Yangi operatsiya
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editId ? "Operatsiyani tahrirlash" : "Yangi operatsiya"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="clientId" render={({ field }) => (
                    <FormItem><FormLabel>Mijoz</FormLabel><ClientCombobox field={field} /><FormMessage /></FormItem>
                  )}/>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="income">Kirim (+)</SelectItem>
                            <SelectItem value="expense">Chiqim (-)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem><FormLabel>Summa</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="paymentType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>To'lov usuli</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Naqd</SelectItem>
                            <SelectItem value="card">Plastik karta</SelectItem>
                            <SelectItem value="transfer">Bank o'tkazmasi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem><FormLabel>Sana</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>

                  <FormField control={form.control} name="responsiblePerson" render={({ field }) => (
                    <FormItem><FormLabel>Mas'ul shaxs</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="comment" render={({ field }) => (
                    <FormItem><FormLabel>Izoh (ixtiyoriy)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createTx.isPending || updateTx.isPending}>
                      {createTx.isPending || updateTx.isPending ? "Saqlanmoqda..." : "Saqlash"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Mijoz izlash..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="w-[180px]">
          <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
            <SelectTrigger><SelectValue placeholder="To'lov usuli" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="cash">Naqd</SelectItem>
              <SelectItem value="card">Plastik karta</SelectItem>
              <SelectItem value="transfer">Bank o'tkazmasi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger><SelectValue placeholder="Turi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="income">Kirim</SelectItem>
              <SelectItem value="expense">Chiqim</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Sana</TableHead>
              <TableHead>Mijoz</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>To'lov usuli</TableHead>
              <TableHead>Mas'ul shaxs</TableHead>
              {isAdmin && <TableHead className="w-[100px] text-right">Amallar</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: isAdmin ? 7 : 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : transactions?.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 7 : 6} className="text-center h-32 text-muted-foreground">Hech qanday operatsiya topilmadi</TableCell></TableRow>
            ) : (
              transactions?.filter(tx => type === 'all' || tx.type === type).map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap font-medium text-sm">
                    {formatDateTime(tx.date)}
                  </TableCell>
                  <TableCell className="font-medium">{tx.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={tx.type === 'income' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                      {tx.type === 'income' ? 'Kirim' : 'Chiqim'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {tx.paymentType === 'cash' ? 'Naqd' : tx.paymentType === 'card' ? 'Karta' : 'O\'tkazma'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.responsiblePerson}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(tx)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(tx.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isAdmin && (
        <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Operatsiyani o'chirish</DialogTitle></DialogHeader>
            <div className="py-4">Bu amalni ortga qaytarib bo'lmaydi. Ishonchingiz komilmi?</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Bekor qilish</Button>
              <Button variant="destructive" onClick={() => deleteId && deleteTx.mutate({ id: deleteId })} disabled={deleteTx.isPending}>
                O'chirish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
