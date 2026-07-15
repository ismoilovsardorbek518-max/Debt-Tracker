import * as React from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  FileText,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { data: user } = useGetCurrentUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const isAdmin = user?.role === "admin";

  const navItems = [
    { title: "Bosh sahifa", url: "/", icon: LayoutDashboard },
    { title: "Klientlar", url: "/clients", icon: Users },
    { title: "Operatsiyalar", url: "/transactions", icon: ArrowRightLeft },
    { title: "Akt Sverka", url: "/akt-sverka", icon: FileText },
  ];

  const settingsItems = [
    { title: "Foydalanuvchilar", url: "/settings/users", icon: Settings, adminOnly: true },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border font-bold text-lg text-sidebar-primary tracking-tight">
        <div>Qarz-Haqdorlik</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menyu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Sozlamalar</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                  const isActive = location.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Operator'}</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Chiqish</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center px-4 border-b bg-card sm:hidden shrink-0">
            <SidebarTrigger />
            <div className="font-bold ml-4 text-primary">Qarz-Haqdorlik</div>
          </header>
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
