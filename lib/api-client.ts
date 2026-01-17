// Helper для API запитів з автоматичним додаванням API ключа
// Для клієнтського коду використовуємо NEXT_PUBLIC_API_KEY
// Для серверного коду (server actions) використовуємо API_KEY

const getApiKey = (): string => {
  // На клієнті використовуємо NEXT_PUBLIC_API_KEY (доступний під час збірки)
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_KEY || '';
  }
  // На сервері використовуємо API_KEY (не публічний)
  return process.env.API_KEY || '';
};

export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const apiKey = getApiKey();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Додаємо існуючі заголовки
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  
  // Додаємо API ключ тільки якщо він встановлений
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};
