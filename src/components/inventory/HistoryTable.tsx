
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
        label: format(date, 'MMM/yy', { locale: ptBR }).toUpperCase().replace('.', '')
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
        // Ignore
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
    <div className="border border-black relative overflow-hidden print:border-black w-[750px] mx-auto min-w-[750px] max-w-[750px] font-sans">
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px] print:hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse text-black">Sincronizando Dados...</span>
        </div>
      )}
      <Table className="border-collapse table-fixed w-[750px] print:w-[750px]">
        <TableHeader className="print:table-row-group">
          {/* Nível 1: MÊS E ANO */}
          <TableRow className="border-b border-black bg-white hover:bg-white h-6">
            <TableHead colSpan={2} className="w-[264px] text-[9px] font-black uppercase text-black p-0 h-auto text-center border-r border-black leading-none">MÊS E ANO</TableHead>
            {lastSixMonths.map((month, mIdx) => (
              <TableHead 
                key={month.key} 
                colSpan={3} 
                className={cn(
                  "text-center text-[9px] font-black uppercase text-black p-0 h-auto border-r border-black leading-none w-[81px]",
                  mIdx === lastSixMonths.length - 1 && "border-r-0"
                )}
              >
                {month.label}
              </TableHead>
            ))}
          </TableRow>
          
          {/* Nível 2: Cabeçalhos das Colunas */}
          <TableRow className="border-b border-black bg-white hover:bg-white h-6">
            <TableHead className="w-[35px] text-[8px] font-black text-black p-0 h-auto text-center leading-none border-r border-black">N.º</TableHead>
            <TableHead className="w-[229px] text-[10px] font-black text-black px-2 py-0 h-auto align-middle leading-none border-r border-black">Publicações</TableHead>
            
            {lastSixMonths.map((m, mIdx) => (
              <React.Fragment key={m.key}>
                <TableHead className="w-[27px] text-[5.5px] font-black text-black p-0 h-auto text-center uppercase leading-none border-r border-black">REC.</TableHead>
                <TableHead className="w-[27px] text-[5.5px] font-black text-black p-0 h-auto text-center uppercase leading-none border-r border-black">EST.</TableHead>
                <TableHead className={cn(
                  "w-[27px] text-[6px] font-black text-black p-0 h-auto text-center uppercase bg-neutral-200 leading-none border-r border-black",
                  mIdx === lastSixMonths.length - 1 && "border-r-0"
                )}>SAÍ.</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedItems.map((item, idx) => {
            if (item.isCategory) {
              return (
                <TableRow key={`hist-cat-${idx}`} className="border-b border-black bg-white hover:bg-white h-6">
                  <TableCell className="w-[35px] p-0 border-r border-black h-full" />
                  <TableCell colSpan={19} className="text-[10px] font-black uppercase px-2 py-0 tracking-tight text-black border-r-0 h-full align-middle">
                    {item.item}
                  </TableCell>
                </TableRow>
              );
            }
            
            return (
              <TableRow key={`hist-row-${item.id}-${idx}`} className="border-b border-black h-6 hover:bg-transparent">
                <TableCell className="w-[35px] text-[9px] text-center p-0 font-bold border-r border-black leading-none">{item.code}</TableCell>
                <TableCell className="w-[229px] text-[9px] px-2 py-0 border-r border-black h-full overflow-hidden leading-none">
                  <div className="flex justify-between items-center w-full gap-1">
                    <span className="truncate leading-none font-medium">{item.item}</span>
                    {item.abbr && <span className="font-bold text-[7px] text-neutral-500 lowercase shrink-0">{item.abbr}</span>}
                  </div>
                </TableCell>
                
                {lastSixMonths.map((m, mIdx) => (
                  <React.Fragment key={m.key}>
                    <TableCell className="w-[27px] text-[9px] text-center p-0 font-bold border-r border-black leading-none">{getValue(m.key, item.id, 'received')}</TableCell>
                    <TableCell className="w-[27px] text-[9px] text-center p-0 font-bold border-r border-black leading-none">{getValue(m.key, item.id, 'current')}</TableCell>
                    <TableCell className={cn(
                      "w-[27px] text-[9px] text-center p-0 font-black bg-neutral-200 leading-none border-r border-black",
                      mIdx === lastSixMonths.length - 1 && "border-r-0"
                    )}>{calculateOutgoing(m.key, item.id)}</TableCell>
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
