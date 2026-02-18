'use client';

import React from 'react';
import { Accessibility, Info, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BrailleListPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-12 px-4 font-body">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-start gap-3 print:hidden">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Accessibility className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight font-headline">Publicações em Braille</h1>
        </div>

        {/* Capa baseada na imagem enviada */}
        <div className="bg-white shadow-2xl p-12 md:p-20 rounded-sm border border-neutral-200 min-h-[800px] flex flex-col items-center justify-between text-center relative overflow-hidden print:shadow-none print:border-none">
          
          <div className="mt-32 space-y-10">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-[0.1em] leading-tight text-black">
              LISTA DE PUBLICAÇÕES<br />EM BRAILLE
            </h2>
            <p className="text-xl md:text-2xl font-bold text-black">Fevereiro de 2021</p>
          </div>

          <div className="mb-16 space-y-8">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-black">© 2021</p>
              <p className="text-[11px] font-bold uppercase text-black">WATCH TOWER BIBLE AND TRACT SOCIETY OF PENNSYLVANIA</p>
              <p className="text-[11px] font-bold text-black">Todos os direitos reservados</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] italic font-medium text-black">Braille Publications List</p>
              <p className="text-[11px] font-medium text-black">Portuguese (Brazil) (S-58-T Ba)</p>
              <p className="text-[11px] font-medium text-black">Made in the United States of America</p>
            </div>
          </div>

          {/* Rodapé fiel à imagem */}
          <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end border-none">
            <span className="text-[11px] font-bold text-black">S-58-T Ba 02/21</span>
            <span className="text-[11px] font-bold text-black">1</span>
          </div>
        </div>

        {/* Informação adicional */}
        <Card className="bg-primary/5 border-primary/10 shadow-sm print:hidden">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-full shrink-0">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2 text-left">
              <h3 className="font-black uppercase text-sm tracking-tight">Gestão de Itens em Braille</h3>
              <p className="text-xs text-muted-foreground font-bold leading-relaxed uppercase">
                Esta página reproduz a capa oficial do formulário S-58-T. Lembre-se que pedidos de itens em Braille possuem procedimentos específicos no JW Hub e devem ser feitos com atenção às necessidades individuais dos publicadores com deficiência visual.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
