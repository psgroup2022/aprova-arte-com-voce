import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, ImageIcon, Trash2, Share2, MoreHorizontal, User2 } from 'lucide-react';
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
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  aguardando_aprovacao: {
    label: 'Aguardando',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  aprovada: {
    label: 'Aprovada',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
  },
  rejeitada: {
    label: 'Rejeitada',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
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
    <Card className="group relative overflow-hidden bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${status.dot}`} />

      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-base truncate group-hover:text-violet-700 transition-colors">
              {pauta.titulo}
            </h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
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
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {pauta.imagens.length > 0 ? (
            <>
              {pauta.imagens.slice(0, 4).map((_, index) => (
                <div
                  key={index}
                  className="w-14 h-14 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm"
                >
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                </div>
              ))}
              {pauta.imagens.length > 4 && (
                <div className="w-14 h-14 bg-violet-50 rounded-lg flex items-center justify-center border border-violet-100 text-xs font-medium text-violet-600">
                  +{pauta.imagens.length - 4}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3 w-full py-2">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                <ImageIcon className="w-5 h-5 text-slate-300" />
              </div>
              <span className="text-sm text-slate-400">Nenhuma arte adicionada</span>
            </div>
          )}
        </div>
      </div>

      {/* Client info */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <User2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Cliente</p>
              <p className="text-sm font-medium text-slate-700">
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
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-violet-700 hover:border-violet-200 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleShare}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>

          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-9 h-9 p-0 text-slate-400 hover:text-slate-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
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
                        className="bg-rose-600 text-white hover:bg-rose-700"
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
