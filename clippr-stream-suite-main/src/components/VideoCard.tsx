import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  url: string;
  title: string;
  description: string | null;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    image: string;
    createdAt: string;
  };
}

interface VideoCardProps {
  video: Video;
}

export const VideoCard = ({ video }: VideoCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/video/${video.id}`);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const videoUrl = `${window.location.origin}/video/${video.id}`;
    navigator.clipboard.writeText(videoUrl);
    toast({
      title: "Link copied!",
      description: "Video link copied to clipboard",
    });
  };

  return (
    <Card className="glass-card overflow-hidden group">
      <div
        className="relative aspect-video bg-muted cursor-pointer"
        onClick={handleClick}
      >
        <video
          src={video.url}
          className="w-full h-full object-cover"
          preload="metadata"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Copy Link Button */}
        <Button
          onClick={handleCopyLink}
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 copy-button"
        >
          <Link className="w-3 h-3" />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-medium text-base line-clamp-2 cursor-pointer" onClick={handleClick}>
            {video.title}
          </h3>
          {video.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {video.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(video.createdAt), 'MMM d, yyyy • h:mm a')}</span>
            </div>
            {video.user?.name && (
              <span className="text-xs text-muted-foreground truncate max-w-24">
                {video.user.name}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};