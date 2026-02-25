
"use client"

import React, { useMemo, useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OFFICIAL_PUBLICATIONS, InventoryItem } from "@/app/types/inventory";
import { cn, formatNumber } from "@/lib/utils";

interface HistoryTableProps {
  targetUserId?: string;
}

export function HistoryTable({ targetUserId }: HistoryTableProps) {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const [historyData, setHistoryData] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);

  const activeUserId = targetUserId || currentUser?.uid;

  // Define os últimos 6 meses incluindo o atual para busca de dados
  const allPotentialMonths = useMemo(() => {
    const months = [];
    const baseDate = startOfMonth(new Date()); 
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(baseDate, i);
      months.push({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM/yy', { locale: ptBR })
      });
    }
    return months;
  }, []);

  // Determina quais meses mostrar (sempre os 5 anteriores + o atual se tiver dados)
  const displayedMonths = useMemo(() => {
    const currentMonth = allPotentialMonths[5];
    const pastMonths = allPotentialMonths.slice(0, 5);
    
    const currentMonthData = historyData[currentMonth.key];
    const hasData = currentMonthData && Object.keys(currentMonthData).some(id => {
      const d = currentMonthData[id];
      return (Number(d.received) || 0) > 0 || (Number(d.current) || 0) > 0;
    });
    
    return hasData ? allPotentialMonths : pastMonths;
  }, [allPotentialMonths, historyData]);

  const customItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUserId) return null;
    return collection(db, 'users', activeUserId, 'inventory');
  }, [db, activeUserId]);

  const { data: customDefinitions } = useCollection(customItemsQuery);

  const combinedItems = useMemo(() => {
    const combined: InventoryItem[] = [];
    const officialIds = new Set(OFFICIAL_PUBLICATIONS.map((pub, idx) => pub.code || pub.abbr || `item_${idx}`));
    
    OFFICIAL_PUBLICATIONS.forEach((pub, idx) => {
      const itemId = pub.code || pub.abbr || `item_${idx}`;
      combined.push({ ...pub, id: itemId } as InventoryItem);
      
      if (pub.isCategory && customDefinitions) {
        const categoryCustomItems = customDefinitions
          .filter(cd => cd.category === pub.category && !officialIds.has(cd.id))
          .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

        categoryCustomItems.forEach(cd => combined.push(cd as InventoryItem));
      }
    });
    return combined;
  }, [customDefinitions]);

  // Configura ouvintes em tempo real para os 6 meses potenciais
  useEffect(() => {
    if (!activeUserId || !db) return;

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    allPotentialMonths.forEach(month => {
      const colRef = collection(db, 'users', activeUserId, 'monthly_records', month.key, 'items');
      const unsub = onSnapshot(colRef, (snapshot) => {
        const monthItems: Record<string, any> = {};
        snapshot.forEach(doc => {
          monthItems[doc.id] = doc.data();
        });
        
        setHistoryData(prev => ({
          ...prev,
          [month.key]: monthItems
        }));
        
        setLoading(false);
      }, (error) => {
        console.error(`Erro no listener do mês ${month.key}:`, error);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [activeUserId, db, allPotentialMonths]);

  const getValue = (monthKey: string, itemId: string, field: string) => {
    const val = historyData[monthKey]?.[itemId]?.[field];
    return (val !== undefined && val !== null) ? val : '';
  };

  const calculateOutgoing = (monthKey: string, itemId: string) => {
    const data = historyData[monthKey]?.[itemId];
    if (!data || data.current === null || data.current === undefined) return '';
    const prev = Number(data.previous) || 0;
    const rec = Number(data.received) || 0;
    const curr = Number(data.current) || 0;
    const result = (prev + rec) - curr;
    return result;
  };

  // Largura dinâmica: Nº(28) + Pub(200) + Meses(84 cada)
  const tableWidth = 228 + (displayedMonths.length * 84);

  return (
    <div className="relative mx-auto bg-white overflow-visible" style={{ width: `${tableWidth}px` }}>
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px] print:hidden">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-black">Sincronizando Histórico...</span>
          </div>
        </div>
      )}
      <Table className="border-separate border-spacing-0 border-black border-t border-l" style={{ width: `${tableWidth}px` }}>
        <TableHeader className="print:table-row-group">
          <TableRow className="bg-white hover:bg-white border-none">
            <TableHead className="w-[28px] border-r border-b border-black p-0"></TableHead>
            <TableHead className="w-[200px] text-[8px] font-black uppercase text-black p-0 text-center border-r border-b border-black align-middle">MÊS E ANO</TableHead>
            {displayedMonths.map((month) => (
              <TableHead 
                key={month.key} 
                colSpan={3} 
                className={cn(
                  "w-[84px] text-center text-[8px] font-black uppercase text-black p-0 border-r border-b border-black bg-neutral-50/50 align-middle"
                )}
              >
                {month.label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="bg-white hover:bg-white border-none">
            <TableHead className="w-[28px] text-[7px] font-bold text-black p-0 text-center border-r border-b border-black align-middle">N.º</TableHead>
            <TableHead className="w-[200px] text-[10px] font-black text-black px-2 py-0 align-middle border-r border-b border-black text-left">Publicações</TableHead>
            
            {displayedMonths.map((m) => (
              <React.Fragment key={m.key}>
                <TableHead className="w-[28px] text-[6px] font-bold text-black p-0 text-center uppercase tracking-tighter border-r border-b border-black align-middle">Recebido</TableHead>
                <TableHead className="w-[28px] text-[6px] font-bold text-black p-0 text-center uppercase tracking-tighter border-r border-b border-black align-middle">Estoque</TableHead>
                <TableHead className={cn(
                  "w-[28px] text-[6px] font-black text-black p-0 text-center uppercase bg-neutral-200 align-middle border-r border-b border-black"
                )}>Saída</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedItems.map((item, idx) => {
            const itemId = item.id;
            const itemName = item.item || "";
            
            if (item.isCategory) {
              const parts = itemName.split('(');
              const mainTitle = parts[0]?.trim() || "";
              const extraInfo = parts[1] ? `(${parts[1]}` : '';

              return (
                <TableRow key={`hist-cat-${idx}`} className="bg-neutral-100 hover:bg-neutral-100 border-none">
                  <TableCell className="p-0 border-r border-b border-black"></TableCell>
                  <TableCell colSpan={displayedMonths.length * 3 + 1} className="px-3 py-4 border-r border-b border-black align-middle">
                    <div className="flex items-center gap-2 overflow-visible">
                      <span className="text-[12px] font-black uppercase tracking-widest text-black shrink-0 leading-normal">{mainTitle}</span>
                      {extraInfo && (
                        <span className="text-[11px] font-bold text-neutral-600 italic normal-case truncate leading-normal">
                          {extraInfo}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }
            
            return (
              <TableRow key={`hist-row-${itemId}-${idx}`} className="hover:bg-transparent border-none min-h-[32px]">
                <TableCell className="text-[8px] text-center p-0 font-bold border-r border-b border-black align-middle">{item.code}</TableCell>
                <TableCell className="w-[200px] text-[9px] px-2 py-1.5 border-r border-b border-black align-middle">
                  <div className="flex justify-between items-center w-full gap-2">
                    <span className="leading-tight break-words">{itemName}</span>
                    {item.abbr && <span className="font-bold ml-auto text-[7px] text-neutral-500 leading-tight shrink-0">{item.abbr}</span>}
                  </div>
                </TableCell>
                
                {displayedMonths.map((m) => (
                  <React.Fragment key={m.key}>
                    <TableCell className="text-[8px] text-center p-0 font-bold border-r border-b border-black align-middle">
                      {formatNumber(getValue(m.key, itemId, 'received'))}
                    </TableCell>
                    <TableCell className="text-[8px] text-center p-0 font-bold border-r border-b border-black align-middle">
                      {formatNumber(getValue(m.key, itemId, 'current'))}
                    </TableCell>
                    <TableCell className={cn(
                      "text-[8px] text-center p-0 font-black bg-neutral-200 align-middle border-r border-b border-black"
                    )}>
                      {formatNumber(calculateOutgoing(m.key, itemId))}
                    </TableCell>
                  </React.Fragment>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
