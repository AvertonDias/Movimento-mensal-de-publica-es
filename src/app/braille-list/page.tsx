'use client';

import React, { useState, useMemo } from 'react';
import { 
  Accessibility, 
  Search, 
  BookOpen, 
  Layers, 
  Filter,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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
  { code: '5427', name: 'Aprenda com as Histórias da Bíblia (G1)', category: 'Livros', grade: 'Grau 1', volumes: '4' },
  { code: '5419', name: 'Imite a Sua Fé (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  { code: '5425', name: 'Jesus — o Caminho, a Verdade e a Vida (G1)', category: 'Livros', grade: 'Grau 1', volumes: '4' },
  { code: '5422', name: 'O Reino de Deus já Governa! (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  { code: '5343', name: '“Continue no Amor de Deus” (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  { code: '5435', name: 'A Adoração Pura de Jeová É Restaurada! (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  { code: '5440', name: 'Princípios Bíblicos para a Vida Cristã (G1)', category: 'Livros', grade: 'Grau 1', volumes: '2' },
  { code: '5341', name: 'Cante de Coração para Jeová (G1)', category: 'Livros', grade: 'Grau 1', volumes: '2' },
  { code: '5339', name: 'Os Jovens Perguntam — Respostas Práticas, Volume 1 (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  { code: '5336', name: 'Os Jovens Perguntam — Respostas Práticas, Volume 2 (G1)', category: 'Livros', grade: 'Grau 1', volumes: '3' },
  
  // Brochuras
  { code: '6659', name: 'Boas Notícias de Deus para Você (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6658', name: 'Escute a Deus e Viva para Sempre (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6669', name: 'Ame as Pessoas — Faça Discípulos (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6671', name: 'Volte para Jeová (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6667', name: 'Melhore sua Leitura e seu Ensino (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  { code: '6663', name: 'Minhas Lições da Bíblia (G1)', category: 'Brochuras', grade: 'Grau 1', volumes: '1' },
  
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

  const categories = ["Bíblias", "Livros", "Brochuras", "Revistas"];

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

        {/* Introdução e Critérios Oficiais */}
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="intro" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline group">
                <div className="flex items-center gap-3 text-left">
                  <div className="bg-primary/10 p-2 rounded-full group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-colors">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-black uppercase text-xs tracking-widest block">Introdução e Critérios</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Orientações importantes sobre pedidos</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2">
                <div className="space-y-6 text-sm text-justify text-neutral-600 leading-relaxed font-medium border-t border-neutral-100 pt-4">
                  <p>
                    Para ajudar os deficientes visuais, são produzidas publicações impressas em alto-relevo em braille e diversas publicações em formato eletrônico. Os pedidos de publicações impressas em alto-relevo podem ser feitos por meio do <strong>jw.org</strong>.
                  </p>
                  
                  <div className="space-y-3">
                    <h3 className="font-black uppercase text-xs text-primary tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Impressão em alto-relevo
                    </h3>
                    <p>
                      Antes de enviar um pedido da <em>Tradução do Novo Mundo</em> em braille, a comissão de serviço da congregação deve confirmar se a pessoa cega ou com baixa visão se qualifica para receber esse item. Os critérios são os seguintes:
                    </p>
                    <ul className="list-decimal pl-6 space-y-2 marker:font-black marker:text-primary">
                      <li>
                        A pessoa é um publicador ou um estudante da Bíblia que está fazendo progresso. (Pessoas recém-interessadas podem pedir itens menores em braille, como folhetos, brochuras e livros. Esperem a pessoa fazer mais progresso para pedir a <em>Tradução do Novo Mundo</em>. Um sinal desse progresso é estar assistindo às reuniões regularmente.)
                      </li>
                      <li>
                        A pessoa consegue ler o idioma e o grau do braille da publicação que está sendo pedida.
                      </li>
                      <li>
                        A pessoa tem espaço suficiente em casa ou em algum outro lugar para guardar todos os volumes.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-3">
                    <h3 className="font-black uppercase text-[10px] text-neutral-800 tracking-widest">Formatos eletrônicos</h3>
                    <p className="text-xs">
                      Os arquivos para leitor de tela (RTF) e notetaker (BRL) podem ser baixados da área pública do <strong>jw.org</strong>. Os anciãos devem se oferecer para ajudar os que usam esses arquivos. Talvez seja necessário designar alguns publicadores para ajudá-los regularmente a baixar os arquivos.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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

        {/* Lista de Itens Organizada */}
        <div className="space-y-10 pb-12">
          {categories.map(cat => {
            const itemsInCat = filteredItems.filter(i => i.category === cat);
            if (itemsInCat.length === 0) return null;

            return (
              <div key={cat} className="space-y-4">
                <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                  <h2 className="text-lg font-black uppercase tracking-widest text-neutral-800 text-left">{cat}</h2>
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
                        <TableRow key={`${item.code}-${idx}`} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="text-center font-bold text-xs text-neutral-400 border-r">{item.code}</TableCell>
                          <TableCell className="font-bold text-sm uppercase border-r flex items-center gap-2 text-left">
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
      </div>
    </div>
  );
}
