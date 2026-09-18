import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Mail, Send } from 'lucide-react';

interface PautaHeaderProps {
  titulo: string;
  cliente: string;
  dataPrazo?: string;
}

export const PautaHeader = ({ titulo, cliente, dataPrazo }: PautaHeaderProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sem prazo definido';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-card px-6 py-4 flex justify-between items-center border-b sticky top-0 z-10">
      <div className="flex items-center">
        <button
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground mr-4"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-foreground">{titulo}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente: {cliente} • Vence {formatDate(dataPrazo)}
          </p>
        </div>
      </div>
      <div className="flex space-x-3">
        <Button variant="outline" className="flex items-center text-sm font-medium">
          <Mail className="w-4 h-4 mr-2" />
          Compartilhar Feedback
        </Button>
        <Button className="flex items-center text-sm font-medium">
          <Send className="w-4 h-4 mr-2" />
          Enviar Revisão
        </Button>
      </div>
    </div>
  );
};
