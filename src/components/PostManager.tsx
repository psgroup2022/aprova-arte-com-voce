import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUpload } from "./FileUpload";
import { PostData } from "@/types/pauta-form";

interface PostManagerProps {
  posts: PostData[];
  tipoPost: string;
  onPostChange: (index: number, field: keyof PostData, value: string | File) => void;
}

export const PostManager = ({ posts, tipoPost, onPostChange }: PostManagerProps) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">
        {tipoPost === 'carousel' ? 'Imagens do Carrossel' : 'Posts'} 
        ({posts.length})
      </h3>
      
      <div className="space-y-6">
        {posts.map((post, index) => (
          <div key={index} className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium">
                {tipoPost === 'carousel' ? `Imagem ${index + 1}` : `Post ${index + 1}`}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`legenda-${index}`} className="text-sm font-medium mb-1">
                  {tipoPost === 'carousel' ? 'Descrição da Imagem' : 'Legenda'} *
                </Label>
                <Textarea
                  id={`legenda-${index}`}
                  value={post.legenda}
                  onChange={(e) => onPostChange(index, 'legenda', e.target.value)}
                  placeholder={tipoPost === 'carousel' 
                    ? 'Descreva esta imagem...' 
                    : 'Digite a legenda do post...'}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor={`hashtags-${index}`} className="text-sm font-medium mb-1">Hashtags</Label>
                <Input
                  id={`hashtags-${index}`}
                  value={post.hashtags}
                  onChange={(e) => onPostChange(index, 'hashtags', e.target.value)}
                  placeholder="#hashtag1 #hashtag2"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">Arquivo</Label>
              <FileUpload
                file={post.arquivo}
                onFileSelect={(file) => onPostChange(index, 'arquivo', file)}
                onFileRemove={() => onPostChange(index, 'arquivo', undefined as any)}
                index={index}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};