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
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, TrendingUp, Package, MoveUpRight, Layers } from 'lucide-react';

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
    }
  }>({
    monthlyOutgoing: [],
    categoryDistribution: [],
    topItems: [],
    totals: { stock: 0, received: 0, outgoing: 0 }
  });

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

  useEffect(() => {
    async function fetchStats() {
      if (!activeUserId || !db) return;
      setLoading(true);
      
      try {
        const monthlyData = [];
        let totalStock = 0;
        let totalReceived = 0;
        let totalOutgoingValue = 0;
        const itemUsage: Record<string, { name: string; outgoing: number }> = {};
        const categoryMap: Record<string, number> = {};

        for (const month of lastSixMonths) {
          const colRef = collection(db, 'users', activeUserId, 'monthly_records', month.key, 'items');
          const snapshot = await getDocs(colRef);
          
          let monthOutgoingTotal = 0;
          snapshot.forEach(doc => {
            const data = doc.data();
            const prev = Number(data.previous) || 0;
            const rec = Number(data.received) || 0;
            const curr = Number(data.current) || 0;
            const outgoing = Math.max(0, (prev + rec) - curr);

            monthOutgoingTotal += outgoing;

            // Agrega dados apenas do mês mais recente para estoque e categorias
            if (month.key === lastSixMonths[lastSixMonths.length - 1].key) {
              totalStock += curr;
              totalReceived += rec;
              
              const cat = data.category || 'Outros';
              categoryMap[cat] = (categoryMap[cat] || 0) + curr;
            }

            // Acumula uso de itens para o ranking
            const itemName = data.item || 'Desconhecido';
            if (!itemUsage[itemName]) itemUsage[itemName] = { name: itemName, outgoing: 0 };
            itemUsage[itemName].outgoing += outgoing;
          });

          monthlyData.push({
            name: month.label,
            saida: monthOutgoingTotal
          });
          
          if (month.key === lastSixMonths[lastSixMonths.length - 1].key) {
            totalOutgoingValue = monthOutgoingTotal;
          }
        }

        const categoryDist = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
        
        // Alterado para mostrar 10 itens conforme solicitado pelo usuário
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
            outgoing: totalOutgoingValue
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
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Estoque Atual</p>
            <p className="text-xl font-black">{stats.totals.stock}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-accent/10 p-3 rounded-lg">
            <TrendingUp className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Recebido (Mês)</p>
            <p className="text-xl font-black">{stats.totals.received}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-neutral-100 p-3 rounded-lg">
            <MoveUpRight className="h-6 w-6 text-neutral-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Saída (Mês)</p>
            <p className="text-xl font-black">{stats.totals.outgoing}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm flex items-center gap-4">
          <div className="bg-primary/5 p-3 rounded-lg">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Categorias</p>
            <p className="text-xl font-black">{stats.categoryDistribution.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Barras: Tendência de Saída */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest pl-2">Tendência de Saída (Últimos 6 meses)</h3>
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

        {/* Gráfico de Pizza: Distribuição por Categoria */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest pl-2">Distribuição do Estoque Atual por Categoria</h3>
          <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-neutral-100 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryDistribution}
                  cx="50%"
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
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking de Itens mais movimentados */}
      <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
        <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest mb-6">Itens com maior Saída (Acumulado 6 meses)</h3>
        <div className="space-y-4">
          {stats.topItems.map((item, idx) => {
            const maxVal = stats.topItems[0]?.outgoing || 1;
            const percentage = (item.outgoing / maxVal) * 100;
            
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="truncate max-w-[70%]">{item.name}</span>
                  <span className="text-primary shrink-0">{item.outgoing} unidades</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
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
