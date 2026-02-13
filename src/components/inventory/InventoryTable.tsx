"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  Edit2,
  X,
  AlertTriangle,
  BellOff,
  Bell
} from "lucide-react";
import { 
  InventoryItem, 
  DEFAULT_COLUMNS
} from "@/app/types/inventory";
import { OFFICIAL_PUBLICATIONS } from "@/app/lib/publications";
import { cn } from "@/lib/utils";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking
} from '@/firebase';
import { collection, doc, getDocs } from 'firebase/firestore';
import { format, subMonths, addMonths, startOfMonth, setMonth, addYears, subYears, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddCustomItemDialog } from "./AddCustomItemDialog";
import { EditCustomItemDialog } from "./EditCustomItemDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";

interface InventoryTableProps {
  targetUserId?: string;
}

export function InventoryTable({ targetUserId }: InventoryTableProps) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const [searchTerm, setSearchTerm] = useState('');
  const [localData, setLocalData] = useState<Record<string, Partial<InventoryItem>>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isMonthPopoverOpen, setIsMonthPopoverOpen] = useState(false);
  const [historicalMinStock, setHistoricalMinStock] = useState<Record<string, number>>({});
  
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthName = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });
  
  const prevMonth = startOfMonth(subMonths(selectedMonth, 1));
  const prevMonthKey = format(prevMonth, 'yyyy-MM');

  const activeUid = targetUserId || user?.uid;

  const isDateInFuture = (date: Date) => {
    const currentMonthStart = startOfMonth(new Date());
    return !isBefore(startOfMonth(date), currentMonthStart);
  };

  useEffect(() => {
    async function calculateSmartMinStock() {
      if (!db || !activeUid) return;
      
      const last6Months = [1, 2, 3, 4, 5, 6].map(i => format(subMonths(selectedMonth, i), 'yyyy-MM'));
      const itemOutgoings: Record<string, number[]> = {};

      for (const mKey of last6Months) {
        const colRef = collection(db, 'users', activeUid, 'monthly_records', mKey, 'items');
        try {
          const snap = await getDocs(colRef);
          snap.forEach(docSnap => {
            const d = docSnap.data();
            const prev = Number(d.previous) || 0;
            const rec = Number(d.received) || 0;
            const curr = Number(d.current) || 0;
            const outgoing = Math.max(0, (prev + rec) - curr);
            
            if (!itemOutgoings[docSnap.id]) itemOutgoings[docSnap.id] = [];
            itemOutgoings[docSnap.id].push(outgoing);
          });
        } catch (e) {
          // Ignore
        }
      }

      const smartMins: Record<string, number> = {};
      Object.entries(itemOutgoings).forEach(([id, outs]) => {
        const nonZeroOuts = outs.filter(v => v > 0);
        if (nonZeroOuts.length === 0) return;
        
        const avg = outs.reduce((a, b) => a + b, 0) / outs.length;
        smartMins[id] = Math.max(1, Math.ceil(avg * 1.2));
      });
      
      setHistoricalMinStock(smartMins);
    }

    calculateSmartMinStock();
  }, [db, activeUid, selectedMonth]);

  const customItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUid) return null;
    return collection(db, 'users', activeUid, 'inventory');
  }, [db, activeUid]);

  const { data: customDefinitions } = useCollection(customItemsQuery);

  const monthItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUid || !monthKey) return null;
    return collection(db, 'users', activeUid, 'monthly_records', monthKey, 'items');
  }, [db, activeUid, monthKey]);

  const { data: remoteItems, isLoading: isFetchingMonth } = useCollection(monthItemsQuery);
  
  const prevMonthItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUid || !prevMonthKey) return null;
    return collection(db, 'users', activeUid, 'monthly_records', prevMonthKey, 'items');
  }, [db, activeUid, prevMonthKey]);
  
  const { data: prevRemoteItems } = useCollection(prevMonthItemsQuery);

  const items = useMemo(() => {
    const combined: InventoryItem[] = [];
    const officialIds = new Set(OFFICIAL_PUBLICATIONS.map((pub, idx) => pub.code || pub.abbr || `item_${idx}`));
    
    OFFICIAL_PUBLICATIONS.forEach((pub, idx) => {
      const id = pub.code || pub.abbr || `item_${idx}`;
      const customDef = customDefinitions?.find(d => d.id === id);
      
      const remote = remoteItems?.find(i => i.id === id);
      const prevRemote = prevRemoteItems?.find(i => i.id === id);
      const local = localData[id] || {};
      
      const previousValue = local.previous !== undefined ? local.previous : (remote?.previous !== undefined && remote?.previous !== null ? remote.previous : (prevRemote?.current !== undefined && prevRemote?.current !== null ? prevRemote.current : null));
      
      combined.push({
        ...pub,
        id,
        previous: previousValue,
        received: local.received !== undefined ? local.received : (remote?.received !== undefined ? remote?.received : null),
        current: local.current !== undefined ? local.current : (remote?.current !== undefined ? remote?.current : null),
        minStock: historicalMinStock[id] || 0,
        hidden: customDef?.hidden || false,
        silent: customDef?.silent || false,
      } as InventoryItem);

      if (pub.isCategory && customDefinitions) {
        const categoryCustomItems = customDefinitions
          .filter(cd => cd.category === pub.category && !officialIds.has(cd.id))
          .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

        categoryCustomItems.forEach(cd => {
          const remoteCustom = remoteItems?.find(i => i.id === cd.id);
          const prevRemoteCustom = prevRemoteItems?.find(i => i.id === cd.id);
          const localCustom = localData[cd.id] || {};
          
          const prevCustomValue = localCustom.previous !== undefined ? localCustom.previous : (remoteCustom?.previous !== undefined && remoteCustom?.previous !== null ? remoteCustom.previous : (prevRemoteCustom?.current !== undefined && prevRemoteCustom?.current !== null ? prevRemoteCustom.current : null));
          
          combined.push({
            ...cd,
            previous: prevCustomValue,
            received: localCustom.received !== undefined ? localCustom.received : (remoteCustom?.received !== undefined ? remoteCustom?.received : null),
            current: localCustom.current !== undefined ? localCustom.current : (remoteCustom?.current !== undefined ? remoteCustom?.current : null),
            minStock: historicalMinStock[cd.id] || 0,
            hidden: cd.hidden || false,
            silent: cd.silent || false,
          } as InventoryItem);
        });
      }
    });

    return combined;
  }, [remoteItems, localData, customDefinitions, prevRemoteItems, selectedMonth, historicalMinStock]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.abbr && item.abbr.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  useEffect(() => {
    if (!isFetchingMonth && items.length > 0 && !isUserLoading) {
      const lowItems = items.filter(item => {
        const minVal = historicalMinStock[item.id] || 0;
        return !item.hidden && !item.silent && minVal > 0 && (
          (item.current !== null && item.current <= minVal) || 
          (item.current === null && item.previous !== null && item.previous <= minVal)
        );
      });

      if (lowItems.length > 0) {
        const lastToastedMonth = sessionStorage.getItem('last_toasted_month');
        if (lastToastedMonth !== monthKey) {
          toast({
            variant: "destructive",
            title: "Atenção: Estoque Crítico",
            description: `Existem ${lowItems.length} itens abaixo da margem de segurança para ${monthName}.`,
          });
          sessionStorage.setItem('last_toasted_month', monthKey);
        }
      }
    }
  }, [isFetchingMonth, monthKey, historicalMinStock, items.length, isUserLoading, toast, monthName]);

  const calculateOutgoing = (item: InventoryItem) => {
    if (item.current === null || item.current === undefined) return '';
    const total = (Number(item.previous) || 0) + (Number(item.received) || 0);
    const current = Number(item.current) || 0;
    return total - current;
  };

  const handleUpdateItem = (id: string, field: string, value: number | null) => {
    if (!activeUid || !db) return;

    const itemData = items.find(i => i.id === id);
    if (!itemData) return;

    let updates: Record<string, any> = { [field]: value };

    if (field === 'current' && value !== null) {
      if (itemData.previous !== null && (itemData.received === null || itemData.received === undefined)) {
        updates.received = 0;
      }
      
      const minVal = historicalMinStock[id] || 0;
      if (value > minVal && (itemData.hidden || itemData.silent)) {
        const inventoryDocRef = doc(db, 'users', activeUid, 'inventory', id);
        setDocumentNonBlocking(inventoryDocRef, {
          hidden: false,
          silent: false
        }, { merge: true });
        
        updates.hidden = false;
        updates.silent = false;
        
        toast({
          title: "Monitoramento Reativado",
          description: `O item "${itemData.item}" foi reabastecido e voltará a ser monitorado automaticamente.`,
        });
      }
    }

    setLocalData(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));

    const docRef = doc(db, 'users', activeUid, 'monthly_records', monthKey, 'items', id);
    setDocumentNonBlocking(docRef, {
      ...itemData,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleInputBlur = (id: string, field: string, value: number | null) => {
    if (field !== 'current' || value === null) return;

    const itemData = items.find(i => i.id === id);
    if (!itemData || itemData.hidden || itemData.silent) return;

    const minVal = historicalMinStock[id] || 0;
    if (minVal > 0 && value <= minVal) {
      toast({
        variant: "destructive",
        title: "Reposição Necessária!",
        description: `A publicação "${itemData.item}" está abaixo da média de segurança.`,
      });
    }
  };

  const handleToggleAlert = (item: InventoryItem, mode: 'silent' | 'hidden' | 'reset') => {
    if (!activeUid || !db) return;
    
    let updates: any = {};
    if (mode === 'silent') {
        updates = { silent: true, hidden: false };
    } else if (mode === 'hidden') {
        updates = { hidden: true, silent: false };
    } else {
        updates = { hidden: false, silent: false };
    }
    
    const docRef = doc(db, 'users', activeUid, 'inventory', item.id);
    setDocumentNonBlocking(docRef, {
      id: item.id,
      item: item.item,
      category: item.category,
      code: item.code,
      abbr: item.abbr,
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({
      title: mode === 'reset' ? "Monitoramento Reativado" : (mode === 'silent' ? "Alertas Silenciados" : "Destaque Removido"),
      description: mode === 'reset' 
        ? `O monitoramento completo foi reativado para "${item.item}".` 
        : (mode === 'silent' ? `O destaque continuará, mas você não receberá mais avisos para "${item.item}".` : `O item "${item.item}" voltou ao estado normal sem destaques.`),
    });
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-white p-6 rounded-t-xl shadow-md border-x border-t border-border space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg border w-fit">
              <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(prev => subMonths(prev, 1))} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Popover open={isMonthPopoverOpen} onOpenChange={setIsMonthPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="px-2 font-bold text-xs uppercase tracking-wider min-w-[140px] justify-center gap-2 h-8">
                    <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                    {monthName}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedMonth(prev => subYears(prev, 1)); }}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                        {format(selectedMonth, 'yyyy')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        disabled={selectedMonth.getFullYear() >= subMonths(new Date(), 1).getFullYear()}
                        onClick={(e) => { e.stopPropagation(); setSelectedMonth(prev => addYears(prev, 1)); }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const date = setMonth(selectedMonth, i);
                        const isSelected = selectedMonth.getMonth() === i;
                        const isBlocked = isDateInFuture(date);
                        return (
                          <Button 
                            key={i} 
                            variant={isSelected ? "default" : "ghost"} 
                            className={cn("h-9 text-[10px] font-bold uppercase", isSelected && "bg-primary text-primary-foreground")} 
                            onClick={() => { setSelectedMonth(date); setIsMonthPopoverOpen(false); }}
                            disabled={isBlocked}
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
                onClick={() => setSelectedMonth(prev => addMonths(prev, 1))} 
                className="h-8 w-8"
                disabled={isDateInFuture(addMonths(selectedMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:flex-1 md:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar publicação..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-11 w-full font-medium"
              />
              {searchTerm && (
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-1.5 px-1">
          <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">
            Os valores para o estoque são sempre referentes ao mês anterior. O sistema destaca automaticamente itens que precisam de reposição.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-md border-x border-b border-border overflow-hidden">
        {(isFetchingMonth || isUserLoading) && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white shadow-sm border-b">
              <TableRow className="bg-white hover:bg-white">
                {DEFAULT_COLUMNS.map((col) => (
                  <TableHead key={col.id} className={cn(
                    "font-bold text-foreground py-3 px-3 text-[10px] uppercase tracking-wider text-center border-r last:border-0 bg-white",
                    col.id === 'item' && "text-left"
                  )}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item, idx) => {
                if (item.isCategory) {
                  const uniqueCatKey = `cat-${item.category}-${idx}`;
                  return (
                    <TableRow key={uniqueCatKey} className="bg-neutral-100/80 hover:bg-neutral-100/80 border-b-2 border-neutral-200">
                      <TableCell colSpan={DEFAULT_COLUMNS.length} className="py-2.5 px-4 font-black text-[11px] uppercase text-neutral-600 tracking-widest">
                        {item.item}
                      </TableCell>
                    </TableRow>
                  );
                }

                const minVal = historicalMinStock[item.id] || 0;
                const isLowStock = !item.hidden && minVal > 0 && (
                  (item.current !== null && item.current <= minVal) || 
                  (item.current === null && item.previous !== null && item.previous <= minVal)
                );
                
                const imagePlaceholder = item.imageKey ? PlaceHolderImages.find(img => img.id === item.imageKey) : null;

                return (
                  <TableRow key={item.id} className={cn(
                    "hover:bg-accent/5 transition-colors border-b last:border-0 group",
                    isLowStock && "bg-destructive/5"
                  )}>
                    {DEFAULT_COLUMNS.map((col) => (
                      <TableCell key={`${item.id}-${col.id}`} className="p-1 px-3 border-r last:border-0 h-11">
                        {col.id === 'outgoing' ? (
                          <div className={cn(
                            "py-1.5 font-black rounded text-sm text-center",
                            item.current !== null && typeof calculateOutgoing(item) === 'number' && (calculateOutgoing(item) as number) < 0 ? "text-destructive bg-destructive/10" : "text-accent-foreground bg-accent/10"
                          )}>
                            {calculateOutgoing(item)}
                          </div>
                        ) : col.id === 'code' ? (
                          <div className="text-center text-[10px] font-bold py-2 text-neutral-400">
                            {item.code || '---'}
                          </div>
                        ) : col.id === 'item' ? (
                          <div className="flex justify-between items-center gap-2 min-w-[240px]">
                            <div className="flex items-center gap-2 overflow-hidden">
                              {(isLowStock || item.hidden || item.silent) && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn(
                                      "h-6 w-6 shrink-0 hover:bg-neutral-100",
                                      (item.hidden || item.silent) ? "text-neutral-400" : "text-destructive"
                                    )}>
                                      {(item.hidden || item.silent) ? <BellOff className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-3">
                                    <p className="text-[10px] font-black uppercase text-foreground mb-2 tracking-widest">Gestão de Alerta</p>
                                    {!(item.hidden || item.silent) ? (
                                      <div className="space-y-3">
                                        <p className="text-[11px] font-bold uppercase leading-tight text-neutral-600 mb-1">
                                          Esta publicação está abaixo do mínimo seguro ({minVal}). O que deseja fazer?
                                        </p>
                                        <div className="grid gap-2">
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full text-[9px] font-black uppercase tracking-widest h-8 gap-2"
                                            onClick={() => handleToggleAlert(item, 'silent')}
                                          >
                                            <BellOff className="h-3 w-3" /> Silenciar (Manter Vermelho)
                                          </Button>
                                          <Button 
                                            variant="default" 
                                            size="sm" 
                                            className="w-full text-[9px] font-black uppercase tracking-widest h-8 gap-2"
                                            onClick={() => handleToggleAlert(item, 'hidden')}
                                          >
                                            <X className="h-3 w-3" /> Desativar e Normalizar
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <p className="text-[11px] font-bold uppercase leading-tight text-neutral-600 mb-1">
                                          O monitoramento está restrito para este item.
                                        </p>
                                        <Button 
                                          variant="default" 
                                          size="sm" 
                                          className="w-full text-[9px] font-black uppercase tracking-widest h-8 gap-2"
                                          onClick={() => handleToggleAlert(item, 'reset')}
                                        >
                                          <Bell className="h-3 w-3" /> Reativar Monitoramento
                                        </Button>
                                      </div>
                                    )}
                                  </PopoverContent>
                                </Popover>
                              )}
                              {imagePlaceholder ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <span className={cn(
                                      "text-sm font-medium cursor-pointer border-b border-dotted transition-colors truncate",
                                      isLowStock ? "text-destructive border-destructive" : "text-foreground border-muted-foreground/50 hover:text-primary"
                                    )}>
                                      {item.item}
                                    </span>
                                  </PopoverTrigger>
                                  <PopoverContent side="top" className="p-0 border-none shadow-2xl overflow-hidden rounded-lg w-[180px]">
                                    <div className="relative aspect-[2/3] bg-neutral-50 p-2">
                                      <Image src={imagePlaceholder.imageUrl} alt={imagePlaceholder.description} fill sizes="180px" className="object-contain" unoptimized />
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <span className={cn("text-sm font-medium truncate", isLowStock && "text-destructive")}>{item.item}</span>
                              )}
                              
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.isCustom && activeUid === user?.uid && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/50 hover:text-primary" onClick={() => setEditingItem(item)}>
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {item.abbr && <span className="text-[9px] font-black bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">{item.abbr}</span>}
                          </div>
                        ) : (
                          <Input
                            type="number"
                            value={(item[col.id] !== undefined && item[col.id] !== null) ? (item[col.id] as number) : ''}
                            onChange={(e) => handleUpdateItem(item.id, col.id, e.target.value === '' ? null : Number(e.target.value))}
                            onBlur={(e) => handleInputBlur(item.id, col.id, e.target.value === '' ? null : Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            onWheel={(e) => e.currentTarget.blur()}
                            className={cn(
                              "border-transparent hover:border-input focus:bg-white focus:ring-1 focus:ring-primary h-8 text-sm text-center font-bold transition-all bg-transparent",
                              isLowStock && col.id === 'current' && "text-destructive"
                            )}
                            placeholder="0"
                            disabled={(activeUid !== user?.uid && !targetUserId)}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {activeCategory && activeUid === user?.uid && (
        <AddCustomItemDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} category={activeCategory} />
      )}

      {editingItem && activeUid === user?.uid && (
        <EditCustomItemDialog item={editingItem} onClose={() => setEditingItem(null)} />
      )}
    </div>
  );
}
