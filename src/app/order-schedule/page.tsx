'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Truck, Calendar, Info, MapPin, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format, isAfter, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type OrderDeadline = {
  deadline: string; // dd/MM/yyyy
  exit: string;
  delivery: string;
};

type RegionData = {
  id: string;
  name: string;
  states: string;
  deadlines: OrderDeadline[];
};

const SCHEDULE_DATA: RegionData[] = [
  {
    id: "co-ne-sul",
    name: "C.O. / NE / Sul",
    states: "Centro-Oeste, Nordeste e Sul (Todos os estados)",
    deadlines: [
      { deadline: "29/08/2025", exit: "Outubro de 2025", delivery: "Entre 1 e 15 de novembro de 2025" },
      { deadline: "31/10/2025", exit: "Dezembro de 2025", delivery: "Entre 1 e 15 de janeiro de 2026" },
      { deadline: "02/01/2026", exit: "Fevereiro de 2026", delivery: "Entre 1 e 15 de março de 2026" },
      { deadline: "27/02/2026", exit: "Abril de 2026", delivery: "Entre 1 e 15 de maio de 2026" },
      { deadline: "01/05/2026", exit: "Junho de 2026", delivery: "Entre 1 e 15 de julho de 2026" },
      { deadline: "03/07/2026", exit: "Agosto de 2026", delivery: "Entre 1 e 15 de setembro de 2026" },
    ]
  },
  {
    id: "norte-1",
    name: "Norte (A)",
    states: "Amazonas, Acre, Amapá e Roraima",
    deadlines: [
      { deadline: "29/08/2025", exit: "Setembro de 2025", delivery: "Entre 15 de outubro e 15 de novembro de 2025" },
      { deadline: "31/10/2025", exit: "Novembro de 2025", delivery: "Entre 15 de dezembro e 15 de janeiro de 2026" },
      { deadline: "02/01/2026", exit: "Janeiro de 2026", delivery: "Entre 15 de fevereiro e 15 de março de 2026" },
      { deadline: "27/02/2026", exit: "Março de 2026", delivery: "Entre 15 de abril e 15 de maio de 2026" },
      { deadline: "01/05/2026", exit: "Maio de 2026", delivery: "Entre 15 de junho e 15 de julho de 2026" },
      { deadline: "03/07/2026", exit: "Julho de 2026", delivery: "Entre 15 de agosto e 15 de setembro de 2026" },
    ]
  },
  {
    id: "norte-2",
    name: "Norte (B)",
    states: "Pará, Rondônia e Tocantins",
    deadlines: [
      { deadline: "29/08/2025", exit: "Setembro de 2025", delivery: "Entre 15 e 31 de outubro de 2025" },
      { deadline: "31/10/2025", exit: "Novembro de 2025", delivery: "Entre 15 e 31 de dezembro de 2025" },
      { deadline: "02/01/2026", exit: "Janeiro de 2026", delivery: "Entre 15 e 31 de fevereiro de 2026" },
      { deadline: "27/02/2026", exit: "Março de 2026", delivery: "Entre 15 e 31 de abril de 2026" },
      { deadline: "01/05/2026", exit: "Maio de 2026", delivery: "Entre 15 e 31 de junho de 2026" },
      { deadline: "03/07/2026", exit: "Julho de 2026", delivery: "Entre 15 e 31 de agosto de 2026" },
    ]
  },
  {
    id: "sudeste-1",
    name: "Sudeste (A)",
    states: "Espírito Santo, Minas Gerais e Rio de Janeiro",
    deadlines: [
      { deadline: "29/08/2025", exit: "Outubro de 2025", delivery: "Entre 15 e 30 de novembro de 2025" },
      { deadline: "31/10/2025", exit: "Dezembro de 2025", delivery: "Entre 15 e 30 de janeiro de 2026" },
      { deadline: "02/01/2026", exit: "Fevereiro de 2026", delivery: "Entre 15 e 30 de março de 2026" },
      { deadline: "27/02/2026", exit: "Abril de 2026", delivery: "Entre 15 e 30 de maio de 2026" },
      { deadline: "01/05/2026", exit: "Junho de 2026", delivery: "Entre 15 e 30 de julho de 2026" },
      { deadline: "03/07/2026", exit: "Agosto de 2026", delivery: "Entre 15 e 30 de setembro de 2026" },
    ]
  },
  {
    id: "sp",
    name: "São Paulo",
    states: "Estado de São Paulo",
    deadlines: [
      { deadline: "29/08/2025", exit: "Novembro de 2025", delivery: "Entre 15 e 30 de novembro de 2025" },
      { deadline: "31/10/2025", exit: "Janeiro de 2026", delivery: "Entre 15 e 30 de janeiro de 2026" },
      { deadline: "02/01/2026", exit: "Março de 2026", delivery: "Entre 15 e 30 de março de 2026" },
      { deadline: "27/02/2026", exit: "Maio de 2026", delivery: "Entre 15 e 30 de maio de 2026" },
      { deadline: "01/05/2026", exit: "Julho de 2026", delivery: "Entre 15 e 30 de julho de 2026" },
      { deadline: "03/07/2026", exit: "Setembro de 2026", delivery: "Entre 15 e 30 de setembro de 2026" },
    ]
  }
];

export default function OrderSchedulePage() {
  const [activeRegionId, setActiveRegionId] = useState(SCHEDULE_DATA[0].id);
  const now = new Date();

  const activeRegion = useMemo(() => 
    SCHEDULE_DATA.find(r => r.id === activeRegionId)!, 
  [activeRegionId]);

  const nextDeadline = useMemo(() => {
    return activeRegion.deadlines.find(d => {
      const deadlineDate = parse(d.deadline, 'dd/MM/yyyy', new Date());
      return isAfter(deadlineDate, now);
    }) || activeRegion.deadlines[activeRegion.deadlines.length - 1];
  }, [activeRegion, now]);

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 md:px-6 font-body">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight font-headline">Cronograma de Pedidos</h1>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Programação anual para pedidos de outras publicações e equipamentos.
            </p>
          </div>
          
          <Card className="bg-primary border-none shadow-lg text-primary-foreground p-4 flex items-center gap-4 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white/20 p-2 rounded-full">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-80 leading-none mb-1">Próximo Prazo Final</p>
              <p className="text-lg font-black tracking-tight">{nextDeadline.deadline}</p>
            </div>
          </Card>
        </div>

        <Card className="bg-white border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black uppercase text-sm tracking-tight">Sobre a Programação</h3>
              <p className="text-xs text-muted-foreground font-bold leading-relaxed uppercase">
                Esta programação auxilia na organização para que os pedidos sejam feitos e recebidos dentro do tempo necessário. 
                Lembre-se que Betel envia publicações de estoque uma vez a cada dois meses.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Selecione sua Região</h2>
          </div>

          <Tabs value={activeRegionId} onValueChange={setActiveRegionId} className="w-full">
            <TabsList className="w-full h-auto flex flex-wrap justify-start bg-transparent gap-2 p-0">
              {SCHEDULE_DATA.map(region => (
                <TabsTrigger 
                  key={region.id} 
                  value={region.id}
                  className="bg-white border border-neutral-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-all"
                >
                  {region.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {SCHEDULE_DATA.map(region => (
              <TabsContent key={region.id} value={region.id} className="mt-6 animate-in fade-in duration-300">
                <Card className="overflow-hidden border-none shadow-xl">
                  <CardHeader className="bg-neutral-50 border-b border-neutral-100 py-4 px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {region.name}
                      </CardTitle>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase italic">{region.states}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-neutral-50/50">
                          <TableRow>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-center h-12 w-[140px] border-r">
                              <div className="flex items-center justify-center gap-2">
                                <AlertCircle className="h-3 w-3 text-destructive" />
                                Data-Limite
                              </div>
                            </TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-center h-12 border-r">
                              <div className="flex items-center justify-center gap-2">
                                <Truck className="h-3 w-3 text-amber-500" />
                                Saída de Betel
                              </div>
                            </TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-center h-12">
                              <div className="flex items-center justify-center gap-2">
                                <Calendar className="h-3 w-3 text-emerald-500" />
                                Prazo de Entrega
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {region.deadlines.map((item, idx) => {
                            const isCurrent = item.deadline === nextDeadline.deadline;
                            const deadlineDate = parse(item.deadline, 'dd/MM/yyyy', new Date());
                            const isPassed = !isCurrent && !isAfter(deadlineDate, now);

                            return (
                              <TableRow 
                                key={idx} 
                                className={cn(
                                  "hover:bg-neutral-50/50 transition-colors",
                                  isCurrent && "bg-primary/5",
                                  isPassed && "opacity-40 grayscale"
                                )}
                              >
                                <TableCell className={cn(
                                  "text-center font-black text-xs h-14 border-r",
                                  isCurrent ? "text-primary" : "text-destructive"
                                )}>
                                  <div className="flex flex-col items-center gap-1">
                                    {isCurrent && <span className="text-[8px] bg-primary text-primary-foreground px-1.5 rounded-full mb-1">ATUAL</span>}
                                    {item.deadline}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-bold text-xs uppercase text-neutral-600 border-r">
                                  {item.exit}
                                </TableCell>
                                <TableCell className="text-center font-black text-xs uppercase text-emerald-600">
                                  {item.delivery}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-[10px] font-bold text-amber-700 uppercase leading-tight">
            Atenção: Os pedidos de outras publicações, equipamentos e cartazes para testemunho público devem ser feitos exclusivamente via JW Hub. Utilize estas datas como referência para planejar seus pedidos com antecedência.
          </p>
        </div>
      </div>
    </div>
  );
}
