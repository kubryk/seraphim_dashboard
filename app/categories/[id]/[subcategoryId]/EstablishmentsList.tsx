"use client";

import { useState, useMemo } from "react";
import EstablishmentItem from "./EstablishmentItem";
import SearchBar from "../../SearchBar";
import { Building2 } from "lucide-react";

type Establishment = {
  id: number;
  name: string;
  edrpouCode: string;
  categoryId: number;
  subcategoryId: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type EstablishmentsListProps = {
  establishments: Establishment[];
};

const EstablishmentsList = ({ establishments }: EstablishmentsListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEstablishments = useMemo(() => {
    if (!searchQuery.trim()) {
      return establishments;
    }

    const query = searchQuery.toLowerCase().trim();
    return establishments.filter(
      (establishment) =>
        establishment.name.toLowerCase().includes(query) ||
        establishment.edrpouCode.toLowerCase().includes(query)
    );
  }, [establishments, searchQuery]);

  return (
    <>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Пошук за назвою або ЄДРПОУ..."
      />

      {filteredEstablishments.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 mb-4 shadow-md">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">
            {searchQuery ? "Заклади не знайдено" : "Заклади відсутні"}
          </p>
          {searchQuery && (
            <p className="text-xs text-muted-foreground">
              Спробуйте змінити запит пошуку
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEstablishments.map((establishment, index) => (
            <div
              key={establishment.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2"
              style={{
                animationDelay: `${index * 30}ms`,
                animationFillMode: 'both'
              }}
            >
              <EstablishmentItem establishment={establishment} index={index} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default EstablishmentsList;

