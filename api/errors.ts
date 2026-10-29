export interface ApiErrorInfo {
  /** Text that is safe to show to the user. */
  message: string;
  /** Request field the error refers to (e.g. "email"), when the server says so. */
  field?: string;
  /** True when the request never got an answer (offline, DNS, timeout, server down). */
  isNetworkError: boolean;
}

const NETWORK_MESSAGE = "Can't reach the server. Check your internet connection and try again.";
const TIMEOUT_MESSAGE = "The server took too long to respond. Please try again.";
const SERVER_MESSAGE = "Something went wrong on our side. Please try again in a moment.";

/**
 * Turns anything thrown by an API call into a user-facing message.
 * The backend returns { errorCode, reason, message, field? }; `message` is written for end users.
 */
export const getApiError = (error: any, fallback = "Something went wrong. Please try again."): ApiErrorInfo => {
  const response = error?.response;

  if (!response) {
    if (error?.code === "ECONNABORTED") {
      return { message: TIMEOUT_MESSAGE, isNetworkError: true };
    }
    if (error?.request || error?.message === "Network Error") {
      return { message: NETWORK_MESSAGE, isNetworkError: true };
    }
    // A plain Error thrown by our own code.
    return { message: error?.message || fallback, isNetworkError: false };
  }

  const data = response.data;
  const serverMessage = typeof data?.message === "string" ? data.message : undefined;
  const field = typeof data?.field === "string" ? data.field : undefined;

  if (response.status >= 500 && !serverMessage) {
    return { message: SERVER_MESSAGE, field, isNetworkError: false };
  }
  if (response.status === 429) {
    return { message: serverMessage || "Too many requests. Please wait a moment and try again.", field, isNetworkError: false };
  }

  return { message: serverMessage || fallback, field, isNetworkError: false };
};

export const getErrorMessage = (error: any, fallback?: string): string => getApiError(error, fallback).message;
