'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Share2, ShoppingCart, Info, FileEdit, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const S14_SECTIONS = [
  {
    title: "Bíblias",
    items: [
      { code: "5140", name: "Tradução do Novo Mundo da Bíblia Sagrada (nwt)" },
      { code: "5142", name: "Tradução do Novo Mundo da Bíblia Sagrada (tamanho de bolso) (nwtpkt)" },
      { code: "5141", name: "Tradução do Novo Mundo da Bíblia Sagrada (tamanho grande) (nwtls)", isSpecial: true },
      { code: "5144", name: "Tradução do Novo Mundo da Bíblia Sagrada — Edição de estudo (Mateus a Atos) (nwtsty1-E)", isSpecial: true },
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
      { code: "88532", name: "Curso bíblico gratuito (cartaz magnético vertical) (divulga curso bíblico presencial) (mvpfbc1) NOVO!", isSpecial: true },
      { code: "3519-1", name: "Quiosque de publicações (ldksk)", isSpecial: true },
      { code: "88533", name: "Curso bíblico gratuito (cartaz magnético vertical) (divulga curso bíblico pela internet) (mvpfbc2) NOVO!", isSpecial: true },
      { code: "3517-1", name: "Display de publicações (simples) (ldstd-1)", isSpecial: true },
    ]
  },
  {
    title: "Livros",
    items: [
      { code: "5416", name: "'Dê Testemunho Cabal' sobre o Reino de Deus (bt)" },
      { code: "5415", name: "Aprenda do Grande Instrutor (lr)" },
      { code: "5331", name: "Achegue-se a Jeová (cl)" },
      { code: "5332", name: "Organizados para Fazer a Vontade de Jeová (od)", isSpecial: true },
      { code: "5419", name: "Imite a Sua Fé! (ia)" },
      { code: "5435", name: "A Adoração Pura de Jeová É Restaurada! (rr)" },
      { code: "5411", name: "Estudo Perspicaz das Escrituras (conjunto completo) (it)", isSpecial: true },
      { code: "5341", name: "Cante de Coração para Jeová (sjj)" },
      { code: "5413", name: "Testemunhas de Jeová — Proclamadores do Reino de Deus (jv)", isSpecial: true },
      { code: "5441", name: "Cante de Coração para Jeová (tamanho grande) (sjlls)" },
      { code: "5425", name: "Jesus — o Caminho, a Verdade e a Vida (jy)" },
      { code: "5442", name: "Cante de Coração para Jeová — apenas letras (sjjyls)" },
      { code: "5422", name: "O Reino de Deus já Governa! (kr)" },
      { code: "5339", name: "Os Jovens Perguntam — Respostas Práticas, Volume 1 (yp1)" },
      { code: "5427", name: "Aprenda com as Histórias da Bíblia (lfb)" },
      { code: "5336", name: "Os Jovens Perguntam — Respostas Práticas, Volume 2 (yp2)" },
    ]
  },
  {
    title: "Brochuras",
    items: [
      { code: "6665", name: "Você Pode Ter uma Família Feliz! (hf)" },
      { code: "6671", name: "Volte para Jeová (rj)" },
      { code: "6662", name: "Como Você Pode Ter uma Vida Feliz? (para judeus) (hl)" },
      { code: "6656", name: "Verdadeira Fé — O Segredo de uma Vida Feliz (para muçulmanos) (rk)" },
      { code: "6647", name: "Como Ter uma Vida Satisfatória (la)" },
      { code: "6630", name: "Espíritos dos Mortos — Ajudam? Ou Prejudicam? Existem realmente? (sp)" },
      { code: "6658", name: "Escute a Deus (ld)" },
      { code: "6667", name: "Melhore Sua Leitura e Seu Ensino (th)" },
      { code: "6663", name: "Minhas Primeiras Lições da Bíblia (mb)" },
      { code: "6670", name: "Aprenda com a Sabedoria de Jesus (para muçulmanos) (wfg) NOVO!" },
      { code: "6648", name: "O Caminho para a Vida Eterna — Já o Encontrou? (para africanos) (ol)" },
      { code: "6684", name: "10 Perguntas Que os Jovens se Fazem e as Melhores Respostas (ypq)" },
      { code: "6639", name: "Como Ter Verdadeira Paz e Felicidade (para chineses) (pc)" },
      { code: "6653", name: "O Caminho para a Paz e Felicidade (para budistas) (ph)" },
    ]
  },
  {
    title: "Formulários e acessórios",
    items: [
      { code: "3505", name: "Porta-crachá (plástico) (bdg)", isSpecial: true },
      { code: "3503", name: "Envelope Plástico para Cartão de Território (pte)", isSpecial: true },
      { code: "83731", name: "Etiquetas para caixas de donativos do Salão do Reino (para países onde é possível fazer donativos pelo donate.jw.org) (cblkh1)" },
      { code: "8704", name: "Relatório de Serviço de Campo (S-4)" },
      { code: "83732", name: "Etiquetas para caixas de donativos do Salão do Reino (para países onde não é possível fazer donativos pelo donate.jw.org) (cblkh2)" },
      { code: "8708", name: "Registro de Casa em Casa (S-8)" },
      { code: "83733", name: "Etiquetas para caixas de donativos do Salão do Reino (para países onde é possível fazer donativos pelo donate.jw.org apenas para a obra mundial) (cblkh3)" },
      { code: "8712", name: "Cartão de Mapa de Território (S-12)", isSpecial: true },
      { code: "9172", name: "Diretivas Antecipadas e Procuração para Tratamento de Saúde (informe o estado ou a província: ________) (dpa)", isSpecial: true },
      { code: "8713", name: "Registro de Designação de Território (S-13)", isSpecial: true },
      { code: "8724", name: "Recibo (S-24)" },
      { code: "8789", name: "Designação para a Reunião Nossa Vida e Ministério Cristão (S-89)" },
      { code: "8805", name: "Petição para o Serviço de Pioneiro Auxiliar (S-205b)" },
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
    state: '',
    date: format(new Date(), 'dd/MM/yyyy'),
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

  const helperInviteRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'invites', user.uid);
  }, [db, user]);

  const { data: helperInvite, isLoading: isCheckingHelper } = useDoc(helperInviteRef);
  const activeUserId = helperInvite ? helperInvite.ownerId : user?.uid;

  const orderFormRef = useMemoFirebase(() => {
    if (!db || !activeUserId) return null;
    return doc(db, 'users', activeUserId, 'order_form', 'state');
  }, [db, activeUserId]);

  const { data: savedState, isLoading: isStateLoading } = useDoc(orderFormRef);

  useEffect(() => {
    if (savedState) {
      if (savedState.header) setHeader(prev => ({ ...prev, ...savedState.header }));
      if (savedState.quantities) setQuantities(savedState.quantities);
      if (savedState.otherItems) setOtherItems(savedState.otherItems);
    }
  }, [savedState]);

  const selectedMonth = useMemo(() => startOfMonth(subMonths(new Date(), 1)), []);
  const monthKey = format(selectedMonth, 'yyyy-MM');

  const monthItemsQuery = useMemoFirebase(() => {
    if (!db || !activeUserId || !monthKey) return null;
    return collection(db, 'users', activeUserId, 'monthly_records', monthKey, 'items');
  }, [db, activeUserId, monthKey]);

  const { data: remoteItems } = useCollection(monthItemsQuery);

  const getStock = (code: string) => {
    const item = remoteItems?.find(i => i.code === code || i.id === code);
    return item?.current !== undefined && item?.current !== null ? item.current : '';
  };

  const handleQtyChange = (code: string, val: string) => {
    const newQuantities = { ...quantities, [code]: val };
    setQuantities(newQuantities);
    if (orderFormRef) {
      setDocumentNonBlocking(orderFormRef, { quantities: newQuantities }, { merge: true });
    }
  };

  const handleHeaderChange = (field: string, val: string) => {
    const newHeader = { ...header, [field]: val };
    setHeader(newHeader);
    if (orderFormRef) {
      setDocumentNonBlocking(orderFormRef, { header: newHeader }, { merge: true });
    }
  };

  const handleOtherItemChange = (idx: number, field: string, val: string) => {
    const newItems = [...otherItems];
    (newItems[idx] as any)[field] = val;
    setOtherItems(newItems);
    if (orderFormRef) {
      setDocumentNonBlocking(orderFormRef, { otherItems: newItems }, { merge: true });
    }
  };

  const handleSharePDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    toast({
      title: "Preparando pedido...",
      description: "Montando formulário S-14-T oficial.",
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

        const canvas = await html2canvas(element, {
          scale: 3, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1000, 
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()), undefined, 'FAST');
      }

      const fileName = `S14_${header.congName.replace(/\s+/g, '_') || 'Pedido'}.pdf`;
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // ABRE O SELETOR DE APPS NATIVO
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Pedido S-14-T',
            text: `Pedido da congregação ${header.congName}`,
          });
        } catch (err) {
          const blobUrl = URL.createObjectURL(pdfBlob);
          window.open(blobUrl, '_blank');
        }
      } else {
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao abrir",
        description: "Não foi possível gerar o PDF.",
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

  const FormInput = ({ value, onChange, placeholder, className, showLine = true }: any) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "bg-transparent border-0 rounded-none h-full w-full px-1 text-[9px] font-bold focus:outline-none transition-colors placeholder:text-neutral-200",
        showLine && "border-b border-black/40",
        className
      )}
    />
  );

  const formatDescription = (name: string) => {
    const lastParenIdx = name.lastIndexOf('(');
    if (lastParenIdx === -1) return name;
    
    const base = name.substring(0, lastParenIdx);
    const abbr = name.substring(lastParenIdx);
    
    return (
      <>
        {base}
        <span className="font-bold">{abbr}</span>
      </>
    );
  };

  const ItemRow = ({ item }: { item: any }) => (
    <div className={cn("flex items-start min-h-[18px] text-[8px] py-0.5 transition-colors", item.isSpecial && "bg-neutral-200")}>
      <div className="w-8 flex items-center justify-center shrink-0 h-4">
        <FormInput 
          value={quantities[item.code] || ''} 
          onChange={(v: any) => handleQtyChange(item.code, v)} 
          className="border-b border-black/40 text-center text-[10px] h-3.5" 
        />
      </div>
      <span className="w-10 text-center font-bold shrink-0 ml-1">{item.code}</span>
      <span className="flex-1 px-1 text-left font-medium leading-[1.1] break-words py-0.5">
        {formatDescription(item.name)}
      </span>
      <div className="w-8 flex items-center justify-center shrink-0 h-4 border-l border-black/10">
        <span className="text-[9px] font-bold border-b border-black/40 w-full text-center h-3.5 leading-none">
          {getStock(item.code)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-100 pt-24 pb-12 px-4 print:p-0 print:bg-white font-body">
      <div className="max-w-[850px] mx-auto space-y-6 print:space-y-0">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm print:hidden">
          <div className="flex items-center gap-3 text-left">
            <div className="bg-primary p-2 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <FileEdit className="h-4 w-4" /> Formulário S-14-T Digital
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Formato oficial pronto para abrir ou compartilhar.</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="default" 
              size="sm" 
              className="gap-2 font-bold uppercase text-[10px] h-9 shadow-sm w-full sm:w-auto" 
              onClick={handleSharePDF}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Abrir PDF
            </Button>
          </div>
        </div>

        <div className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 text-black space-y-8 overflow-hidden relative">
          {isStateLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center print:hidden">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          <div className="space-y-4 bg-white p-4" id="s14-page-1">
            <div className="flex justify-between items-baseline text-[9px] font-bold mb-2">
              <div className="flex gap-1 items-baseline w-[220px]">
                <span className="shrink-0 uppercase">Número do pedido:</span>
                <div className="flex-1 h-3.5"><FormInput value={header.orderNum} onChange={(v: any) => handleHeaderChange('orderNum', v)} /></div>
              </div>
              <div className="flex gap-1 items-baseline w-[220px]">
                <span className="shrink-0 uppercase">Número da congregação:</span>
                <div className="flex-1 h-3.5"><FormInput value={header.congNum} onChange={(v: any) => handleHeaderChange('congNum', v)} /></div>
              </div>
            </div>
            
            <h2 className="text-center text-lg font-black uppercase tracking-tight">PEDIDO DE PUBLICAÇÕES</h2>
            
            <div className="border border-black p-3 space-y-3 text-[9px] font-bold">
              <div className="grid grid-cols-12 gap-x-4 gap-y-2">
                <div className="col-span-5 flex gap-1 items-baseline">
                  <span className="shrink-0 uppercase">Nome da congregação:</span>
                  <div className="flex-1 h-3.5"><FormInput value={header.congName} onChange={(v: any) => handleHeaderChange('congName', v)} /></div>
                </div>
                <div className="col-span-2 flex gap-1 items-baseline">
                  <span className="shrink-0 uppercase">Cidade:</span>
                  <div className="flex-1 h-3.5"><FormInput value={header.city} onChange={(v: any) => handleHeaderChange('city', v)} /></div>
                </div>
                <div className="col-span-3 flex gap-1 items-baseline">
                  <span className="shrink-0 uppercase">Província ou estado:</span>
                  <div className="flex-1 h-3.5"><FormInput value={header.state} onChange={(v: any) => handleHeaderChange('state', v)} /></div>
                </div>
                <div className="col-span-2 flex gap-1 items-baseline">
                  <span className="shrink-0 uppercase">Data:</span>
                  <div className="flex-1 h-3.5"><FormInput value={header.date} onChange={(v: any) => handleHeaderChange('date', v)} /></div>
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-x-4">
                <div className="col-span-6 flex gap-1 items-baseline">
                  <span className="shrink-0 uppercase font-black">IDIOMA (Especifique um):</span>
                  <div className="flex-1 h-3.5"><FormInput value={header.lang} onChange={(v: any) => handleHeaderChange('lang', v)} /></div>
                  <span className="text-[7px] italic font-normal">(Obrigatório)</span>
                </div>
                <div className="col-span-6 flex items-center gap-2 justify-end">
                  <div className="w-10 h-3.5 bg-neutral-200 border border-neutral-300 shadow-sm" />
                  <span className="text-[8px] uppercase font-normal">Os itens de pedido especial estão sombreados.</span>
                </div>
              </div>
            </div>

            <div className="p-2 border border-neutral-200 rounded text-[8px] text-justify leading-snug font-normal italic">
              Os itens mais pedidos estão na lista abaixo. Acesse o JW Hub se quiser ver a lista completa de idiomas e publicações disponíveis. Outros itens poderão ser pedidos na página 2, debaixo da seção "Outros itens". Antes de enviar o pedido, por favor verifique se todos os campos do formulário estão preenchidos corretamente. Se tiver alguma dúvida, consulte as <em>Orientações sobre Pedidos de Publicações e Inventário (S-56)</em>.
            </div>

            {S14_SECTIONS.slice(0, 4).map((section, sIdx) => (
              <div key={sIdx} className="space-y-1 mt-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/30" /></div>
                  <h3 className="relative px-4 bg-white text-[12px] font-black uppercase tracking-tight">{section.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                  {[0, 1].map(col => (
                    <div key={col} className="flex text-[7px] font-black uppercase mb-0.5 opacity-60">
                      <span className="w-8 text-center">Quant.</span>
                      <span className="w-10 text-center">N.º do item</span>
                      <span className="flex-1 px-1">Descrição</span>
                      <span className="w-8 text-center">Estoque</span>
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
            
            <div className="pt-2">
              <span className="text-[7px] font-bold uppercase opacity-40">S-14-T 6/23 (Página 1)</span>
            </div>
          </div>

          <div className="print:break-before-page pt-4 space-y-4 bg-white p-4" id="s14-page-2">
            <div className="flex justify-between items-baseline border-b border-black pb-1 mb-2">
              <div className="flex gap-1 items-baseline text-[9px] font-bold w-[280px]">
                <span className="uppercase">Idioma:</span>
                <div className="flex-1 h-3.5"><FormInput value={header.lang} onChange={(v: any) => handleHeaderChange('lang', v)} /></div>
              </div>
              <div className="flex gap-1 items-baseline text-[9px] font-bold w-[220px]">
                <span className="uppercase">Número da congregação:</span>
                <div className="flex-1 h-3.5"><FormInput value={header.congNum} onChange={(v: any) => handleHeaderChange('congNum', v)} /></div>
              </div>
            </div>

            {S14_SECTIONS.slice(4).map((section, sIdx) => (
              <div key={sIdx} className="space-y-1 mt-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/30" /></div>
                  <h3 className="relative px-4 bg-white text-[12px] font-black uppercase tracking-tight">{section.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                  {[0, 1].map(col => (
                    <div key={col} className="flex text-[7px] font-black uppercase mb-0.5 opacity-60">
                      <span className="w-8 text-center">Quant.</span>
                      <span className="w-10 text-center">N.º do item</span>
                      <span className="flex-1 px-1">Descrição</span>
                      <span className="w-8 text-center">Estoque</span>
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

            <div className="space-y-1 mt-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/30" /></div>
                <h3 className="relative px-4 bg-white text-[12px] font-black uppercase tracking-tight">Outros itens</h3>
              </div>

              <div className="border border-black overflow-hidden">
                <table className="w-full border-collapse text-[7px] font-bold uppercase">
                  <thead>
                    <tr className="border-b border-black bg-neutral-50 h-6">
                      <th className="border-r border-black w-12 px-1">Quantidade</th>
                      <th className="border-r border-black w-14 px-1">N.º do item</th>
                      <th className="border-r border-black w-12 px-1">Uso da filial</th>
                      <th className="border-r border-black w-24 px-1">Idioma (não abreviar)</th>
                      <th className="border-r border-black px-1">Título ou descrição breve</th>
                      <th className="w-12 px-1">Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-black last:border-0 h-5">
                        <td className="border-r border-black"><FormInput value={item.qty} onChange={(v: string) => handleOtherItemChange(idx, 'qty', v)} showLine={false} className="text-center" /></td>
                        <td className="border-r border-black"><FormInput value={item.code} onChange={(v: string) => handleOtherItemChange(idx, 'code', v)} showLine={false} className="text-center" /></td>
                        <td className="border-r border-black"><FormInput value={item.usage} onChange={(v: string) => handleOtherItemChange(idx, 'usage', v)} showLine={false} className="text-center" /></td>
                        <td className="border-r border-black"><FormInput value={item.lang} onChange={(v: string) => handleOtherItemChange(idx, 'lang', v)} showLine={false} /></td>
                        <td className="border-r border-black"><FormInput value={item.title} onChange={(v: string) => handleOtherItemChange(idx, 'title', v)} showLine={false} /></td>
                        <td><FormInput value={item.stock} onChange={(v: string) => handleOtherItemChange(idx, 'stock', v)} showLine={false} className="text-center" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-1.5 self-end ml-auto w-64">
              <div className="w-full border-b border-black h-4" />
              <span className="text-[9px] font-bold uppercase">(Superintendente de serviço)</span>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-black/10">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-bold uppercase opacity-40">S-14-T 6/23 (Página 2)</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-black">2</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-primary/5 rounded border border-primary/10 print:hidden">
                <Info className="h-3 w-3 text-primary" />
                <p className="text-[7px] font-bold uppercase text-muted-foreground">O sistema sincroniza o estoque automaticamente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
