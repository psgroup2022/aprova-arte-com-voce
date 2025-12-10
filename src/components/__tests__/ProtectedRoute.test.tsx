import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';

// Dynamic mock for useAuth
let mockAuth: { user: any; loading: boolean } = { user: null, loading: false };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

const PrivatePage = () => <div data-testid="private">Private content</div>;
const AuthPage = () => <div data-testid="auth">Auth page</div>;

const App = () => (
  <Routes>
    <Route
      path="/private"
      element={
        <ProtectedRoute>
          <PrivatePage />
        </ProtectedRoute>
      }
    />
    <Route path="/auth" element={<AuthPage />} />
  </Routes>
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuth = { user: null, loading: false };
  });

  it('redirects to /auth when not authenticated', () => {
    mockAuth = { user: null, loading: false };

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/private']}>
        <App />
      </MemoryRouter>,
    );

    expect(getByTestId('auth')).toBeInTheDocument();
  });

  it('shows children when authenticated', () => {
    mockAuth = { user: { id: '123' }, loading: false } as any;

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/private']}>
        <App />
      </MemoryRouter>,
    );

    expect(getByTestId('private')).toBeInTheDocument();
  });

  it('renders skeleton while loading', () => {
    mockAuth = { user: null, loading: true };

    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/private']}>
        <App />
      </MemoryRouter>,
    );

    // Assert that loading status container is present
    expect(getByTestId('auth-loading')).toBeInTheDocument();
  });
});
