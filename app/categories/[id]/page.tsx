import { db } from "@/db";
import { categories, subcategories, establishments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import SubcategoriesList from "./SubcategoriesList";
import AddSubcategoryForm from "./AddSubcategoryForm";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "СЕРАФІМ - Підкатегорії",
  description: "Управління підкатегоріями сервісу СЕРАФІМ",
}

const SubCategoryPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const categoryId = parseInt(id, 10);

  if (isNaN(categoryId)) {
    notFound();
  }

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!category) {
    notFound();
  }

  const subcategoriesList = await db
    .select({
      id: subcategories.id,
      name: subcategories.name,
      categoryId: subcategories.categoryId,
      createdAt: subcategories.createdAt,
      updatedAt: subcategories.updatedAt,
      establishmentsCount: sql<number>`count(${establishments.id})`.as("establishments_count"),
    })
    .from(subcategories)
    .leftJoin(establishments, eq(subcategories.id, establishments.subcategoryId))
    .where(eq(subcategories.categoryId, categoryId))
    .groupBy(subcategories.id, subcategories.name, subcategories.categoryId, subcategories.createdAt, subcategories.updatedAt);

  const totalEstablishments = await db
    .select({ count: sql<number>`count(*)` })
    .from(establishments)
    .innerJoin(subcategories, eq(establishments.subcategoryId, subcategories.id))
    .where(eq(subcategories.categoryId, categoryId));

  const totalEstablishmentsCount = Number(totalEstablishments[0]?.count || 0);

  return (
    <div className="min-h-screen bg-muted/20 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href="/categories"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад до категорій
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {category.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                Управління та організація підкатегорій
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ThemeToggle />
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-bold mr-1">{subcategoriesList.length}</span>
                {subcategoriesList.length === 1 ? 'підкатегорія' : 'підкатегорій'}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-bold mr-1">{totalEstablishmentsCount}</span>
                {totalEstablishmentsCount === 1 ? 'заклад' : totalEstablishmentsCount < 5 ? 'заклади' : 'закладів'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <AddSubcategoryForm categoryId={categoryId} />
        </div>

        <SubcategoriesList subcategories={subcategoriesList} />
      </div>
    </div>
  );
};

export default SubCategoryPage;