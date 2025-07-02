import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagManager = ({ tags, onTagsChange }: TagManagerProps) => {
  const [newTag, setNewTag] = useState("");

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-1">Tags</Label>
      <div className="flex flex-wrap items-center border rounded-md px-2 py-1 focus-within:ring-2 focus-within:ring-ring">
        {tags.map((tag, index) => (
          <div key={index} className="bg-primary/10 text-primary text-xs rounded-full px-2 py-1 m-1 flex items-center">
            {tag}
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="ml-1 h-4 w-4 p-0 hover:bg-destructive/20"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="Adicionar tag..."
          className="border-0 focus:ring-0 text-sm p-1 flex-grow"
        />
      </div>
    </div>
  );
};