export interface UploadedFileMetadata {
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface FileUploadProgress {
  percentage: number;
  loadedBytes: number;
  totalBytes: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}
