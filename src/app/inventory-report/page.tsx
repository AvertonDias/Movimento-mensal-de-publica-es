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
import { ChevronLeft, FileText, Printer, Loader2, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OFFICIAL_PUBLICATIONS, InventoryItem } from "@/app/types/inventory";
import { cn } from "@/lib/utils";

export default function InventoryReportPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [selectedMonth] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

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
    
    // Combina oficiais e customizados com seus dados de estoque
    OFFICIAL_PUBLICATIONS.forEach((pub, idx) => {
      const id = pub.code || pub.abbr || `item_${idx}`;
      const remote = remoteItems?.find(i => i.id === id);
      
      const prev = Number(remote?.previous) || 0;
      const curr = Number(remote?.current) || 0;

      // Só adiciona se não for categoria e se tiver saldo em algum dos dois
      if (!pub.isCategory && (prev > 0 || curr > 0)) {
        combined.push({
          ...pub,
          id,
          previous: prev,
          current: curr,
        } as InventoryItem);
      }

      // Adiciona itens customizados desta categoria
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

  if (isUserLoading || isCheckingHelper || !user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 p-6 font-body print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/">
            <Button variant="ghost" className="gap-2 font-bold uppercase text-xs">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-black uppercase tracking-tight font-headline">Relatório de Inventário</h1>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 bg-white font-bold uppercase text-xs" 
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>

        <Card className="border-none shadow-xl overflow-hidden print:shadow-none print:border">
          <CardHeader className="bg-white border-b border-neutral-100 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="uppercase font-black text-lg">Resumo de Saldo Físico</CardTitle>
              <CardDescription className="uppercase font-bold text-[10px] tracking-widest text-muted-foreground mt-1">
                Competência: {monthLabel}
              </CardDescription>
            </div>
            {helperInvite && (
              <div className="bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg flex items-center gap-2 print:hidden">
                <ShieldCheck className="h-4 w-4 text-accent-foreground" />
                <span className="text-[9px] font-black uppercase text-accent-foreground tracking-widest">
                  Ajudante de {helperInvite.ownerName}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isFetchingData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gerando relatório...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <Info className="h-12 w-12 text-neutral-200 mx-auto" />
                <p className="text-neutral-400 font-bold uppercase text-xs tracking-widest">Nenhuma movimentação no mês selecionado</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-neutral-50/50">
                  <TableRow>
                    <TableHead className="w-[100px] font-black uppercase text-[10px] text-center border-r">N.º</TableHead>
                    <TableHead className="font-black uppercase text-[10px] border-r">Publicação</TableHead>
                    <TableHead className="w-[120px] font-black uppercase text-[10px] text-center border-r bg-primary/5">Estoque Anterior</TableHead>
                    <TableHead className="w-[120px] font-black uppercase text-[10px] text-center bg-accent/5">Estoque Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-transparent border-b">
                      <TableCell className="text-center font-bold text-xs text-neutral-400 border-r">{item.code || '---'}</TableCell>
                      <TableCell className="border-r">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm uppercase">{item.item}</span>
                          {item.abbr && <span className="text-[9px] font-black bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">{item.abbr}</span>}
                        </div>
                      </TableCell>
                      <TableCell className={cn(
                        "text-center font-black text-sm border-r bg-primary/5",
                        (item.previous || 0) === 0 && "text-neutral-300 font-normal"
                      )}>
                        {item.previous}
                      </TableCell>
                      <TableCell className={cn(
                        "text-center font-black text-sm bg-accent/5",
                        (item.current || 0) === 0 && "text-destructive"
                      )}>
                        {item.current}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-xl border border-primary/10 print:hidden">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
            Este relatório oculta automaticamente publicações que não possuem estoque inicial nem final no período selecionado.
          </p>
        </div>
      </div>
    </div>
  );
}
