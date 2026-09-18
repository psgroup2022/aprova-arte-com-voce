import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Eye,
  ImageIcon,
  Trash2,
  Share2,
  MoreHorizontal,
  User2,
  Pencil,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

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
    label: 'Rascunho',
    className: 'bg-secondary text-secondary-foreground border-border',
    dot: 'bg-muted-foreground',
  },
  aguardando_aprovacao: {
    label: 'Aguardando',
    className: 'bg-warning text-warning-foreground border-warning-foreground/20',
    dot: 'bg-warning-foreground',
  },
  aprovada: {
    label: 'Aprovada',
    className: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
  },
  rejeitada: {
    label: 'Rejeitada',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive',
  },
};

export const PautaCard = ({ pauta, onDelete, isDeleting }: PautaCardProps) => {
  const status = statusConfig[pauta.status];

  const handleShare = () => {
    const url = `${window.location.origin}/pauta/${pauta.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para sua área de transferência.',
    });
  };

  return (
    <Card className="group relative overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all duration-300">
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${status.dot}`} />

      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base truncate group-hover:text-primary transition-colors">
              {pauta.titulo}
            </h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {pauta.prazo ? new Date(pauta.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </span>
              </div>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`shrink-0 text-xs font-medium px-2.5 py-1 ${status.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Preview Area */}
      <div className="px-5">
        <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl border">
          {pauta.imagens.length > 0 ? (
            <>
              {pauta.imagens.slice(0, 4).map((_, index) => (
                <div
                  key={index}
                  className="w-14 h-14 bg-card rounded-lg flex items-center justify-center border shadow-sm"
                >
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              ))}
              {pauta.imagens.length > 4 && (
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 text-xs font-medium text-primary">
                  +{pauta.imagens.length - 4}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 w-full py-2">
              <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center border">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Nenhuma arte adicionada</span>
            </div>
          )}
        </div>
      </div>

      {/* Client info */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <User2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium text-foreground">
                {pauta.cliente || 'Não definido'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-2">
          <Link to={`/pauta/${pauta.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
          </Link>

          <Button size="sm" onClick={handleShare} className="transition-all">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>

          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-9 h-9 p-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to={`/editar-pauta/${pauta.id}`} className="flex items-center">
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar pauta
                  </Link>
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir pauta
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Pauta</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a pauta "{pauta.titulo}"? Esta ação não pode
                        ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Excluindo...' : 'Excluir'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  );
};
