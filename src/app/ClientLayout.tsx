'use client';
import React from 'react';
import Header from '../components/Header';
import { TabProvider } from '../components/TabContext';

export interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <TabProvider>
      <Header />
      <main className="flex-1 pt-4">
        {children}
      </main>
    </TabProvider>
  );
} 