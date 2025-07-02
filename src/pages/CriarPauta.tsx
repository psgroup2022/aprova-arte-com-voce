import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, HelpCircle, Bell, Upload, Plus, Edit3, Trash2, 
  Play, ArrowRight, Calendar, ChevronDown, Hash, X, 
  SpellCheck, CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CriarPauta = () => {
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState(["summer", "promo"]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [captionText, setCaptionText] = useState("");

  const suggestedHashtags = ["#summer", "#newcollection", "#promotion"];

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addHashtag = (hashtag: string) => {
    setHashtagInput(prev => prev + " " + hashtag);
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
            <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
              <div className="bg-current"></div>
              <div className="bg-current"></div>
              <div className="bg-current"></div>
              <div className="bg-current"></div>
            </div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v11A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-11z"/>
            </svg>
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 12h8m-8 4h6m-6-8h8M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"/>
            </svg>
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          </div>
          <div className="w-10 h-10 flex items-center justify-center hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
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
          <div className="flex items-center">
            <button 
              onClick={() => navigate("/")}
              className="mr-3 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">Criar Nova Pauta</h1>
          </div>
          <div className="flex items-center space-x-3">
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

        {/* Upload Form Section */}
        <div className="p-6">
          <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-5">
                  <div>
                    <label htmlFor="pauta-title" className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                    <Input 
                      type="text" 
                      id="pauta-title" 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Digite o título da pauta" 
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="post-type" className="block text-sm font-medium text-slate-700 mb-1">Tipo de Post *</label>
                    <div className="relative">
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2 appearance-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Selecione o tipo de post</option>
                        <option value="feed">Feed Instagram</option>
                        <option value="story">Stories Instagram</option>
                        <option value="reel">Reels Instagram</option>
                        <option value="carousel">Carrossel Instagram</option>
                        <option value="facebook">Post Facebook</option>
                        <option value="twitter">Post Twitter</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="publish-date" className="block text-sm font-medium text-slate-700 mb-1">Data de Publicação Agendada *</label>
                    <div className="relative">
                      <Input 
                        type="date" 
                        id="publish-date" 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="assigned-to" className="block text-sm font-medium text-slate-700 mb-1">Atribuir Para</label>
                    <div className="relative">
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2 appearance-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Selecionar membro da equipe</option>
                        <option value="user1">João Silva</option>
                        <option value="user2">Maria Santos</option>
                        <option value="user3">Pedro Costa</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                    <div className="flex flex-wrap items-center border border-gray-300 rounded-md px-2 py-1 focus-within:border-blue-500">
                      {selectedTags.map((tag) => (
                        <div key={tag} className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1 m-1 flex items-center">
                          {tag}
                          <button 
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <Input 
                        type="text" 
                        className="flex-grow border-0 focus:ring-0 text-sm p-1 shadow-none" 
                        placeholder="Adicionar tag..." 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Caption & Assets */}
                <div className="space-y-5">
                  <div>
                    <label htmlFor="caption" className="block text-sm font-medium text-slate-700 mb-1">Legenda/Caption *</label>
                    <Textarea 
                      id="caption" 
                      rows={4} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Digite a legenda ou caption do post..."
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{captionText.length}/2200 caracteres</span>
                      <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center">
                        <SpellCheck className="w-3 h-3 mr-1" />
                        Verificar ortografia
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="hashtags" className="block text-sm font-medium text-slate-700 mb-1">Hashtags</label>
                    <div className="relative">
                      <Input 
                        type="text" 
                        id="hashtags" 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pl-7 focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Adicionar hashtags separadas por espaços"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Hash className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex flex-wrap mt-2">
                      {suggestedHashtags.map((hashtag) => (
                        <button 
                          key={hashtag}
                          onClick={() => addHashtag(hashtag)}
                          className="bg-gray-100 hover:bg-gray-200 text-xs rounded-full px-2 py-1 m-0.5 text-slate-700"
                        >
                          {hashtag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Asset Upload Section */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Artes</h3>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="max-w-md mx-auto">
                    <Upload className="w-12 h-12 text-gray-400 mb-3 mx-auto" />
                    <h4 className="text-lg font-medium text-slate-700 mb-2">Arraste e solte arquivos aqui</h4>
                    <p className="text-sm text-gray-500 mb-4">Envie JPG, PNG, GIF para imagens ou MP4 para vídeos</p>
                    <div className="flex justify-center">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Selecionar Arquivos
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">Tamanho máximo do arquivo: 100MB</p>
                  </div>
                </div>
                
                {/* Uploaded Assets Preview */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Artes Enviadas (3)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Asset 1 */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="relative w-full h-48">
                        <img src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7" alt="Asset preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100">
                            <Edit3 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100">
                            <Trash2 className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <span className="text-white text-sm font-medium">promocao_verao_1.jpg</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">1080 x 1080px • 1.2MB</span>
                          <div className="flex items-center">
                            <span className="text-xs text-green-600 font-medium mr-1">Principal</span>
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Asset 2 */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="relative w-full h-48">
                        <img src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b" alt="Asset preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100">
                            <Edit3 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100">
                            <Trash2 className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <span className="text-white text-sm font-medium">promocao_verao_2.jpg</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">1080 x 1080px • 0.9MB</span>
                          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Definir como principal
                          </button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Asset 3 (Video) */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100">
                            <Edit3 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button className="bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100">
                            <Trash2 className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <span className="text-white text-sm font-medium">video_promocao.mp4</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">1920 x 1080px • 24MB</span>
                          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Definir como principal
                          </button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Options */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Opções Adicionais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <input 
                          id="auto-schedule" 
                          type="checkbox" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                        <label htmlFor="auto-schedule" className="ml-2 block text-sm text-slate-700">
                          Agendamento automático para melhor engajamento
                        </label>
                      </div>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <input 
                          id="notify-team" 
                          type="checkbox" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                        <label htmlFor="notify-team" className="ml-2 block text-sm text-slate-700">
                          Notificar equipe quando cliente revisar
                        </label>
                      </div>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input 
                          id="require-approval" 
                          type="checkbox" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                          defaultChecked 
                        />
                        <label htmlFor="require-approval" className="ml-2 block text-sm text-slate-700">
                          Exigir aprovação do cliente antes de publicar
                        </label>
                      </div>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                      Observações Internas (não visível para o cliente)
                    </label>
                    <Textarea 
                      id="notes" 
                      rows={3} 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Adicione observações internas aqui..." 
                    />
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Salvar como Rascunho
                </Button>
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Visualizar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center">
                  <span>Criar & Compartilhar com Cliente</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};