'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, LayoutGrid, Image as ImageIcon, Info, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const displaySchedule = [
  { 
    period: "Janeiro - Fevereiro (2026)", 
    code: "wp18.3", 
    title: "Será que Deus se importa com você?", 
    imageKey: "wp18.3" 
  },
  { 
    period: "Março - Abril (2026)", 
    code: "g20.1", 
    title: "Como aliviar o estresse", 
    imageKey: "g20.1" 
  },
  { 
    period: "Maio - Junho (2026)", 
    code: "wp19.2", 
    title: "Você perdeu a alegria de viver?", 
    imageKey: "wp19.2" 
  },
  { 
    period: "Julho - Agosto (2026)", 
    code: "g18.2", 
    title: "12 segredos para uma família ser feliz", 
    imageKey: "g18.2" 
  },
  { 
    period: "Setembro - Outubro (2026)", 
    code: "wp26.1", 
    title: "A Sentinela N.º 1 2026", 
    imageKey: null 
  },
  { 
    period: "Novembro - Dezembro (2026)", 
    code: "g26.1", 
    title: "Despertai! N.º 1 2026", 
    imageKey: null 
  }
];

export default function MagazineDisplayPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-6 px-6 font-body">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2 font-bold uppercase text-xs">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight font-headline">Programação de Exibição 2026</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySchedule.map((item, idx) => {
            const imagePlaceholder = item.imageKey ? PlaceHolderImages.find(img => img.id === item.imageKey) : null;
            
            return (
              <Card key={idx} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all hover:scale-[1.02] bg-white">
                <CardHeader className="bg-primary/5 p-4 border-b border-primary/10 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-primary opacity-70" />
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary">{item.period}</p>
                  </div>
                  <CardTitle className="text-sm font-bold uppercase line-clamp-1">{item.title}</CardTitle>
                  <CardDescription className="text-[9px] font-black opacity-60">CÓDIGO: {item.code}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] bg-neutral-100 flex items-center justify-center">
                    {imagePlaceholder ? (
                      <Image 
                        src={imagePlaceholder.imageUrl} 
                        alt={item.title} 
                        fill 
                        className="object-contain p-4" 
                        unoptimized 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-neutral-300">
                        <ImageIcon className="h-12 w-12" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-white border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black uppercase text-sm tracking-tight">Dica para o Balcão</h3>
              <p className="text-xs text-muted-foreground font-bold leading-relaxed uppercase">
                Mantenha estas revistas em destaque no balcão de publicações durante os meses indicados. 
                Isso ajuda na uniformidade da congregação e incentiva a distribuição dos itens recomendados para o período de 2026.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
