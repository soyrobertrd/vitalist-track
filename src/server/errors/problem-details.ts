/**
 * RFC 7807 - Problem Details for HTTP APIs
 * Standardized error response contract across all Vitalist Track endpoints.
 */

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly errors?: Record<string, string[]>;

  constructor(
    title: string,
    detail: string,
    status: number = 400,
    type: string = 'about:blank',
    errors?: Record<string, string[]>
  ) {
    super(detail);
    this.name = title;
    this.status = status;
    this.type = type;
    this.errors = errors;
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      type: this.type,
      title: this.name,
      status: this.status,
      detail: this.message,
      instance,
      errors: this.errors,
      timestamp: new Date().toISOString(),
    };
  }
}

export function createProblemResponse(
  error: unknown,
  instanceUrl?: string
): { status: number; body: ProblemDetails } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: error.toProblemDetails(instanceUrl),
    };
  }

  // Fallback for unexpected internal errors (never leak stack trace in production)
  const isDev = process.env.NODE_ENV === 'development';
  const detail = error instanceof Error ? error.message : 'An unexpected error occurred';

  return {
    status: 500,
    body: {
      type: 'https://vitalisttrack.com/errors/internal-server-error',
      title: 'Internal Server Error',
      status: 500,
      detail: isDev ? detail : 'Ocurrió un error inesperado en el servidor.',
      instance: instanceUrl,
      timestamp: new Date().toISOString(),
    },
  };
}
