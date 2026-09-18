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
    <div className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex flex-col z-30 border-r border-slate-800">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-white font-bold text-xl tracking-tight">Aprova</span>
            <span className="text-violet-400 font-bold text-xl">Arte</span>
            <p className="text-slate-500 text-xs font-medium -mt-0.5">Sistema de Aprovação</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-4">
          Menu Principal
        </p>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-500/20 to-indigo-500/10 text-white shadow-lg shadow-violet-500/5 border border-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'text-slate-500 group-hover:text-violet-400 group-hover:bg-violet-500/10'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm font-medium flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-violet-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer">
          <Avatar className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20">
            <AvatarImage src={perfil?.avatar_url || undefined} alt="" className="rounded-xl" />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-white">
              {perfil ? iniciais(perfil.nome) : '—'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {perfil?.nome ?? 'Carregando...'}
            </p>
            <p className="text-xs text-slate-500">
              {perfil ? (isAdmin ? 'Administrador' : 'Membro') : ''}
            </p>
          </div>
          <Settings className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </div>
  );
};
