'use client';

import React, { useState, useMemo } from 'react';
import { 
  Accessibility, 
  Search, 
  BookOpen, 
  Layers, 
  Filter,
  FileText,
  Globe,
  Calendar
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
  language?: string;
}

const BRAILLE_DATA: BrailleItem[] = [
  // ITENS ANUAIS (Português Grau 1)
  { code: '6921', name: 'Examine as Escrituras Diariamente — 2021', category: 'Itens Anuais', grade: 'Grau 1', volumes: '1', language: 'Português' },

  // BÍBLIAS (Português Grau 1)
  { code: '5140', name: 'Tradução do Novo Mundo (Kit completo - 32 volumes)', category: 'Bíblias', grade: 'Grau 1', volumes: '32', language: 'Português' },
  { code: '3140', name: 'Tradução do Novo Mundo (G2)', category: 'Bíblias', grade: 'Grau 2', volumes: '18', language: 'Português' },
  
  // LIVROS (Português Grau 1 - Sequência Oficial)
  { code: '5435', name: 'A Adoração Pura de Jeová É Restaurada!', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5331', name: 'Achegue-se a Jeová', category: 'Livros', grade: 'Grau 1', volumes: '4', language: 'Português' },
  { code: '5415', name: 'Aprenda do Grande Instrutor', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5414', name: 'Beneficie-se da Escola do Ministério Teocrático', category: 'Livros', grade: 'Grau 1', volumes: '4', language: 'Português' },
  { code: '5442', name: 'Cante de Coração para Jeová — Apenas Letras', category: 'Livros', grade: 'Grau 1', volumes: '1', language: 'Português' },
  { code: '56371', name: 'Cante de Coração para Jeová — Partitura em Braille', category: 'Livros', grade: 'Grau 1', volumes: '2', language: 'Português' },
  { code: '5343', name: 'Continue a Amar a Deus', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5416', name: '“Dê Testemunho Cabal” sobre o Reino de Deus', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5419', name: 'Imite a Sua Fé', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5425', name: 'Jesus — o Caminho, a Verdade e a Vida', category: 'Livros', grade: 'Grau 1', volumes: '4', language: 'Português' },
  { code: '5427', name: 'Aprenda com as Histórias da Bíblia', category: 'Livros', grade: 'Grau 1', volumes: '4', language: 'Português' },
  { code: '5422', name: 'O Reino de Deus já Governa!', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5332', name: 'Organizados para Fazer a Vontade de Jeová', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5339', name: 'Os Jovens Perguntam — Respostas Práticas, Volume 1', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5336', name: 'Os Jovens Perguntam — Respostas Práticas, Volume 2', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5436', name: '“Pastoreiem o Rebanho de Deus”', category: 'Livros', grade: 'Grau 1', volumes: '2', language: 'Português' },
  { code: '5231', name: '“Venha Ser Meu Seguidor”', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },
  { code: '5340', name: 'Você Pode Entender a Bíblia!', category: 'Livros', grade: 'Grau 1', volumes: '3', language: 'Português' },

  // BROCHURAS E LIVRETOS (Português Grau 1 - Sequência Oficial)
  { code: '6684', name: '10 Perguntas Que os Jovens se Fazem', category: 'Brochuras', grade: 'Grau 1', volumes: '1', language: 'Português' },
  { code: '6655', name: 'A Origem da Vida — Cinco Perguntas', category: 'Brochuras', grade: 'Grau 1', volumes: '1', language: 'Português' },
  { code: '6654', name: 'A Vida — Teve um Criador?', category: 'Brochuras', grade: 'Grau 1', volumes: '1', language: 'Português' },
  { code: '66930', name: 'Aprenda a Ler Braille (Kit Inicial)', category: 'Brochuras', grade: 'Grau 1', volumes: '1', language: 'Português' },
  { code: '6638', name: 'As Testemunhas de Jeová e a Educação', category: 'Brochuras', grade: 'Grau 1', volumes: '1', language: 'Português' },
  { code: '6659', name: 'Boas Notícias de Deus para Você!', category: 'Brochuras', grade: 'Grau 1', volumes: '1', language: 'Português' },
  { code: '6647', name: 'Como Ter uma Vida Satisfatória', category: 'Brochuras', grade: 'Grau 1', volumes: '1', language: 'Português' },
  
  // PERIÓDICOS (Português)
  { code: 'wp', name: 'A Sentinela — edição para o público', language: 'Português', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'w', name: 'A Sentinela — edição de estudo', language: 'Português', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'g', name: 'Despertai!', language: 'Português', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'mwb', name: 'Nossa Vida e Ministério Cristão — Apostila da Reunião', language: 'Português', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },

  // PERIÓDICOS (Espanhol)
  { code: 'wp', name: 'La Atalaya — edición para el público', language: 'Espanhol', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'w', name: 'La Atalaya — edición de estudio', language: 'Espanhol', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'g', name: '¡Despertad!', language: 'Espanhol', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'mwb', name: 'Nuestra Vida y Ministerio Cristianos — Guía de actividades', language: 'Espanhol', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },

  // PERIÓDICOS (Inglês)
  { code: 'wp', name: 'The Watchtower — Public Edition', language: 'Inglês', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'w', name: 'The Watchtower — Study Edition', language: 'Inglês', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'g', name: 'Awake!', language: 'Inglês', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  { code: 'mwb', name: 'Our Christian Life and Ministry — Meeting Workbook', language: 'Inglês', category: 'Periódicos', grade: 'Grau 1', volumes: '1' },
  
  { code: 'wp', name: 'The Watchtower — Public Edition', language: 'Inglês', category: 'Periódicos', grade: 'Grau 2', volumes: '1' },
  { code: 'w', name: 'The Watchtower — Study Edition', language: 'Inglês', category: 'Periódicos', grade: 'Grau 2', volumes: '1' },
  { code: 'g', name: 'Awake!', language: 'Inglês', category: 'Periódicos', grade: 'Grau 2', volumes: '1' },
  { code: 'mwb', name: 'Our Christian Life and Ministry — Meeting Workbook', language: 'Inglês', category: 'Periódicos', grade: 'Grau 2', volumes: '1' },
];

export default function BrailleListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');

  const filteredItems = useMemo(() => {
    return BRAILLE_DATA.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(search) || 
        item.code.toLowerCase().includes(search) ||
        (item.language && item.language.toLowerCase().includes(search));
      const matchesGrade = selectedGrade === 'all' || item.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    });
  }, [searchTerm, selectedGrade]);

  const categories = ["Itens Anuais", "Bíblias", "Livros", "Brochuras", "Periódicos"];

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
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="intro" className="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden px-0">
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
                      A pessoa é um publicador ou um estudante da Bíblia que está fazendo progresso. (Pessoas recém-interessadas podem pedir itens menores em braille, como folhetos, brochuras e livros. Esperem a pessoa fazer mais progresso para pedir a <em>Tradução do Novo Mundo</em>.)
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
                  <h3 className="font-black uppercase text-[10px] text-neutral-800 tracking-widest text-left">Formatos eletrônicos</h3>
                  <p className="text-xs">
                    Os arquivos para leitor de tela (RTF) e notetaker (BRL) podem ser baixados da área pública do <strong>jw.org</strong>. Os anciãos devem se oferecer para ajudar os que usam esses arquivos.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar por nome, idioma ou código..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 font-bold"
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
        </div>

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
                        <TableRow key={`${item.code}-${idx}-${item.language || ''}`} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="text-center font-bold text-xs text-neutral-400 border-r">{item.code}</TableCell>
                          <TableCell className="border-r p-3 text-left">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {cat === 'Itens Anuais' ? (
                                  <Calendar className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                                ) : (
                                  <BookOpen className="h-3.5 w-3.5 text-primary/40 shrink-0" />
                                )}
                                <span className="font-bold text-sm uppercase">{item.name}</span>
                              </div>
                              {item.language && (
                                <div className="flex items-center gap-1 ml-5">
                                  <Globe className="h-2.5 w-2.5 text-neutral-400" />
                                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{item.language}</span>
                                </div>
                              )}
                            </div>
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
