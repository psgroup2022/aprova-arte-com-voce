import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="eyebrow mb-3">Erro 404</p>
        <h1 className="text-6xl font-display font-black mb-4 text-foreground">Página não encontrada</h1>
        <p className="text-xl text-muted-foreground mb-6">A rota solicitada não existe.</p>
        <a href="/" className="text-primary hover:text-primary-hover underline font-medium">
          Voltar para o início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
