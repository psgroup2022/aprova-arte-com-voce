import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { PautaCard } from "@/components/PautaCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data - será substituído por dados reais
const mockPautas = [
  {
    id: "1",
    titulo: "Campanha Black Friday - Loja XYZ",
    dataPublicacao: "2024-07-15",
    tipoPost: "feed",
    status: "pendente" as const,
    totalArtes: 3,
    cliente: "Loja XYZ",
    criadoEm: "2024-07-02"
  },
  {
    id: "2", 
    titulo: "Stories Produto Novo - Fashion Store",
    dataPublicacao: "2024-07-10",
    tipoPost: "stories",
    status: "aprovada" as const,
    totalArtes: 5,
    cliente: "Fashion Store",
    criadoEm: "2024-07-01"
  },
  {
    id: "3",
    titulo: "Carrossel Benefícios - Tech Corp",
    dataPublicacao: "2024-07-20",
    tipoPost: "carrossel",
    status: "aprovada-com-alteracoes" as const,
    totalArtes: 4,
    cliente: "Tech Corp",
    criadoEm: "2024-07-02"
  }
];

const statusFilters = [
  { key: "todos", label: "Todos", count: 8 },
  { key: "pendente", label: "Aguardando", count: 3 },
  { key: "aprovada", label: "Aprovadas", count: 2 },
  { key: "aprovada-com-alteracoes", label: "Com alterações", count: 2 },
  { key: "reprovada", label: "Reprovadas", count: 1 }
];

export const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Painel de Pautas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e acompanhe todas as aprovações de conteúdo
            </p>
          </div>
          
          <Link to="/criar-pauta">
            <Button variant="hero" size="xl" className="w-full lg:w-auto">
              <Plus className="w-5 h-5 mr-2" />
              Criar Nova Pauta
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, cliente ou tipo..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={activeFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.key)}
                  className="flex items-center gap-1"
                >
                  {filter.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {filter.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Pautas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPautas.map((pauta) => (
            <PautaCard key={pauta.id} pauta={pauta} />
          ))}
        </div>

        {/* Empty State */}
        {mockPautas.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma pauta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando sua primeira pauta para aprovação
            </p>
            <Link to="/criar-pauta">
              <Button variant="hero">
                Criar Primeira Pauta
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};