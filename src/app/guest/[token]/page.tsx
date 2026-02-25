'use client';

import React, { use, useEffect, useState } from 'react';
import { HistoryTable } from "@/components/inventory/HistoryTable";
import { BookOpen, ShieldCheck, FileDown, AlertTriangle, Loader2 } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GuestHistoryPage(props: {
  params: Promise<{ token: string }>;
}) {
  const params = use(props.params);
  const db = useFirestore();
  const { user: guestUser, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    toast({
      title: "Preparando PDF...",
      description: "Preparando Formulário S-28",
    });

    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
      const html2canvas = (await import('html2canvas')).default;

      const element = document.getElementById('s28-history-content-guest');
      if (!element) throw new Error('Elemento não encontrado');

      const scale = 3;
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
      });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const sideMarginMm = 10;
      const topBottomMarginMm = 7;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const contentWidthMm = pdfWidth - (sideMarginMm * 2);
      const pxToMm = contentWidthMm / canvas.width;
      
      const rows = Array.from(element.querySelectorAll('tr'));
      const rect = element.getBoundingClientRect();
      
      const rowData = rows.map(row => {
        const rowRect = row.getBoundingClientRect();
        return {
          top: (rowRect.top - rect.top) * scale,
          height: rowRect.height * scale,
          bottom: (rowRect.top - rect.top + rowRect.height) * scale
        };
      });

      let currentYPx = 0;
      let isFirstPage = true;
      const marginPx = topBottomMarginMm / pxToMm;

      const now = new Date();
      const timestamp = format(now, "dd/MM/yyyy HH:mm");

      while (currentYPx < canvas.height) {
        const remainingRows = rowData.filter(r => r.top >= currentYPx - 1);
        if (remainingRows.length === 0 && !isFirstPage) break;

        if (!isFirstPage) {
          pdf.addPage();
        }

        const availableHeightPx = (pdfHeight / pxToMm) - (topBottomMarginMm * 2);
        let sliceHeightPx = availableHeightPx;

        const rowsFitting = remainingRows.filter(r => r.bottom <= (currentYPx + availableHeightPx + 1));
        
        if (rowsFitting.length > 0) {
          const lastRow = rowsFitting[rowsFitting.length - 1];
          sliceHeightPx = lastRow.bottom - currentYPx;
        } else if (remainingRows.length > 0) {
          sliceHeightPx = remainingRows[0].bottom - currentYPx;
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sliceHeightPx;
        const ctx = tempCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(canvas, 0, currentYPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
          const pageImgData = tempCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', sideMarginMm, topBottomMarginMm, contentWidthMm, sliceHeightPx * pxToMm);
          
          pdf.setFontSize(7);
          pdf.setTextColor(150);
          pdf.text(`Impresso por S-28 Digital em ${timestamp}`, pdfWidth - sideMarginMm, pdfHeight - 5, { align: 'right' });
        }

        currentYPx += sliceHeightPx;
        isFirstPage = false;
        if (canvas.height - currentYPx < 10) break;
      }
      
      const fileDate = format(new Date(), 'yyyy-MM-dd');
      const fileName = `S28_T_Compartilhada_${fileDate}.pdf`;
      
      pdf.save(fileName);

      toast({
        title: "Download concluído!",
        description: "O documento foi baixado com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao baixar",
        description: "Não foi possível gerar o PDF completo.",
      });
    } finally {
      setIsDownloading(false);
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
    <div className="min-h-screen bg-neutral-200 py-6 px-0 sm:px-4 print:p-0 print:bg-white font-body overflow-x-hidden">
      <div className="max-w-[850px] mx-auto space-y-4 print:space-y-0 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-4 rounded-xl border border-white/20 print:hidden text-left">
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
            className="gap-2 bg-white font-bold uppercase text-xs shrink-0 border-primary/20" 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Baixar PDF
          </Button>
        </div>

        <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20">
          <div id="s28-history-content-guest" className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 w-max mx-auto pdf-export-content">
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
    </div>
  );
}
