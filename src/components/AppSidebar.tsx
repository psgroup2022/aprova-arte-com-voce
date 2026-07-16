import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  CalendarDays,
  MessageCircle,
  BarChart3,
  Users2,
  Settings,
  Sparkles,
  ChevronRight,
  Link2,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Criar Pauta', href: '/criar-pauta', icon: FilePlus2 },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays },
  { name: 'Mensagens', href: '/mensagens', icon: MessageCircle },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'Equipe', href: '/equipe', icon: Users2 },
  { name: 'Integrações', href: '/integracoes', icon: Link2 },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-sidebar flex flex-col z-30 border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-lg shadow-brand">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sidebar-foreground font-display font-black text-xl tracking-tight">SRP</span>
            <span className="text-primary font-display font-black text-xl"> Mirador</span>
            <p className="text-sidebar-foreground/50 text-[10px] font-mono uppercase tracking-widest mt-0.5">Sistema de Revisão de Pautas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="eyebrow px-3 mb-4">Menu Principal</p>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 text-sidebar-foreground border border-primary/30'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <div
                className={`p-1.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-sidebar-foreground/50 group-hover:text-primary group-hover:bg-primary/10'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border/60">
        <div className="flex items-center gap-3 p-3 rounded-md bg-sidebar-accent/40 hover:bg-sidebar-accent transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-md bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-brand">
            JC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">Jean Carlo</p>
            <p className="text-xs text-sidebar-foreground/50 font-mono uppercase tracking-wider">Admin</p>
          </div>
          <Settings className="w-4 h-4 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
};
