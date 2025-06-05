/**
 * React Query Provider für DressForPleasure Frontend
 * 
 * Konfiguriert React Query für optimales Caching und Error-Handling
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

// Query Client Konfiguration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache-Einstellungen
      staleTime: 5 * 60 * 1000, // 5 Minuten
      cacheTime: 10 * 60 * 1000, // 10 Minuten
      
      // Retry-Logic
      retry: (failureCount, error: any) => {
        // Bei 404 nicht wiederholen
        if (error?.message?.includes('404')) {
          return false;
        }
        // Maximal 2 Wiederholungen
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background-Updates
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Error-Handling
      onError: (error: any) => {
        console.error('Query Error:', error);
        
        // Bei Netzwerkfehlern nicht sofort aufgeben
        if (error?.message?.includes('fetch')) {
          console.warn('Netzwerkfehler erkannt, versuche Fallback-Daten zu laden...');
        }
      },
    },
    mutations: {
      // Retry für Mutations
      retry: 1,
      onError: (error: any) => {
        console.error('Mutation Error:', error);
      },
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Dev Tools nur in Development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;

// Query Client für direkten Zugriff exportieren
export { queryClient };
