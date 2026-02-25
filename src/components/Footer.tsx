'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from "@/firebase";

export function Footer() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="w-full px-6 py-8 border-t border-border mt-auto bg-transparent print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-bold uppercase tracking-widest text-center md:text-left">
        <p>© 2026 S-28 Digital • Gestão inteligente (2/26)</p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
          <a 
            href="https://aplicativos-ton.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-primary transition-colors"
          >
            Conheça meus aplicativos
          </a>
          {/* O link de suporte depende do estado de autenticação, por isso só renderiza após o mount */}
          {mounted && user && !user.isAnonymous && (
            <a 
              href="https://wa.me/5535991210466?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20aplicativo%20S-28%20Digital." 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary transition-colors"
            >
              Suporte
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
