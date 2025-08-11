import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';



export const TopNavigation = () => {
  const { user, logout } = useVideoStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Determine if user is actually logged in based on user data
  const isUser = !!user

  const handleLogout = () => {
    // Clear all React Query cache
    queryClient.clear();

    // Logout from store
    logout();

    // Navigate to home
    navigate('/');
  };

  const handleJoinClippr = () => {
    navigate('/');
  };

  return (
    <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-0">
            <img
              src="/clippr.png"
              alt="CLIPPR Logo"
              className="w-16 h-16 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground ml-0">CLIPPR</h1>
          </div>

          {/* User Info or Join Button */}
          {isUser && user ? (
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.image} />
                <AvatarFallback>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.name || 'User'}
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleJoinClippr}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Join Clippr
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};