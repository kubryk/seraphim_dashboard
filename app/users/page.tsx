import { Metadata } from "next";
import UsersDashboard from "./UsersDashboard";

export const metadata: Metadata = {
  title: "СЕРАФІМ - Користувачі бота",
  description: "Управління користувачами Telegram бота",
};

const UsersPage = async () => {
  return (
    <div className="min-h-screen bg-muted/20 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Користувачі бота
              </h1>
              <p className="text-muted-foreground text-sm">
                Управління користувачами Telegram бота
              </p>
            </div>
          </div>
        </div>

        <UsersDashboard />
      </div>
    </div>
  );
};

export default UsersPage;
