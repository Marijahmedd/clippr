import { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useVideoStore } from '@/stores/videoStore';
import { Play, Square, Upload, Video, AlertCircle, MicOff, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { buildVideoUrl } from '@/lib/videoUtils'; // Added import

export const RecordModal = () => {
  const { isRecordModalOpen, setRecordModalOpen } = useVideoStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
    error,
  } = useReactMediaRecorder({
    screen: true,
    audio: includeMic,
    video: true,
    blobPropertyBag: { type: 'video/webm' },
  });

  const isRecording = status === 'recording';
  const isStopped = status === 'stopped';

  const resetAndClose = () => {
    if (isRecording) {
      stopRecording();
    }
    clearBlobUrl();
    setTitle('');
    setDescription('');
    setRecordModalOpen(false);
  };

  const handleUpload = async () => {
    if (!mediaBlobUrl || !title.trim()) {
      toast({
        title: "Error",
        description: "Please record a video and provide a title",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const recordedBlob = await fetch(mediaBlobUrl).then((res) => res.blob());

      // Step 1: Get presigned URL from backend
      const presignedResponse = await api.post('/presigned-url', { contentType: recordedBlob.type });
      const { url: presignedUrl, key: fileKey } = presignedResponse.data;

      // Step 2: Upload file to S3 using presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: recordedBlob,
        headers: {
          'Content-Type': recordedBlob.type,
          'Content-Disposition': 'attachment; filename="video.mp4"'
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Create video record in database with S3 key as 'url' field
      await api.post('/video', {
        url: fileKey, // Backend expects 'url' field (which stores the S3 key)
        title: title.trim(),
        description: description.trim() || undefined,
      });

      // Invalidate the query to refetch the video list
      queryClient.invalidateQueries({ queryKey: ['videos'] });

      toast({
        title: "Success!",
        description: "Your video has been uploaded successfully",
      });

      resetAndClose();
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

  return (
    <Dialog open={isRecordModalOpen} onOpenChange={(isOpen) => !isOpen && resetAndClose()}>
      <DialogContent
        onInteractOutside={(e) => {
          // Prevent closing modal by clicking outside while recording
          if (isRecording) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing modal with Escape key while recording
          if (isRecording) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{isStopped ? 'Review & Upload' : 'Record Screen'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="text-red-500 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>
          )}

          {isStopped ? (
            // Review View
            <div className="space-y-4">
              <video src={mediaBlobUrl} controls autoPlay className="w-full rounded-lg" />
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter video title..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter video description... (optional)" />
              </div>
            </div>
          ) : (
            // Initial / Recording View
            <div className="flex flex-col items-center justify-center space-y-4 p-8 glass-card rounded-lg">
              <Video className={`w-16 h-16 text-primary ${isRecording ? 'animate-pulse' : ''}`} />
              <p className="text-lg font-medium">{status.toUpperCase()}</p>

              {/* Microphone Toggle */}
              <div className="flex items-center space-x-3 pt-4">
                <Label htmlFor="mic-toggle">Microphone</Label>
                <button
                  id="mic-toggle"
                  onClick={() => !isRecording && setIncludeMic(!includeMic)}
                  className={`relative w-14 h-8 flex items-center rounded-full transition-colors duration-300
                    ${includeMic ? "bg-green-500" : "bg-gray-400"}
                    ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={isRecording}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                    style={{
                      marginLeft: includeMic ? "calc(100% - 1.75rem)" : "0.25rem"
                    }}
                  >
                    {includeMic ? (
                      <Mic size={14} className="text-green-500" />
                    ) : (
                      <MicOff size={14} className="text-gray-500" />
                    )}
                  </motion.div>
                </button>
              </div>

              <p className="text-sm text-muted-foreground text-center pt-2">
                Click Start to share your screen and begin recording.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {isStopped ? (
            <>
              <Button onClick={clearBlobUrl} variant="outline" className="flex-1">Record Again</Button>
              <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </>
          ) : (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'destructive' : 'default'}
              className="w-full"
            >
              {isRecording ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordModal;