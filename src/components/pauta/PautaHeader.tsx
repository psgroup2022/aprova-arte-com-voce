import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Mail, Send } from "lucide-react";

interface PautaHeaderProps {
  titulo: string;
  cliente: string;
  dataPrazo?: string;
}

export const PautaHeader = ({ titulo, cliente, dataPrazo }: PautaHeaderProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sem prazo definido";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={() => navigate("/")}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-slate-800">{titulo}</h1>
          <p className="text-sm text-gray-500">Cliente: {cliente} • Vence {formatDate(dataPrazo)}</p>
        </div>
      </div>
      <div className="flex space-x-3">
        <Button variant="outline" className="flex items-center text-sm font-medium">
          <Mail className="w-4 h-4 mr-2" />
          Compartilhar Feedback
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center text-sm font-medium">
          <Send className="w-4 h-4 mr-2" />
          Enviar Revisão
        </Button>
      </div>
    </div>
  );
};