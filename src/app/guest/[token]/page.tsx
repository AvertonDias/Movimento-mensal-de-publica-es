'use client';

import React, { use, useEffect, useState } from 'react';
import { HistoryTable } from "@/components/inventory/HistoryTable";
import { BookOpen, ShieldCheck, Share2, AlertTriangle, Loader2 } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

export default function GuestHistoryPage(props: {
  params: Promise<{ token: string }>;
}) {
  const params = use(props.params);
  const db = useFirestore();
  const { user: guestUser, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

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

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    toast({
      title: "Gerando documento...",
      description: "Preparando folha S-28-T para visualização.",
    });

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const element = document.getElementById('s28-history-content-guest');
      if (!element) throw new Error('Elemento não encontrado');

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1000,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()), undefined, 'FAST');
      
      const fileName = `S28_T_Compartilhada_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // PRIORIDADE: Compartilhamento Nativo (Perguntar qual app abrir)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Folha S-28-T Digital (Compartilhada)',
            text: `Movimento mensal de publicações`,
          });
        } catch (err) { }
      } else {
        // FALLBACK: Abrir em nova aba
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao abrir",
        description: "Não foi possível processar o documento PDF.",
      });
    } finally {
      setIsSharing(false);
    }
  };

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
      <div className="max-w-[800px] mx-auto space-y-4 print:space-y-0">
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
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Abrir S-28-T
          </Button>
        </div>

        <div id="s28-history-content-guest" className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 min-w-[750px] print:min-w-0 mx-auto">
          <div className="flex justify-between items-baseline border-b-2 border-black pb-1 mb-2">
            <h1 className="text-lg font-black tracking-tight uppercase font-headline">
              MOVIMENTO MENSAL DE PUBLICAÇÕES
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase">IDIOMA:</span>
              <div className="border-b border-black w-32 h-5 flex items-end px-2 font-bold text-[10px]">Português</div>
            </div>
          </div>

          <HistoryTable targetUserId={invite.ownerId} />

          <div className="mt-4 flex justify-between items-end border-t border-neutral-200 pt-2 print:mt-2">
            <span className="text-[8px] font-bold text-neutral-500 italic uppercase">S-28-T (2/26)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
