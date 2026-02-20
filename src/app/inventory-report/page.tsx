'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Loader2, ShieldCheck, Info, Share2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OFFICIAL_PUBLICATIONS, InventoryItem } from "@/app/types/inventory";
import { cn, formatNumber } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";

export default function InventoryReportPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedMonth] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const [isSharing, setIsSharing] = useState(false);
  
  const monthKey = useMemo(() => format(selectedMonth, 'yyyy-MM'), [selectedMonth]);
  const monthLabel = useMemo(() => format(selectedMonth, 'MMMM yyyy', { locale: ptBR }), [selectedMonth]);

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

  const activeUserId = helperInvite ? helperInvite.ownerId : user?.uid;

  const customItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUserId) return null;
    return collection(db, 'users', activeUserId, 'inventory');
  }, [db, activeUserId]);

  const { data: customDefinitions } = useCollection(customItemsQuery);

  const monthItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUserId || !monthKey) return null;
    return collection(db, 'users', activeUserId, 'monthly_records', monthKey, 'items');
  }, [db, activeUserId, monthKey]);

  const { data: remoteItems, isLoading: isFetchingData } = useCollection(monthItemsQuery);

  const filteredItems = useMemo(() => {
    if (!remoteItems && !isFetchingData) return [];
    
    const combined: InventoryItem[] = [];
    const officialIds = new Set(OFFICIAL_PUBLICATIONS.map((pub, idx) => pub.code || pub.abbr || `item_${idx}`));
    
    OFFICIAL_PUBLICATIONS.forEach((pub, idx) => {
      const id = pub.code || pub.abbr || `item_${idx}`;
      const remote = remoteItems?.find(i => i.id === id);
      
      const prev = Number(remote?.previous) || 0;
      const curr = Number(remote?.current) || 0;

      if (!pub.isCategory && (prev > 0 || curr > 0)) {
        combined.push({
          ...pub,
          id,
          previous: prev,
          current: curr,
        } as InventoryItem);
      }

      if (pub.isCategory && customDefinitions) {
        const categoryCustomItems = customDefinitions
          .filter(cd => cd.category === pub.category && !officialIds.has(cd.id));

        categoryCustomItems.forEach(cd => {
          const remoteCustom = remoteItems?.find(i => i.id === cd.id);
          const cPrev = Number(remoteCustom?.previous) || 0;
          const cCurr = Number(remoteCustom?.current) || 0;

          if (cPrev > 0 || cCurr > 0) {
            combined.push({
              ...cd,
              previous: cPrev,
              current: cCurr,
            } as InventoryItem);
          }
        });
      }
    });

    return combined;
  }, [remoteItems, customDefinitions, isFetchingData]);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    toast({
      title: "Preparando relatório...",
      description: "Gerando PDF de saldo físico.",
    });

    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
      const html2canvas = (await import('html2canvas')).default;

      const element = document.getElementById('report-content');
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

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const fileDate = format(new Date(), 'yyyy-MM-dd');
      const fileName = `Saldo_Fisico_${monthKey}_${fileDate}.pdf`;
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Relatório de Saldo Físico',
            text: `Saldo de publicações - ${monthLabel}`,
          });
        } catch (err) {
          const blobUrl = URL.createObjectURL(pdfBlob);
          window.open(blobUrl, '_blank');
        }
      } else {
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao abrir",
        description: "Não foi possível processar o relatório.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (isUserLoading || isCheckingHelper || !user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-6 px-6 font-body print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="pb-4 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden text-left">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-black uppercase tracking-tight font-headline">Relatório de Inventário</h1>
          </div>
          <Button 
            onClick={handleShare} 
            disabled={isSharing || filteredItems.length === 0}
            className="gap-2 font-black uppercase text-[10px] tracking-widest h-10 shadow-md transition-all active:scale-95"
          >
            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Abrir Relatório
          </Button>
        </div>

        <Card id="report-content" className="border-none shadow-xl overflow-hidden print:shadow-none print:border bg-white">
          <CardHeader className="bg-white border-b border-neutral-100 flex flex-row items-center justify-between space-y-0 p-4">
            <div className="text-left">
              <CardTitle className="uppercase font-black text-base">Resumo de Saldo Físico</CardTitle>
              <CardDescription className="uppercase font-bold text-[9px] tracking-widest text-muted-foreground mt-1">
                Competência: {monthLabel}
              </CardDescription>
            </div>
            {helperInvite && (
              <div className="bg-accent/10 border border-accent/20 px-3 py-1 rounded-lg flex items-center gap-2 print:hidden">
                <ShieldCheck className="h-3 w-3 text-accent-foreground" />
                <span className="text-[8px] font-black uppercase text-accent-foreground tracking-widest">
                  Ajudante de {helperInvite.ownerName}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isFetchingData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gerando relatório...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <Info className="h-12 w-12 text-neutral-200 mx-auto" />
                <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma movimentação no mês selecionado</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-neutral-50/50">
                  <TableRow>
                    <TableHead className="w-[80px] font-black uppercase text-[9px] text-center border-r h-10">N.º</TableHead>
                    <TableHead className="font-black uppercase text-[9px] border-r h-10">Publicação</TableHead>
                    <TableHead className="w-[80px] font-black uppercase text-[9px] text-center border-r bg-primary/5 h-10 leading-tight">Anterior</TableHead>
                    <TableHead className="w-[80px] font-black uppercase text-[9px] text-center bg-accent/5 h-10 leading-tight">Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const imagePlaceholder = item.imageKey ? PlaceHolderImages.find(img => img.id === item.imageKey) : null;
                    
                    return (
                      <TableRow key={item.id} className="hover:bg-transparent border-b h-10">
                        <TableCell className="text-center font-bold text-[10px] text-neutral-400 border-r p-1 leading-tight">{item.code || '---'}</TableCell>
                        <TableCell className="border-r p-1 px-3 text-left leading-tight">
                          <div className="flex justify-between items-center">
                            {imagePlaceholder ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <span className={cn(
                                    "font-bold text-[11px] uppercase cursor-pointer border-b border-dotted transition-colors leading-tight",
                                    (item.current || 0) === 0 ? "text-destructive border-destructive" : "text-foreground border-muted-foreground/50 hover:text-primary"
                                  )}>
                                    {item.item}
                                  </span>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="p-0 border-none shadow-2xl overflow-hidden rounded-lg w-[180px]">
                                  <div className="relative aspect-[2/3] bg-neutral-50 p-2">
                                    <div className="relative w-full h-full rounded shadow-sm overflow-hidden">
                                      <Image 
                                        src={imagePlaceholder.imageUrl} 
                                        alt={imagePlaceholder.description} 
                                        fill 
                                        sizes="180px" 
                                        className="object-contain" 
                                        unoptimized 
                                      />
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <span className={cn(
                                "font-bold text-[11px] uppercase leading-tight",
                                (item.current || 0) === 0 && "text-destructive"
                              )}>{item.item}</span>
                            )}
                            {item.abbr && <span className="text-[8px] font-black bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded ml-2 leading-tight">{item.abbr}</span>}
                          </div>
                        </TableCell>
                        <TableCell className={cn(
                          "text-center font-black text-xs border-r bg-primary/5 p-1 leading-tight",
                          (item.previous || 0) === 0 && "text-neutral-300 font-normal"
                        )}>
                          {formatNumber(item.previous)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-center font-black text-xs bg-accent/5 p-1 leading-tight",
                          (item.current || 0) === 0 && "text-destructive"
                        )}>
                          {formatNumber(item.current)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10 print:hidden text-left">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">
            Este relatório oculta automaticamente publicações que não possuem estoque inicial nem final no período selecionado. Clique no nome da publicação para ver a capa.
          </p>
        </div>
      </div>
    </div>
  );
}
