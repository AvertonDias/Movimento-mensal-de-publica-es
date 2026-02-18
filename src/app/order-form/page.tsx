
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, ShoppingCart, ShieldCheck, Info, FileEdit, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Definição completa dos itens do formulário S-14-T
const S14_SECTIONS = [
  {
    title: "Bíblias",
    items: [
      { code: "5140", name: "Tradução do Novo Mundo da Bíblia Sagrada (nwt)" },
      { code: "5142", name: "Tradução do Novo Mundo da Bíblia Sagrada (tamanho de bolso) (nwtpkt)" },
      { code: "5141", name: "Tradução do Novo Mundo da Bíblia Sagrada (tamanho grande) (nwtls)" },
      { code: "5144", name: "Tradução do Novo Mundo da Bíblia Sagrada — Edição de estudo (Mateus a Atos) (nwtsty1-E)" },
    ]
  },
  {
    title: "Kit de Ferramentas de Ensino",
    items: [
      { code: "5445", name: "Seja Feliz para Sempre! — Um Curso da Bíblia para Você (livro) (lff)" },
      { code: "7133", name: "Quem Controla o Mundo? (T-33)" },
      { code: "6654", name: "A Vida — Teve um Criador? (lc)" },
      { code: "7134", name: "O Sofrimento Vai Acabar Algum Dia? (T-34)" },
      { code: "6655", name: "A Origem da Vida — Cinco Perguntas Que Merecem Resposta (lf)" },
      { code: "7135", name: "Será Que os Mortos Podem Voltar a Viver? (T-35)" },
      { code: "65445", name: "Seja Feliz para Sempre! — Comece a Aprender sobre a Bíblia (brochura) (lffi)" },
      { code: "7136", name: "O Que É o Reino de Deus? (T-36)" },
      { code: "6657", name: "Escute a Deus e Viva para Sempre (ll)" },
      { code: "7137", name: "Onde Encontrar as Respostas mais Importantes da Vida? (T-37)" },
      { code: "7305", name: "Convite para Reuniões Cristãs (inv)" },
      { code: "8410", name: "Cartão de visita do jw.org (Bíblia aberta) (jwcd1)" },
      { code: "7130", name: "O Que Você Acha da Bíblia? (T-30)" },
      { code: "8524", name: "Cartão de visita do jw.org (somente logo jw.org) (jwcd4)" },
      { code: "7131", name: "O Que Você Espera do Futuro? (T-31)" },
      { code: "8569", name: "Cartão de visita para curso bíblico gratuito (divulga curso bíblico presencial) (jwcd9)" },
      { code: "7132", name: "Qual o Segredo para Ter uma Família Feliz? (T-32)" },
      { code: "8570", name: "Cartão de visita para curso bíblico gratuito (divulga curso bíblico pela internet) (jwcd10)" },
    ]
  },
  {
    title: "Equipamentos para testemunho público",
    items: [
      { code: "3516-1", name: "Carrinho de publicações (ldcrt)", isSpecial: true },
      { code: "3517-2", name: "Display de publicações (duplo) (ldstd-2)", isSpecial: true },
      { code: "3520", name: "Carrinho de publicações — Peças de acrílico das prateleiras (ldcrtadp)", isSpecial: true },
      { code: "3524", name: "Display — Peças de reposição (opção 1) (ldstd1sp)", isSpecial: true },
      { code: "3526", name: "Carrinho de publicações — Placa magnética (ldcrtmbd)", isSpecial: true },
      { code: "3525", name: "Display — Peças de reposição (opção 2) (ldstd2sp)", isSpecial: true },
      { code: "3521", name: "Carrinho de publicações — Capa para chuva (ldcrtrcv)", isSpecial: true },
      { code: "3527", name: "Display de publicações — Bolsa para transporte (ldstdcbg)", isSpecial: true },
      { code: "3522", name: "Carrinho de publicações — Kit para conserto (ldcrtrkt)", isSpecial: true },
      { code: "3518", name: "Mesa de publicações (ldtbl)", isSpecial: true },
      { code: "3523", name: "Carrinho de publicações — Rodas (ldcrtwhl)", isSpecial: true },
      { code: "88532", name: "Curso bíblico gratuito (cartaz magnético vertical) (divulga curso bíblico presencial) (mvpfbc1)", isSpecial: true },
      { code: "3519-1", name: "Quiosque de publicações (ldksk)", isSpecial: true },
      { code: "88533", name: "Curso bíblico gratuito (cartaz magnético vertical) (divulga curso bíblico pela internet) (mvpfbc2)", isSpecial: true },
      { code: "3517-1", name: "Display de publicações (simples) (ldstd-1)", isSpecial: true },
    ]
  },
  {
    title: "Livros",
    items: [
      { code: "5416", name: "'Dê Testemunho Cabal' sobre o Reino de Deus (bt)" },
      { code: "5415", name: "Aprenda do Grande Instrutor (lr)" },
      { code: "5331", name: "Achegue-se a Jeová (cl)" },
      { code: "5332", name: "Organizados para Fazer a Vontade de Jeová (od)" },
      { code: "5419", name: "Imite a Sua Fé! (ia)" },
      { code: "5435", name: "A Adoração Pura de Jeová É Restaurada! (rr)" },
      { code: "5411", name: "Estudo Perspicaz das Escrituras (it)" },
      { code: "5341", name: "Cante de Coração para Jeová (sjj)" },
      { code: "5413", name: "Testemunhas de Jeová — Proclamadores (jv)" },
      { code: "5441", name: "Cante de Coração para Jeová (tamanho grande) (sjlls)" },
      { code: "5425", name: "Jesus — o Caminho, a Verdade e a Vida (jy)" },
      { code: "5442", name: "Cante de Coração para Jeová — apenas letras (sjjyls)" },
      { code: "5422", name: "O Reino de Deus já Governa! (kr)" },
      { code: "5339", name: "Os Jovens Perguntam, Volume 1 (yp1)" },
      { code: "5427", name: "Aprenda com as Histórias da Bíblia (lfb)" },
      { code: "5336", name: "Os Jovens Perguntam, Volume 2 (yp2)" },
    ]
  },
  {
    title: "Brochuras",
    items: [
      { code: "6665", name: "Você Pode Ter uma Família Feliz! (hf)" },
      { code: "6671", name: "Volte para Jeová (rj)" },
      { code: "6662", name: "Como Você Pode Ter uma Vida Feliz? (para judeus) (hl)" },
      { code: "6656", name: "Verdadeira Fé — O Segredo de uma Vida Feliz (rk)" },
      { code: "6647", name: "Como Ter uma Vida Satisfatória (la)" },
      { code: "6630", name: "Espíritos dos Mortos — Ajudam? Ou Prejudicam? (sp)" },
      { code: "6658", name: "Escute a Deus (ld)" },
      { code: "6667", name: "Melhore Sua Leitura e Seu Ensino (th)" },
      { code: "6663", name: "Minhas Primeiras Lições da Bíblia (mb)" },
      { code: "6670", name: "Aprenda com a Sabedoria de Jesus (wfg)" },
      { code: "6648", name: "O Caminho para a Vida Eterna (ol)" },
      { code: "6684", name: "10 Perguntas Que os Jovens se Fazem (ypq)" },
      { code: "6639", name: "Como Ter Verdadeira Paz e Felicidade (chineses) (pc)" },
      { code: "6653", name: "O Caminho para a Paz e Felicidade (budistas) (ph)" },
    ]
  },
  {
    title: "Formulários e acessórios",
    items: [
      { code: "3505", name: "Porta-crachá (plástico) (bdg)" },
      { code: "3503", name: "Envelope Plástico para Cartão de Território (pte)" },
      { code: "83731", name: "Etiquetas para caixas de donativos (donate.jw.org) (cblkh1)" },
      { code: "8704", name: "Relatório de Serviço de Campo (S-4)" },
      { code: "83732", name: "Etiquetas para doações (sem donate.jw.org) (cblkh2)" },
      { code: "8708", name: "Registro de Casa em Casa (S-8)" },
      { code: "83733", name: "Etiquetas para doações (apenas obra mundial) (cblkh3)" },
      { code: "8712", name: "Cartão de Mapa de Território (S-12)" },
      { code: "9172", name: "Diretivas Antecipadas (dpa)" },
      { code: "8713", name: "Registro de Designação de Território (S-13)" },
      { code: "8724", name: "Recibo (S-24)" },
      { code: "8789", name: "Designação Vida e Ministério (S-89)" },
      { code: "8805", name: "Petição para Pioneiro Auxiliar (S-205b)" },
    ]
  }
];

export default function OrderFormPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [header, setHeader] = useState({
    orderNum: '',
    congNum: '',
    congName: '',
    city: '',
    date: '',
    lang: 'Português'
  });

  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [otherItems, setOtherItems] = useState(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      qty: '',
      code: '',
      usage: '',
      lang: '',
      title: '',
      stock: ''
    }))
  );

  useEffect(() => {
    setHeader(h => ({ ...h, date: format(new Date(), 'dd/MM/yyyy') }));
  }, []);

  const selectedMonth = useMemo(() => startOfMonth(subMonths(new Date(), 1)), []);
  const monthKey = format(selectedMonth, 'yyyy-MM');

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite, isLoading: isCheckingHelper } = useDoc(helperInviteRef);
  const activeUserId = helperInvite ? helperInvite.ownerId : user?.uid;

  const monthItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUserId || !monthKey) return null;
    return collection(db, 'users', activeUserId, 'monthly_records', monthKey, 'items');
  }, [db, activeUserId, monthKey]);

  const { data: remoteItems } = useCollection(monthItemsQuery);

  const getStock = (code: string) => {
    const item = remoteItems?.find(i => i.code === code || i.id === code);
    return item?.current !== undefined && item?.current !== null ? item.current : '---';
  };

  const handleQtyChange = (code: string, val: string) => {
    setQuantities(prev => ({ ...prev, [code]: val }));
  };

  const handleOtherItemChange = (idx: number, field: string, val: string) => {
    const newItems = [...otherItems];
    (newItems[idx] as any)[field] = val;
    setOtherItems(newItems);
  };

  const handleSharePDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    const loadingToast = toast({
      title: "Gerando PDF de alta qualidade...",
      description: "Ajustando layout para o formato oficial A4.",
    });

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageIds = ['s14-page-1', 's14-page-2'];

      for (let i = 0; i < pageIds.length; i++) {
        const element = document.getElementById(pageIds[i]);
        if (!element) continue;

        if (i > 0) pdf.addPage();

        // Configurações de alta qualidade para o html2canvas
        const canvas = await html2canvas(element, {
          scale: 3, 
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: 1000, 
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `S14_${header.congName.replace(/\s+/g, '_') || 'Pedido'}_${header.date.replace(/\//g, '-')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Pedido de Publicações S-14-T',
            text: `Pedido da congregação ${header.congName} - ${header.date}`,
          });
        } catch (err) {
          pdf.save(fileName);
        }
      } else {
        pdf.save(fileName);
        toast({
          title: "PDF baixado!",
          description: "O arquivo de alta qualidade foi salvo em seu dispositivo.",
        });
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar arquivo",
        description: "Ocorreu uma falha no processamento da imagem.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isCheckingHelper || !user) return null;

  const FormInput = ({ value, onChange, placeholder, className }: any) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "bg-transparent border-0 border-b border-black/30 rounded-none h-full w-full px-1 text-[10px] font-bold focus:outline-none focus:border-primary focus:bg-primary/5 transition-colors placeholder:text-neutral-300 print:border-black/50",
        className
      )}
    />
  );

  const ItemRow = ({ item }: { item: any }) => (
    <div className={cn("flex items-center min-h-[22px] border-b border-black/10 text-[9px] py-0.5", item.isSpecial && "bg-neutral-100")}>
      <div className="w-10 border-r border-black/10 flex items-center justify-center h-full shrink-0">
        <FormInput 
          value={quantities[item.code] || ''} 
          onChange={(v: any) => handleQtyChange(item.code, v)} 
          className="border-0 text-center text-[11px]" 
        />
      </div>
      <span className="w-12 text-center font-black shrink-0">{item.code}</span>
      <span className="flex-1 px-2 text-left font-medium leading-[1.1] break-words py-0.5">{item.name}</span>
      <span className="w-12 text-center border-l border-black/10 font-bold shrink-0">{getStock(item.code)}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-100 pt-24 pb-12 px-4 print:p-0 print:bg-white font-body">
      <div className="max-w-[850px] mx-auto space-y-6 print:space-y-0">
        
        {/* Header de Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <FileEdit className="h-4 w-4" /> Preencher Pedido S-14-T
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Gere o arquivo PDF oficial para compartilhar.</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {helperInvite && (
              <div className="bg-accent/10 border border-accent/20 px-3 py-1 rounded-lg flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-accent-foreground" />
                <span className="text-[8px] font-black uppercase text-accent-foreground tracking-widest">
                  Ajudante de {helperInvite.ownerName}
                </span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 font-bold uppercase text-[10px] bg-white h-9 shadow-sm hover:bg-primary/5" 
              onClick={handleSharePDF}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4 text-primary" />}
              Compartilhar PDF Oficial
            </Button>
          </div>
        </div>

        {/* Formulário S-14-T */}
        <div className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 text-black space-y-8 overflow-hidden">
          
          {/* PÁGINA 1 */}
          <div className="space-y-6 bg-white p-4" id="s14-page-1">
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start text-[10px] font-bold">
                <div className="flex gap-2 items-baseline w-[200px]">
                  <span className="shrink-0">Número do pedido:</span>
                  <div className="flex-1 h-4"><FormInput value={header.orderNum} onChange={(v: any) => setHeader({...header, orderNum: v})} /></div>
                </div>
                <div className="flex gap-2 items-baseline w-[200px]">
                  <span className="shrink-0">Número da congregação:</span>
                  <div className="flex-1 h-4"><FormInput value={header.congNum} onChange={(v: any) => setHeader({...header, congNum: v})} /></div>
                </div>
              </div>
              
              <h2 className="text-center text-xl font-black uppercase tracking-tighter">PEDIDO DE PUBLICAÇÕES</h2>
              
              <div className="grid grid-cols-4 gap-x-4 gap-y-3 text-[10px] font-bold">
                <div className="col-span-2 flex gap-2 items-baseline">
                  <span className="shrink-0 uppercase">Nome da congregação:</span>
                  <div className="flex-1 h-4"><FormInput value={header.congName} onChange={(v: any) => setHeader({...header, congName: v})} /></div>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="shrink-0 uppercase">Cidade:</span>
                  <div className="flex-1 h-4"><FormInput value={header.city} onChange={(v: any) => setHeader({...header, city: v})} /></div>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="shrink-0 uppercase">Data:</span>
                  <div className="flex-1 h-4"><FormInput value={header.date} onChange={(v: any) => setHeader({...header, date: v})} /></div>
                </div>
                <div className="col-span-2 flex gap-2 items-baseline">
                  <span className="shrink-0 uppercase font-black italic">IDIOMA (Especifique um):</span>
                  <div className="flex-1 h-4"><FormInput value={header.lang} onChange={(v: any) => setHeader({...header, lang: v})} /></div>
                  <span className="text-[8px] italic">(Obrigatório)</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-8 h-4 bg-neutral-200 border border-neutral-300" />
                  <span className="text-[9px] uppercase">Os itens de pedido especial estão sombreados.</span>
                </div>
              </div>

              <div className="p-2 border border-neutral-200 rounded text-[9px] text-justify leading-snug font-medium italic">
                Os itens mais pedidos estão na lista abaixo. Acesse o JW Hub se quiser ver a lista completa de idiomas e publicações disponíveis. Outros itens poderão ser pedidos na página 2, debaixo da seção "Outros itens". Antes de enviar o pedido, por favor verifique se todos os campos do formulário estão preenchidos corretamente. Se tiver alguma dúvida, consulte as <em>Orientações sobre Pedidos de Publicações e Inventário (S-56)</em>.
              </div>
            </div>

            {S14_SECTIONS.slice(0, 4).map((section, sIdx) => (
              <div key={sIdx} className="space-y-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/20" /></div>
                  <h3 className="relative px-4 bg-white text-[14px] font-black uppercase tracking-tight">{section.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                  {[0, 1].map(col => (
                    <div key={col} className="flex text-[7px] font-black uppercase mb-1">
                      <span className="w-10 text-center">Quant.</span>
                      <span className="w-12 text-center">N.º do item</span>
                      <span className="flex-1 px-2">Descrição</span>
                      <span className="w-12 text-center">Estoque</span>
                    </div>
                  ))}

                  {Array.from({ length: Math.ceil(section.items.length / 2) }).map((_, rIdx) => {
                    const left = section.items[rIdx * 2];
                    const right = section.items[rIdx * 2 + 1];

                    return (
                      <React.Fragment key={rIdx}>
                        <ItemRow item={left} />
                        {right ? <ItemRow item={right} /> : <div />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* PÁGINA 2 */}
          <div className="print:break-before-page pt-8 space-y-6 bg-white p-4" id="s14-page-2">
            <div className="flex justify-between items-baseline border-b border-black pb-1 mb-4">
              <div className="flex gap-2 items-baseline text-[10px] font-bold w-[300px]">
                <span>Idioma:</span>
                <div className="flex-1 h-4"><FormInput value={header.lang} onChange={(v: any) => setHeader({...header, lang: v})} /></div>
              </div>
              <div className="flex gap-2 items-baseline text-[10px] font-bold w-[200px]">
                <span>Número da congregação:</span>
                <div className="flex-1 h-4"><FormInput value={header.congNum} onChange={(v: any) => setHeader({...header, congNum: v})} /></div>
              </div>
            </div>

            {S14_SECTIONS.slice(4).map((section, sIdx) => (
              <div key={sIdx} className="space-y-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/20" /></div>
                  <h3 className="relative px-4 bg-white text-[14px] font-black uppercase tracking-tight">{section.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                  {[0, 1].map(col => (
                    <div key={col} className="flex text-[7px] font-black uppercase mb-1">
                      <span className="w-10 text-center">Quant.</span>
                      <span className="w-12 text-center">N.º do item</span>
                      <span className="flex-1 px-2">Descrição</span>
                      <span className="w-12 text-center">Estoque</span>
                    </div>
                  ))}

                  {Array.from({ length: Math.ceil(section.items.length / 2) }).map((_, rIdx) => {
                    const left = section.items[rIdx * 2];
                    const right = section.items[rIdx * 2 + 1];

                    return (
                      <React.Fragment key={rIdx}>
                        <ItemRow item={left} />
                        {right ? <ItemRow item={right} /> : <div />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="space-y-2 mt-8">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/20" /></div>
                <h3 className="relative px-4 bg-white text-[14px] font-black uppercase tracking-tight">Outros itens</h3>
              </div>
              
              <div className="border border-black">
                <div className="grid grid-cols-[60px_60px_60px_100px_1fr_60px] text-[7px] font-black uppercase bg-neutral-50 border-b border-black text-center h-8 items-center">
                  <div className="border-r border-black h-full flex items-center justify-center">Quantidade</div>
                  <div className="border-r border-black h-full flex items-center justify-center leading-none px-1">N.º do item</div>
                  <div className="border-r border-black h-full flex items-center justify-center leading-none px-1">Uso da filial</div>
                  <div className="border-r border-black h-full flex items-center justify-center leading-none px-1">Idioma (não abreviar)</div>
                  <div className="border-r border-black h-full flex items-center justify-center">Título ou descrição breve</div>
                  <div className="h-full flex items-center justify-center">Estoque</div>
                </div>
                {otherItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-[60px_60px_60px_100px_1fr_60px] min-h-[24px] border-b last:border-0 border-black group">
                    <div className="border-r border-black h-full flex items-center">
                      <FormInput value={item.qty} onChange={(v: any) => handleOtherItemChange(i, 'qty', v)} className="border-0 text-center" />
                    </div>
                    <div className="border-r border-black h-full flex items-center">
                      <FormInput value={item.code} onChange={(v: any) => handleOtherItemChange(i, 'code', v)} className="border-0 text-center" />
                    </div>
                    <div className="border-r border-black h-full flex items-center">
                      <FormInput value={item.usage} onChange={(v: any) => handleOtherItemChange(i, 'usage', v)} className="border-0 text-center" />
                    </div>
                    <div className="border-r border-black h-full flex items-center">
                      <FormInput value={item.lang} onChange={(v: any) => handleOtherItemChange(i, 'lang', v)} className="border-0 text-center" />
                    </div>
                    <div className="border-r border-black h-full flex items-center py-0.5">
                      <FormInput value={item.title} onChange={(v: any) => handleOtherItemChange(i, 'title', v)} className="border-0 text-left px-2 leading-tight" />
                    </div>
                    <div className="h-full flex items-center">
                      <FormInput value={item.stock} onChange={(v: any) => handleOtherItemChange(i, 'stock', v)} className="border-0 text-center" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-2">
              <div className="w-96 border-b border-black h-4" />
              <span className="text-[10px] font-bold uppercase">(Superintendente de serviço)</span>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-end border-t-2 border-black pt-2">
            <span className="text-[8px] font-black italic uppercase">S-14-T 6/23</span>
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded border border-primary/10 print:hidden">
              <Info className="h-3 w-3 text-primary" />
              <p className="text-[8px] font-bold uppercase text-muted-foreground">O sistema sincroniza o estoque real para ajudar na decisão do pedido.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
