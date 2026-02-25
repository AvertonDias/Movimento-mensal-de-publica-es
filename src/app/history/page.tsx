
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

export default function HistoryPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
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
      title: "Gerando PDF...",
      description: "Aguarde enquanto preparamos o documento completo.",
    });

    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
      const html2canvas = (await import('html2canvas')).default;

      const element = document.getElementById('s28-history-content');
      if (!element) throw new Error('Elemento não encontrado');

      // Captura o conteúdo com escala 2x para equilíbrio entre nitidez e tamanho de arquivo
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Adiciona a primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adiciona páginas extras se o conteúdo transbordar o A4
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileDate = format(new Date(), 'yyyy-MM-dd');
      const fileName = `S28_T_${fileDate}.pdf`;
      
      pdf.save(fileName);

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
          <div id="s28-history-content" className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 w-max mx-auto">
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
