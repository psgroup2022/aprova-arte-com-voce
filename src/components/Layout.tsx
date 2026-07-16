import React from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isClientView = location.pathname.startsWith('/pauta/');

  if (isClientView) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <div className="flex-1 ml-72">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
