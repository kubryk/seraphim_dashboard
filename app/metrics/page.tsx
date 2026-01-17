import { Metadata } from "next";
import MetricsDashboard from "./MetricsDashboard";

export const metadata: Metadata = {
  title: "СЕРАФІМ - Метрики API",
  description: "Метрики та статистика API запитів до Prozorro",
};

const MetricsPage = async () => {
  return (
    <div className="min-h-screen bg-muted/20 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Метрики API
              </h1>
              <p className="text-muted-foreground text-sm">
                Статистика та моніторинг запитів до Prozorro API
              </p>
            </div>
          </div>
        </div>

        <MetricsDashboard />
      </div>
    </div>
  );
};

export default MetricsPage;
