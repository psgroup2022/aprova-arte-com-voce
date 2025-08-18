import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePautaData } from '../usePautaData';

function createFakeSupabase() {
  const calls: { on: number; subscribe: number; remove: number } = {
    on: 0,
    subscribe: 0,
    remove: 0,
  };
  const channelObj: any = {};
  channelObj.on = () => {
    calls.on += 1;
    return channelObj;
  };
  channelObj.subscribe = () => {
    calls.subscribe += 1;
    return channelObj;
  };
  return {
    calls,
    client: {
      from: () => ({
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
      }),
      channel: () => channelObj,
      removeChannel: () => {
        calls.remove += 1;
      },
    },
  } as const;
}

describe('usePautaData - realtime subscriptions', () => {
  it('creates a realtime channel for comentarios and arquivos', () => {
    const fake = createFakeSupabase();
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => usePautaData('p1', fake.client as any), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    });

    expect(fake.calls.on).toBe(2);
    expect(fake.calls.subscribe).toBe(1);
  });
});
