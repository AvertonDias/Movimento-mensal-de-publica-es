
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
  CheckSquare2,
  Search,
  Filter,
  X,
  Loader2
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
    if (!window.confirm("Deseja realmente excluir este publicador e todas as suas quantidades fixas?")) return;
    if (!publishersRef) return;
    const newList = publishers.filter(p => p.id !== id);
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
  };

  const handleFieldChange = (id: string, field: keyof Publisher, value: string | number) => {
    if (!publishersRef) return;
    const newList = publishers.map(p => {
      if (p.id === id) {
        if (typeof value === 'string' && field !== 'name') {
          const numValue = parseInt(value.replace(/\D/g, '')) || 0;
          return { ...p, [field]: numValue };
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
    
    const isChecking = !current[field];
    const message = isChecking 
      ? "Confirmar entrega desta publicação?" 
      : "Deseja remover a marcação de entrega?";
      
    if (!window.confirm(message)) return;

    const updatedChecks = {
      ...checks,
      [publisherId]: {
        ...current,
        [field]: isChecking
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
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
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
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12 px-2 sm:px-4 font-body">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <CheckSquare2 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left overflow-hidden">
              <h1 className="text-base font-black uppercase tracking-tight truncate leading-none">Controle de Periódicos</h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Assinaturas Fixas</p>
            </div>
          </div>

          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border justify-between overflow-hidden sm:min-w-[200px]">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
              className="h-8 w-8 shrink-0 hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 px-2 font-black text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-1 overflow-hidden select-none">
              <span className="truncate">{monthLabel}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
              className="h-8 w-8 shrink-0 hover:bg-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="flex gap-2 w-full">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-white border-neutral-200 focus:ring-primary shadow-sm font-bold uppercase text-[11px] w-full"
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
          <Button 
            onClick={handleAddPublisher} 
            className="h-10 bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>

        {/* Main Content */}
        <div className="relative min-h-[300px]">
          {(isLoadingPublishers || isLoadingMonthly) && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {filteredPublishers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30 bg-white rounded-xl border border-dashed">
              <User className="h-12 w-12" />
              <p className="font-black uppercase text-xs tracking-widest">
                {searchTerm ? 'Nenhum resultado' : 'Lista vazia'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredPublishers.map((pub) => {
                const state = checks[pub.id] || { 
                  apostila: false, 
                  apostilaG: false, 
                  sentinela: false, 
                  sentinelaG: false 
                };
                
                const renderItemCell = (checkField: keyof MonthlyChecks, qtyField: keyof Publisher, label: string) => {
                  const currentQty = pub[qtyField] ?? 0;
                  const hasQty = currentQty > 0;
                  
                  return (
                    <div className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                      hasQty ? "bg-white border-neutral-200" : "bg-neutral-50 border-neutral-100 opacity-40"
                    )}>
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2 text-center leading-tight">
                        {label}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <Input 
                            type="text"
                            inputMode="numeric"
                            value={pub[qtyField] === 0 ? '' : (pub[qtyField] ?? '')}
                            onChange={(e) => handleFieldChange(pub.id, qtyField, e.target.value)}
                            className="w-12 h-9 p-1 text-center font-black text-sm bg-neutral-50 border-neutral-200 focus:bg-white focus:ring-1 focus:ring-primary shadow-inner rounded-lg"
                            placeholder="0"
                          />
                        </div>
                        <Checkbox 
                          checked={hasQty ? (state[checkField] || false) : false} 
                          onCheckedChange={() => handleToggleCheck(pub.id, checkField)}
                          disabled={!hasQty}
                          className={cn(
                            "h-6 w-6 border-2 transition-all rounded-md",
                            state[checkField] && hasQty ? "bg-emerald-500 border-emerald-600 text-white" : "border-neutral-300",
                            !hasQty && "opacity-20"
                          )}
                        />
                      </div>
                    </div>
                  );
                };

                return (
                  <Card key={pub.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all bg-white">
                    <div className="p-4 space-y-4">
                      {/* Name and Delete Row */}
                      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="bg-primary/10 p-1.5 rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <Input 
                            value={pub.name ?? ''}
                            onChange={(e) => handleFieldChange(pub.id, 'name', e.target.value)}
                            placeholder="Nome do publicador..."
                            className="border-none shadow-none focus-visible:ring-0 font-black uppercase text-sm h-8 bg-transparent p-0 placeholder:text-neutral-300"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemovePublisher(pub.id)}
                          className="h-8 w-8 text-neutral-300 hover:text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Items Grid 2x2 for Mobile Efficiency */}
                      <div className="grid grid-cols-2 gap-3">
                        {renderItemCell('apostila', 'apostilaQty', 'Apostila (Normal)')}
                        {renderItemCell('apostilaG', 'apostilaGQty', 'Apostila (Grande)')}
                        {renderItemCell('sentinela', 'sentinelaQty', 'Sentinela (Normal)')}
                        {renderItemCell('sentinelaG', 'sentinelaGQty', 'Sentinela (Grande)')}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Tip */}
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3 text-left">
          <div className="bg-primary/20 p-1.5 rounded-full mt-0.5 shrink-0">
            <CheckSquare2 className="h-3 w-3 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Dica de Gestão Digital</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
              As quantidades de assinaturas fixas são salvas para todos os meses. O checkbox de entrega é exclusivo do mês atual e só fica disponível quando houver uma quantidade maior que zero.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
