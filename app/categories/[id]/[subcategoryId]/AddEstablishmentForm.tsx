"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEstablishment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Loader2, Check, X } from "lucide-react";

type AddEstablishmentFormProps = {
  categoryId: number;
  subcategoryId: number;
};

const validateEdrpou = (code: string): string | null => {
  const trimmed = code.trim();
  if (!trimmed) {
    return "ЄДРПОУ код обов'язковий";
  }
  if (!/^\d+$/.test(trimmed)) {
    return "ЄДРПОУ код повинен містити тільки цифри";
  }
  if (trimmed.length !== 8) {
    return "ЄДРПОУ код повинен містити рівно 8 цифр";
  }
  return null;
};

const AddEstablishmentForm = ({ categoryId, subcategoryId }: AddEstablishmentFormProps) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [edrpouCode, setEdrpouCode] = useState("");
  const [edrpouError, setEdrpouError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEdrpouChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Тільки цифри
    if (value.length <= 8) {
      setEdrpouCode(value);
      setEdrpouError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() === "") {
      return;
    }

    const validationError = validateEdrpou(edrpouCode);
    if (validationError) {
      setEdrpouError(validationError);
      return;
    }
    
    setIsCreating(true);
    const result = await createEstablishment(categoryId, subcategoryId, name.trim(), edrpouCode.trim());
    
    if (result.success) {
      setName("");
      setEdrpouCode("");
      setEdrpouError(null);
      setIsExpanded(false);
      router.refresh();
    } else {
      alert(result.error || "Помилка при створенні закладу");
    }
    
    setIsCreating(false);
  };

  const handleCancel = () => {
    setName("");
    setEdrpouCode("");
    setEdrpouError(null);
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
        aria-label="Додати заклад"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Додати заклад
      </Button>
    );
  }

  return (
    <Card className="border-[0.5px] border-border/50 shadow-md animate-in fade-in-0 slide-in-from-top-2 duration-200">
      <CardContent className="pt-2.5">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Назва закладу"
                className="flex-1 h-9"
                autoFocus
                disabled={isCreating}
              />
              <div className="flex-1">
                <Input
                  type="text"
                  value={edrpouCode}
                  onChange={handleEdrpouChange}
                  onKeyDown={handleKeyDown}
                  placeholder="ЄДРПОУ код (8 цифр)"
                  className={`h-9 ${edrpouError ? 'border-destructive' : ''}`}
                  disabled={isCreating}
                  maxLength={8}
                />
                {edrpouError && (
                  <p className="text-xs text-destructive mt-1">{edrpouError}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isCreating || name.trim() === "" || edrpouCode.trim() === "" || edrpouError !== null}
                size="sm"
                className="flex-1 cursor-pointer"
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddEstablishmentForm;
