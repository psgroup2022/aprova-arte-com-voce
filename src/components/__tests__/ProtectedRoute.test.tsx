import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import type { Perfil } from '@/hooks/useProfile';

// Dynamic mock for useAuth
let mockAuth: { user: any; loading: boolean; signOut: () => void } = {
  user: null,
  loading: false,
  signOut: () => {},
};
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

let mockProfile: { perfil: Perfil | null; isAdmin: boolean; loading: boolean } = {
  perfil: null,
  isAdmin: false,
  loading: false,
};
vi.mock('@/hooks/useProfile', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useProfile')>()),
  useProfile: () => mockProfile,
}));

const perfilDe = (parcial: Partial<Perfil> = {}): Perfil => ({
  id: 'perfil-1',
  nome: 'Rafael',
  email: 'rafael@exemplo.test',
  avatar_url: null,
  papel: 'membro',
  senha_provisoria: false,
  ativo: true,
  ...parcial,
});

const PrivatePage = () => <div data-testid="private">Private content</div>;
const AuthPage = () => <div data-testid="auth">Auth page</div>;
const TrocaPage = () => <div data-testid="troca">Trocar senha</div>;

const App = ({ exigeAdmin = false }: { exigeAdmin?: boolean } = {}) => (
  <Routes>
    <Route
      path="/private"
      element={
        <ProtectedRoute exigeAdmin={exigeAdmin}>
          <PrivatePage />
        </ProtectedRoute>
      }
    />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/trocar-senha" element={<TrocaPage />} />
  </Routes>
);

const montar = (elemento = <App />) =>
  render(<MemoryRouter initialEntries={['/private']}>{elemento}</MemoryRouter>);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuth = { user: null, loading: false, signOut: () => {} };
    mockProfile = { perfil: null, isAdmin: false, loading: false };
  });

  it('redirects to /auth when not authenticated', () => {
    expect(montar().getByTestId('auth')).toBeInTheDocument();
  });

  it('shows children when authenticated', () => {
    mockAuth = { user: { id: '123' }, loading: false, signOut: () => {} } as any;
    mockProfile = { perfil: perfilDe(), isAdmin: false, loading: false };

    expect(montar().getByTestId('private')).toBeInTheDocument();
  });

  it('renders skeleton while loading', () => {
    mockAuth = { user: null, loading: true, signOut: () => {} };

    expect(montar().getByTestId('auth-loading')).toBeInTheDocument();
  });

  it('waits for the profile before deciding', () => {
    mockAuth = { user: { id: '123' }, loading: false, signOut: () => {} } as any;
    mockProfile = { perfil: null, isAdmin: false, loading: true };

    expect(montar().getByTestId('auth-loading')).toBeInTheDocument();
  });

  it('sends whoever still has the shared password to /trocar-senha', () => {
    mockAuth = { user: { id: '123' }, loading: false, signOut: () => {} } as any;
    mockProfile = { perfil: perfilDe({ senha_provisoria: true }), isAdmin: false, loading: false };

    expect(montar().getByTestId('troca')).toBeInTheDocument();
  });

  it('blocks an account without a team profile', () => {
    mockAuth = { user: { id: '123' }, loading: false, signOut: () => {} } as any;
    mockProfile = { perfil: null, isAdmin: false, loading: false };

    expect(montar().getByTestId('sem-perfil')).toBeInTheDocument();
  });

  it('blocks a deactivated profile', () => {
    mockAuth = { user: { id: '123' }, loading: false, signOut: () => {} } as any;
    mockProfile = { perfil: perfilDe({ ativo: false }), isAdmin: false, loading: false };

    expect(montar().getByTestId('perfil-inativo')).toBeInTheDocument();
  });

  it('keeps a membro out of an admin-only route', () => {
    mockAuth = { user: { id: '123' }, loading: false, signOut: () => {} } as any;
    mockProfile = { perfil: perfilDe(), isAdmin: false, loading: false };

    expect(montar(<App exigeAdmin />).getByTestId('exige-admin')).toBeInTheDocument();
  });

  it('lets an admin into an admin-only route', () => {
    mockAuth = { user: { id: '123' }, loading: false, signOut: () => {} } as any;
    mockProfile = { perfil: perfilDe({ papel: 'admin' }), isAdmin: true, loading: false };

    expect(montar(<App exigeAdmin />).getByTestId('private')).toBeInTheDocument();
  });
});
