'use client';

import { use, useEffect } from 'react';
import { HistoryTable } from "@/components/inventory/HistoryTable";
import { ChevronLeft, Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function HistoryPage(props: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) return null;

  return (
    <div className="min-h-screen bg-neutral-200 py-6 px-4 print:p-0 print:bg-white overflow-x-auto font-body">
      <div className="max-w-[1300px] mx-auto space-y-4 print:space-y-0">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Voltar ao Inventário
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="gap-2 bg-white" 
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Imprimir S-28-T (8/24)
          </Button>
        </div>

        <div className="bg-white shadow-2xl p-8 rounded-sm border border-neutral-300 print:shadow-none print:border-none print:p-4 min-w-[1250px] print:min-w-0">
          <div className="flex justify-between items-baseline border-b-2 border-black pb-1 mb-2">
            <h1 className="text-xl font-black tracking-tight uppercase font-headline">
              MOVIMENTO MENSAL DE PUBLICAÇÕES
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase">IDIOMA:</span>
              <div className="border-b border-black w-48 h-5 flex items-end px-2 font-bold text-xs">Português</div>
            </div>
          </div>

          <HistoryTable />

          <div className="mt-4 flex justify-between items-end border-t border-neutral-200 pt-2 print:mt-2">
            <span className="text-[8px] font-bold text-neutral-500 italic uppercase">S-28-T 8/24</span>
          </div>
        </div>
      </div>
    </div>
  );
}
