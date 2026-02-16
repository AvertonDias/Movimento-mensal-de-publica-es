'use client';

import React, { useEffect } from 'react';
import { StatsDashboard } from "@/components/inventory/StatsDashboard";
import { BarChart3, ShieldCheck } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function StatsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite, isLoading: isCheckingHelper } = useDoc(helperInviteRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isCheckingHelper || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <BarChart3 className="h-12 w-12 text-primary animate-pulse mx-auto" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  const isHelper = !!helperInvite;
  const targetUserId = isHelper ? helperInvite.ownerId : user.uid;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-6 px-4 md:px-6 font-body">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-row items-center justify-end gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {isHelper && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-2 py-1 md:px-4 md:py-2 rounded-lg">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-accent-foreground" />
                <span className="text-[10px] md:text-sm font-black uppercase text-accent-foreground tracking-widest truncate max-w-[100px] sm:max-w-none">
                  {helperInvite.ownerName}
                </span>
              </div>
            )}
            <div className="bg-primary p-2 md:p-3 rounded-lg shadow-md shrink-0">
              <BarChart3 className="h-5 w-5 md:h-7 md:w-7 text-primary-foreground" />
            </div>
            <h1 className="text-lg md:text-3xl font-black uppercase tracking-tight font-headline">Estatísticas</h1>
          </div>
        </div>

        <div className="bg-white shadow-xl md:shadow-2xl rounded-xl md:rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="p-4 md:p-10 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-xs md:text-lg font-black uppercase tracking-widest text-neutral-500">Visão Geral</h2>
            <p className="text-[10px] md:text-base text-muted-foreground mt-1 uppercase font-bold">Últimos 6 meses fechados</p>
          </div>
          
          <div className="p-4 md:p-10">
            <StatsDashboard targetUserId={targetUserId} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-6 md:mt-10 pb-16">
          <div className="bg-white p-6 md:p-10 rounded-xl md:rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="text-sm md:text-lg font-black uppercase mb-4 md:mb-8 text-primary">Dicas de Análise</h3>
            <ul className="space-y-3 md:space-y-5 text-xs md:text-base font-bold uppercase text-muted-foreground leading-relaxed">
              <li className="flex gap-3 md:gap-4">
                <span className="text-primary text-xl md:text-2xl">•</span>
                <span>Observe os picos de saída para planejar pedidos.</span>
              </li>
              <li className="flex gap-3 md:gap-4">
                <span className="text-primary text-xl md:text-2xl">•</span>
                <span>Itens com saída zero podem estar obsoletos (S-60).</span>
              </li>
              <li className="flex gap-3 md:gap-4">
                <span className="text-primary text-xl md:text-2xl">•</span>
                <span>Mantenha o estoque anterior atualizado para precisão.</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-primary/5 p-6 md:p-10 rounded-xl md:rounded-2xl border border-primary/10 shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-[10px] md:text-sm font-black uppercase text-primary tracking-[0.2em] mb-2 md:mb-4">Relatório S-28-T</p>
            <p className="text-sm md:text-xl font-bold text-neutral-700 leading-snug">
              Este painel ajuda a preencher o JW Hub visualizando as tendências de forma clara.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
