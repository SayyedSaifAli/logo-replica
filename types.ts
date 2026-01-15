export interface ReferenceImage {
  id: string;
  name: string;
  width: number;
  height: number;
  type: string;
  originalFile: File;
  previewUrl: string;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  progress: number;
  completed: boolean;
  error?: string;
}
