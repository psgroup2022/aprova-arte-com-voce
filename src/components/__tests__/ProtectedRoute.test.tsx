import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';

// Dynamic mock for useAuth
let mockAuth: { user: any; loading: boolean } = { user: null, loading: false };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

const PrivatePage = () => <div>Private content</div>;
const AuthPage = () => <div>Auth page</div>;

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

    render(
      <MemoryRouter initialEntries={['/private']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Auth page')).toBeInTheDocument();
  });

  it('shows children when authenticated', () => {
    mockAuth = { user: { id: '123' }, loading: false } as any;

    render(
      <MemoryRouter initialEntries={['/private']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('renders skeleton while loading', () => {
    mockAuth = { user: null, loading: true };

    render(
      <MemoryRouter initialEntries={['/private']}>
        <App />
      </MemoryRouter>,
    );

    // Assert that loading status container is present
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });
});
