import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-primary">
                ApprovalHub
              </Link>
              <span className="text-sm text-muted-foreground">
                Sistema de Aprovação de Pautas
              </span>
            </div>
            <Link to="/criar-pauta">
              <Button variant="hero" size="lg">
                Nova Pauta
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};