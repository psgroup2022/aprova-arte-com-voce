import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienteDialog } from "@/components/ClienteDialog";
import { useClientes } from "@/hooks/useClientes";
import { FormData, PostType } from "@/types/pauta-form";

interface PautaBasicInfoFormProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string | number) => void;
  onClienteCreated: (clienteId: string) => void;
}

export const PautaBasicInfoForm = ({ 
  formData, 
  onInputChange, 
  onClienteCreated 
}: PautaBasicInfoFormProps) => {
  const { clientes } = useClientes();

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="titulo" className="text-sm font-medium mb-1">Título *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => onInputChange("titulo", e.target.value)}
          placeholder="Digite o título da pauta"
          required
        />
      </div>

      <div>
        <Label htmlFor="tipo_post" className="text-sm font-medium mb-1">Tipo de Post *</Label>
        <Select value={formData.tipo_post} onValueChange={(value: PostType) => onInputChange("tipo_post", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de post" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feed">Instagram Feed</SelectItem>
            <SelectItem value="story">Instagram Story</SelectItem>
            <SelectItem value="reel">Instagram Reel</SelectItem>
            <SelectItem value="carousel">Instagram Carrossel</SelectItem>
            <SelectItem value="facebook">Facebook Post</SelectItem>
            <SelectItem value="twitter">Twitter Post</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="quantidade_materiais" className="text-sm font-medium mb-1">Quantidade de Materiais *</Label>
        <Select 
          value={formData.quantidade_materiais.toString()} 
          onValueChange={(value) => onInputChange("quantidade_materiais", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a quantidade" />
          </SelectTrigger>
          <SelectContent>
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? 'material' : 'materiais'}
                {formData.tipo_post === 'carousel' && num > 1 ? ' (imagens no carrossel)' : 
                 formData.tipo_post !== 'carousel' && num > 1 ? ' posts' : ' post'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {formData.tipo_post === 'carousel' 
            ? 'Para carrossel: cada material é uma imagem do carrossel'
            : 'Cada material é um post separado'
          }
        </p>
      </div>

      <div>
        <Label htmlFor="data_prazo" className="text-sm font-medium mb-1">Data de Publicação *</Label>
        <Input
          id="data_prazo"
          type="date"
          value={formData.data_prazo}
          onChange={(e) => onInputChange("data_prazo", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="cliente" className="text-sm font-medium mb-1">Cliente *</Label>
        <div className="flex gap-2">
          <Select value={formData.cliente_id} onValueChange={(value) => onInputChange("cliente_id", value)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                  {cliente.empresa && ` - ${cliente.empresa}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ClienteDialog onClienteCreated={onClienteCreated} />
        </div>
      </div>
    </div>
  );
};