'use client';

import React, { use, useEffect } from 'react';
import { HistoryTable } from "@/components/inventory/HistoryTable";
import { BookOpen, ShieldCheck, Printer, AlertTriangle } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GuestHistoryPage(props: {
  params: Promise<{ token: string }>;
}) {
  const params = use(props.params);
  const db = useFirestore();
  const { user: guestUser, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !guestUser) {
      router.push(`/login?redirect=/guest/${params.token}`);
    }
  }, [guestUser, isUserLoading, router, params.token]);

  const inviteRef = useMemoFirebase(() => {
    if (!db || !params.token) return null;
    return doc(db, 'invites', params.token);
  }, [db, params.token]);

  const { data: invite, isLoading, error } = useDoc(inviteRef);

  useEffect(() => {
    if (invite && guestUser && !guestUser.isAnonymous && db) {
      if (guestUser.uid !== invite.ownerId && invite.label === 'Aguardando cadastro...') {
        const helperName = guestUser.displayName || guestUser.email?.split('@')[0] || 'Ajudante Conectado';
        const docRef = doc(db, 'invites', invite.id);
        
        updateDocumentNonBlocking(docRef, {
          label: helperName
        });
      }
    }
  }, [invite, guestUser, db]);

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 text-primary animate-pulse mx-auto" />
          <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Autenticando convite...</p>
        </div>
      </div>
    );
  }

  if (!guestUser) return null;

  if (error || !invite) {
    return (
      <div className="min-h-screen items-center justify-center bg-neutral-100 p-6 flex">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center space-y-6">
          <div className="bg-destructive/10 p-4 rounded-full w-fit mx-auto">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black uppercase">Convite Inválido</h1>
            <p className="text-sm text-muted-foreground">O link de acesso expirou ou foi removido pelo proprietário do inventário.</p>
          </div>
          <Button asChild className="w-full uppercase font-bold text-xs" variant="outline">
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-200 py-6 px-4 print:p-0 print:bg-white overflow-x-auto font-body">
      <div className="max-w-[1100px] mx-auto space-y-4 print:space-y-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-xl border border-white/20 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">Acesso Ajudante</p>
              <h2 className="text-sm font-bold uppercase">Visualizando histórico de {invite.label}</h2>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 bg-white font-bold uppercase text-xs" 
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" /> Imprimir S-28-T
          </Button>
        </div>

        <div className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 min-w-[1060px] print:min-w-0 mx-auto">
          <div className="flex justify-between items-baseline border-b-2 border-black pb-1 mb-2">
            <h1 className="text-xl font-black tracking-tight uppercase font-headline">
              MOVIMENTO MENSAL DE PUBLICAÇÕES
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase">IDIOMA:</span>
              <div className="border-b border-black w-48 h-5 flex items-end px-2 font-bold text-xs">Português</div>
            </div>
          </div>

          <HistoryTable targetUserId={invite.ownerId} />

          <div className="mt-4 flex justify-between items-end border-t border-neutral-200 pt-2 print:mt-2">
            <span className="text-[8px] font-bold text-neutral-500 italic uppercase">S-28-T (Visualização de Convidado)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
