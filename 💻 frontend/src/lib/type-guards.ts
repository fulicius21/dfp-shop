/**
 * TypeScript Type Guards für bessere Type Safety
 * 
 * Diese Datei enthält Type Guards, die zur Laufzeit prüfen,
 * ob ein unbekannter Wert einem bestimmten Typ entspricht.
 */

// Error Type Guard
export interface ErrorWithMessage {
  message: string;
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // Fallback für Fälle, wo JSON.stringify fehlschlägt
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

// Array Type Guards
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
}

// Option Type für Select-Komponenten
export interface SelectOption {
  label: string;
  value: string;
}

export function isSelectOption(value: unknown): value is SelectOption {
  return (
    typeof value === 'object' &&
    value !== null &&
    'label' in value &&
    'value' in value &&
    typeof (value as Record<string, unknown>).label === 'string' &&
    typeof (value as Record<string, unknown>).value === 'string'
  );
}

export function isSelectOptionArray(value: unknown): value is SelectOption[] {
  return Array.isArray(value) && value.every(isSelectOption);
}

export function toSelectOption(value: unknown): SelectOption {
  if (isSelectOption(value)) return value;
  
  // Fallback für primitive Werte
  if (typeof value === 'string') {
    return { label: value, value: value };
  }
  
  if (typeof value === 'number') {
    return { label: String(value), value: String(value) };
  }
  
  // Fallback für Objekte mit toString
  const stringValue = String(value);
  return { label: stringValue, value: stringValue };
}

export function toSelectOptionArray(value: unknown): SelectOption[] {
  if (isSelectOptionArray(value)) return value;
  
  if (Array.isArray(value)) {
    return value.map(toSelectOption);
  }
  
  return [];
}

// Utility Types für bessere API Responses
export interface ApiError {
  message: string;
  code?: string | number;
  details?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  
  return {
    message: getErrorMessage(error),
    details: error
  };
}
