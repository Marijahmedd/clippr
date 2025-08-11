import { useEffect, useState, lazy, Suspense } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, VideoIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVideoStore } from '@/stores/videoStore';
import { VideoCard } from '@/components/VideoCard';
import UploadModal from '@/components/UploadModal';
import { TopNavigation } from '@/components/TopNavigation';
import { buildVideoUrl } from '@/lib/videoUtils';
import api from '@/lib/axios';

// Lazy load RecordModal to prevent mobile issues
const RecordModal = lazy(() => import('@/components/RecordModal'));

const Videos = () => {
  const {
    searchQuery,
    setSearchQuery,
    setRecordModalOpen,
    setUploadModalOpen,
  } = useVideoStore();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simple mobile detection
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
  }, []);

  // Fetch videos with search
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['videos', searchQuery],
    queryFn: async () => {
      const response = await api.get('/video', {
        params: {
          search: searchQuery,
        },
      });
      // Transform videos: backend 'url' field contains S3 key, build CloudFront URLs
      const videosWithUrls = response.data.videos.map((video: any) => ({
        ...video,
        key: video.url,
        url: buildVideoUrl(video.url),
      }));
      return {
        videos: videosWithUrls,
      };
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-8 gap-4">
          {/* Search Bar - Left */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 glass-card border-border/30 bg-transparent"
            />
          </div>
          {/* Action Buttons - Right */}
          <div className="flex items-center gap-3">
            {!isMobile && (
              <Button
                onClick={() => setRecordModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <VideoIcon className="w-4 h-4 mr-2" />
                Record
              </Button>
            )}
            <Button
              onClick={() => setUploadModalOpen(true)}
              variant="secondary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Videos Grid */}
        {isLoading || isFetching ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card h-48 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : data?.videos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <VideoIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No videos found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No videos match "${searchQuery}"`
                : "Start creating amazing content"}
            </p>
            <div className="flex justify-center gap-3">
            </div>
          </div>
        )}
      </div>

      {!isMobile && (
        <Suspense fallback={null}>
          <RecordModal />
        </Suspense>
      )}
      <UploadModal />
    </div>
  );
};

export default Videos;