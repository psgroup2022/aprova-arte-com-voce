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
  compartilhadoEm?: string;
  designer?: string;
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
          {/* Miniaturas das artes */}
          <div className="flex items-center gap-2 mb-3">
            {[...Array(Math.min(pauta.totalArtes, 4))].map((_, index) => (
              <div key={index} className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                <Image className="w-6 h-6 text-primary/50" />
              </div>
            ))}
            {pauta.totalArtes > 4 && (
              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                +{pauta.totalArtes - 4}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            {pauta.tipoPost.charAt(0).toUpperCase() + pauta.tipoPost.slice(1)} • Criada em {new Date(pauta.criadoEm).toLocaleDateString('pt-BR')}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{pauta.cliente}</span>
          </div>
          
          {pauta.designer && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Designer:</span>
              <span className="font-medium">{pauta.designer}</span>
            </div>
          )}

          {pauta.compartilhadoEm && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Compartilhada:</span>
              <span className="font-medium">{new Date(pauta.compartilhadoEm).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Link to={`/pauta/${pauta.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Abrir Revisão
              </Button>
            </Link>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/pauta/${pauta.id}`);
              }}
            >
              Compartilhar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};