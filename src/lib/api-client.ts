import { toast } from 'sonner';

/**
 * VITALIST TRACK CLIENT API ADAPTER
 * Type-safe HTTP client targeting Vercel Serverless / Turso backend.
 * Automatically injects active clinic tenant headers and parses RFC 7807 problem details.
 */

export interface ApiProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string[]>;
}

export class ApiException extends Error {
  public readonly status: number;
  public readonly problem: ApiProblemDetails;

  constructor(problem: ApiProblemDetails) {
    super(problem.detail || problem.title);
    this.name = 'ApiException';
    this.status = problem.status;
    this.problem = problem;
  }
}

interface RequestOptions extends RequestInit {
  clinicId?: string;
  idempotencyKey?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

// Active clinic session getter (read from localStorage / session state)
function getActiveClinicId(): string | null {
  try {
    return localStorage.getItem('vt_active_clinic_id');
  } catch {
    return null;
  }
}

export function setActiveClinicId(clinicId: string) {
  try {
    localStorage.setItem('vt_active_clinic_id', clinicId);
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { clinicId, idempotencyKey, params, headers, ...customConfig } = options;

  let url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        query.set(key, String(value));
      }
    }
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const activeClinic = clinicId || getActiveClinicId();

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(activeClinic ? { 'x-clinic-id': activeClinic } : {}),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...(headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...customConfig,
    headers: reqHeaders,
  });

  if (!response.ok) {
    let problem: ApiProblemDetails;
    try {
      problem = await response.json();
    } catch {
      problem = {
        type: 'about:blank',
        title: response.statusText,
        status: response.status,
        detail: `Error de servidor HTTP ${response.status}`,
      };
    }

    // Friendly notifications for common error codes
    if (response.status === 401) {
      toast.error('Sesión expirada o no autorizada. Inicia sesión nuevamente.');
    } else if (response.status === 403) {
      toast.error('No tienes permisos suficientes para realizar esta acción.');
    } else if (response.status >= 500) {
      toast.error('Error temporal en el servicio. Intenta de nuevo más tarde.');
    }

    throw new ApiException(problem);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export interface PatientDto {
  id: string;
  branchId?: string | null;
  firstName: string;
  lastName: string;
  docType: 'cedula' | 'passport' | 'other';
  docNumber: string;
  birthDate?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  notes?: string | null;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type PatientCreateInput = Omit<PatientDto, 'id' | 'createdAt' | 'updatedAt'>;
export type PatientUpdateInput = Partial<PatientCreateInput>;

export interface AppointmentDto {
  id: string;
  branchId: string;
  patientId: string;
  professionalId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentCreateInput = Omit<AppointmentDto, 'id' | 'createdAt' | 'updatedAt'>;

export interface InvoiceDto {
  id: string;
  branchId: string;
  patientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'insurance' | 'other' | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceCreateInput = Omit<InvoiceDto, 'id' | 'createdAt' | 'updatedAt'>;

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: 'DELETE' }),

  // Sub-namespaces for domain resources
  patients: {
    list: (params?: { branchId?: string; search?: string; page?: number; limit?: number }) =>
      apiClient.get<{ data: PatientDto[]; total: number }>('/patients', { params }),
    getById: (id: string) => apiClient.get<PatientDto>(`/patients/${id}`),
    create: (data: PatientCreateInput) => apiClient.post<PatientDto>('/patients', data),
    update: (id: string, data: PatientUpdateInput) => apiClient.put<PatientDto>(`/patients/${id}`, data),
    delete: (id: string) => apiClient.delete<void>(`/patients/${id}`),
  },

  appointments: {
    list: (params?: { branchId?: string; startDate?: string; endDate?: string; professionalId?: string }) =>
      apiClient.get<AppointmentDto[]>('/appointments', { params }),
    create: (data: AppointmentCreateInput) => apiClient.post<AppointmentDto>('/appointments', data),
    updateStatus: (id: string, status: AppointmentDto['status'], reason?: string) =>
      apiClient.put<AppointmentDto>(`/appointments/${id}/status`, { status, cancellationReason: reason }),
  },

  invoices: {
    list: (params?: { branchId?: string; status?: string }) => apiClient.get<InvoiceDto[]>('/invoices', { params }),
    create: (data: InvoiceCreateInput, idempotencyKey?: string) =>
      apiClient.post<InvoiceDto>('/invoices', data, { idempotencyKey }),
  },
};

