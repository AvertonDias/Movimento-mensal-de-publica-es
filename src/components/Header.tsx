'use client';

import React, { useState, useEffect } from 'react';
import { History, LogOut, User as UserIcon, Users, BarChart3, Trash2, FileText, LayoutGrid, Truck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doc } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { usePathname } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlHeader = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
      }
    };
    window.addEventListener('scroll', controlHeader);
    return () => window.removeEventListener('scroll', controlHeader);
  }, [lastScrollY]);

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite } = useDoc(helperInviteRef);
  const isHelper = !!helperInvite;

  const handleSignOut = () => {
    initiateSignOut(auth);
  };

  const handleForceUpdate = async () => {
    toast({
      title: "Limpando cache...",
      description: "O aplicativo será reiniciado para aplicar as atualizações.",
    });

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }

    // Limpa localStorage de controle interno se houver
    // window.localStorage.clear(); 

    // Força o recarregamento ignorando o cache do navegador
    window.location.href = window.location.origin + window.location.pathname + '?update=' + Date.now();
  };

  if (isUserLoading || !user || user.isAnonymous) return null;

  const navItems = [
    { href: "/", label: "Painel Principal", icon: LayoutGrid, minWidth: "lg" },
    { href: "/inventory-report", label: "Relatório de Inventário", icon: FileText, minWidth: "lg" },
    { href: "/history", label: "Folha S-28", icon: History, minWidth: "xl" },
    { href: "/stats", label: "Estatísticas", icon: BarChart3, minWidth: "xl" },
    { href: "/order-schedule", label: "Cronograma de Pedidos", icon: Truck, minWidth: "2xl" },
    { href: "/magazine-display", label: "Programação de Exibição", icon: LayoutGrid, minWidth: "2xl" },
    { href: "/s60", label: "Lista de Descartes (S-60)", icon: Trash2, minWidth: "2xl" },
    { href: "/helpers", label: "Ajudantes", icon: Users, minWidth: "2xl", hideIfHelper: true },
  ];

  return (
    <header 
      className={cn(
        "bg-white border-b border-border py-4 px-6 fixed top-0 left-0 right-0 z-20 shadow-sm transition-transform duration-300 ease-in-out print:hidden",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
          <div className="rounded-xl overflow-hidden w-[40px] h-[40px] sm:w-[42px] sm:h-[42px]">
            <Image src="/icon.png" alt="Logo" width={42} height={42} className="object-cover w-full h-full" unoptimized priority />
          </div>
          <div className="flex flex-col justify-center text-left">
            <h1 className="text-base sm:text-xl font-black tracking-tight text-foreground uppercase font-headline leading-none">
              S-28 Digital
            </h1>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 leading-none">
              Gestão inteligente de publicações
            </p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            {navItems.map((item) => {
              if (item.hideIfHelper && isHelper) return null;
              
              const isActive = pathname === item.href;
              const visibilityClass = item.minWidth === 'xl' ? 'hidden xl:flex' : 
                                     item.minWidth === '2xl' ? 'hidden 2xl:flex' : 'flex';

              return (
                <Link key={item.href} href={item.href} className={visibilityClass}>
                  <Button variant="ghost" className={cn(
                    "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3 transition-all",
                    isActive && "bg-primary/10 border-primary text-primary-foreground shadow-sm"
                  )}>
                    <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    <span className="truncate">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full shrink-0">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 text-left">
                  <p className="text-sm font-bold leading-none">{user.displayName || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="flex flex-col">
                {navItems.map((item) => {
                  if (item.hideIfHelper && isHelper) return null;
                  
                  const isActive = pathname === item.href;
                  const hiddenInDropdownClass = item.minWidth === 'lg' ? 'lg:hidden' : 
                                               item.minWidth === 'xl' ? 'xl:hidden' : 
                                               item.minWidth === '2xl' ? '2xl:hidden' : '';

                  return (
                    <Link key={item.href} href={item.href} className={hiddenInDropdownClass}>
                      <DropdownMenuItem className={cn(
                        "font-bold uppercase text-[10px] tracking-widest cursor-pointer",
                        isActive && "bg-primary/10 text-primary font-black"
                      )}>
                        <item.icon className={cn("mr-2 h-4 w-4", isActive && "text-primary")} /> {item.label}
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleForceUpdate} className="font-bold uppercase text-[10px] tracking-widest cursor-pointer text-primary">
                <RefreshCw className="mr-2 h-4 w-4" /> Forçar Atualização
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
