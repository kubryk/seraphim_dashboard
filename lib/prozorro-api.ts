type ProzorroContract = {
  id: string;
  contractID: string;
  dateSigned: string;
  status: string;
  buyer?: {
    name?: string;
    identifier?: {
      id?: string;
    };
  };
  suppliers?: Array<{
    name?: string;
    identifier?: {
      legalName?: string;
      id?: string;
    };
  }>;
  value?: {
    amount: number;
    currency: string;
    valueAddedTaxIncluded: boolean;
    amountNet: number;
  };
};

type ProzorroResponse = {
  data: ProzorroContract[];
  total: number;
  page: number;
  per_page: number;
};

const PROZORRO_API_BASE = "https://prozorro.gov.ua/api/search/contracts";

// Затримка між запитами (в мілісекундах)
const DELAY_BETWEEN_REQUESTS = 500; // 0.5 секунди

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const fetchContractsByEdrpou = async (
  edrpouCodes: string | string[],
  startDate: string,
  endDate: string,
  page: number = 1,
  establishmentId?: number,
  logRequest?: (logData: {
    establishmentId?: number;
    edrpouCode: string;
    url: string;
    method: string;
    startDate: string;
    endDate: string;
    page: number;
    statusCode?: number;
    success: boolean;
    contractsCount?: number;
    totalPages?: number;
    totalContracts?: number;
    errorMessage?: string;
    errorDetails?: Record<string, unknown>;
    responseTime: number;
  }) => Promise<void>
): Promise<ProzorroResponse | null> => {
  const startTime = Date.now();
  const codes = Array.isArray(edrpouCodes) ? edrpouCodes : [edrpouCodes];
  const edrpouCode = codes[0]; // для логування беремо перший
  
  try {
    const params = new URLSearchParams();
    
    // Додаємо всі buyer коди як індексований масив buyer[0], buyer[1], buyer[2]...
    codes.forEach((code, index) => {
      params.append(`buyer[${index}]`, code);
    });
    
    params.append('date[dateSigned][start]', startDate);
    params.append('date[dateSigned][end]', endDate);
    params.append('page', page.toString());

    const url = `${PROZORRO_API_BASE}?${params.toString()}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const codesStr = Array.isArray(edrpouCodes) ? edrpouCodes.join(', ') : edrpouCodes;
      console.error(`Failed to fetch contracts for EDRPOU ${codesStr}:`, response.statusText, errorData);
      
      // Логування помилки
      if (logRequest) {
        await logRequest({
          establishmentId: establishmentId,
          edrpouCode: edrpouCode,
          url: url,
          method: "POST",
          startDate: startDate,
          endDate: endDate,
          page: page,
          statusCode: response.status,
          success: false,
          errorMessage: errorData.message || response.statusText,
          errorDetails: errorData,
          responseTime: responseTime,
        });
      }
      
      return null;
    }

    const data = await response.json();
    
    // Логування успішного запиту
    if (logRequest) {
      await logRequest({
        establishmentId: establishmentId,
        edrpouCode: edrpouCode,
        url: url,
        method: "POST",
        startDate: startDate,
        endDate: endDate,
        page: page,
        statusCode: response.status,
        success: true,
        contractsCount: data.data?.length || 0,
        totalPages: Math.ceil((data.total || 0) / (data.per_page || 20)),
        totalContracts: data.total || 0,
        responseTime: responseTime,
      });
    }

    return data;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const codesStr = Array.isArray(edrpouCodes) ? edrpouCodes.join(', ') : edrpouCodes;
    console.error(`Error fetching contracts for EDRPOU ${codesStr}:`, error);
    
    // Логування винятку
    if (logRequest) {
      await logRequest({
        establishmentId: establishmentId,
        edrpouCode: edrpouCode,
        url: `${PROZORRO_API_BASE}?...`,
        method: "POST",
        startDate: startDate,
        endDate: endDate,
        page: page,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        responseTime: responseTime,
      });
    }
    
    return null;
  }
};

export const fetchAllContractsByEdrpou = async (
  edrpouCodes: string | string[],
  startDate: string,
  endDate: string,
  establishmentId?: number,
  logRequest?: (logData: {
    establishmentId?: number;
    edrpouCode: string;
    url: string;
    method: string;
    startDate: string;
    endDate: string;
    page: number;
    statusCode?: number;
    success: boolean;
    contractsCount?: number;
    totalPages?: number;
    totalContracts?: number;
    errorMessage?: string;
    errorDetails?: Record<string, unknown>;
    responseTime: number;
  }) => Promise<void>
): Promise<ProzorroContract[]> => {
  const allContracts: ProzorroContract[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchContractsByEdrpou(edrpouCodes, startDate, endDate, page, establishmentId, logRequest);
    
    if (!response || !response.data || response.data.length === 0) {
      hasMore = false;
      break;
    }

    allContracts.push(...response.data);

    // Перевіряємо, чи є ще сторінки
    const perPage = response.per_page || 20;
    const totalPages = Math.ceil((response.total || 0) / perPage);
    if (page >= totalPages || response.data.length < perPage) {
      hasMore = false;
    } else {
      page++;
      // Затримка перед наступним запитом
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }

  return allContracts;
};
