'use client';

import { useEffect } from 'react';
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o início já que o perfil agora é um modal no cabeçalho
    router.replace('/');
  }, [router]);

  return null;
}
