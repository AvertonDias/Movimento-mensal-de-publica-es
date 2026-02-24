
"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow,
  TableHead
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
  PackageSearch,
  Truck,
  Smartphone,
  Filter,
  AlertOctagon
} from "lucide-react";
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  InventoryItem, 
  DEFAULT_COLUMNS
} from "@/app/types/inventory";
import { OFFICIAL_PUBLICATIONS } from "@/app/lib/publications";
import { cn, formatNumber } from "@/lib/utils";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking
} from '@/firebase';
import { collection, doc, getDocs } from 'firebase/firestore';
import { format, subMonths, addMonths, startOfMonth, setMonth, addYears, subYears, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditCustomItemDialog } from "./EditCustomItemDialog";
import { RequestItemDialog } from "./RequestItemDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface InventoryTableProps {
  targetUserId?: string;
}

export function InventoryTable({ targetUserId }: InventoryTableProps) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low-stock' | 'pending' | 'received'>('all');
  const [localData, setLocalData] = useState<Record<string, Partial<InventoryItem>>>({});
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [requestingItem, setRequestingItem] = useState<InventoryItem | null>(null);
  const [pendingConfirmItem, setPendingConfirmItem] = useState<InventoryItem | null>(null);
  const [negativeWarningItem, setNegativeWarningItem] = useState<InventoryItem | null>(null);
  const [isMonthPopoverOpen, setIsMonthPopoverOpen] = useState(false);
  const [historicalMinStock, setHistoricalMinStock] = useState<Record<string, number>>({});
  const [focusedField, setFocusedField] = useState<{id: string, col: string} | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthName = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });
  
  const prevMonth = startOfMonth(subMonths(selectedMonth, 1));
  const prevMonthKey = format(prevMonth, 'yyyy-MM');

  const activeUid = targetUserId || user?.uid;

  useEffect(() => {
    if (!pendingConfirmItem && !requestingItem && !editingItem && !negativeWarningItem) {
      const forceUnlock = () => {
        if (typeof document !== 'undefined') {
          document.body.style.pointerEvents = 'auto';
          document.body.style.overflow = 'auto';
        }
      };
      forceUnlock();
      const t = setTimeout(forceUnlock, 350);
      return () => clearTimeout(t);
    }
  }, [pendingConfirmItem, requestingItem, editingItem, negativeWarningItem]);

  const isDateRestricted = (date: Date) => {
    const limitDate = startOfMonth(addMonths(new Date(), 1));
    return isAfter(startOfMonth(date), limitDate);
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
        } catch (e) {}
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
      const currentVal = local.current !== undefined ? local.current : (remote?.current !== undefined && remote?.current !== null ? remote.current : 0);

      combined.push({
        ...pub,
        id,
        previous: previousValue,
        received: local.received !== undefined ? local.received : (remote?.received !== undefined ? remote?.received : null),
        current: currentVal,
        minStock: historicalMinStock[id] || 0,
        hidden: customDef?.hidden || false,
        silent: customDef?.silent || false,
        pendingRequestsCount: customDef?.pendingRequestsCount || 0,
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
          const currentCustomVal = localCustom.current !== undefined ? localCustom.current : (remoteCustom?.current !== undefined && remoteCustom?.current !== null ? remoteCustom.current : 0);

          combined.push({
            ...cd,
            previous: prevCustomValue,
            received: localCustom.received !== undefined ? localCustom.received : (remoteCustom?.received !== undefined ? remoteCustom?.received : null),
            current: currentCustomVal,
            minStock: historicalMinStock[cd.id] || 0,
            hidden: cd.hidden || false,
            silent: cd.silent || false,
            pendingRequestsCount: cd.pendingRequestsCount || 0,
          } as InventoryItem);
        });
      }
    });
    return combined;
  }, [remoteItems, localData, customDefinitions, prevRemoteItems, selectedMonth, historicalMinStock]);

  const filteredItems = useMemo(() => {
    const matches = items.filter(item => !item.isCategory).filter(item => {
      const matchesSearch = (item.item || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.abbr && item.abbr.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesStatus = true;
      if (filterStatus === 'low-stock') {
        const minVal = historicalMinStock[item.id] || 0;
        matchesStatus = !item.hidden && minVal > 0 && (
          (item.current !== null && item.current <= minVal) || 
          (item.current === null && item.previous !== null && item.previous <= minVal)
        );
      } else if (filterStatus === 'pending') {
        matchesStatus = (item.pendingRequestsCount || 0) > 0;
      } else if (filterStatus === 'received') {
        matchesStatus = (Number(item.received) || 0) > 0;
      }

      return matchesSearch && matchesStatus;
    });

    if (filterStatus !== 'all' || searchTerm !== '') {
      return matches;
    }

    return items;
  }, [items, searchTerm, filterStatus, historicalMinStock]);

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

    const checkPrev = field === 'previous' ? (value ?? 0) : (Number(itemData.previous) || 0);
    const checkRec = field === 'received' ? (value ?? 0) : (Number(itemData.received) || 0);
    const checkCurr = field === 'current' ? (value ?? 0) : (Number(itemData.current) || 0);
    
    const calculatedOutgoing = (Number(checkPrev) + Number(checkRec)) - Number(checkCurr);
    if (calculatedOutgoing < 0 && value !== null) {
      setNegativeWarningItem({ ...itemData, ...updates });
    }

    if (field === 'received' && value !== null && value > 0 && (Number(itemData.pendingRequestsCount) || 0) > 0) {
      setPendingConfirmItem({ ...itemData });
    }
    
    if (field === 'current' && value !== null) {
      if (itemData.previous !== null && (itemData.received === null || itemData.received === undefined)) {
        updates.received = 0;
      }
      
      const minVal = historicalMinStock[id] || 0;
      if (value > minVal && (itemData.hidden || itemData.silent)) {
        const inventoryDocRef = doc(db, 'users', activeUid, 'inventory', id);
        setDocumentNonBlocking(inventoryDocRef, { hidden: false, silent: false }, { merge: true });
        updates.hidden = false;
        updates.silent = false;
        toast({ title: "Monitoramento Reativado", description: `O item "${itemData.item}" foi reabastecido.`, });
      }
    }

    setLocalData(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
    const docRef = doc(db, 'users', activeUid, 'monthly_records', monthKey, 'items', id);
    setDocumentNonBlocking(docRef, { ...itemData, ...updates, id, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const handleToggleSilence = (item: InventoryItem) => {
    if (!activeUid || !db) return;
    const isSilenced = item.hidden || item.silent;
    const inventoryDocRef = doc(db, 'users', activeUid, 'inventory', item.id);
    
    setDocumentNonBlocking(inventoryDocRef, {
      hidden: !isSilenced,
      silent: !isSilenced
    }, { merge: true });

    toast({
      title: !isSilenced ? "Alerta Silenciado" : "Monitoramento Reativado",
      description: !isSilenced 
        ? `O item "${item.item}" não exibirá mais avisos de estoque baixo.`
        : `O monitoramento de estoque para "${item.item}" foi reativado.`,
    });
  };

  const handleOpenRequestsAfterAlert = () => {
    if (pendingConfirmItem) {
      const itemToOpen = { ...pendingConfirmItem };
      setPendingConfirmItem(null); 
      setTimeout(() => {
        setRequestingItem(itemToOpen);
      }, 350);
    }
  };

  return (
    <div className="space-y-6 relative max-w-full overflow-x-hidden">
      {isMobile && (
        <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 landscape:hidden">
          <div className="bg-primary/20 p-2 rounded-lg animate-rotate-phone">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase text-primary-foreground leading-tight tracking-wider text-left">
            Dica: aproveite ao máximo o aplicativo usando o celular na horizontal ou acessando-o pelo computador.
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-t-xl shadow-md border-x border-t border-border space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex flex-col gap-2 items-start">
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{format(selectedMonth, 'yyyy')}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isDateRestricted(addYears(selectedMonth, 1))} onClick={(e) => { e.stopPropagation(); setSelectedMonth(prev => addYears(prev, 1)); }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const date = setMonth(selectedMonth, i);
                        const isSelected = selectedMonth.getMonth() === i;
                        const isRestricted = isDateRestricted(date);
                        return (
                          <Button key={i} variant={isSelected ? "default" : "ghost"} className={cn("h-9 text-[10px] font-bold uppercase", isSelected && "bg-primary text-primary-foreground")} onClick={() => { setSelectedMonth(date); setIsMonthPopoverOpen(false); }} disabled={isRestricted}>{format(date, 'MMM', { locale: ptBR })}</Button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(prev => addMonths(prev, 1))} className="h-8 w-8" disabled={isDateRestricted(addMonths(selectedMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-2 max-w-[340px] text-left">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                Os valores para o estoque são sempre referentes ao mês anterior. O sistema destaca automaticamente itens que precisam de reposição.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 w-full md:flex-1 md:max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar publicação..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 pr-10 h-11 w-full font-medium shadow-sm" 
              />
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" 
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-full h-11 font-bold text-[10px] uppercase tracking-widest bg-neutral-50 border-neutral-200">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-primary" />
                  <SelectValue placeholder="Filtrar por Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">Todas as Publicações</SelectItem>
                <SelectItem value="low-stock" className="text-[10px] font-black uppercase tracking-widest text-destructive">Estoque Baixo</SelectItem>
                <SelectItem value="pending" className="text-[10px] font-black uppercase tracking-widest text-primary">Pedidos Pendentes</SelectItem>
                <SelectItem value="received" className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Itens Recebidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-md border-x border-b border-border">
        <div className="p-2 border-b border-neutral-100 flex justify-end px-6 bg-neutral-50/50">
          <Dialog>
            <DialogTrigger asChild>
              <button className="hover:text-primary transition-colors uppercase font-bold text-[10px] tracking-widest outline-none flex items-center gap-1.5 py-1">
                <Info className="h-3 w-3 text-primary" />
                Instruções
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="uppercase font-black flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Instruções do Formulário S-28-T
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm leading-relaxed text-justify pr-2">
                <p>
                  <strong>1.</strong> Todas as congregações coordenadoras de idioma devem fazer a contagem real das publicações todo mês. Si a sua congregação envia todo mês um relatório do inventário de publicações pelo JW Hub, você não precisa usar este formulário.
                </p>
                <p>
                  <strong>2.</strong> Antes de fazer a contagem, recapitule a <Link href="/s60" className="text-primary font-bold hover:underline"><em>Lista de Publicações a Serem Descartadas (S-60)</em></Link> e siga as instruções sobre jogar fora os itens que aparecem na lista.
                </p>
                <p>
                  <strong>3.</strong> Se a sua congregação não puder enviar todo mês um relatório do inventário de publicações pelo JW Hub, certifique-se de que as informações a seguir sejam preenchidas abaixo para cada mês:
                </p>
                <div className="pl-6 space-y-2">
                  <p><strong>(1) Estoque:</strong> Anote a quantidade em estoque no fim do mês. Com exceção do livro Organizados, itens de pedido especial não estão listados neste formulário, visto que eles não devem ficar em estoque. Se por algum motivo houver itens de pedido especial in estoque, anote as quantidades em uma das categorias gerais, como, por exemplo, “Outras Bíblias”.</p>
                  <p><strong>(2) Recebido:</strong> Anote a quantidade de cada item recebido durante o mês.</p>
                  <p><strong>(3) Saída:</strong> Anote a quantidade de cada item que saiu durante o mês. Pode-se determinar essa quantidade por: (1) somar a quantidade em “Estoque” do mês anterior à quantidade anotada em “Recebido” durante o mês atual e depois (2) subtrair desse total a contagem real que acabou de ser feita (“Estoque”).</p>
                </div>
                <p>
                  <strong>4.</strong> Duas vezes por ano, Betel vai pedir que as congregações coordenadoras de idiomas enviem seu inventário pelo JW Hub, se possível. Para enviar um relatório do inventário de publicações, faça o seguinte: na página inicial do JW Hub, seção “Congregação”, clique em “Publicações” &rarr; “Relatórios de inventário”. Veja na seção “Ajuda” instruções sobre como enviar relatórios.
                </p>
                <p>
                  <strong>5.</strong> Neste formulário, um asterisco (*) depois do título ou da descrição de um item indica que ele faz parte do Kit de Ensino.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(isFetchingMonth || isUserLoading) && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-[1px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-white shadow-sm border-b">
              <TableRow className="bg-white hover:bg-white">
                {DEFAULT_COLUMNS.map((col) => (
                  <TableHead 
                    key={col.id} 
                    className={cn(
                      "font-bold text-foreground py-3 px-2 text-[10px] uppercase tracking-wider text-center border-r last:border-0 bg-white sticky top-0 z-10 shadow-sm", 
                      col.id === 'item' && "text-left",
                      ['previous', 'received', 'current', 'outgoing'].includes(col.id) && "w-[80px] min-w-[80px]"
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item, idx) => {
                const itemName = item.item || "";
                if (item.isCategory) {
                  const parts = itemName.split('(');
                  return (
                    <TableRow key={`cat-${idx}`} className="bg-neutral-100/80 hover:bg-neutral-100/80 border-b-2 border-neutral-200">
                      <TableCell colSpan={DEFAULT_COLUMNS.length} className="py-2.5 px-4 font-black text-[13px] uppercase text-neutral-600 tracking-widest text-left">
                        {parts[0]} {parts[1] && <span className="text-[13px] font-bold text-muted-foreground/70 normal-case tracking-normal italic">({parts[1]}</span>}
                      </TableCell>
                    </TableRow>
                  );
                }

                const minVal = historicalMinStock[item.id] || 0;
                const isLowStock = !item.hidden && minVal > 0 && ((item.current !== null && item.current <= minVal) || (item.current === null && item.previous !== null && item.previous <= minVal));
                const isTeachingKit = itemName.includes('*');
                const isCriticalTeachingKit = isTeachingKit && isLowStock;
                const isSelected = selectedRowId === item.id;
                
                const imagePlaceholder = item.imageKey ? PlaceHolderImages.find(img => img.id === item.imageKey) : null;
                const hasPending = (item.pendingRequestsCount || 0) > 0;

                return (
                  <TableRow 
                    key={item.id} 
                    onClick={() => setSelectedRowId(isSelected ? null : item.id)}
                    className={cn(
                      "hover:bg-accent/5 transition-all border-b last:border-0 group cursor-pointer", 
                      isLowStock && "bg-destructive/5",
                      isCriticalTeachingKit && "bg-destructive/10 animate-pulse-slow",
                      isSelected && "bg-primary/20 hover:bg-primary/25 border-l-4 border-l-primary"
                    )}
                  >
                    {DEFAULT_COLUMNS.map((col) => (
                      <TableCell key={`${item.id}-${col.id}`} className="p-0.5 px-1 border-r last:border-0 h-11">
                        {col.id === 'outgoing' ? (
                          <div className={cn("py-1.5 font-black rounded text-sm text-center", item.current !== null && typeof calculateOutgoing(item) === 'number' && (calculateOutgoing(item) as number) < 0 ? "text-destructive bg-destructive/10" : "text-accent-foreground bg-accent/10")}>
                            {formatNumber(calculateOutgoing(item))}
                          </div>
                        ) : col.id === 'code' ? (
                          <div className="text-center text-[10px] font-bold py-2 text-neutral-400">{item.code || '---'}</div>
                        ) : col.id === 'item' ? (
                          <div className="flex justify-between items-center gap-2 min-w-[240px] px-2">
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                              {(isLowStock || item.hidden || item.silent) && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn("h-6 w-6 shrink-0 hover:bg-neutral-100", (item.hidden || item.silent) ? "text-neutral-400" : "text-destructive")}>
                                      {isCriticalTeachingKit ? <AlertOctagon className="h-4 w-4 text-destructive animate-bounce-slow" /> : (item.hidden || item.silent) ? <BellOff className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-3">
                                    <p className="text-[10px] font-black uppercase text-foreground mb-2 tracking-widest text-left">Ações de Alerta</p>
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      className="w-full text-[9px] font-black uppercase tracking-widest h-8" 
                                      onClick={() => handleToggleSilence(item)}
                                    >
                                      {item.hidden || item.silent ? "Reativar Monitoramento" : "Silenciar este item"}
                                    </Button>
                                  </PopoverContent>
                                </Popover>
                              )}
                              <div className="flex flex-col gap-0.5 overflow-hidden">
                                {isCriticalTeachingKit && (
                                  <span className="text-[7px] font-black text-destructive uppercase tracking-widest leading-none">CRÍTICO - KIT DE ENSINO</span>
                                )}
                                {imagePlaceholder ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <span className={cn("text-sm font-medium cursor-pointer border-b border-dotted transition-colors truncate", isLowStock ? "text-destructive border-destructive font-bold" : "text-foreground border-muted-foreground/50 hover:text-primary")}>{itemName}</span>
                                    </PopoverTrigger>
                                    <PopoverContent side="top" className="p-0 border-none shadow-2xl overflow-hidden rounded-xl w-[180px]">
                                      <div className="relative aspect-[2/3] bg-white p-2">
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
                                  <span className={cn("text-sm font-medium truncate text-left", isLowStock && "text-destructive font-bold")}>{itemName}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button variant="ghost" size="icon" className={cn("h-6 w-6 hover:bg-neutral-100 transition-colors", hasPending ? "text-primary bg-primary/10 animate-pulse-slow" : "text-muted-foreground/50")} onClick={() => setRequestingItem(item)}>
                                  {hasPending ? <Truck className="h-3.5 w-3.5" /> : <PackageSearch className="h-3.5 w-3.5" />}
                                </Button>
                                {item.isCustom && activeUid === user?.uid && <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/50 hover:text-primary" onClick={() => setEditingItem(item)}><Edit2 className="h-3.5 w-3.5" /></Button>}
                              </div>
                            </div>
                            {item.abbr && <span className="text-[9px] font-black bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">{item.abbr}</span>}
                          </div>
                        ) : (
                          <Input 
                            type="text"
                            inputMode="numeric"
                            value={
                              focusedField?.id === item.id && focusedField?.col === col.id
                                ? (item[col.id] === null || item[col.id] === undefined ? '' : String(item[col.id]))
                                : formatNumber(item[col.id])
                            } 
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              handleUpdateItem(item.id, col.id, val === '' ? null : Number(val));
                            }}
                            onFocus={(e) => {
                              e.target.select();
                              setFocusedField({ id: item.id, col: col.id });
                            }} 
                            onBlur={() => setFocusedField(null)}
                            onWheel={(e) => e.currentTarget.blur()} 
                            className={cn(
                              "border-transparent hover:border-input focus:bg-white focus:ring-1 focus:ring-primary h-8 text-sm text-center font-bold transition-all bg-transparent px-0.5", 
                              isLowStock && col.id === 'current' && "text-destructive scale-110"
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

      <AlertDialog 
        open={!!pendingConfirmItem} 
        onOpenChange={(open) => {
          if (!open) setPendingConfirmItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black text-left">Pedido pendente encontrado</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Você está registrando uma entrada para <span className="font-bold text-foreground">"{pendingConfirmItem?.item}"</span>. 
              Este item possui <span className="font-bold text-primary">{pendingConfirmItem?.pendingRequestsCount}</span> pedido(s) pendente(s). 
              Deseja abrir o controle de pedidos para marcá-los como recebidos agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase text-xs text-muted-foreground">Agora não</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleOpenRequestsAfterAlert} 
              className="bg-primary hover:bg-primary/90 font-black uppercase text-xs"
            >
              Sim, Abrir Pedidos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={!!negativeWarningItem} 
        onOpenChange={(open) => {
          if (!open) setNegativeWarningItem(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black text-left flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Atenção: Saída Negativa
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-left space-y-2">
                <p>A quantidade <strong>Atual</strong> de <span className="font-bold text-foreground">"{negativeWarningItem?.item}"</span> é maior do que a soma do estoque <strong>Anterior</strong> com o <strong>Recebido</strong>.</p>
                <p className="text-xs text-muted-foreground uppercase font-bold">Isso resultará em uma saída negativa, o que indica um erro de contagem ou lançamento.</p>
                <p className="font-black text-destructive pt-2">Tem certeza que os valores estão corretos?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase text-xs">Vou revisar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => setNegativeWarningItem(null)} 
              className="bg-primary hover:bg-primary/90 font-black uppercase text-xs"
            >
              Sim, está correto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingItem && activeUid === user?.uid && <EditCustomItemDialog item={editingItem} onClose={() => setEditingItem(null)} />}
      {requestingItem && <RequestItemDialog item={requestingItem} onClose={() => setRequestingItem(null)} targetUserId={targetUserId} />}
    </div>
  );
}
