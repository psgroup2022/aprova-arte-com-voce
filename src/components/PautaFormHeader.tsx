import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const PautaFormHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="bg-card p-4 flex justify-between items-center shadow-sm border-b sticky top-0 z-20">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/")}
          className="mr-3"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Criar Nova Pauta</h1>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="outline" size="sm">
          <HelpCircle className="h-4 w-4 mr-1" />
          Ajuda
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
        </Button>
        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </div>
  );
};