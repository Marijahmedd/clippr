import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Share2, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { buildVideoUrl } from '@/lib/videoUtils';
import { useVideoStore } from '@/stores/videoStore';
import { TopNavigation } from '@/components/TopNavigation';
import api from '@/lib/axios';

const VideoPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useVideoStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      const response = await api.get(`/video/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await api.delete(`/video`, {
        data: { videoId }
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Video deleted",
        description: "Your video has been deleted successfully",
      });
      // Invalidate and refetch videos list
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      // Navigate back to videos page
      navigate('/videos');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Video not found</h1>
          <p className="text-muted-foreground mb-4">
            The video you're looking for doesn't exist.
          </p>
          <Link to="/videos">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Videos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { video: rawVideo } = data;

  // Transform video: backend 'url' field contains S3 key, build CloudFront URL
  const video = {
    ...rawVideo,
    key: rawVideo.url, // Store the S3 key from backend's 'url' field
    url: buildVideoUrl(rawVideo.url), // Build CloudFront URL from the S3 key
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Video link copied to clipboard",
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = `${video.title}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your video download has begun",
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteMutation.mutate(video.id);
    }
  };

  // Check if current user owns this video
  // Try ID first, fallback to email comparison if ID is missing
  const isVideoOwner = user && (
    (user.id && video.userId === user.id) ||
    (!user.id && user.email && video.user?.email === user.email)
  );

  const isUser = !!user
  // Check if user is logged in

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {isUser && (<Link to="/videos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Videos
            </Button>
          </Link>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleDownload}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Download className="w-4 h-4" />
            </Button>
            {/* Show delete button only if user owns the video */}
            {isVideoOwner && (
              <Button
                onClick={handleDelete}
                className='text-muted-foreground hover:text-red-700'
                variant="ghost"
                size="sm"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {deleteMutation.isPending ? 'Deleting...' : null}
              </Button>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="glass-card overflow-hidden rounded-xl mb-6">
          <div className="relative aspect-video bg-black">
            <video
              src={video.url}
              controls
              className="w-full h-full"
              poster={video.thumbnail}
            />
          </div>
        </div>

        {/* Video Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold mb-3">{video.title}</h1>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={video.user?.image} />
                  <AvatarFallback>
                    {video.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{video.user?.name || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(video.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {video.description && (
            <div className="glass-card p-6 rounded-xl">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {video.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;