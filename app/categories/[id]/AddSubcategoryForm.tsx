"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSubcategory } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Loader2, Check, X } from "lucide-react";

type AddSubcategoryFormProps = {
  categoryId: number;
};

const AddSubcategoryForm = ({ categoryId }: AddSubcategoryFormProps) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() === "") return;
    
    setIsCreating(true);
    const result = await createSubcategory(categoryId, name.trim());
    
    if (result.success) {
      setName("");
      setIsExpanded(false);
      router.refresh();
    } else {
      alert(result.error || "Помилка при створенні підкатегорії");
    }
    
    setIsCreating(false);
  };

  const handleCancel = () => {
    setName("");
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        size="default"
        className="w-full h-10 text-sm font-semibold shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary cursor-pointer"
        aria-label="Додати підкатегорію"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Додати підкатегорію
      </Button>
    );
  }

  return (
    <Card className="border-[0.5px] border-border/50 shadow-md animate-in fade-in-0 slide-in-from-top-2 duration-200">
      <CardContent className="pt-2.5">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Назва підкатегорії"
              className="flex-1 h-9"
              autoFocus
              disabled={isCreating}
            />
            <Button
              type="submit"
              disabled={isCreating || name.trim() === ""}
              size="sm"
              className="cursor-pointer"
              aria-label="Створити"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Створення...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Створити
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
              size="sm"
              className="cursor-pointer"
              aria-label="Скасувати"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Скасувати
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddSubcategoryForm;
