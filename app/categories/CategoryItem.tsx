"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCategory, updateCategory } from "./actions";
import { Trash2, Pencil, Check, X, Calendar, Loader2, FolderTree, Building2 } from "lucide-react";
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

type Category = {
  id: number;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
  subcategoriesCount: number;
  establishmentsCount: number;
};

type CategoryItemProps = {
  category: Category;
};

const CategoryItem = ({ category }: CategoryItemProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
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

  const getSubcategoryText = (count: number) => {
    if (count === 1) return 'підкатегорія';
    if (count >= 2 && count <= 4) return 'підкатегорії';
    return 'підкатегорій';
  };

  const getEstablishmentText = (count: number) => {
    if (count === 1) return 'заклад';
    if (count >= 2 && count <= 4) return 'заклади';
    return 'закладів';
  };

  const handleSave = async () => {
    if (name.trim() === "") return;
    
    const result = await updateCategory(category.id, name.trim());
    if (result.success) {
      setIsEditing(false);
      router.refresh();
    }
  };

  const handleCancel = () => {
    setName(category.name);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      const result = await deleteCategory(category.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Помилка при видаленні категорії");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Помилка при видаленні категорії");
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
      <Card className=" p-1 group hover:shadow-lg hover:border-primary/60 transition-all duration-200 border-[0.5px] border-border/50 cursor-pointer [&:hover]:!bg-muted/80 dark:[&:hover]:!bg-muted/60">
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
                href={`/categories/${category.id}`}
                className="flex-1 flex items-center gap-3 cursor-pointer group/link"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold group-hover/link:text-primary transition-colors duration-200 truncate mb-1.5">
                    {category.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(category.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs px-2 py-0.5">
                        <FolderTree className="w-3 h-3 mr-0.5" />
                        <span className="font-semibold">{category.subcategoriesCount}</span>
                        <span className="ml-0.5">{getSubcategoryText(category.subcategoriesCount)}</span>
                      </Badge>
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs px-2 py-0.5">
                        <Building2 className="w-3 h-3 mr-0.5" />
                        <span className="font-semibold">{category.establishmentsCount}</span>
                        <span className="ml-0.5">{getEstablishmentText(category.establishmentsCount)}</span>
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
                  Ви впевнені, що хочете видалити категорію &quot;{category.name}&quot;? Ця дія незворотна.
                </div>
                {(category.subcategoriesCount > 0 || category.establishmentsCount > 0) && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="text-sm font-semibold text-destructive mb-1">
                      Разом з категорією також будуть видалені:
                    </div>
                    <ul className="text-sm text-destructive/90 space-y-1 list-disc list-inside">
                      {category.subcategoriesCount > 0 && (
                        <li>
                          {category.subcategoriesCount} {category.subcategoriesCount === 1 ? 'підкатегорія' : category.subcategoriesCount < 5 ? 'підкатегорії' : 'підкатегорій'}
                        </li>
                      )}
                      {category.establishmentsCount > 0 && (
                        <li>
                          {category.establishmentsCount} {category.establishmentsCount === 1 ? 'заклад' : category.establishmentsCount < 5 ? 'заклади' : 'закладів'}
                        </li>
                      )}
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

export default CategoryItem;

