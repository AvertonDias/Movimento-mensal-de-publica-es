
'use client';

import React, { useState, useEffect } from 'react';
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { BookOpen, History, LogOut, User as UserIcon, ArrowRightLeft, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { initiateSignOut } from "@/firebase/non-blocking-login";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'personal' | 'shared'>('personal');
  const [sharedOwnerId, setSharedOwnerId] = useState<string | null>(null);
  const [sharedOwnerName, setSharedOwnerName] = useState<string>('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite } = useDoc(helperInviteRef);
  const isHelper = !!helperInvite;

  useEffect(() => {
    if (helperInvite && helperInvite.ownerId) {
      setSharedOwnerId(helperInvite.ownerId);
      setSharedOwnerName(helperInvite.ownerName || 'Proprietário');
    }
  }, [helperInvite]);

  const handleSignOut = () => {
    initiateSignOut(auth);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <BookOpen className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeUserId = (viewMode === 'shared' && sharedOwnerId) ? sharedOwnerId : user.uid;

  return (
    <div className="min-h-screen pb-12 bg-background/50 font-body">
      <header className="bg-white border-b border-border py-4 px-6 mb-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2.5 rounded-xl shadow-inner">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase font-headline">
                {viewMode === 'shared' ? 'Inventário Compartilhado' : 'Movimento Mensal'}
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.2em]">
                {viewMode === 'shared' ? 'Ajudante Ativo' : 'Publicações • JW'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isHelper && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setViewMode(prev => prev === 'personal' ? 'shared' : 'personal')}
                className={cn(
                  "gap-2 font-black uppercase text-[10px] tracking-widest h-9",
                  viewMode === 'shared' ? "bg-accent/10 border-accent text-accent-foreground" : ""
                )}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                {viewMode === 'shared' ? 'Meu Inventário' : 'Ajudante'}
              </Button>
            )}

            <div className="hidden md:flex items-center gap-2">
              {!isHelper && (
                <Link href="/helpers">
                  <Button variant="ghost" className="gap-2 font-bold uppercase text-[10px] tracking-widest border border-primary/20 hover:bg-primary/5 h-9">
                    <Users className="h-4 w-4" />
                    Ajudantes
                  </Button>
                </Link>
              )}
              <Link href="/history">
                <Button variant="ghost" className="gap-2 font-bold uppercase text-[10px] tracking-widest border hover:bg-neutral-50 h-9">
                  <History className="h-4 w-4" />
                  S-28-T Histórico
                </Button>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
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
                {!isHelper && (
                  <Link href="/helpers">
                    <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest">
                      <Users className="mr-2 h-4 w-4" /> Ajudantes
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link href="/history">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest">
                    <History className="mr-2 h-4 w-4" /> Histórico S-28-T
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive font-bold uppercase text-[10px] tracking-widest">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        {viewMode === 'shared' && (
          <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
              <div>
                <p className="text-xs font-black uppercase text-accent-foreground">Modo Ajudante Ativo</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">As alterações feitas aqui serão aplicadas ao inventário compartilhado.</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest" onClick={() => setViewMode('personal')}>Sair do modo ajudante</Button>
          </div>
        )}
        <InventoryTable targetUserId={activeUserId} />
      </main>
      
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Gestão de Publicações • Formulário S-28-T (8/24)</p>
          <div className="flex gap-8">
            {!isHelper && <Link href="/helpers" className="hover:text-primary transition-colors">Ajudantes</Link>}
            <a href="#" className="hover:text-primary transition-colors">Instruções</a>
            <a href="#" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
