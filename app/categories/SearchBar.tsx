"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type SearchBarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
};

const SearchBar = ({ searchQuery, onSearchChange, placeholder = "Пошук..." }: SearchBarProps) => {
  return (
    <div className="mb-4 relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 h-9 text-sm"
      />
    </div>
  );
};

export default SearchBar;

