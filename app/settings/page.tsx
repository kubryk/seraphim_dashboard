import { Metadata } from "next";
import SettingsDashboard from "./SettingsDashboard";

export const metadata: Metadata = {
  title: "СЕРАФІМ - Налаштування",
  description: "Налаштування системи СЕРАФІМ",
};

const SettingsPage = async () => {
  return (
    <div className="min-h-screen bg-muted/20 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Налаштування системи
              </h1>
              <p className="text-muted-foreground text-sm">
                Управління налаштуваннями та параметрами системи
              </p>
            </div>
          </div>
        </div>

        <SettingsDashboard />
      </div>
    </div>
  );
};

export default SettingsPage;
