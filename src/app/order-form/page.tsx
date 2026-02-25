'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format, subMonths, addMonths, startOfMonth, setMonth, addYears, subYears } from 'date-fns';
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
  X,
  Loader2,
  AlertTriangle,
  Calendar as CalendarIcon,
  Filter
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type FilterStatus = 'all' | 'pending' | 'completed' | 'pending_apostila' | 'pending_apostilaG' | 'pending_sentinela' | 'pending_sentinelaG';

export default function OrderFormPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const hasCleanedUp = useRef(false);

  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isMonthPopoverOpen, setIsMonthPopoverOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const [deleteConfig, setDeleteConfig] = useState<{ id: string, name: string } | null>(null);
  const [toggleConfig, setToggleConfig] = useState<{ 
    publisherId: string, 
    field: keyof MonthlyChecks, 
    pubName: string, 
    itemLabel: string,
    isChecking: boolean 
  } | null>(null);

  const [confirmQtyConfig, setConfirmQtyConfig] = useState<{
    id: string,
    field: keyof Publisher,
    newValue: number,
    oldValue: number,
    pubName: string,
    label: string
  } | null>(null);

  const [localQtyValues, setLocalQtyValues] = useState<Record<string, string>>({});
  const [localNameValues, setLocalNameValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsMounted(true);
    // Persistência de mês apenas nesta página
    const savedMonth = localStorage.getItem('order_form_selected_month');
    if (savedMonth) {
      try {
        const date = new Date(savedMonth);
        if (!isNaN(date.getTime())) {
          setSelectedMonth(startOfMonth(date));
        } else {
          setSelectedMonth(startOfMonth(new Date()));
        }
      } catch (e) {
        setSelectedMonth(startOfMonth(new Date()));
      }
    } else {
      setSelectedMonth(startOfMonth(new Date()));
    }
  }, []);

  useEffect(() => {
    if (isMounted && selectedMonth) {
      localStorage.setItem('order_form_selected_month', selectedMonth.toISOString());
    }
  }, [selectedMonth, isMounted]);

  const displayMonth = selectedMonth || new Date();
  const monthKey = format(displayMonth, 'yyyy-MM');
  const monthLabel = format(displayMonth, 'MMMM yyyy', { locale: ptBR });

  const publishersRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'order_form', 'publishers');
  }, [db, user]);

  const monthlyChecksRef = useMemoFirebase(() => {
    if (!db || !user || !monthKey || !isMounted) return null;
    return doc(db, 'users', user.uid, 'order_form', `checks_${monthKey}`);
  }, [db, user, monthKey, isMounted]);

  const { data: publishersData, isLoading: isLoadingPublishers } = useDoc(publishersRef);
  const { data: monthlyData, isLoading: isLoadingMonthly } = useDoc(monthlyChecksRef);

  const publishers: Publisher[] = publishersData?.list || [];
  const checks: Record<string, MonthlyChecks> = monthlyData?.checks || {};

  useEffect(() => {
    if (publishers.length > 0) {
      const currentIds = publishers.map(p => p.id);
      const isSync = orderedIds.length === currentIds.length && 
                     orderedIds.every(id => currentIds.includes(id));
      
      if (!isSync) {
        const withName = publishers.filter(p => p.name && p.name.trim() !== "");
        const withoutName = publishers.filter(p => !p.name || p.name.trim() === "");
        
        const sortedWithName = [...withName].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        const finalSorted = [...sortedWithName, ...withoutName];
          
        setOrderedIds(finalSorted.map(p => p.id));
      }
    } else if (orderedIds.length > 0) {
      setOrderedIds([]);
    }
  }, [publishers.length, publishersData, orderedIds.length]);

  useEffect(() => {
    if (!isLoadingPublishers && publishers.length > 0 && !hasCleanedUp.current && publishersRef) {
      const emptyItems = publishers.filter(p => !p.name || p.name.trim() === "");
      if (emptyItems.length > 0) {
        const cleanedList = publishers.filter(p => p.name && p.name.trim() !== "");
        setDocumentNonBlocking(publishersRef, { list: cleanedList }, { merge: true });
      }
      hasCleanedUp.current = true;
    }
  }, [isLoadingPublishers, publishers, publishersRef]);

  useEffect(() => {
    if (isMounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, isMounted]);

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

  const confirmDelete = () => {
    if (!deleteConfig || !publishersRef) return;
    const newList = publishers.filter(p => p.id !== deleteConfig.id);
    setOrderedIds([]); 
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
    setDeleteConfig(null);
  };

  const confirmToggle = () => {
    if (!toggleConfig || !monthlyChecksRef) return;
    
    const { publisherId, field, isChecking } = toggleConfig;
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
        [field]: isChecking
      }
    };
    setDocumentNonBlocking(monthlyChecksRef, { checks: updatedChecks }, { merge: true });
    setToggleConfig(null);
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

  const saveQtyChange = (id: string, field: keyof Publisher, value: number) => {
    if (!publishersRef) return;
    const newList = publishers.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setDocumentNonBlocking(publishersRef, { list: newList }, { merge: true });
  };

  const filteredPublishers = useMemo(() => {
    const baseList = orderedIds
      .map(id => publishers.find(p => p.id === id))
      .filter((p): p is Publisher => !!p);
    
    const newItems = publishers.filter(p => !orderedIds.includes(p.id));
    const fullList = [...baseList, ...newItems];

    return fullList.filter(pub => {
      const matchesSearch = (pub.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const state = checks[pub.id] || { apostila: false, apostilaG: false, sentinela: false, sentinelaG: false };
      
      const itemsWithQty = [
        { field: 'apostila', qty: pub.apostilaQty, checked: state.apostila },
        { field: 'apostilaG', qty: pub.apostilaGQty, checked: state.apostilaG },
        { field: 'sentinela', qty: pub.sentinelaQty, checked: state.sentinela },
        { field: 'sentinelaG', qty: pub.sentinelaGQty, checked: state.sentinelaG },
      ].filter(i => i.qty > 0);

      switch (filterStatus) {
        case 'pending':
          return itemsWithQty.some(i => !i.checked);
        case 'completed':
          return itemsWithQty.length > 0 && itemsWithQty.every(i => i.checked);
        case 'pending_apostila':
          return pub.apostilaQty > 0 && !state.apostila;
        case 'pending_apostilaG':
          return pub.apostilaGQty > 0 && !state.apostilaG;
        case 'pending_sentinela':
          return pub.sentinelaQty > 0 && !state.sentinela;
        case 'pending_sentinelaG':
          return pub.sentinelaGQty > 0 && !state.sentinelaG;
        default:
          return true;
      }
    });
  }, [publishers, searchTerm, orderedIds, filterStatus, checks]);

  if (!isMounted || !selectedMonth) return null;

  if (isUserLoading || !user) {
    return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-12 px-2 sm:px-4 font-body">
      <div className="max-w-6xl mx-auto space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <CheckSquare2 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left overflow-hidden">
              <h1 className="text-base font-black uppercase tracking-tight truncate leading-none">Controle de Periódicos</h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Controle a entrega de pedidos periódicos da congregação</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border justify-between overflow-hidden sm:min-w-[200px] w-full sm:w-auto">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedMonth(prev => prev ? subMonths(prev, 1) : null)}
                className="h-8 w-8 shrink-0 hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover open={isMonthPopoverOpen} onOpenChange={setIsMonthPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="flex-1 px-2 font-black text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-1 overflow-hidden select-none cursor-pointer hover:bg-white rounded transition-colors h-8">
                    <CalendarIcon className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">{monthLabel}</span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedMonth(prev => prev ? subYears(prev, 1) : null); 
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                        {format(displayMonth, 'yyyy')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedMonth(prev => prev ? addYears(prev, 1) : null); 
                        }}
                      >
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
                            className={cn(
                              "h-9 text-[10px] font-bold uppercase", 
                              isSelected && "bg-primary text-primary-foreground"
                            )} 
                            onClick={() => { 
                              setSelectedMonth(date); 
                              setIsMonthPopoverOpen(false); 
                            }}
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
                className="h-8 w-8 shrink-0 hover:bg-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              onClick={handleAddPublisher} 
              className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest h-9 px-6 shadow-md transition-all active:scale-95 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" /> Adiciona Periódico
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
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

          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(v: FilterStatus) => setFilterStatus(v)}>
              <SelectTrigger className="h-10 bg-white border-neutral-200 font-bold uppercase text-[9px] tracking-widest min-w-[160px] flex-1 sm:flex-none">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-primary" />
                  <SelectValue placeholder="Filtro de Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[9px] font-black uppercase">Todos</SelectItem>
                <SelectItem value="pending" className="text-[9px] font-black uppercase text-destructive">Possuem Pendências</SelectItem>
                <SelectItem value="completed" className="text-[9px] font-black uppercase text-emerald-600">Tudo Entregue</SelectItem>
                <SelectItem value="pending_apostila" className="text-[9px] font-black uppercase">Pendente: Apostila (N)</SelectItem>
                <SelectItem value="pending_apostilaG" className="text-[9px] font-black uppercase">Pendente: Apostila (G)</SelectItem>
                <SelectItem value="pending_sentinela" className="text-[9px] font-black uppercase">Pendente: Sentinela (N)</SelectItem>
                <SelectItem value="pending_sentinelaG" className="text-[9px] font-black uppercase">Pendente: Sentinela (G)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative min-h-[300px]">
          {(isLoadingPublishers || isLoadingMonthly) && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {filteredPublishers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30 bg-white rounded-xl border border-dashed">
              <User className="h-12 w-12" />
              <p className="font-black uppercase text-xs tracking-widest text-center px-4">
                {searchTerm || filterStatus !== 'all' ? 'Nenhum resultado para os filtros atuais' : 'Sua lista está vazia'}
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
                  const isChecked = hasQty ? (state[checkField] || false) : false;
                  
                  const inputKey = `${pub.id}-${qtyField}`;
                  const currentLocalValue = localQtyValues[inputKey];
                  const displayValue = currentLocalValue !== undefined ? currentLocalValue : (pub[qtyField] === 0 ? '' : String(pub[qtyField] ?? ''));

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
                            value={displayValue}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setLocalQtyValues(prev => ({ ...prev, [inputKey]: val }));
                            }}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => {
                              const newValue = parseInt(localQtyValues[inputKey] || '0') || 0;
                              const oldValue = pub[qtyField] as number || 0;
                              
                              if (newValue !== oldValue) {
                                if (oldValue > 0) {
                                  setConfirmQtyConfig({
                                    id: pub.id,
                                    field: qtyField as keyof Publisher,
                                    newValue,
                                    oldValue,
                                    pubName: pub.name || 'este(a) publicador(a)',
                                    label
                                  });
                                } else {
                                  saveQtyChange(pub.id, qtyField as keyof Publisher, newValue);
                                }
                              }
                              setLocalQtyValues(prev => {
                                const newState = { ...prev };
                                delete newState[inputKey];
                                return newState;
                              });
                            }}
                            className="w-12 h-9 p-1 text-center font-black text-sm bg-neutral-50 border-neutral-200 focus:bg-white focus:ring-1 focus:ring-primary shadow-inner rounded-lg"
                            placeholder="0"
                          />
                        </div>
                        <Checkbox 
                          checked={isChecked} 
                          onCheckedChange={() => {
                            if (!hasQty) return;
                            setToggleConfig({
                              publisherId: checkField,
                              field: checkField,
                              pubName: pub.name || 'este(a) publicador(a)',
                              itemLabel: label,
                              isChecking: !isChecked
                            });
                          }}
                          disabled={!hasQty}
                          className={cn(
                            "h-6 w-6 border-2 transition-all rounded-md",
                            isChecked ? "bg-primary border-primary text-primary-foreground" : "border-neutral-300",
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
                      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="bg-primary/10 p-1.5 rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <Input 
                            value={localNameValues[pub.id] ?? pub.name ?? ''}
                            onChange={(e) => setLocalNameValues(prev => ({ ...prev, [pub.id]: e.target.value }))}
                            onBlur={() => {
                              const val = localNameValues[pub.id];
                              if (val === undefined) return;
                              
                              const trimmed = val.trim();
                              if (trimmed === pub.name?.trim()) {
                                setLocalNameValues(prev => {
                                  const next = { ...prev };
                                  delete next[pub.id];
                                  return next;
                                });
                                return;
                              }

                              if (trimmed === '') {
                                setLocalNameValues(prev => {
                                  const next = { ...prev };
                                  delete next[pub.id];
                                  return next;
                                });
                                return;
                              }

                              const isDuplicate = publishers.some(p => 
                                p.id !== pub.id && 
                                p.name.trim().toLowerCase() === trimmed.toLowerCase()
                              );

                              if (isDuplicate) {
                                toast({
                                  variant: "destructive",
                                  title: "Nome Duplicado",
                                  description: `O publicador "${trimmed}" já existe na sua lista.`,
                                });
                                setLocalNameValues(prev => {
                                  const next = { ...prev };
                                  delete next[pub.id];
                                  return next;
                                });
                              } else {
                                handleFieldChange(pub.id, 'name', trimmed);
                                setLocalNameValues(prev => {
                                  const next = { ...prev };
                                  delete next[pub.id];
                                  return next;
                                });
                              }
                            }}
                            placeholder="Nome"
                            className="border-none shadow-none focus-visible:ring-0 font-black uppercase text-sm h-8 bg-transparent p-0 placeholder:text-neutral-300"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteConfig({ id: pub.id, name: pub.name })}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3 text-left">
          <div className="bg-primary p-1.5 rounded-full mt-0.5 shrink-0">
            <CheckSquare2 className="h-3 w-3 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary-foreground tracking-widest">Dica de Gestão Digital</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
              Exemplo: a apostila do mês de Abril deve ser marcada como entregue com o calendário no topo selecionado em "Abril". As quantidades fixas são permanentes para todos os meses. Já a marcação de entrega (o check) é individual.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteConfig} onOpenChange={(open) => !open && setDeleteConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 uppercase font-black text-destructive text-left">
              <AlertTriangle className="h-5 w-5" />
              Remover Registro?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold uppercase text-xs leading-relaxed text-left">
              Deseja realmente remover <span className="text-foreground">"{deleteConfig?.name || 'sem nome'}"</span> e todas as suas quantidades fixas do sistema?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-black uppercase text-[10px] tracking-widest">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] tracking-widest"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toggleConfig} onOpenChange={(open) => !open && setToggleConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black text-left">
              {toggleConfig?.isChecking ? "Confirmar Entrega?" : "Remover Marcação?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold uppercase text-xs leading-relaxed text-left">
              {toggleConfig?.isChecking 
                ? `Confirmar entrega de "${toggleConfig.itemLabel}" para ${toggleConfig.pubName}?`
                : `Deseja remover a marcação de entrega de "${toggleConfig?.itemLabel}" para ${toggleConfig?.pubName}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-black uppercase text-[10px] tracking-widest">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmToggle}
              className="font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90"
            >
              {toggleConfig?.isChecking ? "Sim, Marcar" : "Sim, Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmQtyConfig} onOpenChange={(open) => !open && setConfirmQtyConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black text-left">Confirmar Alteração?</AlertDialogTitle>
            <AlertDialogDescription className="font-bold uppercase text-xs leading-relaxed text-left">
              Você está alterando a quantidade fixa de <span className="text-primary">"{confirmQtyConfig?.label}"</span> para <span className="text-foreground">{confirmQtyConfig?.pubName}</span>.<br/><br/>
              De: <span className="text-destructive line-through font-black mx-1">{confirmQtyConfig?.oldValue}</span> para: <span className="text-primary font-black mx-1">{confirmQtyConfig?.newValue}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-black uppercase text-[10px] tracking-widest">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmQtyConfig) {
                  saveQtyChange(confirmQtyConfig.id, confirmQtyConfig.field, confirmQtyConfig.newValue);
                  setConfirmQtyConfig(null);
                }
              }}
              className="font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90"
            >
              Confirmar Alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
