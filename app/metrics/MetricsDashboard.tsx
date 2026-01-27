"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-client";

type MetricsData = {
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: string;
    avgResponseTime: number;
    totalContracts: number;
    totalPages: number;
  };
};

type Execution = {
  id: number;
  startDate: string;
  endDate: string;
  establishmentsProcessed: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalContractsCollected: number;
  totalContractsUpdated: number;
  totalErrors: number;
  duration: number;
  status: string;
  errorMessage: string | null;
  errorDetails: unknown;
  createdAt: string;
  successRate: string;
};

const MetricsDashboard = () => {
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executionsLoading, setExecutionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const executionsPerPage = 10;
  const [triggeringN8n, setTriggeringN8n] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/api/metrics`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data);
      } else {
        setError(data.error || "Failed to fetch metrics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExecutions = useCallback(async (page: number) => {
    setExecutionsLoading(true);
    try {
      const params = new URLSearchParams();
      const offset = (page - 1) * executionsPerPage;
      params.append("limit", executionsPerPage.toString());
      params.append("offset", offset.toString());

      const response = await apiRequest(`/api/metrics/executions?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setExecutions(data.executions || []);
        const total = Number(data.total) || 0;
        setTotalExecutions(total);
      }
    } catch (err) {
      console.error("Error fetching executions:", err);
    } finally {
      setExecutionsLoading(false);
    }
  }, [executionsPerPage]);

  // Автоматичне оновлення executions, якщо є running
  useEffect(() => {
    const hasRunning = executions.some((exec) => exec.status === "running");
    if (!hasRunning) return;

    const interval = setInterval(() => {
      const offset = (currentPage - 1) * executionsPerPage;
      const params = new URLSearchParams();
      params.append("limit", executionsPerPage.toString());
      params.append("offset", offset.toString());
      
      apiRequest(`/api/metrics/executions?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setExecutions(data.executions || []);
            setTotalExecutions(data.total || 0);
          }
        })
        .catch((err) => console.error("Error fetching executions:", err));
    }, 2000);

    return () => clearInterval(interval);
  }, [executions, currentPage, executionsPerPage]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchExecutions(currentPage);
  }, [currentPage, fetchExecutions]);

  // Оновлюємо метрики після зміни сторінки executions
  useEffect(() => {
    if (!executionsLoading) {
      fetchMetrics();
    }
  }, [executionsLoading, fetchMetrics]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleTriggerN8n = useCallback(async () => {
    setTriggeringN8n(true);
    try {
      const response = await apiRequest("/api/n8n/trigger", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        // Оновлюємо метрики після успішного запуску
        setTimeout(() => {
          fetchMetrics();
          fetchExecutions(currentPage);
        }, 2000);
        alert("✅ Збір договорів запущено через n8n");
      } else {
        alert(`❌ Помилка: ${data.error || "Невідома помилка"}`);
      }
    } catch (err) {
      console.error("Error triggering n8n:", err);
      alert(`❌ Помилка: ${err instanceof Error ? err.message : "Невідома помилка"}`);
    } finally {
      setTriggeringN8n(false);
    }
  }, [fetchMetrics, fetchExecutions, currentPage]);

  const totalPages = Math.ceil(totalExecutions / executionsPerPage);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}мс`;
    return `${(ms / 1000).toFixed(2)}с`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження метрик...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">Помилка: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Немає даних</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Загальна статистика */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
        <h2 className="text-lg font-semibold">Загальна статистика</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleTriggerN8n}
            disabled={triggeringN8n}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {triggeringN8n ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                <span>Запуск...</span>
              </>
            ) : (
              "🚀 Запустити збір"
            )}
          </button>
          <button
            onClick={() => fetchMetrics()}
            disabled={loading}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Оновлення..." : "Оновити"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Всього запитів</div>
          <div className="text-xl font-bold">{metrics.summary.totalRequests}</div>
        </Card>

        <Card className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Успішні</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {metrics.summary.successfulRequests}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {metrics.summary.successRate}%
          </div>
        </Card>

        <Card className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Помилки</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {metrics.summary.failedRequests}
          </div>
        </Card>

        <Card className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Середній час</div>
          <div className="text-xl font-bold">{formatTime(metrics.summary.avgResponseTime)}</div>
        </Card>

        <Card className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Контрактів</div>
          <div className="text-xl font-bold">{metrics.summary.totalContracts}</div>
        </Card>

        <Card className="p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Сторінок</div>
          <div className="text-xl font-bold">{metrics.summary.totalPages}</div>
        </Card>
      </div>

      {/* Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Executions</CardTitle>
          <CardDescription>Історія виконань збору контрактів</CardDescription>
        </CardHeader>
        <CardContent>
          {executionsLoading ? (
            <div className="text-center py-4 text-muted-foreground">Завантаження...</div>
          ) : executions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Немає executions</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Дата</th>
                      <th className="text-left p-2">Діапазон</th>
                      <th className="text-right p-2">Статус</th>
                      <th className="text-right p-2">Закладів</th>
                      <th className="text-right p-2">Запитів</th>
                      <th className="text-right p-2">Успішних</th>
                      <th className="text-right p-2">Помилок</th>
                      <th className="text-right p-2">Контрактів</th>
                      <th className="text-right p-2">Оновлено</th>
                      <th className="text-right p-2">Тривалість</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec) => (
                      <tr 
                        key={exec.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/metrics/executions/${exec.id}`)}
                      >
                        <td className="p-2 font-mono text-xs">{exec.id}</td>
                        <td className="p-2 text-xs">
                          {formatDate(exec.createdAt)}
                        </td>
                        <td className="p-2 text-xs">
                          {exec.startDate} - {exec.endDate}
                        </td>
                        <td className="text-right p-2">
                          <Badge
                            variant={
                              exec.status === "success"
                                ? "default"
                                : exec.status === "partial_success"
                                ? "secondary"
                                : exec.status === "running"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {exec.status === "success"
                              ? "Успішно"
                              : exec.status === "partial_success"
                              ? "Частково"
                              : exec.status === "running"
                              ? "Виконується..."
                              : "Помилка"}
                          </Badge>
                        </td>
                        <td className="text-right p-2">
                          {exec.status === "running" ? (
                            <div className="flex items-center justify-end gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            </div>
                          ) : (
                            exec.establishmentsProcessed
                          )}
                        </td>
                        <td className="text-right p-2">
                          {exec.status === "running" ? (
                            <div className="flex items-center justify-end gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            </div>
                          ) : (
                            exec.totalRequests
                          )}
                        </td>
                        <td className="text-right p-2 text-green-600 dark:text-green-400">
                          {exec.status === "running" ? (
                            <div className="flex items-center justify-end gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                            </div>
                          ) : (
                            exec.successfulRequests
                          )}
                        </td>
                        <td className="text-right p-2 text-red-600 dark:text-red-400">
                          {exec.status === "running" ? (
                            <div className="flex items-center justify-end gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                            </div>
                          ) : (
                            exec.failedRequests
                          )}
                        </td>
                        <td className="text-right p-2 font-semibold">
                          {exec.status === "running" ? (
                            <div className="flex items-center justify-end gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            </div>
                          ) : (
                            exec.totalContractsCollected
                          )}
                        </td>
                        <td className="text-right p-2">
                          {exec.status === "running" ? (
                            <div className="flex items-center justify-end gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            </div>
                          ) : (
                            exec.totalContractsUpdated
                          )}
                        </td>
                        <td className="text-right p-2">
                          {exec.status === "running" ? (
                            <div className="flex items-center justify-end gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            </div>
                          ) : (
                            formatTime(exec.duration)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {executions.map((exec) => (
                  <Card
                    key={exec.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/metrics/executions/${exec.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-mono text-xs text-muted-foreground mb-1">ID: {exec.id}</div>
                          <div className="text-sm font-medium">{formatDate(exec.createdAt)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {exec.startDate} - {exec.endDate}
                          </div>
                        </div>
                        <Badge
                          variant={
                            exec.status === "success"
                              ? "default"
                              : exec.status === "partial_success"
                              ? "secondary"
                              : exec.status === "running"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {exec.status === "success"
                            ? "Успішно"
                            : exec.status === "partial_success"
                            ? "Частково"
                            : exec.status === "running"
                            ? "Виконується..."
                            : "Помилка"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Закладів</div>
                          <div className="font-medium">
                            {exec.status === "running" ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                              </div>
                            ) : (
                              exec.establishmentsProcessed
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Запитів</div>
                          <div className="font-medium">
                            {exec.status === "running" ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                              </div>
                            ) : (
                              exec.totalRequests
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Успішних</div>
                          <div className="font-medium text-green-600 dark:text-green-400">
                            {exec.status === "running" ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                              </div>
                            ) : (
                              exec.successfulRequests
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Помилок</div>
                          <div className="font-medium text-red-600 dark:text-red-400">
                            {exec.status === "running" ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                              </div>
                            ) : (
                              exec.failedRequests
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Контрактів</div>
                          <div className="font-semibold">
                            {exec.status === "running" ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              exec.totalContractsCollected
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Тривалість</div>
                          <div className="font-medium">
                            {exec.status === "running" ? (
                              <div className="flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                              </div>
                            ) : (
                              formatTime(exec.duration)
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Пагінація */}
          {!executionsLoading && totalExecutions > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
              <div className="text-sm text-muted-foreground">
                Показано {((currentPage - 1) * executionsPerPage) + 1} - {Math.min(currentPage * executionsPerPage, totalExecutions)} з {totalExecutions}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || executionsLoading}
                    className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Попередня
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={executionsLoading}
                          className={`px-3 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                            currentPage === pageNum
                              ? "bg-primary text-primary-foreground border-primary"
                              : ""
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || executionsLoading}
                    className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Наступна
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsDashboard;
