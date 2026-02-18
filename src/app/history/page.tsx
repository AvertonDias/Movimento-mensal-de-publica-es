'use client';

import { use, useEffect, useState } from 'react';
import { HistoryTable } from "@/components/inventory/HistoryTable";
import { Share2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

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
  const [isSharing, setIsSharing] = useState(false);

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

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    toast({
      title: "Preparando documento...",
      description: "Aguarde enquanto geramos a folha S-28-T.",
    });

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const element = document.getElementById('s28-history-content');
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
      
      const fileName = `S28_T_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // TENTA COMPARTILHAMENTO NATIVO (Isso abre o seletor de apps no celular)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Folha S-28-T Digital',
            text: 'Movimento mensal de publicações',
          });
        } catch (shareError) {
          // Se falhar ou cancelar, tenta abrir em nova aba como fallback
          const blobUrl = URL.createObjectURL(pdfBlob);
          window.open(blobUrl, '_blank');
        }
      } else {
        // Fallback para navegadores que não suportam navigator.share
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao processar",
        description: "Não foi possível gerar o PDF.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (isUserLoading || isCheckingHelper || !user) return null;

  const isHelper = !!helperInvite;
  const targetUserId = isHelper ? helperInvite.ownerId : user.uid;

  return (
    <div className="min-h-screen bg-neutral-200 pt-24 pb-6 px-4 print:p-0 print:bg-white overflow-x-auto font-body">
      <div className="max-w-[800px] mx-auto space-y-4 print:space-y-0">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
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
            className="gap-2 bg-white font-bold uppercase text-xs shadow-sm hover:bg-neutral-50" 
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Abrir S-28-T
          </Button>
        </div>

        <div id="s28-history-content" className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 min-w-[750px] print:min-w-0 mx-auto">
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
  );
}
