
'use client';

import React, { useState, useEffect } from 'react';
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { BookOpen, History, LogOut, User as UserIcon, ShieldCheck, Users, Info } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'personal' | 'shared'>('personal');
  const [sharedOwnerId, setSharedOwnerId] = useState<string | null>(null);

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
    if (isHelper && helperInvite?.ownerId) {
      setViewMode('shared');
      setSharedOwnerId(helperInvite.ownerId);
    } else {
      setViewMode('personal');
    }
  }, [isHelper, helperInvite]);

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
                Movimento Mensal
              </h1>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.2em]">
                Publicações • JW
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isHelper && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-accent-foreground" />
                <span className="text-[10px] font-black uppercase text-accent-foreground tracking-widest">Ajudante</span>
              </div>
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
                    <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                      <Users className="mr-2 h-4 w-4" /> Ajudantes
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link href="/history">
                  <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                    <History className="mr-2 h-4 w-4" /> Histórico S-28-T
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-8">
        {isHelper && (
          <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
              <div>
                <p className="text-xs font-black uppercase text-accent-foreground">Acesso Autorizado</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Você está ajudando a gerenciar este inventário.</p>
              </div>
            </div>
          </div>
        )}
        <InventoryTable targetUserId={activeUserId} />
      </main>
      
      <footer className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Gestão de Publicações • Formulário S-28-T (8/24)</p>
          <div className="flex gap-8">
            {!isHelper && <Link href="/helpers" className="hover:text-primary transition-colors">Ajudantes</Link>}
            
            <Dialog>
              <DialogTrigger asChild>
                <button className="hover:text-primary transition-colors uppercase font-bold text-[10px] tracking-widest outline-none">
                  Instruções
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="uppercase font-black flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Instruções do Formulário S-28-T
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm leading-relaxed text-justify pr-2">
                  <p>
                    <strong>1.</strong> Todas as congregações coordenadoras de idioma devem fazer a contagem real das publicações todo mês. Se a sua congregação envia todo mês um relatório do inventário de publicações pelo JW Hub, você não precisa usar este formulário.
                  </p>
                  <p>
                    <strong>2.</strong> Antes de fazer a contagem, recapitule a <em>Lista de Publicações a Serem Descartadas (S-60)</em> e siga as instruções sobre jogar fora os itens que aparecem na lista.
                  </p>
                  <p>
                    <strong>3.</strong> Se a sua congregação não puder enviar todo mês um relatório do inventário de publicações pelo JW Hub, certifique-se de que as informações a seguir sejam preenchidas abaixo para cada mês:
                  </p>
                  <div className="pl-6 space-y-2">
                    <p><strong>(1) Estoque:</strong> Anote a quantidade em estoque no fim do mês. Com exceção do livro Organizados, itens de pedido especial não estão listados neste formulário, visto que eles não devem ficar em estoque. Se por algum motivo houver itens de pedido especial em estoque, anote as quantidades em uma das categorias gerais, como, por exemplo, “Outras Bíblias”.</p>
                    <p><strong>(2) Recebido:</strong> Anote a quantidade de cada item recebido durante o mês.</p>
                    <p><strong>(3) Saída:</strong> Anote a quantidade de cada item que saiu durante o mês. Pode-se determinar essa quantidade por: (1) somar a quantidade em “Estoque” do mês anterior à quantidade anotada em “Recebido” durante o mês atual e depois (2) subtrair desse total a contagem real que acabou de ser feita (“Estoque”).</p>
                  </div>
                  <p>
                    <strong>4.</strong> Duas vezes por ano, Betel vai pedir que as congregações coordenadoras de idiomas enviem seu inventário pelo JW Hub, se possível. Para enviar um relatório do inventário de publicações, faça o seguinte: na página inicial do JW Hub, seção “Congregação”, clique em “Publicações” &rarr; “Relatórios de inventário”. Veja na seção “Ajuda” instruções sobre como enviar relatórios.
                  </p>
                  <p>
                    <strong>5.</strong> Neste formulário, um asterisco (*) depois do título ou da descrição de um item indica que ele faz parte do Kit de Ensino.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <a href="https://wa.me/5535991210466?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20aplicativo%20Invent%C3%A1rio%20F%C3%A1cil." target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
