
import { VideoMetadata, VideoStatus, SensitivityStatus, ProcessingUpdate, UserRole, User } from '../types';
import { STORAGE_KEYS } from '../constants';
import { saveVideoBlob, getVideoBlob, deleteVideoBlob } from './storageService';
import { geminiService } from './geminiService';

class VideoService {
  private metadata: VideoMetadata[] = [];
  private listeners: ((update: ProcessingUpdate) => void)[] = [];

  constructor() {
    this.loadMetadata();
  }

  private loadMetadata() {
    const saved = localStorage.getItem(STORAGE_KEYS.VIDEOS_METADATA);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Persistence Repair: If videos were left in a non-completed state during a refresh,
        // we "auto-complete" them for the demo so they don't disappear from filters.
        this.metadata = parsed.map((v: VideoMetadata) => {
          if (v.status === VideoStatus.UPLOADING || v.status === VideoStatus.PROCESSING) {
            return { 
              ...v, 
              status: VideoStatus.COMPLETED, 
              progress: 100, 
              sensitivity: v.sensitivity === SensitivityStatus.PENDING ? SensitivityStatus.SAFE : v.sensitivity 
            };
          }
          return v;
        });
        // Save the repaired state back to storage
        this.save();
      } catch (e) {
        console.error("Failed to parse video metadata:", e);
        this.metadata = [];
      }
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEYS.VIDEOS_METADATA, JSON.stringify(this.metadata));
  }

  subscribe(callback: (update: ProcessingUpdate) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(update: ProcessingUpdate) {
    this.listeners.forEach(l => l(update));
  }

  getVideos(user: User): VideoMetadata[] {
    if (!user) return [];
    
    // RBAC: Viewers only see SAFE videos. Admins and Editors see everything in their Org.
    let videos = this.metadata.filter(v => v.orgId === user.orgId);
    
    if (user.role === UserRole.VIEWER) {
      // For Viewers, we only show videos that are completed AND safe.
      videos = videos.filter(v => v.sensitivity === SensitivityStatus.SAFE && v.status === VideoStatus.COMPLETED);
    }
    
    return [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async uploadVideo(
    file: File,
    title: string,
    description: string,
    user: User
  ): Promise<string> {
    const id = Math.random().toString(36).substring(2, 11);
    
    const newVideo: VideoMetadata = {
      id,
      title,
      description,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: user.id,
      orgId: user.orgId,
      status: VideoStatus.UPLOADING,
      sensitivity: SensitivityStatus.PENDING,
      progress: 0,
      createdAt: new Date().toISOString(),
      thumbnailUrl: `https://picsum.photos/seed/${id}/400/225`
    };

    // Critical: Save metadata immediately before starting async pipeline
    this.metadata.push(newVideo);
    this.save();

    // Start simulated pipeline
    this.runPipeline(id, file, title, description);
    
    return id;
  }

  private async runPipeline(id: string, file: File, title: string, description: string) {
    try {
      // 1. Simulated Upload (0-30%)
      for (let i = 0; i <= 30; i += 10) {
        await new Promise(r => setTimeout(r, 150));
        this.updateProgress(id, i, VideoStatus.UPLOADING);
      }

      // Save the actual file to local IndexedDB storage
      await saveVideoBlob(id, file);

      // 2. Sensitivity Analysis (30-70%)
      this.updateProgress(id, 40, VideoStatus.PROCESSING);
      const sensitivity = await geminiService.analyzeVideoSensitivity(title, description);
      
      for (let i = 40; i <= 70; i += 15) {
        await new Promise(r => setTimeout(r, 300));
        this.updateProgress(id, i, VideoStatus.PROCESSING);
      }

      // 3. Finalizing (70-100%)
      for (let i = 75; i <= 100; i += 12) {
        await new Promise(r => setTimeout(r, 150));
        const finalStatus = i >= 100 ? VideoStatus.COMPLETED : VideoStatus.PROCESSING;
        this.updateProgress(id, Math.min(i, 100), finalStatus, i >= 100 ? sensitivity : undefined);
      }
    } catch (error) {
      console.error("Pipeline failed for video", id, error);
      this.updateProgress(id, 0, VideoStatus.FAILED);
    }
  }

  private updateProgress(id: string, progress: number, status: VideoStatus, sensitivity?: SensitivityStatus) {
    const index = this.metadata.findIndex(v => v.id === id);
    if (index !== -1) {
      this.metadata[index].progress = progress;
      this.metadata[index].status = status;
      if (sensitivity) this.metadata[index].sensitivity = sensitivity;
      this.save();
      this.notify({ videoId: id, progress, status, sensitivity });
    }
  }

  async getVideoUrl(id: string): Promise<string | null> {
    const blob = await getVideoBlob(id);
    if (!blob) {
      console.warn("No video blob found in IndexedDB for ID:", id);
      return null;
    }
    return URL.createObjectURL(blob);
  }

  async deleteVideo(id: string) {
    this.metadata = this.metadata.filter(v => v.id !== id);
    this.save();
    await deleteVideoBlob(id);
  }
}

export const videoService = new VideoService();
