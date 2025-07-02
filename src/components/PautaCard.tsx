import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, Image } from "lucide-react";
import { Link } from "react-router-dom";

interface Pauta {
  id: string;
  titulo: string;
  dataPublicacao: string;
  tipoPost: string;
  status: 'pendente' | 'aprovada' | 'aprovada-com-alteracoes' | 'reprovada';
  totalArtes: number;
  cliente: string;
  criadoEm: string;
}

interface PautaCardProps {
  pauta: Pauta;
}

const statusConfig = {
  pendente: { 
    label: "Aguardando aprovação", 
    variant: "secondary" as const,
    color: "border-muted"
  },
  aprovada: { 
    label: "Aprovada", 
    variant: "default" as const,
    color: "border-success"
  },
  'aprovada-com-alteracoes': { 
    label: "Aprovada com alterações", 
    variant: "outline" as const,
    color: "border-warning"
  },
  reprovada: { 
    label: "Reprovada", 
    variant: "destructive" as const,
    color: "border-destructive"
  }
};

export const PautaCard = ({ pauta }: PautaCardProps) => {
  const status = statusConfig[pauta.status];
  
  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${status.color} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold mb-1">
              {pauta.titulo}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(pauta.dataPublicacao).toLocaleDateString('pt-BR')}
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{pauta.cliente}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium capitalize">{pauta.tipoPost}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image className="w-4 h-4" />
            {pauta.totalArtes} {pauta.totalArtes === 1 ? 'arte' : 'artes'}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Link to={`/pauta/${pauta.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </Link>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/pauta/${pauta.id}`);
              }}
            >
              Copiar Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};