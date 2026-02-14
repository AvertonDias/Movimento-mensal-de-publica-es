
"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, TrendingUp, Package, MoveUpRight, AlertOctagon, Activity } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { OFFICIAL_PUBLICATIONS } from "@/app/lib/publications";

interface StatsDashboardProps {
  targetUserId?: string;
}

export function StatsDashboard({ targetUserId }: StatsDashboardProps) {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    monthlyOutgoing: any[];
    categoryDistribution: any[];
    topItems: any[];
    totals: {
      stock: number;
      received: number;
      outgoing: number;
      criticalItems: number;
      avgOutgoing: number;
    }
  }>({
    monthlyOutgoing: [],
    categoryDistribution: [],
    topItems: [],
    totals: { stock: 0, received: 0, outgoing: 0, criticalItems: 0, avgOutgoing: 0 }
  });

  const activeUserId = targetUserId || currentUser?.uid;

  const lastSixMonths = useMemo(() => {
    const months = [];
    const baseDate = startOfMonth(subMonths(new Date(), 1)); // Inicia do mês anterior
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(baseDate, i);
      months.push({
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM/yy', { locale: ptBR })
      });
    }
    return months;
  }, []);

  useEffect(() => {
    async function fetchStats() {
      if (!activeUserId || !db) return;
      setLoading(true);
      
      try {
        const monthlyData = [];
        let latestMonthWithData = null;
        const allMonthsRecords: Record<string, any[]> = {};
        const itemHistory: Record<string, number[]> = {};
        const itemUsage: Record<string, { name: string; outgoing: number; category: string; imageKey?: string }> = {};

        // Busca dados de todos os 6 meses para análise de tendências e médias
        for (const month of lastSixMonths) {
          const colRef = collection(db, 'users', activeUserId, 'monthly_records', month.key, 'items');
          const snapshot = await getDocs(colRef);
          
          const records: any[] = [];
          let monthOutgoingTotal = 0;
          
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const prev = Number(data.previous) || 0;
            const rec = Number(data.received) || 0;
            const curr = Number(data.current) || 0;
            const outgoing = Math.max(0, (prev + rec) - curr);

            records.push({ ...data, outgoing, curr, rec, id: docSnap.id });
            monthOutgoingTotal += outgoing;

            // Histórico individual para cálculo de média/minStock
            if (!itemHistory[docSnap.id]) itemHistory[docSnap.id] = [];
            itemHistory[docSnap.id].push(outgoing);

            const itemName = data.item || 'Desconhecido';
            if (!itemUsage[itemName]) {
              // Busca fallback da imagem na lista oficial caso o registro antigo não tenha
              const official = OFFICIAL_PUBLICATIONS.find(p => p.item === itemName);
              
              itemUsage[itemName] = { 
                name: itemName, 
                outgoing: 0, 
                category: data.category || 'Outros',
                imageKey: data.imageKey || official?.imageKey
              };
            }
            itemUsage[itemName].outgoing += outgoing;
          });

          allMonthsRecords[month.key] = records;
          if (records.length > 0) latestMonthWithData = month.key;

          monthlyData.push({
            name: month.label,
            saida: monthOutgoingTotal
          });
        }

        // Processa o mês mais recente para métricas de "Agora"
        const targetMonthKey = latestMonthWithData || lastSixMonths[lastSixMonths.length - 1].key;
        const targetRecords = allMonthsRecords[targetMonthKey] || [];
        
        let totalStock = 0;
        let totalReceived = 0;
        let totalOutgoingLastMonth = 0;
        let criticalCount = 0;
        const categoryMap: Record<string, number> = {};

        targetRecords.forEach(rec => {
          totalStock += rec.curr;
          totalReceived += rec.rec;
          totalOutgoingLastMonth += rec.outgoing;
          
          // Simplifica o nome da categoria removendo o texto entre parênteses
          const rawCat = rec.category || 'Outros';
          const cat = rawCat.split('(')[0].trim();
          categoryMap[cat] = (categoryMap[cat] || 0) + rec.curr;

          // Lógica de item crítico (estoque atual <= margem de segurança baseada na média)
          const history = itemHistory[rec.id] || [];
          if (history.length > 0) {
            const avg = history.reduce((a, b) => a + b, 0) / history.length;
            const minSafe = Math.max(1, Math.ceil(avg * 1.2));
            if (rec.curr <= minSafe && avg > 0) {
              criticalCount++;
            }
          }
        });

        const avgTotalOutgoing = monthlyData.reduce((acc, curr) => acc + curr.saida, 0) / (monthlyData.filter(m => m.saida > 0).length || 1);

        const categoryDist = Object.entries(categoryMap)
          .map(([name, value]) => ({ name, value }))
          .filter(c => c.value > 0);
        
        const topItemsList = Object.values(itemUsage)
          .sort((a, b) => b.outgoing - a.outgoing)
          .slice(0, 10);

        setStats({
          monthlyOutgoing: monthlyData,
          categoryDistribution: categoryDist,
          topItems: topItemsList,
          totals: {
            stock: totalStock,
            received: totalReceived,
            outgoing: totalOutgoingLastMonth,
            criticalItems: criticalCount,
            avgOutgoing: Math.round(avgTotalOutgoing)
          }
        });
      } catch (e) {
        console.error("Erro ao processar estatísticas:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [activeUserId, db, lastSixMonths]);

  const COLORS = ['#A0CFEC', '#90EE90', '#1F5F5B', '#E5A93F', '#E56D3F', '#6B7280', '#D946EF', '#F43F5E', '#10B981', '#F59E0B'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Processando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Estoque Total</p>
            <p className="text-lg font-black">{stats.totals.stock}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-accent/10 p-3 rounded-lg">
            <MoveUpRight className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Saída (Últ. Mês)</p>
            <p className="text-lg font-black">{stats.totals.outgoing}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-destructive/10 p-3 rounded-lg">
            <AlertOctagon className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Itens Críticos</p>
            <p className="text-lg font-black text-destructive">{stats.totals.criticalItems}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-neutral-100 p-3 rounded-lg">
            <Activity className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Média Mensal</p>
            <p className="text-lg font-black">{stats.totals.avgOutgoing}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-primary/5 p-3 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Recebidos</p>
            <p className="text-lg font-black">{stats.totals.received}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest pl-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" /> Tendência de Saída (Últimos 6 meses)
          </h3>
          <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyOutgoing}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(160, 207, 236, 0.1)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="saida" fill="#A0CFEC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest pl-2 flex items-center gap-2">
            <Package className="h-3.5 w-3.5" /> Distribuição do Estoque Atual por Categoria
          </h3>
          <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
            {stats.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryDistribution}
                    cx="40%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingLeft: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
                Nenhum dado de categoria disponível
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
        <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest mb-6 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" /> Top 10 Itens mais distribuídos (6 meses)
        </h3>
        <div className="space-y-4">
          {stats.topItems.map((item, idx) => {
            const maxVal = stats.topItems[0]?.outgoing || 1;
            const percentage = (item.outgoing / maxVal) * 100;
            const imagePlaceholder = item.imageKey ? PlaceHolderImages.find(img => img.id === item.imageKey) : null;
            
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 w-4">#{idx + 1}</span>
                    {imagePlaceholder ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <span className="truncate max-w-[200px] md:max-w-md cursor-pointer border-b border-dotted border-muted-foreground/50 hover:text-primary transition-colors">
                            {item.name}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="p-0 border-none shadow-2xl overflow-hidden rounded-lg w-[180px]">
                          <div className="relative aspect-[2/3] bg-neutral-50 p-2">
                            <Image 
                              src={imagePlaceholder.imageUrl} 
                              alt={imagePlaceholder.description} 
                              fill 
                              sizes="180px" 
                              className="object-contain" 
                              unoptimized 
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="truncate max-w-[200px] md:max-w-md">{item.name}</span>
                    )}
                    <span className="text-[8px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500">
                      {item.category.split('(')[0].trim()}
                    </span>
                  </div>
                  <span className="text-primary shrink-0">{item.outgoing} un.</span>
                </div>
                <div className="h-2 w-full bg-neutral-50 rounded-full overflow-hidden border border-neutral-100/50">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
