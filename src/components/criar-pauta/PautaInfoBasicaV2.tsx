import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClientes } from '@/hooks/useClientes';
import { TagManager } from '@/components/TagManager';
import { TarefaVinculadaSelector } from './TarefaVinculadaSelector';

interface PautaInfoBasicaV2Props {
  titulo: string;
  clienteId: string;
  dataPrevista: string;
  tags: string[];
  observacoesInternas: string;
  mirapautaTaskId?: string;
  onTituloChange: (value: string) => void;
  onClienteChange: (value: string) => void;
  onDataPrevistaChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onObservacoesChange: (value: string) => void;
  onMirapautaTaskChange?: (value: string) => void;
  onNovoCliente?: () => void;
  disabled?: boolean;
}

export const PautaInfoBasicaV2: React.FC<PautaInfoBasicaV2Props> = ({
  titulo,
  clienteId,
  dataPrevista,
  tags,
  observacoesInternas,
  mirapautaTaskId,
  onTituloChange,
  onClienteChange,
  onDataPrevistaChange,
  onTagsChange,
  onObservacoesChange,
  onMirapautaTaskChange,
  onNovoCliente,
  disabled = false,
}) => {
  const { clientes, isLoading } = useClientes();
  const selectedDate = dataPrevista ? new Date(dataPrevista) : undefined;

  return (
    <div className="space-y-6">
      {/* Título da pauta */}
      <div className="space-y-2">
        <Label htmlFor="titulo">
          Título da Pauta <span className="text-destructive">*</span>
        </Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          placeholder="Ex: Rede Social Setembro"
          disabled={disabled}
          className="text-lg"
        />
      </div>

      {/* Cliente */}
      <div className="space-y-2">
        <Label>
          Cliente <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Select
            value={clienteId}
            onValueChange={onClienteChange}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{cliente.nome}</span>
                    {cliente.empresa && (
                      <span className="text-muted-foreground text-xs">({cliente.empresa})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onNovoCliente && (
            <Button type="button" variant="outline" onClick={onNovoCliente} disabled={disabled}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Data prevista e Tags em grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data prevista de publicação */}
        <div className="space-y-2">
          <Label>
            Data Prevista de Publicação
            <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate
                  ? format(selectedDate, 'PPP', { locale: ptBR })
                  : 'Selecione uma data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => onDataPrevistaChange(date ? date.toISOString() : '')}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>
            Tags
            <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
          </Label>
          <TagManager tags={tags} onTagsChange={onTagsChange} />
        </div>
      </div>

      {/* Tarefa Vinculada do MiraPauta */}
      {onMirapautaTaskChange && (
        <TarefaVinculadaSelector
          value={mirapautaTaskId || ''}
          onChange={onMirapautaTaskChange}
          disabled={disabled}
        />
      )}

      {/* Observações internas */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">
          Observações Internas
          <span className="text-muted-foreground font-normal ml-1">
            (não aparece para o cliente)
          </span>
        </Label>
        <Textarea
          id="observacoes"
          value={observacoesInternas}
          onChange={(e) => onObservacoesChange(e.target.value)}
          placeholder="Anotações internas sobre a pauta..."
          rows={3}
          disabled={disabled}
          className="resize-none"
        />
      </div>
    </div>
  );
};
