import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useVideoStore } from '@/stores/videoStore';
import { Upload, File, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildVideoUrl } from '@/lib/videoUtils';
import api from '@/lib/axios';

const UploadModal = () => {
  const { isUploadModalOpen, setUploadModalOpen, addVideo } = useVideoStore();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's a video file
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      // Auto-fill title with filename (without extension)
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(fileName);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Error",
        description: "Please select a video file and provide a title",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get presigned URL from backend
      const presignedResponse = await api.post('/presigned-url', { contentType: selectedFile.type });
      const { url: presignedUrl, key: fileKey } = presignedResponse.data;

      // Step 2: Upload file to S3 using presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
          'Content-Disposition': 'attachment; filename="video.mp4"'
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Create video record in database with S3 key as 'url' field
      const videoResponse = await api.post('/video', {
        url: fileKey, // Backend expects 'url' field (which stores the S3 key)
        title: title.trim(),
        description: description.trim() || undefined,
      });
      const videoData = videoResponse.data;

      // Build the video object with CloudFront URL for local state
      const videoWithUrl = {
        ...videoData.videoData,
        url: buildVideoUrl(fileKey), // Build CloudFront URL for display
        key: fileKey, // Keep the key for reference
      };

      addVideo(videoWithUrl);

      toast({
        title: "Success!",
        description: "Your video has been uploaded successfully",
      });

      closeModal();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setIsUploading(false);
    setUploadModalOpen(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isUploadModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">Upload Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div
              className="glass-card p-8 border-2 border-dashed border-border/50 rounded-lg text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to select or drag and drop your video file
              </p>
              <p className="text-xs text-muted-foreground">
                Supports MP4, WebM, MOV and other video formats
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description... (optional)"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={closeModal} variant="secondary" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 glow-primary"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
export { UploadModal };