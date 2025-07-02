import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, Image, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Pauta {
  id: string;
  titulo: string;
  prazo: string;
  status: 'rascunho' | 'aguardando_aprovacao' | 'aprovada' | 'rejeitada';
  imagens: string[];
  cliente: string;
}

interface PautaCardProps {
  pauta: Pauta;
  onDelete?: () => void;
  isDeleting?: boolean;
}

const statusConfig = {
  rascunho: { 
    label: "Rascunho", 
    variant: "outline" as const,
    color: "border-muted"
  },
  aguardando_aprovacao: { 
    label: "Aguardando aprovação", 
    variant: "secondary" as const,
    color: "border-warning"
  },
  aprovada: { 
    label: "Aprovada", 
    variant: "default" as const,
    color: "border-success"
  },
  rejeitada: { 
    label: "Rejeitada", 
    variant: "destructive" as const,
    color: "border-destructive"
  }
};

export const PautaCard = ({ pauta, onDelete, isDeleting }: PautaCardProps) => {
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
              {pauta.prazo ? new Date(pauta.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Miniaturas das artes */}
          <div className="flex items-center gap-2 mb-3">
            {pauta.imagens.slice(0, 4).map((_, index) => (
              <div key={index} className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                <Image className="w-6 h-6 text-primary/50" />
              </div>
            ))}
            {pauta.imagens.length === 0 && (
              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                <Image className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            {pauta.imagens.length > 4 && (
              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                +{pauta.imagens.length - 4}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{pauta.cliente}</span>
          </div>
          
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
            
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Pauta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a pauta "{pauta.titulo}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};