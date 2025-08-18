import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createTestQueryClient, withQueryClient } from '@/test-utils';

// Hoisted mocks to satisfy Vitest's hoisting behavior
const { insertMock, authGetUserMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  authGetUserMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      insert: insertMock,
      select: () => ({ single: () => ({ data: { id: 'x' }, error: null }) }),
    }),
    auth: { getUser: authGetUserMock },
  },
}));

import { useComentarios } from '../useComentarios';

describe('useComentarios - optimistic updates', () => {
  beforeEach(() => {
    insertMock.mockReset();
    authGetUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } });
  });

  it('adds optimistic comment and rolls back on error', async () => {
    const client = createTestQueryClient();
    const wrapper = withQueryClient(client);
    insertMock.mockReturnValueOnce({
      select: () => ({ single: () => ({ data: null, error: new Error('fail') }) }),
    });

    const { result } = renderHook(() => useComentarios('p1'), { wrapper });

    // seed cache empty
    client.setQueryData(['comentarios', 'p1'], []);

    // set new comment and trigger add
    act(() => {
      result.current.setNewComment('hello');
    });

    await act(async () => {
      await result.current.handleAddComment();
    });

    const after = client.getQueryData<any[]>(['comentarios', 'p1']);
    // After error, optimistic should be rolled back to previous []
    expect(after).toEqual([]);
  });

  it('adds optimistic comment and keeps after success (then invalidates)', async () => {
    const client = createTestQueryClient();
    const wrapper = withQueryClient(client);
    insertMock.mockReturnValueOnce({
      select: () => ({ single: () => ({ data: { id: 'c1' }, error: null }) }),
    });

    const { result } = renderHook(() => useComentarios('p1'), { wrapper });
    client.setQueryData(['comentarios', 'p1'], []);

    act(() => {
      result.current.setNewComment('hello');
    });

    await act(async () => {
      await result.current.handleAddComment();
    });

    const after = client.getQueryData<any[]>(['comentarios', 'p1']);
    // On success, invalidation will occur; optimistic item may still exist until refetch
    expect(Array.isArray(after)).toBe(true);
    expect(after!.length).toBeGreaterThanOrEqual(1);
  });
});
