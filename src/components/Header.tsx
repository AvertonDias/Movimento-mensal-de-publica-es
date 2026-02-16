'use client';

import React, { useState, useEffect } from 'react';
import { History, LogOut, User as UserIcon, ShieldCheck, Users, BarChart3, Trash2, FileText, LayoutGrid, Truck } from "lucide-react";
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

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const pathname = usePathname();
  
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
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
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

  if (isUserLoading) return null;
  if (!user || user.isAnonymous) return null;

  return (
    <header 
      className={cn(
        "bg-white border-b border-border py-4 px-6 fixed top-0 left-0 right-0 z-20 shadow-sm transition-transform duration-300 ease-in-out print:hidden",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity shrink-0">
          <div className="rounded-xl overflow-hidden w-[40px] h-[40px] sm:w-[42px] sm:h-[42px]">
            <Image src="/icon.png" alt="Logo" width={42} height={42} className="object-cover w-full h-full" unoptimized priority />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-base sm:text-xl font-black tracking-tight text-foreground uppercase font-headline leading-none">
              S-28 Digital
            </h1>
            <p className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 leading-none">
              Gestão inteligente de publicações
            </p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          {isHelper && (
            <div className="hidden xl:flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-accent-foreground" />
              <span className="text-[10px] font-black uppercase text-accent-foreground tracking-widest">Ajudante</span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            <Link href="/">
              <Button variant="ghost" className={cn(
                "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3",
                pathname === '/' && "bg-primary/10 border-primary"
              )}>
                <LayoutGrid className="h-4 w-4" />
                Painel Principal
              </Button>
            </Link>
            <Link href="/inventory-report">
              <Button variant="ghost" className={cn(
                "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3",
                pathname === '/inventory-report' && "bg-primary/10 border-primary"
              )}>
                <FileText className="h-4 w-4" />
                Relatório de Inventário
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" className={cn(
                "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3",
                pathname === '/history' && "bg-primary/10 border-primary"
              )}>
                <History className="h-4 w-4" />
                Folha S-28
              </Button>
            </Link>
            <Link href="/stats">
              <Button variant="ghost" className={cn(
                "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3",
                pathname === '/stats' && "bg-primary/10 border-primary"
              )}>
                <BarChart3 className="h-4 w-4" />
                Estatísticas
              </Button>
            </Link>
            <Link href="/order-schedule">
              <Button variant="ghost" className={cn(
                "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3",
                pathname === '/order-schedule' && "bg-primary/10 border-primary"
              )}>
                <Truck className="h-4 w-4" />
                Cronograma de Pedidos
              </Button>
            </Link>
            <Link href="/magazine-display">
              <Button variant="ghost" className={cn(
                "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3",
                pathname === '/magazine-display' && "bg-primary/10 border-primary"
              )}>
                <LayoutGrid className="h-4 w-4" />
                Exibição de Revistas
              </Button>
            </Link>
            <Link href="/s60">
              <Button variant="ghost" className={cn(
                "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3",
                pathname === '/s60' && "bg-primary/10 border-primary"
              )}>
                <Trash2 className="h-4 w-4" />
                Lista de Descartes (S-60)
              </Button>
            </Link>
            {!isHelper && (
              <Link href="/helpers">
                <Button variant="ghost" className={cn(
                  "gap-2 font-bold uppercase text-[9px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9 px-2 xl:px-3",
                  pathname === '/helpers' && "bg-primary/10 border-primary"
                )}>
                  <Users className="h-4 w-4" />
                  Ajudantes
                </Button>
              </Link>
            )}
          </div>

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
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">{user.displayName || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground text-ellipsis overflow-hidden">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="lg:hidden">
                <Link href="/">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                    <LayoutGrid className="mr-2 h-4 w-4" /> Painel Principal
                  </DropdownMenuItem>
                </Link>
                <Link href="/inventory-report">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" /> Relatório de Inventário
                  </DropdownMenuItem>
                </Link>
                <Link href="/history">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                    <History className="mr-2 h-4 w-4" /> Folha S-28
                  </DropdownMenuItem>
                </Link>
                <Link href="/stats">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" /> Estatísticas
                  </DropdownMenuItem>
                </Link>
                <Link href="/order-schedule">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                    <Truck className="mr-2 h-4 w-4" /> Cronograma de Pedidos
                  </DropdownMenuItem>
                </Link>
                <Link href="/magazine-display">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                    <LayoutGrid className="mr-2 h-4 w-4" /> Exibição de Revistas
                  </DropdownMenuItem>
                </Link>
                <Link href="/s60">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" /> Lista de Descartes (S-60)
                  </DropdownMenuItem>
                </Link>
                {!isHelper && (
                  <Link href="/helpers">
                    <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                      <Users className="mr-2 h-4 w-4" /> Ajudantes
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
              </div>
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
