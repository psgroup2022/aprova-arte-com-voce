import React, { useState } from "react";
import { 
  Grid3X3, Folder, CalendarDays, MessageSquare, BarChart3, Users, Settings,
  Filter, ChevronDown, Bell, HelpCircle, Search, List, Grid, Plus, X,
  Clock, Check, Edit3, Share2, MoreVertical, Eye, ExternalLink, 
  MessageCircle, Download, Play, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const mockPautas = [
  {
    id: "1",
    titulo: "Promoção Coleção de Verão",
    tipo: "Feed Instagram",
    status: "awaiting",
    statusLabel: "Aguardando Revisão",
    dataVencimento: "15 Jul, 2023",
    artes: 3,
    legenda: "Coleção de verão com novos modelos de beachwear e acessórios. Legenda: \"Se prepare para o verão com nossa nova coleção! #VibesVerao #NovaColecao\"",
    teamMembers: [
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
    ],
    compartilhado: "há 2 dias",
    temVideo: true
  },
  {
    id: "2",
    titulo: "Lançamento de Produto - Novos Tênis",
    tipo: "Carrossel Instagram",
    status: "approved",
    statusLabel: "Aprovada",
    dataVencimento: "10 Jul, 2023",
    artes: 4,
    legenda: "Apresentando nossa nova linha de tênis com tecnologia avançada de conforto. Legenda: \"Entre no futuro com nossos tênis mais confortáveis! Disponível agora! #NovoLancamento #TecnologiaConforto\"",
    teamMembers: [
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
    ],
    compartilhado: "há 1 dia",
    aprovado: true
  },
  {
    id: "3",
    titulo: "Anúncio Promoção de Final de Semana",
    tipo: "Stories Instagram",
    status: "revision",
    statusLabel: "Precisa Revisão",
    dataVencimento: "8 Jul, 2023",
    artes: 1,
    comentarios: 2,
    legenda: "Anúncio de promoção relâmpago de final de semana com 40% de desconto em todos os acessórios. Legenda: \"PROMOÇÃO RELÂMPAGO de final de semana! 40% OFF em todos os acessórios. Compre agora antes que acabe! #PromocaoRelampago #OfertasFimDeSemana\"",
    teamMembers: [
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg"
    ],
    compartilhado: "há 5 horas"
  },
  {
    id: "4",
    titulo: "Anúncio Nova Funcionalidade do Blog",
    tipo: "Reels Instagram",
    status: "awaiting",
    statusLabel: "Aguardando Revisão",
    dataVencimento: "20 Jul, 2023",
    artes: 1,
    legenda: "Anunciando nossa nova funcionalidade de blog com dicas de especialistas e insights da indústria. Legenda: \"Animados para anunciar nosso novo blog! Confira dicas de especialistas e insights no link da bio. #NovoBlog #DicasEspecialistas\"",
    teamMembers: [
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg",
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-9.jpg"
    ],
    compartilhado: "há 6 horas",
    temVideo: true
  }
];

export const Dashboard = () => {
  const [showModal, setShowModal] = useState(false);

  const getStatusBg = (status: string) => {
    switch (status) {
      case "awaiting": return "bg-yellow-50";
      case "approved": return "bg-green-50"; 
      case "revision": return "bg-red-50";
      default: return "bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "awaiting": return <Clock className="w-5 h-5 text-yellow-600" />;
      case "approved": return <Check className="w-5 h-5 text-green-600" />;
      case "revision": return <Edit3 className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case "awaiting": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{label}</Badge>;
      case "approved": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{label}</Badge>;
      case "revision": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{label}</Badge>;
      default: return <Badge variant="secondary">{label}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 h-full w-16 bg-slate-800 flex flex-col z-30">
        <div className="p-3">
          <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-lg">
            CR
          </div>
        </div>
        <div className="flex flex-col items-center mt-6 space-y-6 text-gray-400">
          <div className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-md text-white">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <Folder className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-auto mb-4 flex justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-xs font-medium text-white">
            JS
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ml-16">
        {/* Header */}
        <div className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
          <h1 className="text-xl font-semibold text-slate-800">
            🇧🇷 Painel de Revisão Criativa
          </h1>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <HelpCircle className="w-4 h-4" />
              <span>Ajuda</span>
            </Button>
            <div className="relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
            </div>
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="px-6 py-3 flex flex-wrap justify-between bg-gray-50 border-b border-gray-200">
          <div className="w-64">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-medium text-slate-700">Status</h3>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Todos os status</p>
          </div>
          <div className="w-64">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-medium text-slate-700">Tipo de Post</h3>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Todos os tipos</p>
          </div>
          <div className="w-64">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-medium text-slate-700">Período</h3>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Últimos 30 dias</p>
          </div>
          <div className="w-64">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-medium text-slate-700">Atribuído a</h3>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Todos os membros</p>
          </div>
          <div className="flex items-center">
            <button className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium">
              Limpar Tudo
            </button>
          </div>
        </div>

        {/* Sort Bar */}
        <div className="px-6 py-3 flex justify-between items-center bg-white border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-sm text-slate-600 mr-2">Ordenar por</span>
            <select className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-1.5 pr-8 text-sm text-slate-700">
              <option>Data de Vencimento (Mais Próxima)</option>
              <option>Última Modificação</option>
              <option>Data de Criação</option>
              <option>Alfabética</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input type="text" placeholder="Buscar pautas..." className="pl-9 w-64" />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <button className="text-blue-600 hover:text-blue-700">
              <List className="w-5 h-5" />
            </button>
            <button className="text-gray-400">
              <Grid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Pauta Button */}
        <div className="px-6 py-4">
          <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Criar Nova Pauta</span>
          </Button>
        </div>

        {/* Dashboard Stats */}
        <div className="px-6 py-2 grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 font-medium">Total de Pautas</h3>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Grid3X3 className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-800">24</p>
              <p className="text-xs text-gray-500 mt-1">+3 desde a semana passada</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 font-medium">Aguardando Revisão</h3>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-800">8</p>
              <p className="text-xs text-gray-500 mt-1">2 vencem hoje</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 font-medium">Aprovadas</h3>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-800">12</p>
              <p className="text-xs text-gray-500 mt-1">+5 esta semana</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 font-medium">Precisam Revisão</h3>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-800">4</p>
              <p className="text-xs text-gray-500 mt-1">-2 desde a semana passada</p>
            </CardContent>
          </Card>
        </div>

        {/* Pautas List */}
        <div className="px-6 pb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Todas as Pautas</h2>
          
          {mockPautas.map((pauta) => (
            <div key={pauta.id} className="border border-gray-300 rounded-lg bg-white overflow-hidden mb-4 hover:shadow-md transition-shadow">
              <div className={`${getStatusBg(pauta.status)} p-4 border-b border-gray-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${pauta.status === 'awaiting' ? 'bg-yellow-100' : pauta.status === 'approved' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mr-3`}>
                      {getStatusIcon(pauta.status)}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{pauta.titulo}</h3>
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        {getStatusBadge(pauta.status, pauta.statusLabel)}
                        <span className="mx-2">•</span>
                        <span className="text-gray-500">{pauta.tipo}</span>
                        <span className="mx-2">•</span>
                        <span className="text-gray-500">Vence {pauta.dataVencimento}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-slate-600 hover:text-slate-800">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="text-slate-600 hover:text-slate-800">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex space-x-4 mb-4 overflow-x-auto pb-2">
                  {Array.from({ length: pauta.artes }).map((_, index) => (
                    <div key={index} className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-md relative group">
                      {pauta.temVideo && index === pauta.artes - 1 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                          <Play className="w-8 h-8" />
                        </div>
                      )}
                      {pauta.comentarios && index === 0 && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-bl-md">
                          {pauta.comentarios} comentários
                        </div>
                      )}
                      <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/default-placeholder.png" alt="Asset preview" className="w-full h-full object-cover rounded-md" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all rounded-md">
                        <button className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-2 shadow-md">
                          <Eye className="w-4 h-4 text-slate-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                  {pauta.legenda}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      {pauta.teamMembers.map((member, index) => (
                        <img key={index} src={member} alt="Team member" className="w-7 h-7 rounded-full border-2 border-white" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {pauta.aprovado ? `Aprovada pelo cliente ${pauta.compartilhado}` : `Compartilhada com cliente ${pauta.compartilhado}`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-500">
                    {pauta.comentarios && (
                      <button className="text-red-500 flex items-center">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs ml-1">{pauta.comentarios}</span>
                      </button>
                    )}
                    {!pauta.comentarios && (
                      <button className="hover:text-slate-700">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button className="hover:text-slate-700">
                      <Eye className="w-4 h-4" />
                    </button>
                    {pauta.aprovado ? (
                      <button className="hover:text-slate-700">
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="hover:text-slate-700">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create New Pauta Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-slate-800">Criar Nova Pauta</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="pauta-title" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <Input type="text" id="pauta-title" placeholder="Digite o título da pauta" />
                </div>
                
                <div>
                  <label htmlFor="post-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Post</label>
                  <select id="post-type" className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Selecione o tipo de post</option>
                    <option value="feed">Feed Instagram</option>
                    <option value="story">Stories Instagram</option>
                    <option value="reel">Reels Instagram</option>
                    <option value="carousel">Carrossel Instagram</option>
                    <option value="facebook">Post Facebook</option>
                    <option value="twitter">Post Twitter</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="publish-date" className="block text-sm font-medium text-gray-700 mb-1">Data de Publicação Agendada</label>
                  <Input type="date" id="publish-date" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload de Artes</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-500">Arraste e solte arquivos aqui, ou clique para navegar</p>
                      <p className="text-xs text-gray-400">Suporta JPG, PNG, GIF, MP4 (máx 100MB)</p>
                    </div>
                    <Button variant="outline" className="mt-4">
                      Selecionar Arquivos
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">Legenda/Caption</label>
                  <textarea id="caption" rows={4} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Digite a legenda ou caption do post..."></textarea>
                </div>
                
                <div>
                  <label htmlFor="assigned-to" className="block text-sm font-medium text-gray-700 mb-1">Atribuir Para</label>
                  <select id="assigned-to" className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Selecionar membro da equipe</option>
                    <option value="user1">João Silva</option>
                    <option value="user2">Maria Santos</option>
                    <option value="user3">Pedro Costa</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-end space-x-2 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Criar Pauta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};