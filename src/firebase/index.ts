'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// Função de inicialização robusta para evitar erros de "no-options"
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp: FirebaseApp;
  
  // Verifica se estamos em um ambiente que fornece configuração automática (como App Hosting)
  // Caso contrário, usa a configuração manual fornecida no arquivo config.ts
  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG || process.env.FIREBASE_CONFIG) {
      firebaseApp = initializeApp();
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
  } catch (e) {
    // Fallback final para a configuração manual caso a tentativa automática falhe
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
