import { db } from "@/db";
import { categories, subcategories, establishments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import EstablishmentsList from "./EstablishmentsList";
import AddEstablishmentForm from "./AddEstablishmentForm";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string; subcategoryId: string }>;
};

export const metadata: Metadata = {
  title: "СЕРАФІМ - Заклади",
  description: "Управління закладами сервісу СЕРАФІМ",
}

// Робимо сторінку динамічною, щоб уникнути помилок під час білду
export const dynamic = 'force-dynamic';

const EstablishmentsPage = async ({ params }: PageProps) => {
  const { id, subcategoryId } = await params;
  const categoryId = parseInt(id, 10);
  const subcategoryIdNum = parseInt(subcategoryId, 10);

  if (isNaN(categoryId) || isNaN(subcategoryIdNum)) {
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

  const [subcategory] = await db
    .select()
    .from(subcategories)
    .where(eq(subcategories.id, subcategoryIdNum))
    .limit(1);

  if (!subcategory || subcategory.categoryId !== categoryId) {
    notFound();
  }

  const establishmentsList = await db
    .select()
    .from(establishments)
    .where(eq(establishments.subcategoryId, subcategoryIdNum));

  return (
    <div className="min-h-screen bg-muted/20 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            href={`/categories/${categoryId}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад до підкатегорій
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {subcategory.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                Категорія: {category.name}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-sm font-bold mr-1">{establishmentsList.length}</span>
                {establishmentsList.length === 1 ? 'заклад' : establishmentsList.length < 5 ? 'заклади' : 'закладів'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <AddEstablishmentForm categoryId={categoryId} subcategoryId={subcategoryIdNum} />
        </div>

        <EstablishmentsList establishments={establishmentsList} />
      </div>
    </div>
  );
};

export default EstablishmentsPage;