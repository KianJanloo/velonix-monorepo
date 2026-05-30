/**
 * Web-specific types that extend or supplement @velonix/types.
 * These are UI concerns not needed by the API.
 */

/** Represents a file being uploaded with progress tracking. */
export interface UploadingFile {
  id: string;
  file: File;
  progress: number; // 0-100
  url: string | null;
  error: string | null;
  status: "pending" | "uploading" | "done" | "error";
}

/** Toast notification payload */
export interface ToastPayload {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "warning" | "info";
  duration?: number;
}

/** Navigation breadcrumb item */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Generic select option */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/** Studio canvas pointer position */
export interface CanvasPoint {
  x: number;
  y: number;
}

/** Studio component bounding box */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
