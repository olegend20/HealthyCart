import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isUnauthorizedError(error: any): boolean {
  return error?.message?.includes('Unauthorized') || 
         error?.status === 401 || 
         error?.statusCode === 401;
}
