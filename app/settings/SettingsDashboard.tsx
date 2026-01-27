"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-client";
import { RefreshCw, Pause, Play, CheckCircle2, XCircle, Clock } from "lucide-react";

type Setting = {
  id: number;
  value: string;
  description: string | null;
  updatedAt: string | null;
};

type SettingsData = {
  telegram_threshold?: Setting;
  [key: string]: Setting | undefined;
};

type SyncStatus = {
  lastSyncDate: string | null;
  lastOffset: string | null;
  contractsCount: number;
  status: string;
  syncPaused: boolean;
};

const SettingsDashboard = () => {
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncStatusLoading, setSyncStatusLoading] = useState(false);
  const [syncStatusError, setSyncStatusError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest("/api/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings || {});
        // Ініціалізуємо локальні значення
        const initialValues: Record<string, string> = {};
        const initialDisplayValues: Record<string, string> = {};
        Object.keys(data.settings || {}).forEach((key) => {
          initialValues[key] = data.settings[key].value;
          initialDisplayValues[key] = data.settings[key].value;
        });
        setLocalValues(initialValues);
        setDisplayValues(initialDisplayValues);
      } else {
        setError(data.error || "Failed to fetch settings");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    setSyncStatusLoading(true);
    setSyncStatusError(null);
    try {
      const response = await apiRequest("/api/sync/status");
      const data = await response.json();

      if (data.success) {
        setSyncStatus(data.data);
      } else {
        setSyncStatusError(data.error || "Failed to fetch sync status");
      }
    } catch (err) {
      setSyncStatusError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSyncStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchSyncStatus();
  }, [fetchSettings, fetchSyncStatus]);

  // Автоматичне оновлення статусу синхронізації кожні 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  const handleSave = async (key: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await apiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          key,
          value: localValues[key],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Налаштування "${key}" успішно оновлено`);
        // Оновлюємо налаштування після успішного збереження
        await fetchSettings();
        // Прибираємо повідомлення через 3 секунди
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to update setting");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setDisplayValues((prev) => ({ ...prev, [key]: value }));
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = (key: string) => {
    // При втраті фокусу форматуємо значення для telegram_threshold
    if (key === "telegram_threshold" && localValues[key]) {
      const numericValue = parseFloat(localValues[key].replace(",", "."));
      if (!isNaN(numericValue)) {
        setDisplayValues((prev) => ({ ...prev, [key]: numericValue.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }));
      }
    }
  };

  const handleFocus = (key: string) => {
    // При фокусі показуємо неформатоване значення для telegram_threshold
    if (key === "telegram_threshold" && localValues[key]) {
      const numericValue = parseFloat(localValues[key].replace(",", "."));
      if (!isNaN(numericValue)) {
        setDisplayValues((prev) => ({ ...prev, [key]: numericValue.toString() }));
      }
    }
  };

  const formatSettingValue = (key: string, value: string): string => {
    if (key === "telegram_threshold") {
      // Форматуємо значення для відображення
      const numericValue = parseFloat(value.replace(",", "."));
      if (!isNaN(numericValue)) {
        return numericValue.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    return value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження налаштувань...</div>
      </div>
    );
  }

  if (error && Object.keys(settings).length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">Помилка: {error}</div>
      </div>
    );
  }

  const settingKeys = Object.keys(settings);

  if (settingKeys.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Немає налаштувань</div>
      </div>
    );
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("uk-UA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Успішно
          </Badge>
        );
      case "error":
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Помилка
          </Badge>
        );
      case "running":
        return (
          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            В процесі
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Статус синхронізації */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Збирання контрактів з Prozorro</CardTitle>
              <CardDescription>
                Всі нові контракти збираються кожну хвилину автоматично.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSyncStatus}
              disabled={syncStatusLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatusLoading ? "animate-spin" : ""}`} />
              Оновити
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syncStatusLoading && !syncStatus ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Завантаження статусу...</div>
            </div>
          ) : syncStatusError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
              Помилка: {syncStatusError}
            </div>
          ) : syncStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Статус</div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(syncStatus.status)}
                    {syncStatus.syncPaused && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300">
                        <Pause className="w-3 h-3 mr-1" />
                        Призупинено
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Кількість контрактів</div>
                  <div className="text-lg font-semibold">{syncStatus.contractsCount.toLocaleString("uk-UA")}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Остання синхронізація</div>
                  <div className="text-sm">{formatDate(syncStatus.lastSyncDate)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Останній offset</div>
                  <div className="font-mono text-xs break-all">{syncStatus.lastOffset || "—"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Немає даних про статус</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Інші налаштування */}
      {settingKeys
        .filter((key) => !key.startsWith("scoring_") && !key.toLowerCase().includes("prompt"))
        .map((key) => {
        const setting = settings[key];
        if (!setting) return null;

        // Використовуємо displayValues для відображення
        const storedValue = localValues[key] || setting.value;
        const displayValue = displayValues[key] !== undefined
          ? displayValues[key]
          : (key === "telegram_threshold"
              ? formatSettingValue(key, storedValue)
              : storedValue);
        
        const hasChanges = storedValue !== setting.value;

        return (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full">
                  {setting.description && (
                    <label className="text-sm font-medium mb-2 block">
                      {setting.description}
                    </label>
                  )}
                  <Input
                    type={key === "telegram_threshold" ? "number" : "text"}
                    value={displayValue}
                    onChange={(e) => {
                      handleValueChange(key, e.target.value);
                    }}
                    onFocus={() => handleFocus(key)}
                    onBlur={() => handleBlur(key)}
                    placeholder="Введіть значення"
                    className="w-full"
                    step={key === "telegram_threshold" ? "0.01" : undefined}
                    min={key === "telegram_threshold" ? "0" : undefined}
                  />
                </div>
                <Button
                  onClick={() => handleSave(key)}
                  disabled={!hasChanges || saving[key]}
                  className="w-full sm:w-auto sm:self-start"
                >
                  {saving[key] ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SettingsDashboard;
