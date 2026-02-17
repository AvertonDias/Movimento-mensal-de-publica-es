
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Info, Printer } from "lucide-react";

export default function S60Page() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-8 px-4 font-body print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="sticky top-20 z-10 bg-neutral-50/80 backdrop-blur-sm pb-4 pt-2 flex flex-col items-start gap-2 print:hidden text-left">
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 p-2 rounded-lg">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight font-headline text-destructive">Lista de Descartes (S-60)</h1>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 bg-white font-bold uppercase text-xs w-full sm:w-auto shadow-sm" 
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <div className="bg-white shadow-xl rounded-2xl border border-neutral-200 overflow-hidden print:shadow-none print:border-none">
          <div className="p-8 space-y-8">
            <header className="text-center space-y-4 border-b border-neutral-100 pb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">Lista de publicações a serem descartadas</h2>
              <div className="max-w-2xl mx-auto text-sm text-justify space-y-3 leading-relaxed text-neutral-600 font-medium">
                <p>
                  Publicações danificadas ou amareladas devem ser jogadas fora. Na tabela abaixo, <strong>"jogar fora"</strong> significa que vocês podem decidir se devem ou não jogar fora os itens.
                </p>
                <p>
                  <strong>"Deixar à mostra e depois jogar fora"</strong> significa que os itens devem ficar à mostra no balcão de publicações para que os publicadores possam pegar os itens que quiserem. Se depois de um tempo razoável os itens não forem retirados, eles poderão ser jogados fora.
                </p>
              </div>
            </header>

            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-800 text-left">Publicações anuais</h3>
              </div>
              <div className="border rounded-lg overflow-hidden border-neutral-200">
                <Table>
                  <TableHeader className="bg-neutral-50">
                    <TableRow>
                      <TableHead className="w-1/2 font-black uppercase text-[10px] tracking-wider text-neutral-500">Item</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-wider text-neutral-500">O que fazer?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { item: "Anuário das Testemunhas de Jeová (yb)", action: "Jogar fora." },
                      { item: "Convite da Celebração (mi)", action: "Depois da Celebração, jogar fora." },
                      { item: "Convite do congresso (CO-inv)", action: "Depois do congresso, jogar fora." },
                      { item: "Crachá do congresso (bdg-cd)", action: "Depois do congresso, jogar fora." },
                      { item: "Examine as Escrituras Diariamente (es)", action: "Jogar fora todos os que não são do ano atual." },
                      { item: "Watchtower Library (dvly)", action: "Jogar fora todas as versões anteriores à de 2017." },
                    ].map((row, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="font-bold text-sm italic text-left">{row.item}</TableCell>
                        <TableCell className="text-sm font-medium text-neutral-600 text-left">{row.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-accent pl-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-800 text-left">Publicações substituídas</h3>
              </div>
              <div className="border rounded-lg overflow-hidden border-neutral-200">
                <Table>
                  <TableHeader className="bg-neutral-50">
                    <TableRow>
                      <TableHead className="w-1/2 font-black uppercase text-[10px] tracking-wider text-neutral-500">Item</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-wider text-neutral-500">O que fazer?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { item: "Ajuda para o Estudo da Palavra de Deus (sgd e sgdls)", action: "Se foi substituído pela Tradução do Novo Mundo da Bíblia Sagrada (nwt), deixar à mostra e depois jogar fora." },
                      { item: "Cantemos a Jeová (sn, snlp, sny, snylp e sny55)", action: "Se foi substituído por Cante de Coração para Jeová (sjj) de qualquer tamanho, jogar fora." },
                      { item: "Ensinos Bíblicos Elementares (et)", action: "Se foi substituído por 'Vão e Façam Discípulos, Batizando-os' (ds) ou por Organizados para Fazer a Vontade de Jeová (od), picotar e depois jogar fora." },
                      { item: "Guia de Pesquisa para Testemunhas de Jeová (rsg)", action: "Jogar fora todos os que não são do ano mais recente." },
                      { item: "Índice das Publicações da Torre de Vigia (dx)", action: "Jogar fora os índices de um a cinco anos quando são substituídos por um volume maior." },
                      { item: "O Maior Homem Que já Viveu (gt)", action: "Se foi substituído por Jesus — O Caminho, a Verdade e a Vida (jy), jogar fora." },
                      { item: "Organizados para Fazer a Vontade de Jeová (od)", action: "Se foi substituído pela edição de capa flexível, picotar e depois jogar fora todas as edições de capa dura." },
                      { item: "Tradução do Novo Mundo das Escrituras Gregas Cristãs (bi7, bi7ls, nwtgs e nwtgsls)", action: "Se foi substituída pela Tradução do Novo Mundo da Bíblia Sagrada (nwt) completa, deixar à mostra e depois jogar fora." },
                    ].map((row, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="font-bold text-sm italic text-left">{row.item}</TableCell>
                        <TableCell className="text-sm font-medium text-neutral-600 leading-relaxed text-left">{row.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
          
          <footer className="bg-neutral-50 p-6 border-t border-neutral-100 flex items-center gap-3">
            <Info className="h-5 w-5 text-neutral-400 shrink-0" />
            <p className="text-[10px] font-bold uppercase text-neutral-500 leading-tight">
              Esta lista é baseada nas instruções oficiais de Betel para otimização de estoque físico em congregações.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
