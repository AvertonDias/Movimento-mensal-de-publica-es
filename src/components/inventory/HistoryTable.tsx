
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
    OFFICIAL_PUBLICATIONS.forEach((pub, idx) => {
      combined.push({ ...pub, id: pub.code || `cat_${idx}` } as InventoryItem);
      
      if (pub.isCategory && customDefinitions) {
        const categoryCustomItems = customDefinitions
          .filter(cd => cd.category === pub.item)
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
        console.error("Erro ao buscar histórico:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [activeUserId, db, lastSixMonths]);

  const getValue = (monthKey: string, itemId: string, field: string) => {
    const val = historyData[monthKey]?.[itemId]?.[field];
    return val !== undefined && val !== 0 ? val : '';
  };

  const calculateOutgoing = (monthKey: string, itemId: string) => {
    const data = historyData[monthKey]?.[itemId];
    if (!data) return '';
    const prev = Number(data.previous) || 0;
    const rec = Number(data.received) || 0;
    const curr = Number(data.current) || 0;
    const result = (prev + rec) - curr;
    return result !== 0 ? result : '';
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
          <TableRow className="border-b-2 border-black divide-x divide-black bg-white hover:bg-white h-7">
            <TableHead className="w-[35px] text-[8px] font-black uppercase text-black p-0.5 text-center border-black">MÊS</TableHead>
            <TableHead className="w-[160px] border-l-0"></TableHead>
            {lastSixMonths.map((month) => (
              <TableHead 
                key={month.key} 
                colSpan={3} 
                className="text-center text-[8px] font-black uppercase text-black p-0 h-7 border-l border-black bg-neutral-50/50"
              >
                {month.label}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="border-b-2 border-black divide-x divide-black bg-white hover:bg-white h-7">
            <TableHead className="w-[35px] text-[7px] font-bold text-black p-0 text-center leading-none">N.º</TableHead>
            <TableHead className="text-[10px] font-black text-black px-1 py-0 align-middle">Publicações</TableHead>
            
            {lastSixMonths.map((m) => (
              <React.Fragment key={m.key}>
                <TableHead className="text-[6px] font-bold text-black p-0 text-center uppercase leading-[1]">Recebido</TableHead>
                <TableHead className="text-[6px] font-bold text-black p-0 text-center uppercase leading-[1]">Est.</TableHead>
                <TableHead className="text-[6px] font-black text-black p-0 text-center uppercase bg-neutral-200 leading-[1]">Saída</TableHead>
              </React.Fragment>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedItems.map((item, idx) => {
            const itemId = item.id || `item_${idx}`;
            
            if (item.isCategory) {
              return (
                <TableRow key={idx} className="border-b border-black bg-neutral-100/50 hover:bg-neutral-100/50 h-5">
                  <TableCell className="p-0 border-r border-black"></TableCell>
                  <TableCell colSpan={18} className="text-[9px] font-black uppercase px-1 py-0 tracking-tight text-black">
                    {item.item}
                  </TableCell>
                </TableRow>
              );
            }
            
            return (
              <TableRow key={idx} className="border-b border-black divide-x divide-black h-5 hover:bg-transparent print:h-4">
                <TableCell className="text-[8px] text-center p-0 font-bold border-black leading-none">{item.code}</TableCell>
                <TableCell className="text-[9px] px-1 py-0 border-black flex justify-between items-center h-full overflow-hidden">
                  <span className="truncate leading-none">{item.item}</span>
                  {item.abbr && <span className="font-bold ml-1 text-[7px] text-neutral-500">{item.abbr}</span>}
                </TableCell>
                
                {lastSixMonths.map((m) => (
                  <React.Fragment key={m.key}>
                    <TableCell className="text-[8px] text-center p-0 font-bold leading-none">{getValue(m.key, itemId, 'received')}</TableCell>
                    <TableCell className="text-[8px] text-center p-0 font-bold leading-none">{getValue(m.key, itemId, 'current')}</TableCell>
                    <TableCell className="text-[8px] text-center p-0 font-black bg-neutral-200 leading-none">{calculateOutgoing(m.key, itemId)}</TableCell>
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
