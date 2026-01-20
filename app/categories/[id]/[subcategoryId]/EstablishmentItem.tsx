"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEstablishment, updateEstablishment } from "./actions";
import { Trash2, Pencil, Check, X, Calendar, Loader2, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Establishment = {
  id: number;
  name: string;
  edrpouCode: string;
  categoryId: number;
  subcategoryId: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type EstablishmentItemProps = {
  establishment: Establishment;
  index: number;
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

const EstablishmentItem = ({ establishment, index }: EstablishmentItemProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(establishment.name);
  const [edrpouCode, setEdrpouCode] = useState(establishment.edrpouCode);
  const [edrpouError, setEdrpouError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleEdrpouChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Тільки цифри
    if (value.length <= 8) {
      setEdrpouCode(value);
      setEdrpouError(null);
    }
  };

  const handleSave = async () => {
    if (name.trim() === "") return;

    const validationError = validateEdrpou(edrpouCode);
    if (validationError) {
      setEdrpouError(validationError);
      return;
    }
    
    const result = await updateEstablishment(
      establishment.id,
      establishment.categoryId,
      establishment.subcategoryId,
      name.trim(),
      edrpouCode.trim()
    );
    if (result.success) {
      setIsEditing(false);
      setEdrpouError(null);
      router.refresh();
    } else {
      alert(result.error || "Помилка при оновленні закладу");
    }
  };

  const handleCancel = () => {
    setName(establishment.name);
    setEdrpouCode(establishment.edrpouCode);
    setEdrpouError(null);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      const result = await deleteEstablishment(
        establishment.id,
        establishment.categoryId,
        establishment.subcategoryId
      );
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Помилка при видаленні закладу");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting establishment:", error);
      alert("Помилка при видаленні закладу");
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <>
      <Card className="p-1 group hover:shadow-lg hover:border-primary/60 transition-all duration-200 border-[0.5px] border-border/50 cursor-pointer [&:hover]:!bg-muted/80 dark:[&:hover]:!bg-muted/60">
        <CardContent className="p-2.5">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Назва закладу"
                className="w-full"
                autoFocus
              />
              <div>
                <Input
                  type="text"
                  value={edrpouCode}
                  onChange={handleEdrpouChange}
                  onKeyDown={handleKeyDown}
                  placeholder="ЄДРПОУ код (8 цифр)"
                  className={`w-full ${edrpouError ? 'border-destructive' : ''}`}
                  maxLength={8}
                />
                {edrpouError && (
                  <p className="text-xs text-destructive mt-1">{edrpouError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 cursor-pointer"
                  size="sm"
                  disabled={edrpouError !== null}
                  aria-label="Зберегти"
                >
                  <Check className="w-3.5 h-3.5" />
                  Зберегти
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  size="sm"
                  aria-label="Скасувати"
                >
                  <X className="w-3.5 h-3.5" />
                  Скасувати
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-muted-foreground min-w-[24px]">
                  {index + 1}.
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate mb-1.5">
                  {establishment.name}
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(establishment.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Hash className="w-3 h-3" />
                    <span>ЄДРПОУ: {establishment.edrpouCode}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  aria-label="Редагувати"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  size="icon"
                  disabled={isDeleting}
                  className="h-8 w-8 cursor-pointer"
                  aria-label="Видалити"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Видалити заклад?</DialogTitle>
            <DialogDescription>
              Ви впевнені, що хочете видалити заклад &quot;{establishment.name}&quot;? Ця дія незворотна.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="cursor-pointer"
            >
              Скасувати
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="cursor-pointer"
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EstablishmentItem;
