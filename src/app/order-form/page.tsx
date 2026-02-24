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
  Search,
  Filter,
  X
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type FilterType = 'all' | 'checked' | 'unchecked';

export default function OrderFormPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [colFilters, setColFilters] = useState<Record<string, FilterType>>({
    apostila: 'all',
    apostilaG: 'all',
    sentinela: 'all',
    sentinelaG: 'all'
  });

  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthLabel = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  const publishersRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'order_form', 'publishers');
  }, [db, user]);

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

  const filteredPublishers = useMemo(() => {
    return publishers.filter(pub => {
      const matchesSearch = (pub.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const state = checks[pub.id] || { 
        apostila: false, 
        apostilaG: false, 
        sentinela: false, 
        sentinelaG: false 
      };

      const matchApo = colFilters.apostila === 'all' || (colFilters.apostila === 'checked' ? state.apostila : !state.apostila);
      const matchApoG = colFilters.apostilaG === 'all' || (colFilters.apostilaG === 'checked' ? state.apostilaG : !state.apostilaG);
      const matchSen = colFilters.sentinela === 'all' || (colFilters.sentinela === 'checked' ? state.sentinela : !state.sentinela);
      const matchSenG = colFilters.sentinelaG === 'all' || (colFilters.sentinelaG === 'checked' ? state.sentinelaG : !state.sentinelaG);

      return matchesSearch && matchApo && matchApoG && matchSen && matchSenG;
    });
  }, [publishers, searchTerm, colFilters, checks]);

  if (isUserLoading || !user) return null;

  const renderHeaderFilter = (title: string, field: string) => (
    <div className="flex flex-col items-center justify-center gap-1">
      <span className="leading-tight">{title}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn("h-6 w-6", colFilters[field] !== 'all' && "text-primary")}>
            <Filter className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest">Filtro: {title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={colFilters[field]} onValueChange={(val) => setColFilters(prev => ({ ...prev, [field]: val as FilterType }))}>
            <DropdownMenuRadioItem value="all" className="text-xs font-bold uppercase">Todos</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="checked" className="text-xs font-bold uppercase text-emerald-600">Entregues</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="unchecked" className="text-xs font-bold uppercase text-amber-600">Pendentes</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 font-body">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="space-y-4 pb-4 pt-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                <CheckSquare2 className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left overflow-hidden">
                <h1 className="text-lg font-black uppercase tracking-tight truncate">Controle de Periódicos</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">
                  Assinaturas fixas mensais.<br />Entrega exclusiva do mês selecionado.
                </p>
              </div>
            </div>

            <div className="flex items-center bg-neutral-100 p-1 rounded-lg border w-full md:w-auto justify-between md:justify-center overflow-hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
                className="h-9 w-9 shrink-0 hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 md:flex-none px-4 font-black text-[11px] uppercase tracking-widest min-w-[120px] md:min-w-[160px] text-center flex items-center justify-center gap-2 overflow-hidden select-none">
                <Calendar className="h-4 w-4 text-primary shrink-0 hidden sm:block" />
                <span className="truncate">{monthLabel}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
                className="h-9 w-9 shrink-0 hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar publicador por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white border-neutral-200 focus:ring-primary shadow-sm font-bold uppercase text-xs w-full"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-neutral-200">
            <div className="min-w-[900px]">
              <CardHeader className="bg-white border-b p-0">
                <div className="grid grid-cols-12 w-full">
                  <div className="col-span-4 p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r flex items-center">
                    Nome do Publicador
                  </div>
                  <div className="col-span-2 p-2 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50">
                    {renderHeaderFilter('Apostila (Normal)', 'apostila')}
                  </div>
                  <div className="col-span-2 p-2 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50">
                    {renderHeaderFilter('Apostila (Grande)', 'apostilaG')}
                  </div>
                  <div className="col-span-2 p-2 text-[10px] font-black uppercase tracking-widest text-center border-r bg-neutral-50/50">
                    {renderHeaderFilter('A Sentinela (Normal)', 'sentinela')}
                  </div>
                  <div className="col-span-2 p-2 text-[10px] font-black uppercase tracking-widest text-center bg-neutral-50/50">
                    {renderHeaderFilter('A Sentinela (Grande)', 'sentinelaG')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-white min-h-[400px] relative">
                {(isLoadingPublishers || isLoadingMonthly) && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {filteredPublishers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                    <User className="h-12 w-12" />
                    <p className="font-black uppercase text-xs tracking-widest">
                      {searchTerm ? 'Nenhum resultado para a busca' : 'Nenhum publicador na lista'}
                    </p>
                    {!searchTerm && (
                      <Button variant="outline" size="sm" onClick={handleAddPublisher} className="font-black uppercase text-[10px]">
                        Adicionar Primeiro
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y border-b">
                    {filteredPublishers.map((pub) => {
                      const state = checks[pub.id] || { 
                        apostila: false, 
                        apostilaG: false, 
                        sentinela: false, 
                        sentinelaG: false 
                      };
                      
                      const renderCell = (checkField: keyof MonthlyChecks, qtyField: keyof Publisher) => {
                        const currentQty = pub[qtyField] ?? 0;
                        const hasQty = currentQty > 0;
                        
                        return (
                          <div className="flex items-center justify-center gap-3 px-2">
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
                            <Checkbox 
                              checked={hasQty ? (state[checkField] || false) : false} 
                              onCheckedChange={() => handleToggleCheck(pub.id, checkField)}
                              disabled={!hasQty}
                              className={cn(
                                "h-5 w-5 border-2 transition-all",
                                state[checkField] && hasQty ? "bg-emerald-500 border-emerald-600" : "border-neutral-300",
                                !hasQty && "opacity-20 cursor-not-allowed"
                              )}
                            />
                          </div>
                        );
                      };

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

        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3 text-left">
          <div className="bg-primary/20 p-1.5 rounded-full mt-0.5 shrink-0">
            <CheckSquare2 className="h-3 w-3 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Dica de Gestão Digital</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
              As quantidades de assinaturas fixas são salvas para todos os meses. O checkbox de entrega é exclusivo do mês atual e só fica disponível quando houver uma quantidade maior que zero. Use os filtros no topo das colunas para encontrar quem ainda não retirou os itens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
