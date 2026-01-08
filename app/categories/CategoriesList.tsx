"use client";

import { useState, useMemo } from "react";
import CategoryItem from "./CategoryItem";
import SearchBar from "./SearchBar";
import { FolderOpen } from "lucide-react";

type Category = {
  id: number;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
  subcategoriesCount: number;
  establishmentsCount: number;
};

type CategoriesListProps = {
  categories: Category[];
};

const CategoriesList = ({ categories }: CategoriesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase().trim();
    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  return (
    <>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Пошук категорій..."
      />

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 mb-4 shadow-md">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">
            {searchQuery ? "Категорії не знайдено" : "Категорії відсутні"}
          </p>
          {searchQuery && (
            <p className="text-xs text-muted-foreground">
              Спробуйте змінити запит пошуку
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCategories.map((category, index) => (
            <div
              key={category.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2"
              style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'both'
              }}
            >
              <CategoryItem category={category} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default CategoriesList;

