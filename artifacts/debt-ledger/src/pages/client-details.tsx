import * as React from "react";
import { 
  useGetClient, 
  useListClientTransactions, 
  useUpdateClient,
  useDeleteClient,
  useGetCurrentUser,
  getGetClientQueryKey,
  getListClientsQueryKey,
  getListClientTransactionsQueryKey
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
import { ArrowLeft, Edit, Trash2, FileText, Calendar, Building, Phone, User, Activity } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const clientSchema = z.object({
  name: z.string().min(1, "Ism kiritish majburiy"),
  territory: z.string().min(1, "Hudud kiritish majburiy"),
  phone: z.string().optional(),
  responsiblePerson: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const [, setLocation] = useLocation();
  
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: currentUser } = useGetCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const { data: client, isLoading: isClientLoading, isError } = useGetClient(clientId, {
    query: { enabled: !!clientId, queryKey: getGetClientQueryKey(clientId) }
  });
  
  const { data: transactions, isLoading: isTxLoading } = useListClientTransactions(clientId, {
    query: { enabled: !!clientId, queryKey: getListClientTransactionsQueryKey(clientId) }
  });

  const updateClient = useUpdateClient({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetClientQueryKey(clientId), data);
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setIsEditModalOpen(false);
        toast({ title: "Muvaffaqiyatli!", description: "Klient ma'lumotlari yangilandi." });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Xatolik!", description: "Yangilashda xatolik." });
      }
    }
  });

  const deleteClient = useDeleteClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        toast({ title: "Muvaffaqiyatli!", description: "Klient o'chirildi." });
        setLocation("/clients");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Xatolik!", description: "O'chirishda xatolik." });
      }
    }
  });

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", territory: "", phone: "", responsiblePerson: "" },
  });

  // Pre-fill form when client data loads
  React.useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        territory: client.territory,
        phone: client.phone || "",
        responsiblePerson: client.responsiblePerson || "",
      });
    }
  }, [client, form]);

  if (isError) {
    return (
      <div className="p-8 text-center bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
        Mijoz topilmadi yoki yuklashda xatolik yuz berdi.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mijoz kartochkasi</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" asChild className="gap-2">
            <Link href={`/akt-sverka?clientId=${clientId}`}>
              <FileText className="h-4 w-4" /> Akt Sverka
            </Link>
          </Button>

          {isAdmin && (
            <>
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" /> Tahrirlash
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Klient ma'lumotlarini tahrirlash</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => updateClient.mutate({ id: clientId, data }))} className="space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Kompaniya / F.I.Sh</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="territory" render={({ field }) => (
                        <FormItem><FormLabel>Hudud</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="responsiblePerson" render={({ field }) => (
                        <FormItem><FormLabel>Mas'ul shaxs</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={updateClient.isPending}>
                          {updateClient.isPending ? "Saqlanmoqda..." : "Saqlash"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" /> O'chirish
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mijozni o'chirishni tasdiqlaysizmi?</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">Bu amalni ortga qaytarib bo'lmaydi. Barcha tegishli tranzaksiyalar o'chirilishi mumkin.</div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Bekor qilish</Button></DialogClose>
                    <Button variant="destructive" onClick={() => deleteClient.mutate({ id: clientId })} disabled={deleteClient.isPending}>
                      O'chirish
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Mijoz ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isClientLoading ? (
               <div className="space-y-3"><Skeleton className="h-5 w-full"/><Skeleton className="h-5 w-3/4"/></div>
            ) : client && (
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> Nomi
                  </div>
                  <div className="font-semibold text-base">{client.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> Hududi
                  </div>
                  <div>{client.territory}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Telefon
                  </div>
                  <div>{client.phone || "Kiritilmagan"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Mas'ul
                  </div>
                  <div>{client.responsiblePerson || "Kiritilmagan"}</div>
                </div>
                <div className="col-span-2 pt-2 border-t mt-2">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Joriy Balans</div>
                  <div className={`text-2xl font-bold ${client.balance > 0 ? 'text-success' : client.balance < 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(client.balance)}
                    {client.balance > 0 ? " (Biz qarzdormiz / Haqdor)" : client.balance < 0 ? " (Ular qarzdor)" : ""}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Operatsiyalar tarixi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Sana</TableHead>
                  <TableHead>Turi</TableHead>
                  <TableHead>To'lov usuli</TableHead>
                  <TableHead>Mas'ul shaxs</TableHead>
                  <TableHead className="w-[30%]">Izoh</TableHead>
                  <TableHead className="text-right">Summa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTxLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24"><Skeleton className="h-6 w-full max-w-sm mx-auto"/></TableCell></TableRow>
                ) : transactions?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Hech qanday operatsiya topilmadi</TableCell></TableRow>
                ) : (
                  transactions?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDateTime(tx.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'income' ? 'default' : 'destructive'} className={tx.type === 'income' ? 'bg-success hover:bg-success/90' : ''}>
                          {tx.type === 'income' ? 'Kirim' : 'Chiqim'}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {tx.paymentType === 'cash' ? 'Naqd' : tx.paymentType === 'card' ? 'Plastik karta' : 'Bank o\'tkazmasi'}
                      </TableCell>
                      <TableCell>{tx.responsiblePerson}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={tx.comment || ""}>
                        {tx.comment || "—"}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
