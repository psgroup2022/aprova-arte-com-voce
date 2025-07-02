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
  { name: "Pautas", href: "/pautas", icon: FolderIcon },
  { name: "Agenda", href: "/agenda", icon: CalendarDaysIcon },
  { name: "Mensagens", href: "/mensagens", icon: MessageSquareIcon },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3Icon },
  { name: "Equipe", href: "/equipe", icon: UsersIcon },
  { name: "Configurações", href: "/configuracoes", icon: SettingsIcon },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-sidebar-primary flex flex-col z-30">
      {/* Logo */}
      <div className="p-3">
        <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg">
          AM
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex flex-col items-center mt-6 space-y-6">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-primary" 
                  : "text-sidebar-foreground hover:text-white hover:bg-sidebar-accent/50"
              }`}
              title={item.name}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
      
      {/* User Avatar */}
      <div className="mt-auto mb-4 flex justify-center">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-white">
          JS
        </div>
      </div>
    </div>
  );
};