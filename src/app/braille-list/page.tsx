'use client';

import React, { useState, useMemo } from 'react';
import { 
  Accessibility, 
  Search, 
  BookOpen, 
  Info, 
  Layers, 
  Filter,
  ChevronRight,
  Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BrailleItem {
  code: string;
  name: string;
  category: string;
  grade: 'Grau 1' | 'Grau 2' | 'Ambos';
  volumes: string;
}

const BRAILLE_DATA: BrailleItem[] = [
  // Bíblias
  { code: '3140', name: 'Tradução do Novo Mundo (G1)', category: 'Bíblias', grade: 'Grau 1', volumes: '20' },
  { code: '3140', name: 'Tradução do Novo Mundo (G2)', category: 'Bíblias', grade: 'Grau 2', volumes: '18' },
  { code: '3142', name: 'Escrituras Gregas (G1)', category: 'Bíblias', grade: 'Grau 1', volumes: '5' },
  
  // Livros
  { code: '5445', name: 'Seja Feliz para Sempre! (G1)', category: 'Livros', grade: 'Grau 1', volumes: '5' },
  { code: '5331', name: 'Achegue-se a Jeová (G1)', category: 'Livros', grade: 'Grau 1', volumes: '4' },
  { code: '5340', name: 'O Que a Bíblia Realmente Ensina? (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  { code: '5332', name: 'Organizados para Fazer a Vontade de Jeová (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  { code: '5427', name: 'Aprendas com as Histórias da Bíblia (G1)', category: 'Livros', grade: 'Grau 1', volumes: '4' },
  { code: '5419', name: 'Imite a Sua Fé (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  
  // Brochuras
  { code: '6659', name: 'Boas Notícias de Deus para Você (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6658', name: 'Escute a Deus e Viva para Sempre (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6669', name: 'Ame as Pessoas — Faça Discípulos (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6671', name: 'Volte para Jeová (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6667', name: 'Melhore sua Leitura e seu Ensino (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  
  // Revistas
  { code: 'wp', name: 'A Sentinela (Edição de Estudo)', category: 'Revistas', grade: 'Grau 1', volumes: '1' },
  { code: 'g', name: 'Despertai! (Edição Anual)', category: 'Revistas', grade: 'Grau 1', volumes: '1' },
];

export default function BrailleListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');

  const filteredItems = useMemo(() => {
    return BRAILLE_DATA.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = selectedGrade === 'all' || item.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    });
  }, [searchTerm, selectedGrade]);

  const categories = Array.from(new Set(BRAILLE_DATA.map(i => i.category)));

  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 font-body">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabeçalho de Identificação */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Accessibility className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight font-headline">Publicações em Braille</h1>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Consulta rápida baseada na Lista Oficial S-58-T (02/21)
            </p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar por nome ou código..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary shrink-0" />
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-[160px] h-11 font-bold uppercase text-[10px] tracking-widest">
                    <SelectValue placeholder="Filtrar Grau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px] font-black uppercase">Todos os Graus</SelectItem>
                    <SelectItem value="Grau 1" className="text-[10px] font-black uppercase text-primary">Grau 1</SelectItem>
                    <SelectItem value="Grau 2" className="text-[10px] font-black uppercase text-accent-foreground">Grau 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <div className="space-y-10">
          {categories.map(cat => {
            const itemsInCat = filteredItems.filter(i => i.category === cat);
            if (itemsInCat.length === 0) return null;

            return (
              <div key={cat} className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                  <h2 className="text-lg font-black uppercase tracking-widest text-neutral-800">{cat}</h2>
                  <Badge variant="outline" className="text-[10px] font-black uppercase opacity-50">
                    {itemsInCat.length} itens
                  </Badge>
                </div>

                <div className="bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-neutral-50/50">
                      <TableRow>
                        <TableHead className="w-[80px] font-black uppercase text-[10px] text-center border-r">Código</TableHead>
                        <TableHead className="font-black uppercase text-[10px] border-r">Publicação</TableHead>
                        <TableHead className="w-[100px] font-black uppercase text-[10px] text-center border-r">Tipo</TableHead>
                        <TableHead className="w-[100px] font-black uppercase text-[10px] text-center">Volumes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsInCat.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="text-center font-bold text-xs text-neutral-400 border-r">{item.code}</TableCell>
                          <TableCell className="font-bold text-sm uppercase border-r flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                            {item.name}
                          </TableCell>
                          <TableCell className="text-center border-r">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase tracking-tighter",
                              item.grade === 'Grau 1' ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                            )}>
                              {item.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-black text-sm">
                            <div className="flex items-center justify-center gap-1.5">
                              <Layers className="h-3.5 w-3.5 text-neutral-300" />
                              {item.volumes}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé Informativo Adaptado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
          <Card className="bg-white border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-full shrink-0">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2 text-left">
                <h3 className="font-black uppercase text-sm tracking-tight">Orientações de Pedido</h3>
                <p className="text-xs text-muted-foreground font-bold leading-relaxed uppercase">
                  Pedidos de itens em Braille devem ser feitos apenas quando solicitados especificamente por um publicador. Devido ao alto custo e volume físico, não deve ser mantido estoque preventivo no balcão.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-100 border-none shadow-inner">
            <CardContent className="p-6 flex flex-col justify-center h-full space-y-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-neutral-500 tracking-widest">
                <span>Formulário de Referência:</span>
                <span className="text-neutral-800">S-58-T Ba</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-neutral-500 tracking-widest">
                <span>Última Revisão da Lista:</span>
                <span className="text-neutral-800">Fevereiro de 2021</span>
              </div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase italic text-center pt-2">
                "O cego não pode ver a luz, mas pode senti-la."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
