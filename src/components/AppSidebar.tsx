'use client';

import * as React from 'react';
import {
  History,
  Users,
  BarChart3,
  Trash2,
  FileText,
  LayoutGrid,
  Truck,
  ShoppingCart,
  ClipboardList,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite } = useDoc(helperInviteRef);
  const isHelper = !!helperInvite;

  if (isUserLoading || !user || user.isAnonymous) return null;

  const navItems = [
    { href: '/', label: 'Painel Principal', icon: LayoutGrid },
    { href: '/inventory-report', label: 'Relatório de Inventário', icon: FileText },
    { href: '/history', label: 'Folha S-28', icon: History },
    { href: '/order-form', label: 'Pedido S-14-T', icon: ShoppingCart },
    { href: '/special-orders', label: 'Pedidos Especiais', icon: ClipboardList },
    { href: '/stats', label: 'Estatísticas', icon: BarChart3 },
    { href: '/order-schedule', label: 'Cronograma de Pedidos', icon: Truck },
    { href: '/magazine-display', label: 'Programação de Exibição', icon: LayoutGrid },
    { href: '/s60', label: 'Lista de Descartes (S-60)', icon: Trash2 },
    { href: '/helpers', label: 'Ajudantes', icon: Users, hideIfHelper: true },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden font-black uppercase text-[9px] tracking-widest text-muted-foreground/60">
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              if (item.hideIfHelper && isHelper) return null;
              
              const isActive = pathname === item.href;
              
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive} 
                    tooltip={item.label}
                    onClick={() => setOpenMobile(false)}
                    className={cn(
                      "font-bold uppercase text-[10px] tracking-wider transition-all duration-200 h-10",
                      isActive ? "bg-primary/10 text-primary-foreground" : "hover:bg-sidebar-accent"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-tighter">S-28-T DIGITAL</p>
          <p className="text-[7px] font-bold text-muted-foreground/30 uppercase tracking-widest">v2.26.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
