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
  Plus,
  ArrowUp,
  ArrowDown,
  Book
} from "lucide-react";
import { 
  InventoryItem, 
  InventoryColumn, 
  OFFICIAL_PUBLICATIONS
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
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase/provider';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddCustomItemDialog } from "./AddCustomItemDialog";
import { EditCustomItemDialog } from "./EditCustomItemDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function InventoryTable() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const [searchTerm, setSearchTerm] = useState('');
  const [localData, setLocalData] = useState<Record<string, Partial<InventoryItem>>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthName = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // Busca definições de itens personalizados do usuário
  const customItemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'inventory');
  }, [db, user]);

  const { data: customDefinitions } = useCollection(customItemsQuery);

  // Busca valores do mês selecionado
  const monthItemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'monthly_records', monthKey, 'items');
  }, [db, user, monthKey]);

  const { data: remoteItems, isLoading: isFetchingMonth } = useCollection(monthItemsQuery);

  const columns: InventoryColumn[] = [
    { id: 'move', header: '', type: 'text' },
    { id: 'code', header: 'N.º', type: 'text' },
    { id: 'item', header: 'Publicação', type: 'text' },
    { id: 'previous', header: 'Estoque Anterior', type: 'number' },
    { id: 'received', header: 'Recebido', type: 'number' },
    { id: 'current', header: 'Estoque Atual', type: 'number' },
    { id: 'outgoing', header: 'Saída', type: 'calculated' },
  ];

  // Mescla lista oficial + itens personalizados + dados do mês
  const items = useMemo(() => {
    const combined: InventoryItem[] = [];
    
    OFFICIAL_PUBLICATIONS.forEach((pub, idx) => {
      const id = pub.code || `cat_${idx}`;
      const remote = remoteItems?.find(i => i.id === id);
      const local = localData[id] || {};
      
      combined.push({
        ...pub,
        id,
        previous: local.previous ?? remote?.previous ?? 0,
        received: local.received ?? remote?.received ?? 0,
        current: local.current ?? remote?.current ?? 0,
      } as InventoryItem);

      // Se for uma categoria, insere itens personalizados desta categoria logo após, ordenados
      if (pub.isCategory && customDefinitions) {
        const categoryCustomItems = customDefinitions
          .filter(cd => cd.category === pub.item)
          .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

        categoryCustomItems.forEach(cd => {
          const remoteCustom = remoteItems?.find(i => i.id === cd.id);
          const localCustom = localData[cd.id] || {};
          combined.push({
            ...cd,
            previous: localCustom.previous ?? remoteCustom?.previous ?? 0,
            received: localCustom.received ?? remoteCustom?.received ?? 0,
            current: localCustom.current ?? remoteCustom?.current ?? 0,
          } as InventoryItem);
        });
      }
    });

    return combined;
  }, [remoteItems, localData, customDefinitions]);

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
    if (!user || !db) return;

    setLocalData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));

    const docRef = doc(db, 'users', user.uid, 'monthly_records', monthKey, 'items', id);
    const itemData = items.find(i => i.id === id);
    if (itemData) {
      setDocumentNonBlocking(docRef, {
        ...itemData,
        [field]: value,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  const handleMoveItem = (item: InventoryItem, direction: 'up' | 'down') => {
    if (!user || !db || !customDefinitions) return;

    // Obtém todos os itens personalizados desta categoria, ordenados pelo valor atual
    const categoryCustomItems = [...customDefinitions]
      .filter(cd => cd.category === item.category)
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

    const currentIndex = categoryCustomItems.findIndex(i => i.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Verifica se o movimento é possível dentro dos limites da categoria
    if (targetIndex >= 0 && targetIndex < categoryCustomItems.length) {
      const currentItem = categoryCustomItems[currentIndex];
      const targetItem = categoryCustomItems[targetIndex];
      
      const currentRef = doc(db, 'users', user.uid, 'inventory', currentItem.id);
      const targetRef = doc(db, 'users', user.uid, 'inventory', targetItem.id);

      const targetOrder = Number(targetItem.sortOrder) || (targetIndex * 1000);
      const currentOrder = Number(currentItem.sortOrder) || (currentIndex * 1000);

      setDocumentNonBlocking(currentRef, { sortOrder: targetOrder }, { merge: true });
      setDocumentNonBlocking(targetRef, { sortOrder: currentOrder }, { merge: true });
    }
  };

  const openAddDialog = (category: string) => {
    setActiveCategory(category);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-lg border w-fit">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(prev => subMonths(prev, 1))} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-2 font-bold text-xs uppercase tracking-wider min-w-[140px] justify-center">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              {monthName}
            </div>
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
            className="pl-10 h-11 w-full"
          />
        </div>
      </div>

      <div className="relative bg-white rounded-xl shadow-md border border-border overflow-hidden">
        {isFetchingMonth && (
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
                {columns.map((col) => (
                  <TableHead key={col.id} className={cn(
                    "font-bold text-foreground py-4 px-3 text-[10px] uppercase tracking-wider text-center border-r last:border-0",
                    col.id === 'move' && "w-[60px]"
                  )}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TooltipProvider>
                {filteredItems.map((item) => {
                  if (item.isCategory) {
                    return (
                      <TableRow key={item.id} className="bg-neutral-100/80 hover:bg-neutral-100/80 border-b-2 border-neutral-200">
                        <TableCell colSpan={columns.length} className="py-2 px-4 font-black text-[11px] uppercase text-neutral-600 tracking-widest">
                          <div className="flex justify-between items-center">
                            <span>{item.item}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-[9px] gap-1 hover:bg-primary/20"
                              onClick={() => openAddDialog(item.item)}
                            >
                              <Plus className="h-3 w-3" /> Adicionar Linha
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const imagePlaceholder = item.imageKey ? PlaceHolderImages.find(img => img.id === item.imageKey) : null;

                  return (
                    <TableRow key={item.id} className="hover:bg-accent/5 transition-colors border-b last:border-0 group">
                      {columns.map((col) => (
                        <TableCell key={col.id} className="p-1 px-3 border-r last:border-0">
                          {col.id === 'move' ? (
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              {item.isCustom && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => handleMoveItem(item, 'up')}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => handleMoveItem(item, 'down')}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          ) : col.id === 'outgoing' ? (
                            <div className={cn(
                              "py-2 font-black rounded text-sm text-center",
                              calculateOutgoing(item) < 0 ? "text-destructive bg-destructive/10" : "text-accent-foreground bg-accent/10"
                            )}>
                              {calculateOutgoing(item)}
                            </div>
                          ) : col.id === 'code' ? (
                            <div 
                              className={cn(
                                "text-center text-[11px] font-bold py-2 rounded transition-colors",
                                item.isCustom 
                                  ? "text-primary cursor-pointer hover:bg-primary/10 hover:underline" 
                                  : "text-neutral-400"
                              )}
                              onClick={() => item.isCustom && setEditingItem(item)}
                            >
                              {item.code || (item.isCustom ? '?' : '')}
                            </div>
                          ) : col.id === 'item' ? (
                            <div className="flex justify-between items-center gap-2 min-w-[240px]">
                              {imagePlaceholder ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-sm font-medium text-foreground cursor-help border-b border-dotted border-muted-foreground/50 hover:text-primary hover:border-primary transition-colors">
                                      {item.item}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="p-0 border-none shadow-xl overflow-hidden rounded-lg bg-transparent">
                                    <div className="relative w-[200px] h-[300px] bg-white">
                                      <Image 
                                        src={imagePlaceholder.imageUrl} 
                                        alt={imagePlaceholder.description}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={imagePlaceholder.imageHint}
                                      />
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-[10px] font-bold uppercase text-center backdrop-blur-sm">
                                        {item.item}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-sm font-medium text-foreground">{item.item}</span>
                              )}
                              {item.abbr && <span className="text-[9px] font-black bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded uppercase">{item.abbr}</span>}
                            </div>
                          ) : (
                            <Input
                              type="number"
                              value={item[col.id] as number}
                              onChange={(e) => handleUpdateItem(item.id, col.id, Number(e.target.value))}
                              className="border-transparent hover:border-input focus:bg-white focus:ring-1 focus:ring-primary h-9 text-sm text-center font-bold transition-all bg-transparent group-hover:bg-white/50"
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TooltipProvider>
            </TableBody>
          </Table>
        </div>
      </div>
      
      {activeCategory && (
        <AddCustomItemDialog 
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          category={activeCategory} 
        />
      )}

      {editingItem && (
        <EditCustomItemDialog 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}

      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          Os dados são salvos automaticamente para o mês de {monthName}
        </p>
      </div>
    </div>
  );
}
