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

  const lastSixMonths = useMemo(() => {
    const months = [];
    const baseDate = startOfMonth(subMonths(new Date(), 1)); 
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
    <div className="border border-black relative mx-auto bg-white" style={{ width: '732px' }}>
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px] print:hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse text-black">Sincronizando...</span>
        </div>
      )}
      <Table className="border-collapse table-fixed w-[732px]">
        <TableHeader className="print:table-row-group">
          <TableRow className="border-b border-black bg-white hover:bg-white h-[36px]">
            <TableHead className="w-[28px] border-r border-black p-0"></TableHead>
            <TableHead className="w-[200px] text-[8px] font-black uppercase text-black p-0 text-center border-r border-black leading-tight align-middle">MÊS E ANO</TableHead>
            {lastSixMonths.map((month, idx) => (
              <TableHead 
                key={month.key} 
                colSpan={3} 
                className={cn(
                  "w-[84px] text-center text-[8px] font-black uppercase text-black p-0 border-r border-black bg-neutral-50/50 leading-tight align-middle",
                  idx === 5 && "border-r-0"
                )}
              >
                {month.label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="border-b border-black bg-white hover:bg-white h-[36px]">
            <TableHead className="w-[28px] text-[7px] font-bold text-black p-0 text-center leading-tight border-r border-black align-middle">N.º</TableHead>
            <TableHead className="w-[200px] text-[10px] font-black text-black px-1 py-0 align-middle leading-tight border-r border-black text-left">Publicações</TableHead>
            
            {lastSixMonths.map((m, idx) => (
              <React.Fragment key={m.key}>
                <TableHead className="w-[28px] text-[6px] font-bold text-black p-0 text-center uppercase tracking-tighter leading-tight border-r border-black align-middle">Recebido</TableHead>
                <TableHead className="w-[28px] text-[6px] font-bold text-black p-0 text-center uppercase tracking-tighter leading-tight border-r border-black align-middle">Estoque</TableHead>
                <TableHead className={cn(
                  "w-[28px] text-[6px] font-black text-black p-0 text-center uppercase bg-neutral-200 leading-tight align-middle",
                  idx === 5 ? "" : "border-r border-black"
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
                <TableRow key={`hist-cat-${idx}`} className="border-b border-black bg-neutral-100/50 hover:bg-neutral-100/50 h-[32px]">
                  <TableCell className="p-0 border-r border-black"></TableCell>
                  <TableCell colSpan={19} className="px-1 py-0 border-r-0 align-middle">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-[11px] font-black uppercase tracking-tight text-black shrink-0 leading-none">{mainTitle}</span>
                      {extraInfo && (
                        <span className="text-[11px] font-bold text-neutral-500 italic normal-case truncate leading-none">
                          {extraInfo}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            }
            
            return (
              <TableRow key={`hist-row-${itemId}-${idx}`} className="border-b border-black h-[30px] hover:bg-transparent print:h-[28px]">
                <TableCell className="text-[8px] text-center p-0 font-bold border-r border-black leading-tight align-middle">{item.code}</TableCell>
                <TableCell className="w-[200px] text-[9px] px-1 py-0 border-r border-black align-middle">
                  <div className="flex justify-between items-center w-full">
                    <span className="leading-tight">{itemName}</span>
                    {item.abbr && <span className="font-bold ml-1 text-[7px] text-neutral-500 leading-tight">{item.abbr}</span>}
                  </div>
                </TableCell>
                
                {lastSixMonths.map((m, mIdx) => (
                  <React.Fragment key={m.key}>
                    <TableCell className="text-[8px] text-center p-0 font-bold border-r border-black leading-tight align-middle">
                      {formatNumber(getValue(m.key, itemId, 'received'))}
                    </TableCell>
                    <TableCell className="text-[8px] text-center p-0 font-bold border-r border-black leading-tight align-middle">
                      {formatNumber(getValue(m.key, itemId, 'current'))}
                    </TableCell>
                    <TableCell className={cn(
                      "text-[8px] text-center p-0 font-black bg-neutral-200 leading-tight align-middle",
                      mIdx === 5 ? "" : "border-r border-black"
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
