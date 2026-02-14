'use client';

import React, { useEffect } from 'react';
import { StatsDashboard } from "@/components/inventory/StatsDashboard";
import { ChevronLeft, BarChart3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-neutral-50 py-10 px-6 font-body">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2 font-bold uppercase text-base">
              <ChevronLeft className="h-5 w-5" />
              Voltar ao Inventário
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {isHelper && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-lg mr-2">
                <ShieldCheck className="h-5 w-5 text-accent-foreground" />
                <span className="text-sm font-black uppercase text-accent-foreground tracking-widest">
                  Stats de {helperInvite.ownerName}
                </span>
              </div>
            )}
            <div className="bg-primary p-3 rounded-lg shadow-md">
              <BarChart3 className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight font-headline">Painel de Estatísticas</h1>
          </div>
        </div>

        <div className="bg-white shadow-2xl rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="p-10 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-lg font-black uppercase tracking-widest text-neutral-500">Visão Geral de Movimentação</h2>
            <p className="text-base text-muted-foreground mt-1 uppercase font-bold">Análise baseada nos últimos 6 meses de registros fechados</p>
          </div>
          
          <div className="p-10">
            <StatsDashboard targetUserId={targetUserId} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pb-16">
          <div className="bg-white p-10 rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-black uppercase mb-8 text-primary">Dicas de Análise</h3>
            <ul className="space-y-5 text-base font-bold uppercase text-muted-foreground leading-relaxed">
              <li className="flex gap-4">
                <span className="text-primary text-2xl">•</span>
                <span>Observe os picos de saída para planejar pedidos com antecedência.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-primary text-2xl">•</span>
                <span>Itens com saída zero por vários meses podem estar obsoletos (consulte a S-60).</span>
              </li>
              <li className="flex gap-4">
                <span className="text-primary text-2xl">•</span>
                <span>Mantenha o estoque anterior sempre atualizado para garantir a precisão dos cálculos.</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-primary/5 p-10 rounded-2xl border border-primary/10 shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-sm font-black uppercase text-primary tracking-[0.3em] mb-4">Relatório S-28-T</p>
            <p className="text-xl font-bold text-neutral-700 leading-snug">
              Este painel ajuda a preencher o JW Hub visualizando as tendências de forma clara e profissional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
