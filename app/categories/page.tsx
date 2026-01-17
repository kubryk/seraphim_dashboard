import { db } from "@/db";
import { categories, subcategories, establishments } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import CategoriesList from "./CategoriesList";
import AddCategoryForm from "./AddCategoryForm";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "СЕРАФІМ - Категорії",
  description: "Управління категоріями сервісу СЕРАФІМ",
}

const CategoriesPage = async () => {
  const categoriesList = await db
    .select({
      id: categories.id,
      name: categories.name,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      subcategoriesCount: sql<number>`count(distinct ${subcategories.id})`.as("subcategories_count"),
      establishmentsCount: sql<number>`count(distinct ${establishments.id})`.as("establishments_count"),
    })
    .from(categories)
    .leftJoin(subcategories, eq(categories.id, subcategories.categoryId))
    .leftJoin(establishments, eq(subcategories.id, establishments.subcategoryId))
    .groupBy(categories.id, categories.name, categories.createdAt, categories.updatedAt);

  const totalSubcategories = await db
    .select({ count: sql<number>`count(*)` })
    .from(subcategories);

  const totalEstablishments = await db
    .select({ count: sql<number>`count(*)` })
    .from(establishments);

  const totalSubcategoriesCount = Number(totalSubcategories[0]?.count || 0);
  const totalEstablishmentsCount = Number(totalEstablishments[0]?.count || 0);

  return (
    <div className="min-h-screen bg-muted/20 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Категорії
              </h1>
              <p className="text-muted-foreground text-sm">
                Управління та організація категорій
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-bold mr-1">{categoriesList.length}</span>
                {categoriesList.length === 1 ? 'категорія' : 'категорій'}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-bold mr-1">{totalSubcategoriesCount}</span>
                {totalSubcategoriesCount === 1 ? 'підкатегорія' : 'підкатегорій'}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-bold mr-1">{totalEstablishmentsCount}</span>
                {totalEstablishmentsCount === 1 ? 'заклад' : totalEstablishmentsCount < 5 ? 'заклади' : 'закладів'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <AddCategoryForm />
        </div>

        <CategoriesList categories={categoriesList} />
      </div>
    </div>
  );
};

export default CategoriesPage;