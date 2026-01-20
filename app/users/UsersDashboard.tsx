"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/api-client";

type User = {
  id: number;
  telegramId: number;
  username: string | null;
  role: string;
  isActive: boolean;
  lastInteraction: string | null;
  createdAt: string;
};

const UsersDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Форма додавання/редагування
  const [formData, setFormData] = useState({
    telegramId: "",
    username: "",
    role: "user",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Debounce для пошуку
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setSearchLoading(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (roleFilter) params.append("role", roleFilter);
      if (activeFilter) params.append("isActive", activeFilter);

      const response = await apiRequest(`/api/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, [debouncedSearch, roleFilter, activeFilter]);

  // Перший завантаження
  useEffect(() => {
    fetchUsers(true);
  }, []);

  // Оновлення при зміні фільтрів
  useEffect(() => {
    if (!loading) {
      fetchUsers(false);
    }
  }, [debouncedSearch, roleFilter, activeFilter]);

  const handleAddUser = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify({
          telegramId: formData.telegramId,
          username: formData.username || null,
          role: formData.role,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Користувача успішно додано");
        setIsAddDialogOpen(false);
        setFormData({ telegramId: "", username: "", role: "user", isActive: true });
        await fetchUsers(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to add user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    setSaving(true);
    setError(null);
    try {
      const response = await apiRequest("/api/users", {
        method: "PUT",
        body: JSON.stringify({
          id: editingUser.id,
          username: formData.username || null,
          role: formData.role,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingUser(null);
        setFormData({ telegramId: "", username: "", role: "user", isActive: true });
        await fetchUsers(false);
      } else {
        setError(data.error || "Failed to update user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleting(true);
    setError(null);
    try {
      const response = await apiRequest(`/api/users?id=${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to delete user";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || `Server error: ${response.status}`;
        }
        setError(errorMessage);
        return;
      }

      const text = await response.text();
      if (!text) {
        setError("Empty response from server");
        return;
      }

      const data = JSON.parse(text);

      if (data.success) {
        setSuccessMessage("Користувача успішно видалено");
        setDeletingUser(null);
        await fetchUsers(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      telegramId: user.telegramId.toString(),
      username: user.username || "",
      role: user.role,
      isActive: user.isActive,
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("uk-UA");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "moderator":
        return "secondary";
      default:
        return "default";
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження користувачів...</div>
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

      {/* Фільтри та додавання */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium mb-2 block">Пошук</label>
              <Input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук за username або Telegram ID"
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Роль</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Всі ролі</option>
                <option value="user">Користувач</option>
                <option value="admin">Адміністратор</option>
                <option value="moderator">Модератор</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium mb-2 block">Статус</label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Всі</option>
                <option value="true">Активні</option>
                <option value="false">Неактивні</option>
              </select>
            </div>
            <Dialog 
              open={isAddDialogOpen} 
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setFormData({ telegramId: "", username: "", role: "user", isActive: true });
                  setError(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>Додати користувача</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Додати нового користувача</DialogTitle>
                  <DialogDescription>
                    Введіть дані користувача для додавання в систему
                  </DialogDescription>
                </DialogHeader>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Telegram ID *</label>
                    <Input
                      type="number"
                      value={formData.telegramId}
                      onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
                      placeholder="123456789"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Username</label>
                    <Input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Роль</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="user">Користувач</option>
                      <option value="admin">Адміністратор</option>
                      <option value="moderator">Модератор</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">
                      Активний
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setFormData({ telegramId: "", username: "", role: "user", isActive: true });
                      }}
                    >
                      Скасувати
                    </Button>
                    <Button onClick={handleAddUser} disabled={saving || !formData.telegramId}>
                      {saving ? "Збереження..." : "Додати"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Список користувачів */}
      <Card>
        <CardHeader>
          <CardTitle>Список користувачів</CardTitle>
          <CardDescription>
            Всього користувачів: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Користувачів не знайдено
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Telegram ID</th>
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Роль</th>
                      <th className="text-left p-2">Статус</th>
                      <th className="text-left p-2">Остання взаємодія</th>
                      <th className="text-left p-2">Дата створення</th>
                      <th className="text-right p-2">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">{user.id}</td>
                        <td className="p-2 font-mono text-xs">{user.telegramId}</td>
                        <td className="p-2">{user.username || "—"}</td>
                        <td className="p-2">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Активний" : "Неактивний"}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs">{formatDate(user.lastInteraction)}</td>
                        <td className="p-2 text-xs">{formatDate(user.createdAt)}</td>
                        <td className="text-right p-2">
                          <div className="flex items-center justify-end gap-2">
                          <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                Редагувати
                              </Button>
                            </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Редагувати користувача</DialogTitle>
                              <DialogDescription>
                                Оновіть дані користувача
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Telegram ID</label>
                                <Input
                                  type="text"
                                  value={formData.telegramId}
                                  disabled
                                  className="bg-muted"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Username</label>
                                <Input
                                  type="text"
                                  value={formData.username}
                                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                  placeholder="@username"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Роль</label>
                                <select
                                  value={formData.role}
                                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                  <option value="user">Користувач</option>
                                  <option value="admin">Адміністратор</option>
                                  <option value="moderator">Модератор</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="editIsActive"
                                  checked={formData.isActive}
                                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                  className="rounded"
                                />
                                <label htmlFor="editIsActive" className="text-sm font-medium">
                                  Активний
                                </label>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingUser(null);
                                    setFormData({ telegramId: "", username: "", role: "user", isActive: true });
                                  }}
                                >
                                  Скасувати
                                </Button>
                                <Button onClick={handleEditUser} disabled={saving}>
                                  {saving ? "Збереження..." : "Зберегти"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={deletingUser?.id === user.id} onOpenChange={(open) => !open && setDeletingUser(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeletingUser(user)}
                            >
                              Видалити
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Видалити користувача</DialogTitle>
                              <DialogDescription>
                                Ви впевнені, що хочете видалити користувача {user.username || `ID: ${user.telegramId}`}? Цю дію неможливо скасувати.
                              </DialogDescription>
                            </DialogHeader>
                            {error && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm">
                                {error}
                              </div>
                            )}
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setDeletingUser(null)}
                                disabled={deleting}
                              >
                                Скасувати
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteUser}
                                disabled={deleting}
                              >
                                {deleting ? "Видалення..." : "Видалити"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-mono text-xs text-muted-foreground mb-1">ID: {user.id}</div>
                          <div className="font-semibold">{user.username || `@${user.telegramId}`}</div>
                          <div className="font-mono text-xs text-muted-foreground mt-1">
                            Telegram ID: {user.telegramId}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {user.role}
                          </Badge>
                          <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                            {user.isActive ? "Активний" : "Неактивний"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Остання взаємодія</div>
                          <div className="text-xs">{formatDate(user.lastInteraction)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Дата створення</div>
                          <div className="text-xs">{formatDate(user.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openEditDialog(user)}
                            >
                              Редагувати
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw] sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Редагувати користувача</DialogTitle>
                              <DialogDescription>
                                Оновіть дані користувача
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Telegram ID</label>
                                <Input
                                  type="text"
                                  value={formData.telegramId}
                                  disabled
                                  className="bg-muted"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Username</label>
                                <Input
                                  type="text"
                                  value={formData.username}
                                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                  placeholder="@username"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Роль</label>
                                <select
                                  value={formData.role}
                                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                  <option value="user">Користувач</option>
                                  <option value="admin">Адміністратор</option>
                                  <option value="moderator">Модератор</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`edit-active-${user.id}`}
                                  checked={formData.isActive}
                                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`edit-active-${user.id}`} className="text-sm">
                                  Активний
                                </label>
                              </div>
                              {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm">
                                  {error}
                                </div>
                              )}
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setEditingUser(null);
                                    setFormData({ telegramId: "", username: "", role: "user", isActive: true });
                                  }}
                                >
                                  Скасувати
                                </Button>
                                <Button onClick={handleEditUser} disabled={saving}>
                                  {saving ? "Збереження..." : "Зберегти"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={deletingUser?.id === user.id} onOpenChange={(open) => !open && setDeletingUser(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => setDeletingUser(user)}
                            >
                              Видалити
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw] sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Видалити користувача</DialogTitle>
                              <DialogDescription>
                                Ви впевнені, що хочете видалити користувача {user.username || `ID: ${user.telegramId}`}? Цю дію неможливо скасувати.
                              </DialogDescription>
                            </DialogHeader>
                            {error && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm">
                                {error}
                              </div>
                            )}
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setDeletingUser(null)}
                                disabled={deleting}
                              >
                                Скасувати
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteUser}
                                disabled={deleting}
                              >
                                {deleting ? "Видалення..." : "Видалити"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersDashboard;
