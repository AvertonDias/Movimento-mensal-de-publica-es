'use client';

import React, { useState, useEffect } from 'react';
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ShieldCheck, Info } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isUserLoading } = useUser();
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

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl animate-pulse w-[40px] h-[40px] overflow-hidden">
            <Image src="/icon.png" alt="Carregando" width={40} height={40} className="object-cover w-full h-full" unoptimized priority />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeUserId = (viewMode === 'shared' && sharedOwnerId) ? sharedOwnerId : user.uid;

  return (
    <div className="min-h-screen pb-12 bg-background/50 font-body">
      <main className="max-w-7xl mx-auto px-6 pt-24 space-y-8">
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
          <p>© {new Date().getFullYear()} S-28 Digital • Gestão inteligente (8/24)</p>
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
                    <strong>2.</strong> Antes de fazer a contagem, recapitule a <Link href="/s60" className="text-primary font-bold hover:underline"><em>Lista de Publicações a Serem Descartadas (S-60)</em></Link> e siga as instruções sobre jogar fora os itens que aparecem na lista.
                  </p>
                  <p>
                    <strong>3.</strong> Se a sua congregação não puder enviar todo mês um relatório do inventário de publicações pelo JW Hub, certifique-se de que as informações a seguir sejam preenchidas abaixo para cada mês:
                  </p>
                  <div className="pl-6 space-y-2">
                    <p><strong>(1) Estoque:</strong> Anote a quantidade em estoque no fim do mês. Com exceção do livro Organizados, itens de pedido especial não estão listados neste formulário, visto que eles não devem ficar em estoque. Se por algum motivo houver itens de pedido especial in estoque, anote as quantidades em uma das categorias gerais, como, por exemplo, “Outras Bíblias”.</p>
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

            <Link href="/s60" className="hover:text-destructive transition-colors">Lista S-60</Link>

            <a href="https://wa.me/5535991210466?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20aplicativo%20S-28%20Digital." target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
