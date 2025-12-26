
import React from 'react';
import { VideoMetadata, VideoStatus, SensitivityStatus } from '../types';
import { Play, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';

interface VideoCardProps {
  video: VideoMetadata;
  onPlay: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay, onDelete, canDelete }) => {
  const getStatusBadge = () => {
    switch (video.status) {
      case VideoStatus.UPLOADING:
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>Uploading {video.progress}%</span>
          </span>
        );
      case VideoStatus.PROCESSING:
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Processing {video.progress}%</span>
          </span>
        );
      case VideoStatus.COMPLETED:
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>Ready</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getSensitivityBadge = () => {
    if (video.status !== VideoStatus.COMPLETED) return null;
    
    switch (video.sensitivity) {
      case SensitivityStatus.SAFE:
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>Safe</span>
          </span>
        );
      case SensitivityStatus.FLAGGED:
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full">
            <AlertTriangle className="w-3 h-3" />
            <span>Flagged</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
            <span>Pending Analysis</span>
          </span>
        );
    }
  };

  const isReady = video.status === VideoStatus.COMPLETED;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-video">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className={`w-full h-full object-cover ${!isReady ? 'filter grayscale blur-sm opacity-50' : ''}`} 
        />
        
        {isReady && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={() => onPlay(video.id)}
              className="bg-white p-4 rounded-full text-indigo-600 hover:scale-110 transition-transform shadow-lg"
            >
              <Play className="w-6 h-6 fill-current" />
            </button>
          </div>
        )}

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full bg-white/20 backdrop-blur-md rounded-full h-2">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${video.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex space-x-2">
            {getStatusBadge()}
            {getSensitivityBadge()}
          </div>
          {canDelete && (
            <button 
              onClick={() => onDelete?.(video.id)}
              className="text-gray-400 hover:text-red-500 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <h3 className="font-bold text-gray-900 truncate mb-1">{video.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{video.description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
              {video.uploadedBy.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-600">Added {new Date(video.createdAt).toLocaleDateString()}</span>
          </div>
          <span className="text-xs font-medium text-gray-400">
            {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
