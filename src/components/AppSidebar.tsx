import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  GridIcon,
  FolderIcon, 
  CalendarDaysIcon,
  MessageSquareIcon,
  BarChart3Icon,
  UsersIcon,
  SettingsIcon
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: GridIcon },
  { name: "Criar Pauta", href: "/criar-pauta", icon: FolderIcon },
  { name: "Agenda", href: "/agenda", icon: CalendarDaysIcon },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquareIcon },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3Icon },
  { name: "Equipe", href: "/equipe", icon: UsersIcon },
  { name: "Configurações", href: "/configuracoes", icon: SettingsIcon },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-sidebar-primary flex flex-col z-30">
      {/* Logo */}
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg">
            AM
          </div>
          <span className="text-sidebar-primary-foreground font-semibold text-lg">
            AgencyMaker
          </span>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex flex-col px-3 mt-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-primary" 
                  : "text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      {/* User Avatar */}
      <div className="mt-auto mb-4 px-3">
        <div className="flex items-center space-x-3 p-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-white">
            JS
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-primary-foreground">João Silva</p>
            <p className="text-xs text-sidebar-foreground">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};