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
  X
} from "lucide-react";
import { 
  InventoryItem, 
  OFFICIAL_PUBLICATIONS,
  DEFAULT_COLUMNS
} from "@/app/types/inventory";
import { cn } from "@/lib/utils";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddCustomItemDialog } from "./AddCustomItemDialog";
import { EditCustomItemDialog } from "./EditCustomItemDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface InventoryTableProps {
  targetUserId?: string;
}

export function InventoryTable({ targetUserId }: InventoryTableProps) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const [searchTerm, setSearchTerm] = useState('');
  const [localData, setLocalData] = useState<Record<string, Partial<InventoryItem>>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthName = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });
  
  const prevMonth = startOfMonth(subMonths(selectedMonth, 1));
  const prevMonthKey = format(prevMonth, 'yyyy-MM');

  const activeUid = targetUserId || user?.uid;

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
    
    OFFICIAL_PUBLICATIONS.forEach((pub, idx) => {
      const id = pub.code || `cat_${idx}`;
      const remote = remoteItems?.find(i => i.id === id);
      const prevRemote = prevRemoteItems?.find(i => i.id === id);
      const local = localData[id] || {};
      
      const previousValue = local.previous ?? remote?.previous ?? prevRemote?.current ?? 0;
      
      combined.push({
        ...pub,
        id,
        previous: previousValue,
        received: local.received ?? remote?.received ?? 0,
        current: local.current ?? remote?.current ?? 0,
      } as InventoryItem);

      if (pub.isCategory && customDefinitions) {
        const categoryCustomItems = customDefinitions
          .filter(cd => cd.category === pub.item)
          .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

        categoryCustomItems.forEach(cd => {
          const remoteCustom = remoteItems?.find(i => i.id === cd.id);
          const prevRemoteCustom = prevRemoteItems?.find(i => i.id === cd.id);
          const localCustom = localData[cd.id] || {};
          
          const prevCustomValue = localCustom.previous ?? remoteCustom?.previous ?? prevRemoteCustom?.current ?? 0;
          
          combined.push({
            ...cd,
            previous: prevCustomValue,
            received: localCustom.received ?? remoteCustom?.received ?? 0,
            current: localCustom.current ?? remoteCustom?.current ?? 0,
          } as InventoryItem);
        });
      }
    });

    return combined;
  }, [remoteItems, localData, customDefinitions, prevRemoteItems]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.abbr && item.abbr.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  const calculateOutgoing = (item: InventoryItem) => {
    const total = (Number(item.previous) || 0) + (Number(item.received) || 0);
    const current = Number(item.current) || 0;
    return total - current;
  };

  const handleUpdateItem = (id: string, field: string, value: number) => {
    if (!activeUid || !db) return;

    setLocalData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));

    const docRef = doc(db, 'users', activeUid, 'monthly_records', monthKey, 'items', id);
    const itemData = items.find(i => i.id === id);
    if (itemData) {
      setDocumentNonBlocking(docRef, {
        ...itemData,
        [field]: value,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg border w-fit">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(prev => subMonths(prev, 1))} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="px-2 font-bold text-xs uppercase tracking-wider min-w-[140px] justify-center gap-2 h-8">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  {monthName}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(startOfMonth(date))}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(prev => addMonths(prev, 1))} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-start gap-1.5 px-1 max-w-[200px]">
            <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">
              Nota: Os lançamentos devem ser referentes ao fechamento do mês anterior.
            </p>
          </div>
        </div>

        <div className="relative w-full md:flex-1 md:max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar por publicação, código ou sigla..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 h-11 w-full font-medium"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Limpar pesquisa</span>
            </Button>
          )}
        </div>
      </div>

      <div className="relative bg-white rounded-xl shadow-md border border-border overflow-hidden">
        {(isFetchingMonth || isUserLoading) && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-bold uppercase text-muted-foreground">Carregando dados...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                {DEFAULT_COLUMNS.map((col) => (
                  <TableHead key={col.id} className={cn(
                    "font-bold text-foreground py-4 px-3 text-[10px] uppercase tracking-wider text-center border-r last:border-0",
                    col.id === 'item' && "text-left"
                  )}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                if (item.isCategory) {
                  return (
                    <TableRow key={item.id} className="bg-neutral-100/80 hover:bg-neutral-100/80 border-b-2 border-neutral-200">
                      <TableCell colSpan={DEFAULT_COLUMNS.length} className="py-2.5 px-4 font-black text-[11px] uppercase text-neutral-600 tracking-widest">
                        <div className="flex items-center">
                          <span>{item.item}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                const imagePlaceholder = item.imageKey ? PlaceHolderImages.find(img => img.id === item.imageKey) : null;

                return (
                  <TableRow key={item.id} className="hover:bg-accent/5 transition-colors border-b last:border-0 group">
                    {DEFAULT_COLUMNS.map((col) => (
                      <TableCell key={col.id} className="p-1 px-3 border-r last:border-0">
                        {col.id === 'outgoing' ? (
                          <div className={cn(
                            "py-2 font-black rounded text-sm text-center",
                            calculateOutgoing(item) < 0 ? "text-destructive bg-destructive/10" : "text-accent-foreground bg-accent/10"
                          )}>
                            {calculateOutgoing(item)}
                          </div>
                        ) : col.id === 'code' ? (
                          <div className="text-center text-[11px] font-bold py-2 text-neutral-400">
                            {item.code || (item.isCustom ? '---' : '')}
                          </div>
                        ) : col.id === 'item' ? (
                          <div className="flex justify-between items-center gap-2 min-w-[240px]">
                            <div className="flex items-center gap-2 overflow-hidden">
                              {imagePlaceholder ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <span className="text-sm font-medium text-foreground cursor-pointer border-b border-dotted border-muted-foreground/50 hover:text-primary hover:border-primary transition-colors truncate">
                                      {item.item}
                                    </span>
                                  </PopoverTrigger>
                                  <PopoverContent 
                                    side="top" 
                                    align="center" 
                                    className="p-0 border-none shadow-2xl overflow-hidden rounded-lg z-[100] w-[180px] mb-2"
                                  >
                                    <div className="relative w-full aspect-[2/3] bg-white">
                                      <Image 
                                        src={imagePlaceholder.imageUrl} 
                                        alt={imagePlaceholder.description}
                                        fill
                                        sizes="180px"
                                        className="object-cover"
                                        priority={true}
                                        unoptimized={true}
                                      />
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white text-[10px] font-black uppercase text-center backdrop-blur-md">
                                        {item.item}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <span className="text-sm font-medium text-foreground truncate">{item.item}</span>
                              )}
                              {item.isCustom && activeUid === user?.uid && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground/50 hover:text-primary"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            {item.abbr && <span className="text-[9px] font-black bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">{item.abbr}</span>}
                          </div>
                        ) : (
                          <Input
                            type="number"
                            value={item[col.id] as number || ''}
                            onChange={(e) => handleUpdateItem(item.id, col.id, Number(e.target.value))}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="border-transparent hover:border-input focus:bg-white focus:ring-1 focus:ring-primary h-9 text-sm text-center font-bold transition-all bg-transparent group-hover:bg-white/50"
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
        <AddCustomItemDialog 
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          category={activeCategory} 
        />
      )}

      {editingItem && activeUid === user?.uid && (
        <EditCustomItemDialog 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-white/50 py-2 rounded-full border border-white/20 inline-block px-6">
          Os dados são salvos automaticamente para o mês de {monthName}
        </p>
      </div>
    </div>
  );
}