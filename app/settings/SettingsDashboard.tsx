"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-client";

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

const SettingsDashboard = () => {
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingAllScoring, setSavingAllScoring] = useState(false);

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

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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

  const handleSaveAllScoring = async () => {
    setSavingAllScoring(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const scoringKeys = settingKeys.filter((key) => key.startsWith("scoring_"));
      const changedKeys = scoringKeys.filter((key) => {
        const setting = settings[key];
        if (!setting) return false;
        const storedValue = localValues[key] || setting.value;
        return storedValue !== setting.value;
      });

      if (changedKeys.length === 0) {
        setError("Немає змін для збереження");
        setSavingAllScoring(false);
        return;
      }

      // Зберігаємо всі змінені налаштування послідовно
      const savePromises = changedKeys.map(async (key) => {
        const response = await apiRequest("/api/settings", {
          method: "PUT",
          body: JSON.stringify({
            key,
            value: localValues[key],
          }),
        });
        return response.json();
      });

      const results = await Promise.all(savePromises);
      const failedResults = results.filter((result) => !result.success);

      if (failedResults.length > 0) {
        setError(`Не вдалося зберегти деякі налаштування: ${failedResults.map((r) => r.error).join(", ")}`);
      } else {
        setSuccessMessage(`Успішно збережено ${changedKeys.length} налаштування(нь)`);
        await fetchSettings();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSavingAllScoring(false);
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
    // Для scoring налаштувань - не форматуємо, залишаємо як є (з крапкою)
    if (key.startsWith("scoring_") && localValues[key]) {
      // Просто замінюємо кому на крапку, якщо вона є, і залишаємо значення як є
      const value = localValues[key].replace(",", ".");
      // Перевіряємо, чи це валідне число, і якщо так - форматуємо до 2 знаків після крапки
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        // Використовуємо toFixed(2) який завжди повертає крапку
        const formatted = numericValue.toFixed(2);
        setDisplayValues((prev) => ({ ...prev, [key]: formatted }));
        // Також оновлюємо localValues, щоб зберегти значення з крапкою
        setLocalValues((prev) => ({ ...prev, [key]: formatted }));
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
    // Для scoring налаштувань - показуємо значення без форматування, замінюємо кому на крапку
    if (key.startsWith("scoring_") && localValues[key]) {
      const value = localValues[key].replace(",", ".");
      setDisplayValues((prev) => ({ ...prev, [key]: value }));
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

      {/* Правила автоматичної оцінки ризику */}
      {settingKeys.some((key) => key.startsWith("scoring_")) && (() => {
        const scoringKeys = settingKeys.filter((key) => key.startsWith("scoring_"));
        const hasAnyChanges = scoringKeys.some((key) => {
          const setting = settings[key];
          if (!setting) return false;
          const storedValue = localValues[key] || setting.value;
          return storedValue !== setting.value;
        });

        return (
          <Card>
            <CardHeader>
              <CardTitle>Правила автоматичної оцінки ризику</CardTitle>
              <CardDescription>
                Налаштування порогів для скорингу контрактів
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoringKeys.map((key, index) => {
                const setting = settings[key];
                if (!setting) return null;

                const storedValue = localValues[key] || setting.value;
                const displayValue = displayValues[key] !== undefined
                  ? displayValues[key]
                  : storedValue;

                const isLast = index === scoringKeys.length - 1;
                
                // Визначаємо колір та тип порогу
                const isYellow = key.includes('yellow');
                const isRed = key.includes('red');
                const borderColor = isYellow 
                  ? 'border-l-yellow-500 dark:border-l-yellow-400' 
                  : isRed 
                  ? 'border-l-red-500 dark:border-l-red-400' 
                  : 'border-l-gray-300 dark:border-l-gray-600';
                const badgeVariant = isYellow ? 'outline' : isRed ? 'destructive' : 'default';
                const badgeText = isYellow ? 'Yellow' : isRed ? 'Red' : '';
                const badgeClassName = isYellow 
                  ? 'border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30' 
                  : '';

                return (
                  <div 
                    key={key} 
                    className={`pb-4 pl-4 border-l-4 ${borderColor} ${!isLast ? 'border-b border-b-border mb-4' : ''}`}
                  >
                    <div className="flex-1 w-full">
                      {setting.description && (
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-medium">
                            {setting.description}
                          </label>
                          {badgeText && (
                            <Badge variant={badgeVariant} className={`text-xs ${badgeClassName}`}>
                              {badgeText}
                            </Badge>
                          )}
                        </div>
                      )}
                      <Input
                        type="number"
                        value={displayValue}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        onFocus={() => handleFocus(key)}
                        onBlur={() => handleBlur(key)}
                        placeholder="Введіть значення"
                        className="w-full"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 flex justify-center">
                <Button
                  onClick={handleSaveAllScoring}
                  disabled={!hasAnyChanges || savingAllScoring}
                  className="w-full sm:w-auto"
                >
                  {savingAllScoring ? "Збереження..." : "Зберегти всі зміни"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Інші налаштування */}
      {settingKeys
        .filter((key) => !key.startsWith("scoring_"))
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
                    type={key === "telegram_threshold" || key.startsWith("scoring_") ? "number" : "text"}
                    value={displayValue}
                    onChange={(e) => {
                      handleValueChange(key, e.target.value);
                    }}
                    onFocus={() => handleFocus(key)}
                    onBlur={() => handleBlur(key)}
                    placeholder="Введіть значення"
                    className="w-full"
                    step={key === "telegram_threshold" || key.startsWith("scoring_") ? "0.01" : undefined}
                    min={key === "telegram_threshold" || key.startsWith("scoring_") ? "0" : undefined}
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
