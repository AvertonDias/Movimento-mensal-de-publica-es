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
import { FileText, Loader2, ShieldCheck, Info, FileDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format, subMonths, startOfMonth, addMonths, setMonth, addYears, subYears } from 'date-fns';
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
  
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isMonthPopoverOpen, setIsMonthPopoverOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setSelectedMonth(startOfMonth(subMonths(new Date(), 1)));
  }, []);
  
  const displayMonth = selectedMonth || new Date();
  const monthKey = format(displayMonth, 'yyyy-MM');
  const monthLabel = format(displayMonth, 'MMMM yyyy', { locale: ptBR });

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite, isLoading: isCheckingHelper } = useDoc(helperInviteRef);

  useEffect(() => {
    if (isMounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, isMounted]);

  const activeUserId = helperInvite ? helperInvite.ownerId : user?.uid;

  const customItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUserId) return null;
    return collection(db, 'users', activeUserId, 'inventory');
  }, [db, activeUserId]);

  const { data: customDefinitions } = useCollection(customItemsQuery);

  const monthItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUserId || !monthKey || !isMounted) return null;
    return collection(db, 'users', activeUserId, 'monthly_records', monthKey, 'items');
  }, [db, activeUserId, monthKey, isMounted]);

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

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    toast({
      title: "Gerando Relatório...",
      description: "Ajustando o corte das páginas para uma visão profissional.",
    });

    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
      const html2canvas = (await import('html2canvas')).default;

      const element = document.getElementById('report-content');
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

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pxToMm = pdfWidth / canvas.width;
      
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
      const marginMm = 7;
      const marginPx = marginMm / pxToMm;

      while (currentYPx < canvas.height) {
        if (!isFirstPage) {
          pdf.addPage();
        }

        const availableHeightPx = (pdfHeight / pxToMm) - (marginPx * 2);
        let sliceHeightPx = availableHeightPx;

        const rowsFitting = rowData.filter(r => r.top >= currentYPx - 1 && r.bottom <= (currentYPx + availableHeightPx + 1));
        
        if (rowsFitting.length > 0) {
          const lastRow = rowsFitting[rowsFitting.length - 1];
          sliceHeightPx = lastRow.bottom - currentYPx;
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sliceHeightPx;
        const ctx = tempCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(canvas, 0, currentYPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
          const pageImgData = tempCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', 0, marginMm, pdfWidth, sliceHeightPx * pxToMm);
        }

        currentYPx += sliceHeightPx;
        isFirstPage = false;
        if (canvas.height - currentYPx < 10) break;
      }
      
      const fileDate = format(new Date(), 'yyyy-MM-dd');
      const fileName = `Saldo_Fisico_${monthKey}_${fileDate}.pdf`;
      
      pdf.save(fileName);

      toast({
        title: "Download concluído!",
        description: "O relatório foi salvo com sucesso.",
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

  if (!isMounted || !selectedMonth) return null;

  if (isUserLoading || isCheckingHelper || !user) {
    return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-6 px-6 font-body print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="pb-4 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden text-left">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-black uppercase tracking-tight font-headline">Relatório de Inventário</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white p-1 rounded-lg border shadow-sm print:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedMonth(prev => prev ? subMonths(prev, 1) : null)} 
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover open={isMonthPopoverOpen} onOpenChange={setIsMonthPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-8 px-3 font-black text-[10px] uppercase tracking-widest gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                    {monthLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedMonth(prev => prev ? subYears(prev, 1) : null)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{format(displayMonth, 'yyyy')}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedMonth(prev => prev ? addYears(prev, 1) : null)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const date = setMonth(displayMonth, i);
                        const isSelected = displayMonth.getMonth() === i;
                        return (
                          <Button 
                            key={i} 
                            variant={isSelected ? "default" : "ghost"} 
                            className={cn("h-9 text-[10px] font-bold uppercase", isSelected && "bg-primary text-primary-foreground")} 
                            onClick={() => { setSelectedMonth(date); setIsMonthPopoverOpen(false); }}
                          >
                            {format(date, 'MMM', { locale: ptBR })}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedMonth(prev => prev ? addMonths(prev, 1) : null)} 
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleDownloadPDF} 
              disabled={isDownloading || filteredItems.length === 0}
              className="gap-2 font-black uppercase text-[10px] tracking-widest h-10 shadow-md transition-all active:scale-95"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Baixar PDF
            </Button>
          </div>
        </div>

        <Card id="report-content" className="border-none shadow-xl overflow-hidden print:shadow-none print:border border-black bg-white pdf-export-content">
          <CardHeader className="bg-white border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
            <div className="text-left space-y-1">
              <CardTitle className="uppercase font-black text-base">Resumo de Saldo Físico</CardTitle>
              <CardDescription className="uppercase font-bold text-[10px] tracking-widest text-muted-foreground">
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
              <Table className="border-black border-separate border-spacing-0">
                <TableHeader className="bg-neutral-50/50">
                  <TableRow className="border-b border-black">
                    <TableHead className="w-[80px] font-black uppercase text-[9px] text-center border-r border-b border-black h-10">N.º</TableHead>
                    <TableHead className="font-black uppercase text-[9px] border-r border-b border-black h-10">Publicação</TableHead>
                    <TableHead className="w-[80px] font-black uppercase text-[9px] text-center border-r border-b border-black bg-primary/5 h-10 leading-tight">Anterior</TableHead>
                    <TableHead className="w-[80px] font-black uppercase text-[9px] text-center border-b border-black bg-accent/5 h-10 leading-tight">Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isSelected = selectedRowId === item.id;
                    const imagePlaceholder = item.imageKey ? PlaceHolderImages.find(img => img.id === item.imageKey) : null;
                    
                    return (
                      <TableRow 
                        key={item.id} 
                        onClick={() => setSelectedRowId(isSelected ? null : item.id)}
                        className={cn(
                          "hover:bg-accent/5 transition-all border-none cursor-pointer",
                          isSelected && "bg-primary/20 hover:bg-primary/25"
                        )}
                      >
                        <TableCell className="text-center font-bold text-[10px] text-neutral-400 border-r border-b border-black p-1 leading-tight">{item.code || '---'}</TableCell>
                        <TableCell className="border-r border-b border-black p-1 px-3 text-left leading-tight">
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
                          "text-center font-black text-xs border-r border-b border-black bg-primary/5 p-1 leading-tight",
                          (item.previous || 0) === 0 && "text-neutral-300 font-normal"
                        )}>
                          {formatNumber(item.previous)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-center font-black text-xs border-b border-black bg-accent/5 p-1 leading-tight",
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
