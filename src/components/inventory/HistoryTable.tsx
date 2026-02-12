
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
import { collection, getDocs } from 'firebase/firestore';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OFFICIAL_PUBLICATIONS, InventoryItem } from "@/app/types/inventory";
import { cn } from "@/lib/utils";

interface HistoryTableProps {
  targetUserId?: string;
}

export function HistoryTable({ targetUserId }: HistoryTableProps) {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const [historyData, setHistoryData] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);

  const activeUserId = targetUserId || currentUser?.uid;

  const lastSixMonths = useMemo(() => {
    const months = [];
    const baseDate = subMonths(new Date(), 1);
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(baseDate, i);
      months.push({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM/yy', { locale: ptBR })
      });
    }
    return months;
  }, []);

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

  useEffect(() => {
    async function fetchHistory() {
      if (!activeUserId || !db) return;
      setLoading(true);
      const allMonthsData: Record<string, Record<string, any>> = {};

      try {
        for (const month of lastSixMonths) {
          const colRef = collection(db, 'users', activeUserId, 'monthly_records', month.key, 'items');
          const snapshot = await getDocs(colRef);
          const monthItems: Record<string, any> = {};
          snapshot.forEach(doc => {
            monthItems[doc.id] = doc.data();
          });
          allMonthsData[month.key] = monthItems;
        }
        setHistoryData(allMonthsData);
      } catch (e) {
        // Silently handle error
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [activeUserId, db, lastSixMonths]);

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

  return (
    <div className="border border-black relative overflow-hidden print:border-black">
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px] print:hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse text-black">Sincronizando...</span>
        </div>
      )}
      <Table className="border-collapse table-fixed w-full min-w-[1250px] print:min-w-0">
        <TableHeader className="print:table-row-group">
          <TableRow className="border-b border-black bg-white hover:bg-white h-[22px]">
            <TableHead className="w-[20px] border-r border-black"></TableHead>
            <TableHead className="w-[210px] text-[8px] font-black uppercase text-black p-0 h-auto text-center border-r border-black leading-none">MÊS E ANO</TableHead>
            {lastSixMonths.map((month, mIdx) => (
              <TableHead 
                key={month.key} 
                colSpan={3} 
                className={cn(
                  "text-center text-[8px] font-black uppercase text-black p-0 h-auto border-black bg-neutral-50/50 leading-none",
                  mIdx !== lastSixMonths.length - 1 ? "border-r" : ""
                )}
              >
                {month.label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="border-b border-black bg-white hover:bg-white h-[22px]">
            <TableHead className="w-[20px] text-[7px] font-bold text-black p-0 h-auto text-center leading-none border-r border-black">N.º</TableHead>
            <TableHead className="w-[210px] text-[10px] font-black text-black px-1 py-0 h-auto align-middle leading-none border-r border-black">Publicações</TableHead>
            
            {lastSixMonths.map((m, mIdx) => (
              <React.Fragment key={m.key}>
                <TableHead className="w-[50px] text-[6px] font-bold text-black p-0 h-auto text-center uppercase leading-[1] border-r border-black">Recebido</TableHead>
                <TableHead className="w-[50px] text-[6px] font-bold text-black p-0 h-auto text-center uppercase leading-[1] border-r border-black">Estoque</TableHead>
                <TableHead className={cn(
                  "w-[50px] text-[6px] font-black text-black p-0 h-auto text-center uppercase bg-neutral-200 leading-[1] border-black",
                  mIdx !== lastSixMonths.length - 1 ? "border-r" : ""
                )}>Saída</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedItems.map((item, idx) => {
            const itemId = item.id;
            
            if (item.isCategory) {
              return (
                <TableRow key={`hist-cat-${idx}`} className="border-b border-black bg-neutral-100/50 hover:bg-neutral-100/50 h-5">
                  <TableCell className="p-0 border-r border-black"></TableCell>
                  <TableCell colSpan={20} className="text-[9px] font-black uppercase px-1 py-0 tracking-tight text-black border-r border-black">
                    {item.item}
                  </TableCell>
                </TableRow>
              );
            }
            
            return (
              <TableRow key={`hist-row-${itemId}-${idx}`} className="border-b border-black h-5 hover:bg-transparent print:h-4">
                <TableCell className="text-[8px] text-center p-0 font-bold border-r border-black leading-none">{item.code}</TableCell>
                <TableCell className="w-[210px] text-[9px] px-1 py-0 border-r border-black h-full overflow-hidden leading-none">
                  <div className="flex justify-between items-center w-full">
                    <span className="truncate leading-none">{item.item}</span>
                    {item.abbr && <span className="font-bold ml-1 text-[7px] text-neutral-500">{item.abbr}</span>}
                  </div>
                </TableCell>
                
                {lastSixMonths.map((m, mIdx) => (
                  <React.Fragment key={m.key}>
                    <TableCell className="text-[8px] text-center p-0 font-bold border-r border-black leading-none">{getValue(m.key, itemId, 'received')}</TableCell>
                    <TableCell className="text-[8px] text-center p-0 font-bold border-r border-black leading-none">{getValue(m.key, itemId, 'current')}</TableCell>
                    <TableCell className={cn(
                      "text-[8px] text-center p-0 font-black bg-neutral-200 leading-none",
                      mIdx !== lastSixMonths.length - 1 ? "border-r border-black" : ""
                    )}>{calculateOutgoing(m.key, itemId)}</TableCell>
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
