import React from "react";
import { Layout } from "@/components/Layout";
import { MessageSquare, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Mensagens = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mensagens</h1>
            <p className="text-muted-foreground">Comunicação com clientes e equipe</p>
          </div>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Conversas */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversas</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar conversas..." className="pl-8" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                    JD
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">João Dias</p>
                    <p className="text-sm text-muted-foreground">Aprovação da pauta...</p>
                  </div>
                  <div className="text-xs text-muted-foreground">2min</div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary-foreground font-medium">
                    MS
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Maria Silva</p>
                    <p className="text-sm text-muted-foreground">Revisei os materiais</p>
                  </div>
                  <div className="text-xs text-muted-foreground">1h</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área de Mensagem */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                    JD
                  </div>
                  <div>
                    <CardTitle>João Dias</CardTitle>
                    <p className="text-sm text-muted-foreground">Cliente - Empresa ABC</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 mb-4">
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                    <p>Selecione uma conversa para ver as mensagens</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Input placeholder="Digite sua mensagem..." className="flex-1" />
                  <Button>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};