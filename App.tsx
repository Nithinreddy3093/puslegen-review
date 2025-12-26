
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, 
  UserRole, 
  VideoMetadata, 
  VideoStatus, 
  SensitivityStatus,
  AuthState
} from './types';
import { MOCK_USERS, STORAGE_KEYS } from './constants';
import { videoService } from './services/videoService';
import Layout from './components/Layout';
import VideoCard from './components/VideoCard';
import { 
  Video, 
  Shield, 
  Users, 
  ArrowRight, 
  AlertCircle, 
  Plus,
  ArrowLeft,
  Loader2,
  Upload,
  SearchX
} from 'lucide-react';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Authentication Logic
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (savedUser) {
      setAuthState({
        user: JSON.parse(savedUser),
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = (user: User) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setPlayingVideoId(null);
    setSearchQuery('');
  };

  // Video Management Logic
  const fetchVideos = useCallback(() => {
    if (authState.user) {
      setVideos(videoService.getVideos(authState.user));
    }
  }, [authState.user]);

  useEffect(() => {
    fetchVideos();
    const unsubscribe = videoService.subscribe(() => {
      fetchVideos();
    });
    return unsubscribe;
  }, [fetchVideos]);

  // Derived filtered videos
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const query = searchQuery.toLowerCase();
    return videos.filter(v => 
      v.title.toLowerCase().includes(query) || 
      v.description.toLowerCase().includes(query) ||
      v.status.toLowerCase().includes(query) ||
      v.sensitivity.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authState.user) return;

    const formData = new FormData(e.currentTarget);
    const file = formData.get('videoFile') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file || !title) return;

    setIsUploading(true);
    try {
      await videoService.uploadVideo(file, title, description, authState.user);
      setActiveTab('dashboard');
      setSearchQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayVideo = async (id: string) => {
    const url = await videoService.getVideoUrl(id);
    if (url) {
      setVideoUrl(url);
      setPlayingVideoId(id);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    await videoService.deleteVideo(id);
    fetchVideos();
  };

  if (authState.isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  // Login View
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl mb-4 shadow-xl shadow-indigo-500/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">VisiGuard AI</h1>
            <p className="text-slate-400 font-medium">Enterprise Video Sensitivity Platform</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Select a Role to Demo</h2>
            <div className="space-y-4">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => login(u)}
                  className="group w-full flex items-center p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-xl object-cover mr-4" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{u.role}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center space-x-3 text-slate-500 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>Demo accounts use simulated organizational contexts and roles.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard / Upload Content Logic
  const renderContent = () => {
    if (playingVideoId) {
      const v = videos.find(v => v.id === playingVideoId);
      return (
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => {
              setPlayingVideoId(null);
              if (videoUrl) URL.revokeObjectURL(videoUrl);
              setVideoUrl(null);
            }}
            className="flex items-center space-x-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Library</span>
          </button>
          
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video relative group">
            {videoUrl ? (
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-50" />
                <p>Loading Video Stream...</p>
              </div>
            )}
          </div>

          <div className="mt-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{v?.title}</h1>
                <p className="text-gray-500 font-medium">{v?.description}</p>
              </div>
              <div className="flex space-x-2">
                {v?.sensitivity === SensitivityStatus.SAFE ? (
                   <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs uppercase tracking-widest flex items-center">
                     <Shield className="w-3 h-3 mr-2" /> Verified Safe
                   </span>
                ) : (
                  <span className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full font-bold text-xs uppercase tracking-widest flex items-center">
                    <AlertCircle className="w-3 h-3 mr-2" /> Flagged Content
                  </span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-50">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">File Name</p>
                <p className="text-sm font-bold text-slate-800 truncate">{v?.fileName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Uploaded On</p>
                <p className="text-sm font-bold text-slate-800">{v ? new Date(v.createdAt).toLocaleDateString() : '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Size</p>
                <p className="text-sm font-bold text-slate-800">{v ? (v.fileSize / (1024*1024)).toFixed(1) : '-'} MB</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'upload') {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-indigo-600 p-8 text-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">New Video Asset</h2>
                  <p className="text-indigo-100 text-sm font-medium">Upload content for AI sensitivity screening</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleUpload} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Video File</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    name="videoFile" 
                    accept="video/*" 
                    required 
                    className="hidden" 
                    id="video-upload"
                  />
                  <label 
                    htmlFor="video-upload" 
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group-hover:scale-[1.01]"
                  >
                    <div className="p-4 bg-gray-50 rounded-full mb-4 text-gray-400 group-hover:text-indigo-500 group-hover:bg-white transition-all">
                      <Plus className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 mb-1">Click to select video</span>
                    <span className="text-xs text-gray-500 font-medium">MP4, WebM or OGG up to 500MB</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    placeholder="e.g. Q4 Internal Growth Presentation"
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-slate-900 font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Description</label>
                  <textarea 
                    name="description" 
                    rows={4} 
                    placeholder="Briefly explain the video content for sensitivity analysis context..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-slate-900 font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold transition-all shadow-xl ${
                    isUploading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20 active:scale-95'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading to Secure Storage...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Start Content Screening</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    if (activeTab === 'admin') {
      return (
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="bg-indigo-50 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Organizational Controls</h2>
          <p className="text-gray-500 font-medium max-w-lg mx-auto mb-8">
            Manage user permissions, review system sensitivity logs, and configure organization-wide content thresholds.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left">
              <h3 className="font-bold text-lg mb-2 text-slate-800">User Directory</h3>
              <p className="text-sm text-gray-400 font-medium mb-4">Currently 3 active seats in {authState.user?.orgId.toUpperCase()}</p>
              <button className="text-indigo-600 font-bold text-sm hover:underline">Manage Team &rarr;</button>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left">
              <h3 className="font-bold text-lg mb-2 text-slate-800">Audit Logs</h3>
              <p className="text-sm text-gray-400 font-medium mb-4">Last sensitivity flag detected 48h ago</p>
              <button className="text-indigo-600 font-bold text-sm hover:underline">View System History &rarr;</button>
            </div>
          </div>
        </div>
      );
    }

    // Default Dashboard
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
            <p className="text-gray-500 mt-1 font-medium">Manage and monitor organization-wide content.</p>
          </div>
          <div className="flex space-x-3">
            {authState.user?.role !== UserRole.VIEWER && (
              <button 
                onClick={() => setActiveTab('upload')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Upload New
              </button>
            )}
          </div>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            {searchQuery ? (
               <>
                 <SearchX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-gray-900">No results found for "{searchQuery}"</h3>
                 <p className="text-gray-400 mt-2 font-medium">Try a different keyword or filter.</p>
               </>
            ) : (
              <>
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">No videos found</h3>
                <p className="text-gray-400 mt-2 font-medium">Start by uploading your first content for analysis.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map(video => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onPlay={handlePlayVideo}
                onDelete={handleDeleteVideo}
                canDelete={authState.user?.role === UserRole.ADMIN || (authState.user?.role === UserRole.EDITOR && video.uploadedBy === authState.user.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout 
      user={authState.user!} 
      onLogout={logout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
