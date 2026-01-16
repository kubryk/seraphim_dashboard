"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteSubcategory, updateSubcategory } from "./actions";
import { Trash2, Pencil, Check, X, Calendar, Loader2, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Subcategory = {
  id: number;
  name: string;
  categoryId: number;
  createdAt: string | null;
  updatedAt: string | null;
  establishmentsCount: number;
};

type SubcategoryItemProps = {
  subcategory: Subcategory;
  index: number;
};

const SubcategoryItem = ({ subcategory, index }: SubcategoryItemProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(subcategory.name);
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

  const getEstablishmentText = (count: number) => {
    if (count === 1) return 'заклад';
    if (count >= 2 && count <= 4) return 'заклади';
    return 'закладів';
  };

  const handleSave = async () => {
    if (name.trim() === "") return;
    
    const result = await updateSubcategory(subcategory.id, subcategory.categoryId, name.trim());
    if (result.success) {
      setIsEditing(false);
      router.refresh();
    }
  };

  const handleCancel = () => {
    setName(subcategory.name);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      const result = await deleteSubcategory(subcategory.id, subcategory.categoryId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Помилка при видаленні підкатегорії");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      alert("Помилка при видаленні підкатегорії");
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
                className="w-full"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 cursor-pointer"
                  size="sm"
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
              <Link
                href={`/categories/${subcategory.categoryId}/${subcategory.id}`}
                className="flex-1 flex items-center gap-3 cursor-pointer group/link"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-muted-foreground min-w-[24px]">
                    {index + 1}.
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold group-hover/link:text-primary transition-colors duration-200 truncate mb-1.5">
                    {subcategory.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(subcategory.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs px-2 py-0.5">
                        <Building2 className="w-3 h-3 mr-0.5" />
                        <span className="font-semibold">{subcategory.establishmentsCount}</span>
                        <span className="ml-0.5">{getEstablishmentText(subcategory.establishmentsCount)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  aria-label="Редагувати"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Увага!</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <div>
                  Ви впевнені, що хочете видалити підкатегорію &quot;{subcategory.name}&quot;? Ця дія незворотна.
                </div>
                {subcategory.establishmentsCount > 0 && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="text-sm font-semibold text-destructive mb-1">
                      Разом з підкатегорією будуть видалені:
                    </div>
                    <ul className="text-sm text-destructive/90 space-y-1 list-disc list-inside">
                      <li>
                        {subcategory.establishmentsCount} {subcategory.establishmentsCount === 1 ? 'заклад' : subcategory.establishmentsCount < 5 ? 'заклади' : 'закладів'}
                      </li>
                    </ul>
                  </div>
                )}
              </div>
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

export default SubcategoryItem;
