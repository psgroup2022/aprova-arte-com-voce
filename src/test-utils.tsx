import React, { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 1000 },
      mutations: { retry: false },
    },
  });

export const withQueryClient = (client: QueryClient) => {
  return ({ children }: PropsWithChildren<{ children?: React.ReactNode }>) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};
