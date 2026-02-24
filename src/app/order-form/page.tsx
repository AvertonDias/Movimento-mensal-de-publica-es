
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  User, 
  Calendar,
  Loader2,
  CheckSquare2,
  Hash
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Publisher {
  id: string;
  name: string;
  apostilaQty: number;
  apostilaGQty: number;
  sentinelaQty: number;
  sentinelaGQty: number;
}

interface MonthlyChecks {
  apostila: boolean;
  apostilaG: boolean;
  sentinela: boolean;
  sentinelaG: boolean;
}

export default function OrderFormPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(new Date()));
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  // Referência para os nomes e quantidades habituais dos publicadores (Global)
  const publishersRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'order_form', 'publishers');
  }, [db, user]);

  // Referência para as marcações (checks) do mês corrente
  const monthlyChecksRef = useMemoFirebase(() => {
    if (!db || !user || !monthKey) return null;
    return doc(db, 'users', user.uid, 'order_form', `checks_${monthKey}`);
  }, [db, user, monthKey]);

  const { data: publishersData, isLoading: isLoadingPublishers } = useDoc(publishersRef);
  const { data: monthlyData, isLoading: isLoadingMonthly } = useDoc(monthlyChecksRef);

  const publishers: Publisher[] = publishersData?.list || [];
  const checks: Record<string, MonthlyChecks> = monthlyData?.checks || {};

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleAddPublisher = () => {
    if (!publishersRef) return;
    const newPublisher: Publisher = {
      id: `pub_${Date.now()}`,
      name: '',
      apostilaQty: 0,
      apostilaGQty: 0,
      sentinelaQty: 0,
      sentinelaGQty: 0
    };
    const newList = [...publishers, newPublisher];
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
  };

  const handleRemovePublisher = (id: string) => {
    if (!publishersRef) return;
    const newList = publishers.filter(p => p.id !== id);
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
  };

  const handleFieldChange = (id: string, field: keyof Publisher, value: string | number) => {
    if (!publishersRef) return;
    const newList = publishers.map(p => {
      if (p.id === id) {
        if (typeof value === 'string' && field !== 'name') {
          return { ...p, [field]: parseInt(value.replace(/\D/g, '')) || 0 };
        }
        return { ...p, [field]: value };
      }
      return p;
    });
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
  };

  const handleToggleCheck = (publisherId: string, field: keyof MonthlyChecks) => {
    if (!monthlyChecksRef) return;
    const current = checks[publisherId] || { 
      apostila: false, 
      apostilaG: false, 
      sentinela: false, 
      sentinelaG: false 
    };
    const updatedChecks = {
      ...checks,
      [publisherId]: {
        ...current,
        [field]: !current[field]
      }
    };
    setDocumentNonBlocking(monthlyChecksRef, { checks: updatedChecks }, { merge: true });
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 font-body">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho e Seletor de Mês */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <CheckSquare2 className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black uppercase tracking-tight">Pedido de Publicadores</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">
                As quantidades são salvas para todos os meses.<br />O check é exclusivo do mês atual.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg border">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 font-black text-[10px] uppercase tracking-widest min-w-[140px] text-center flex items-center justify-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {monthLabel}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabela de Pedidos - Com Rolagem Horizontal em Telas Pequenas */}
        <Card className="border-none shadow-xl overflow-hidden">
          <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-neutral-200">
            <div className="min-w-[800px]">
              <CardHeader className="bg-white border-b p-0">
                <div className="grid grid-cols-12 w-full">
                  <div className="col-span-4 p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r">Nome do Publicador</div>
                  <div className="col-span-2 p-4 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50 leading-tight">Apostila<br/>(Normal)</div>
                  <div className="col-span-2 p-4 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50 leading-tight">Apostila<br/>(Grande)</div>
                  <div className="col-span-2 p-4 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50 leading-tight">A Sentinela<br/>(Normal)</div>
                  <div className="col-span-2 p-4 text-[10px] font-black uppercase tracking-widest text-center bg-neutral-50/50 leading-tight">A Sentinela<br/>(Grande)</div>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-white min-h-[400px] relative">
                {(isLoadingPublishers || isLoadingMonthly) && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {publishers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                    <User className="h-12 w-12" />
                    <p className="font-black uppercase text-xs tracking-widest">Nenhum publicador na lista</p>
                    <Button variant="outline" size="sm" onClick={handleAddPublisher} className="font-black uppercase text-[10px]">
                      Adicionar Primeiro
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y border-b">
                    {publishers.map((pub) => {
                      const state = checks[pub.id] || { 
                        apostila: false, 
                        apostilaG: false, 
                        sentinela: false, 
                        sentinelaG: false 
                      };
                      
                      const renderCell = (checkField: keyof MonthlyChecks, qtyField: keyof Publisher) => (
                        <div className="flex items-center justify-center gap-3 px-2">
                          <Checkbox 
                            checked={state[checkField] || false} 
                            onCheckedChange={() => handleToggleCheck(pub.id, checkField)}
                            className="h-5 w-5 border-2"
                          />
                          <div className="relative">
                            <Input 
                              type="text"
                              inputMode="numeric"
                              value={pub[qtyField] === 0 ? '' : (pub[qtyField] ?? '')}
                              onChange={(e) => handleFieldChange(pub.id, qtyField, e.target.value)}
                              className="w-10 h-8 p-1 text-center font-black text-xs bg-neutral-50 border-neutral-200 focus:bg-white focus:ring-1 focus:ring-primary shadow-inner"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      );

                      return (
                        <div key={pub.id} className="grid grid-cols-12 group hover:bg-primary/5 transition-colors items-center h-14">
                          <div className="col-span-4 px-2 flex items-center gap-2 border-r h-full">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemovePublisher(pub.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Input 
                              value={pub.name ?? ''}
                              onChange={(e) => handleFieldChange(pub.id, 'name', e.target.value)}
                              placeholder="Nome do publicador..."
                              className="border-none shadow-none focus-visible:ring-0 font-bold uppercase text-xs h-8 bg-transparent w-full"
                            />
                          </div>
                          
                          <div className="col-span-2 border-r h-full flex items-center justify-center">
                            {renderCell('apostila', 'apostilaQty')}
                          </div>
                          <div className="col-span-2 border-r h-full flex items-center justify-center">
                            {renderCell('apostilaG', 'apostilaGQty')}
                          </div>
                          <div className="col-span-2 border-r h-full flex items-center justify-center">
                            {renderCell('sentinela', 'sentinelaQty')}
                          </div>
                          <div className="col-span-2 h-full flex items-center justify-center">
                            {renderCell('sentinelaG', 'sentinelaGQty')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-6 bg-neutral-50/50 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleAddPublisher}
                    className="gap-2 font-black uppercase text-[10px] tracking-widest border-dashed border-2 hover:bg-white hover:border-primary hover:text-primary transition-all h-11 px-8 shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Adicionar Novo Publicador
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Rodapé Informativo */}
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3 text-left">
          <div className="bg-primary/20 p-1.5 rounded-full mt-0.5 shrink-0">
            <CheckSquare2 className="h-3 w-3 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Dica de Gestão Digital</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
              As quantidades registradas nos campos numéricos são fixas e servem como sua lista base. Ao mudar o mês, os números permanecem lá, mas os checks são resetados para que você marque as retiradas do novo mês.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
