import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users2, Settings, Sparkles, ChevronRight } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Equipe', href: '/equipe', icon: Users2 },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const AppSidebar = () => {
  const location = useLocation();
  // Nome e papel vinham escritos no código — "Jean Carlo / Administrador" para
  // quem quer que estivesse logado. Agora vêm do perfil de quem está logado.
  const { perfil, isAdmin } = useProfile();

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-sidebar flex flex-col z-30 border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-sidebar-primary rounded-xl flex items-center justify-center text-sidebar-primary-foreground font-bold text-lg shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sidebar-accent-foreground font-bold text-xl tracking-tight">
              Aprova
            </span>
            <span className="text-sidebar-primary font-bold text-xl">Arte</span>
            <p className="text-sidebar-foreground text-xs font-medium -mt-0.5">
              Sistema de Aprovação
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="text-sidebar-foreground text-xs font-semibold uppercase tracking-wider px-3 mb-4">
          Menu Principal
        </p>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-sm before:bg-sidebar-primary'
                  : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-sidebar-primary'
                    : 'text-sidebar-foreground group-hover:text-sidebar-primary'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm font-medium flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-sidebar-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors cursor-pointer">
          <Avatar className="w-10 h-10 rounded-xl shadow-md">
            <AvatarImage src={perfil?.avatar_url || undefined} alt="" className="rounded-xl" />
            <AvatarFallback className="rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
              {perfil ? iniciais(perfil.nome) : '—'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-accent-foreground truncate">
              {perfil?.nome ?? 'Carregando...'}
            </p>
            <p className="text-xs text-sidebar-foreground">
              {perfil ? (isAdmin ? 'Administrador' : 'Membro') : ''}
            </p>
          </div>
          <Settings className="w-4 h-4 text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
};
