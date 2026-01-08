"use client";

import { useState, useMemo } from "react";
import SubcategoryItem from "./SubcategoryItem";
import SearchBar from "../SearchBar";
import { FolderOpen } from "lucide-react";

type Subcategory = {
  id: number;
  name: string;
  categoryId: number;
  createdAt: string | null;
  updatedAt: string | null;
  establishmentsCount: number;
};

type SubcategoriesListProps = {
  subcategories: Subcategory[];
};

const SubcategoriesList = ({ subcategories }: SubcategoriesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubcategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return subcategories;
    }

    const query = searchQuery.toLowerCase().trim();
    return subcategories.filter((subcategory) =>
      subcategory.name.toLowerCase().includes(query)
    );
  }, [subcategories, searchQuery]);

  return (
    <>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Пошук підкатегорій..."
      />

      {filteredSubcategories.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 mb-4 shadow-md">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">
            {searchQuery ? "Підкатегорії не знайдено" : "Підкатегорії відсутні"}
          </p>
          {searchQuery && (
            <p className="text-xs text-muted-foreground">
              Спробуйте змінити запит пошуку
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSubcategories.map((subcategory, index) => (
            <div
              key={subcategory.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2"
              style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'both'
              }}
            >
              <SubcategoryItem subcategory={subcategory} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default SubcategoriesList;

