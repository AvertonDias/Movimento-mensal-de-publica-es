
'use client';

import { use, useEffect, useState } from 'react';
import { HistoryTable } from "@/components/inventory/HistoryTable";
import { FileDown, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoryPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

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

      const element = document.getElementById('s28-history-content');
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
      const topBottomMarginMm = 10;
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
      const now = new Date();
      const timestamp = format(now, "dd/MM/yyyy HH:mm");

      while (currentYPx < canvas.height) {
        const remainingHeightPx = canvas.height - currentYPx;
        if (remainingHeightPx < 10 && !isFirstPage) break;

        if (!isFirstPage) {
          pdf.addPage();
        }

        const availableHeightPx = (pdfHeight - (topBottomMarginMm * 2)) / pxToMm;
        let sliceHeightPx = Math.min(availableHeightPx, remainingHeightPx);

        // Busca a última linha que cabe inteira neste pedaço para evitar cortes
        const rowsInThisSlice = rowData.filter(r => 
          r.top >= currentYPx - 1 && 
          r.bottom <= currentYPx + availableHeightPx + 1
        );

        if (rowsInThisSlice.length > 0) {
          const lastRow = rowsInThisSlice[rowsInThisSlice.length - 1];
          sliceHeightPx = lastRow.bottom - currentYPx;
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
      }
      
      const fileDate = format(new Date(), 'yyyy-MM-dd');
      pdf.save(`S28_T_${fileDate}.pdf`);

      toast({
        title: "Download concluído!",
        description: "O formulário S-28-T foi salvo com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao processar documento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao baixar",
        description: "Não foi possível gerar o PDF completo.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isUserLoading || isCheckingHelper || !user) return null;

  const isHelper = !!helperInvite;
  const targetUserId = isHelper ? helperInvite.ownerId : user.uid;

  return (
    <div className="min-h-screen bg-neutral-200 pt-24 pb-6 px-0 sm:px-4 print:p-0 print:bg-white font-body overflow-x-hidden">
      <div className="max-w-[850px] mx-auto space-y-4 print:space-y-0 px-4 sm:px-0">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-left">
            {isHelper && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-accent-foreground" />
                <span className="text-[10px] font-black uppercase text-accent-foreground tracking-widest">
                  Histórico de {helperInvite.ownerName}
                </span>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            className="gap-2 bg-white font-bold uppercase text-xs shadow-sm hover:bg-neutral-50 shrink-0 border-primary/20" 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Baixar PDF
          </Button>
        </div>

        <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20">
          <div id="s28-history-content" className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 w-max mx-auto pdf-export-content">
            <div className="flex justify-between items-baseline border-b-2 border-black pb-1 mb-2">
              <h1 className="text-lg font-black tracking-tight uppercase font-headline">
                MOVIMENTO MENSAL DE PUBLICAÇÕES
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase">IDIOMA:</span>
                <div className="border-b border-black w-32 h-5 flex items-end px-2 font-bold text-[10px]">Português</div>
              </div>
            </div>

            <HistoryTable targetUserId={targetUserId} />

            <div className="mt-4 flex justify-between items-end border-t border-neutral-200 pt-2 print:mt-2">
              <span className="text-[8px] font-bold text-neutral-500 italic uppercase">S-28-T (2/26)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
