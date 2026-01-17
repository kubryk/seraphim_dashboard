"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-client";

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

type Request = {
  id: number;
  executionId: number | null;
  establishmentId: number | null;
  edrpouCode: string;
  url: string;
  method: string;
  startDate: string;
  endDate: string;
  page: number | null;
  statusCode: number | null;
  success: boolean;
  contractsCount: number | null;
  totalPages: number | null;
  totalContracts: number | null;
  errorMessage: string | null;
  errorDetails: unknown;
  responseTime: number | null;
  createdAt: string | null;
};

const ExecutionDetails = ({ executionId }: { executionId: string }) => {
  const router = useRouter();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await apiRequest(`/api/metrics/executions/${executionId}`);
        const data = await response.json();

        if (!isMounted) return;

        if (data.success) {
          setExecution(data.execution);
          setRequests(data.requests || []);
        } else {
          setError(data.error || "Failed to fetch execution details");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [executionId]);

  // Автоматичне оновлення, якщо execution running
  useEffect(() => {
    if (execution?.status !== "running") return;

    const interval = setInterval(async () => {
      try {
        const response = await apiRequest(`/api/metrics/executions/${executionId}`);
        const data = await response.json();

        if (data.success) {
          setExecution(data.execution);
          setRequests(data.requests || []);
          
          // Якщо статус змінився з running, зупиняємо інтервал
          if (data.execution.status !== "running") {
            clearInterval(interval);
          }
        }
      } catch (err) {
        // Ігноруємо помилки при автоматичному оновленні
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [executionId, execution?.status]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString("uk-UA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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
        <div className="text-muted-foreground">Завантаження...</div>
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

  if (!execution) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Execution не знайдено</div>
      </div>
    );
  }

  const successfulRequests = requests.filter((r) => r.success);
  const failedRequests = requests.filter((r) => !r.success);

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-4 md:space-y-6 py-4 md:py-6">
        {/* Кнопка назад */}
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          ← Назад до метрик
        </button>

      {/* Інформація про execution */}
      <Card>
        <CardHeader>
          <CardTitle>Execution #{execution.id}</CardTitle>
          <CardDescription>
            {formatDate(execution.createdAt)} • {execution.startDate} - {execution.endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Статус</div>
              <Badge
                variant={
                  execution.status === "success"
                    ? "default"
                    : execution.status === "partial_success"
                    ? "secondary"
                    : execution.status === "running"
                    ? "secondary"
                    : "destructive"
                }
                className="mt-1"
              >
                {execution.status === "success"
                  ? "Успішно"
                  : execution.status === "partial_success"
                  ? "Частково"
                  : execution.status === "running"
                  ? "Виконується..."
                  : "Помилка"}
              </Badge>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Тривалість</div>
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm text-muted-foreground">Обчислюється...</span>
                </div>
              ) : (
                <div className="text-lg font-semibold">{formatTime(execution.duration)}</div>
              )}
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Закладів оброблено</div>
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ) : (
                <div className="text-lg font-semibold">{execution.establishmentsProcessed}</div>
              )}
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Успішність</div>
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ) : (
                <div className="text-lg font-semibold">{execution.successRate}%</div>
              )}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">Всього запитів</div>
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ) : (
                <div className="text-xl font-bold">{execution.totalRequests}</div>
              )}
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="text-xs text-muted-foreground mb-1">Успішних</div>
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ) : (
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {execution.successfulRequests}
                </div>
              )}
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <div className="text-xs text-muted-foreground mb-1">Помилок</div>
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ) : (
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {execution.failedRequests}
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="text-xs text-muted-foreground mb-1">Контрактів зібрано</div>
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ) : (
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {execution.totalContractsCollected}
                </div>
              )}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">Контрактів оновлено</div>
              {execution.status === "running" ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              ) : (
                <div className="text-xl font-bold">{execution.totalContractsUpdated}</div>
              )}
            </div>
          </div>

          {/* Помилка якщо є */}
          {execution.errorMessage && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="text-sm font-semibold text-destructive mb-2">Помилка виконання:</div>
              <div className="text-sm break-words">{execution.errorMessage}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Успішні запити */}
      {successfulRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Успішні запити ({successfulRequests.length})</CardTitle>
            <CardDescription>Всі успішно виконані API запити</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">EDRPOU</th>
                    <th className="text-left p-2 hidden sm:table-cell">Сторінка</th>
                    <th className="text-right p-2">Статус</th>
                    <th className="text-right p-2 hidden md:table-cell">Контрактів</th>
                    <th className="text-right p-2 hidden lg:table-cell">Час відповіді</th>
                    <th className="text-left p-2 hidden xl:table-cell">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {successfulRequests.map((req) => (
                    <tr key={req.id} className="border-b hover:bg-green-50 dark:hover:bg-green-950/20 bg-green-50/50 dark:bg-green-950/10">
                      <td className="p-2 font-mono text-xs sm:text-sm">{req.edrpouCode}</td>
                      <td className="p-2 hidden sm:table-cell">{req.page || "—"}</td>
                      <td className="text-right p-2">
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">{req.statusCode || "—"}</Badge>
                      </td>
                      <td className="text-right p-2 hidden md:table-cell">{req.contractsCount || 0}</td>
                      <td className="text-right p-2 hidden lg:table-cell">{formatTime(req.responseTime)}</td>
                      <td className="p-2 text-xs text-muted-foreground hidden xl:table-cell">
                        {formatDate(req.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Невдалі запити */}
      {failedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Невдалі запити ({failedRequests.length})</CardTitle>
            <CardDescription>Запити з помилками</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">EDRPOU</th>
                    <th className="text-left p-2 hidden sm:table-cell">Сторінка</th>
                    <th className="text-right p-2">Статус</th>
                    <th className="text-right p-2 hidden lg:table-cell">Час відповіді</th>
                    <th className="text-left p-2">Помилка</th>
                    <th className="text-left p-2 hidden xl:table-cell">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {failedRequests.map((req) => (
                    <tr key={req.id} className="border-b hover:bg-red-50 dark:hover:bg-red-950/20 bg-red-50/50 dark:bg-red-950/10">
                      <td className="p-2 font-mono text-xs sm:text-sm">{req.edrpouCode}</td>
                      <td className="p-2 hidden sm:table-cell">{req.page || "—"}</td>
                      <td className="text-right p-2">
                        <Badge variant="destructive">{req.statusCode || "—"}</Badge>
                      </td>
                      <td className="text-right p-2 hidden lg:table-cell">{formatTime(req.responseTime)}</td>
                      <td className="p-2 text-sm text-destructive break-words max-w-xs sm:max-w-md md:max-w-lg">
                        {req.errorMessage || "Unknown error"}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground hidden xl:table-cell">
                        {formatDate(req.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

        {requests.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Немає запитів для цього execution
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExecutionDetails;
