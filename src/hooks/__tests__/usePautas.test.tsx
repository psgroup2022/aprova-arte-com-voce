import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Hoisted mocks (Vitest hoisting-safe)
const { insertMock, updateMock, deleteMock, selectMock, eqMock, authGetUserMock } = vi.hoisted(
  () => ({
    insertMock: vi.fn(),
    updateMock: vi.fn(),
    deleteMock: vi.fn(),
    selectMock: vi.fn(),
    eqMock: vi.fn(),
    authGetUserMock: vi.fn(),
  }),
);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => ({
      insert: (payload: any) =>
        insertMock(table, payload) || {
          select: () => ({ single: () => ({ data: { id: 'p1', ...payload }, error: null }) }),
        },
      update: (payload: any) =>
        updateMock(table, payload) || {
          eq: () => ({
            select: () => ({ single: () => ({ data: { id: 'p1', ...payload }, error: null }) }),
          }),
        },
      delete: () => deleteMock(table) || { eq: () => ({}) },
      select: (...args: any[]) =>
        selectMock(table, ...args) || { order: () => ({ data: [], error: null }) },
      eq: (...args: any[]) =>
        eqMock(table, ...args) || { select: () => ({ single: () => ({ data: {}, error: null }) }) },
    }),
    auth: { getUser: authGetUserMock },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: () => {} }),
}));

import { usePautas } from '../usePautas';

const wrapperFactory = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, Wrapper };
};

describe('usePautas - CRUD básico', () => {
  beforeEach(() => {
    insertMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
    selectMock.mockReset();
    eqMock.mockReset();
    authGetUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } });
  });

  it('createPauta envia criado_por = user.id', async () => {
    const { Wrapper } = wrapperFactory();
    const { result } = renderHook(() => usePautas(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.createPauta({ titulo: 'T', cliente: 'C' });
    });

    expect(insertMock).toHaveBeenCalled();
    const [_table, payload] = insertMock.mock.calls[0];
    expect(_table).toBe('pautas');
    expect(payload.criado_por).toBe('u1');
  });

  it('updatePauta atualiza por id', async () => {
    const { Wrapper } = wrapperFactory();
    const { result } = renderHook(() => usePautas(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.updatePauta({ id: 'p1', titulo: 'Novo' });
    });

    expect(updateMock).toHaveBeenCalled();
    const [_table, payload] = updateMock.mock.calls[0];
    expect(_table).toBe('pautas');
    expect(payload).toMatchObject({ titulo: 'Novo' });
  });

  it('deletePauta remove por id', async () => {
    const { Wrapper } = wrapperFactory();
    const { result } = renderHook(() => usePautas(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.deletePauta('p1');
    });

    expect(deleteMock).toHaveBeenCalled();
    const [_table] = deleteMock.mock.calls[0];
    expect(_table).toBe('pautas');
  });
});
