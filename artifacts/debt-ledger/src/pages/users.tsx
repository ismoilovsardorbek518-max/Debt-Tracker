import * as React from "react";
import { 
  useListUsers, 
  useUpdateUserRole,
  useGetCurrentUser,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, ShieldAlert, User, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Redirect } from "wouter";

export default function UsersPage() {
  const { data: currentUser } = useGetCurrentUser();
  const { data: users, isLoading } = useListUsers({
    query: { enabled: currentUser?.role === "admin", queryKey: getListUsersQueryKey() }
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRole = useUpdateUserRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Muvaffaqiyatli!", description: "Foydalanuvchi roli o'zgartirildi." });
      },
      onError: () => toast({ variant: "destructive", title: "Xatolik!", description: "Rolni o'zgartirishda xatolik yuz berdi." })
    }
  });

  if (currentUser && currentUser.role !== "admin") {
    return <Redirect to="/" />;
  }

  const handleRoleChange = (id: number, role: 'admin' | 'operator') => {
    if (currentUser?.id === id) {
      toast({ variant: "destructive", title: "Taqiqlangan", description: "O'z rolingizni o'zgartira olmaysiz." });
      return;
    }
    updateRole.mutate({ id, data: { role } });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Foydalanuvchilar</h1>
        <p className="text-muted-foreground mt-1">Tizimga kirish huquqlari va rollarni boshqarish.</p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Ism / Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Qo'shilgan sana</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell align="right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : users?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center h-32">Foydalanuvchilar topilmadi</TableCell></TableRow>
            ) : (
              users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{u.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{u.name || "Ism kiritilmagan"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/20 text-secondary-foreground border-secondary/30'}>
                      {u.role === 'admin' ? <ShieldAlert className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                      {u.role === 'admin' ? 'Administrator' : 'Operator'}
                    </Badge>
                    {u.id === currentUser?.id && <span className="ml-2 text-xs text-muted-foreground font-medium">(Siz)</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(u.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select 
                      disabled={u.id === currentUser?.id || updateRole.isPending} 
                      value={u.role} 
                      onValueChange={(v: 'admin' | 'operator') => handleRoleChange(u.id, v)}
                    >
                      <SelectTrigger className="w-[140px] ml-auto h-8 text-xs">
                        <SelectValue placeholder="Rolni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
