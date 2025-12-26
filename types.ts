
export enum UserRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin'
}

export enum VideoStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum SensitivityStatus {
  PENDING = 'pending',
  SAFE = 'safe',
  FLAGGED = 'flagged'
}

export interface User {
  id: string;
  name: string;
  email: string;
  orgId: string;
  role: UserRole;
  avatar: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string; // userId
  orgId: string;
  status: VideoStatus;
  sensitivity: SensitivityStatus;
  progress: number;
  duration?: number;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ProcessingUpdate {
  videoId: string;
  progress: number;
  status: VideoStatus;
  sensitivity?: SensitivityStatus;
}
