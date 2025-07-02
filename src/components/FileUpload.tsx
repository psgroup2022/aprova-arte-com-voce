import React from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Upload, Play, Trash2 } from "lucide-react";

interface FileUploadProps {
  file?: File;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  index: number;
}

export const FileUpload = ({ file, onFileSelect, onFileRemove, index }: FileUploadProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: File) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  if (file) {
    return (
      <div className="border rounded-lg p-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
              {getFileType(file) === 'image' ? (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Preview"
                  className="w-full h-full object-cover rounded"
                />
              ) : getFileType(file) === 'video' ? (
                <Play className="h-6 w-6 text-primary" />
              ) : (
                <span className="text-primary font-medium text-xs">DOC</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFileRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
      <CloudUpload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground mb-2">Arraste um arquivo ou clique para selecionar</p>
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
      >
        <Upload className="h-4 w-4 mr-1" />
        Selecionar Arquivo
      </Button>
      <input
        type="file"
        id={`file-upload-${index}`}
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};