
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
}

interface MonthlySelection {
  apostila: boolean;
  apostilaQty: number;
  apostilaG: boolean;
  apostilaGQty: number;
  sentinela: boolean;
  sentinelaQty: number;
  sentinelaG: boolean;
  sentinelaGQty: number;
}

export default function OrderFormPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(new Date()));
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  // Referência para os nomes dos publicadores (Global)
  const publishersRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'order_form', 'publishers');
  }, [db, user]);

  // Referência para as seleções do mês corrente
  const monthlySelectionsRef = useMemoFirebase(() => {
    if (!db || !user || !monthKey) return null;
    return doc(db, 'users', user.uid, 'order_form', `month_${monthKey}`);
  }, [db, user, monthKey]);

  const { data: publishersData, isLoading: isLoadingPublishers } = useDoc(publishersRef);
  const { data: monthlyData, isLoading: isLoadingMonthly } = useDoc(monthlySelectionsRef);

  const publishers: Publisher[] = publishersData?.list || [];
  const selections: Record<string, MonthlySelection> = monthlyData?.selections || {};

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleAddPublisher = () => {
    if (!publishersRef) return;
    const newPublisher: Publisher = {
      id: `pub_${Date.now()}`,
      name: ''
    };
    const newList = [...publishers, newPublisher];
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
  };

  const handleRemovePublisher = (id: string) => {
    if (!publishersRef) return;
    const newList = publishers.filter(p => p.id !== id);
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
  };

  const handleNameChange = (id: string, name: string) => {
    if (!publishersRef) return;
    const newList = publishers.map(p => p.id === id ? { ...p, name } : p);
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
  };

  const handleToggleCheck = (publisherId: string, field: keyof MonthlySelection) => {
    if (!monthlySelectionsRef) return;
    const current = selections[publisherId] || { 
      apostila: false, apostilaQty: 0, 
      apostilaG: false, apostilaGQty: 0, 
      sentinela: false, sentinelaQty: 0, 
      sentinelaG: false, sentinelaGQty: 0 
    };
    const updatedSelections = {
      ...selections,
      [publisherId]: {
        ...current,
        [field]: !current[field]
      }
    };
    setDocumentNonBlocking(monthlySelectionsRef, { selections: updatedSelections }, { merge: true });
  };

  const handleQtyChange = (publisherId: string, field: keyof MonthlySelection, value: string) => {
    if (!monthlySelectionsRef) return;
    const numValue = parseInt(value.replace(/\D/g, '')) || 0;
    const current = selections[publisherId] || { 
      apostila: false, apostilaQty: 0, 
      apostilaG: false, apostilaGQty: 0, 
      sentinela: false, sentinelaQty: 0, 
      sentinelaG: false, sentinelaGQty: 0 
    };
    const updatedSelections = {
      ...selections,
      [publisherId]: {
        ...current,
        [field]: numValue
      }
    };
    setDocumentNonBlocking(monthlySelectionsRef, { selections: updatedSelections }, { merge: true });
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 font-body">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabeçalho e Seletor de Mês */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <CheckSquare2 className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black uppercase tracking-tight">Pedido de Publicadores</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Controle de pedidos individuais</p>
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

        {/* Tabela de Pedidos */}
        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-white border-b p-0">
            <div className="grid grid-cols-12 w-full">
              <div className="col-span-4 p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r">Nome</div>
              <div className="col-span-2 p-4 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50">Apostila</div>
              <div className="col-span-2 p-4 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50">Apostila G</div>
              <div className="col-span-2 p-4 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50">A Sentinela</div>
              <div className="col-span-2 p-4 text-[10px] font-black uppercase tracking-widest text-center bg-neutral-50/50">A Sentinela G</div>
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
                  const state = selections[pub.id] || { 
                    apostila: false, apostilaQty: 0, 
                    apostilaG: false, apostilaGQty: 0, 
                    sentinela: false, sentinelaQty: 0, 
                    sentinelaG: false, sentinelaGQty: 0 
                  };
                  
                  const renderCell = (field: keyof MonthlySelection, qtyField: keyof MonthlySelection) => (
                    <div className="flex items-center justify-center gap-2 px-2">
                      <Checkbox 
                        checked={state[field] as boolean} 
                        onCheckedChange={() => handleToggleCheck(pub.id, field)}
                        className="h-5 w-5"
                      />
                      <div className="relative">
                        <Input 
                          type="text"
                          inputMode="numeric"
                          value={state[qtyField] === 0 ? '' : state[qtyField]}
                          onChange={(e) => handleQtyChange(pub.id, qtyField, e.target.value)}
                          className="w-10 h-8 p-1 text-center font-black text-xs bg-neutral-50 border-neutral-200 focus:bg-white"
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
                          value={pub.name}
                          onChange={(e) => handleNameChange(pub.id, e.target.value)}
                          placeholder="Nome do publicador..."
                          className="border-none shadow-none focus-visible:ring-0 font-bold uppercase text-xs h-8 bg-transparent"
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

            <div className="p-4 bg-neutral-50/50 flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleAddPublisher}
                className="gap-2 font-black uppercase text-[10px] tracking-widest border-dashed border-2 hover:bg-white transition-all h-10 px-8"
              >
                <Plus className="h-4 w-4" /> Adicionar Publicador
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé Informativo */}
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3 text-left">
          <div className="bg-primary/20 p-1.5 rounded-full mt-0.5">
            <CheckSquare2 className="h-3 w-3 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Dica de Gestão</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
              Utilize o campo numérico para registrar a quantidade de cada item. O check ajuda a identificar quem já retirou as publicações no balcão. 
              As quantidades são salvas apenas para o mês selecionado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
