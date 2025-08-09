import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useVideoStore } from '@/stores/videoStore';
import { Play, Square, Upload, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { buildVideoUrl } from '@/lib/videoUtils';

export const RecordModal = () => {
  const { isRecordModalOpen, setRecordModalOpen, addVideo } = useVideoStore();
  const { toast } = useToast();

  // Recording state
  const [systemAudio, setSystemAudio] = useState(true);
  const [micAudio, setMicAudio] = useState(true);
  const [recording, setRecording] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [noSystemAudio, setNoSystemAudio] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RECORDING_TIME = 60; // 3 minutes

  // Build a mixed audio stream (system + mic) and return combined MediaStream with video
  const createCombinedStream = async () => {
    // Request screen/tab capture
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: systemAudio,
    } as MediaStreamConstraints);

    // Detect if user requested system audio but it's not present (e.g., not sharing a tab)
    if (systemAudio) {
      setNoSystemAudio(displayStream.getAudioTracks().length === 0);
    } else {
      setNoSystemAudio(false);
    }

    // If mic disabled, return display stream (with or without system audio)
    if (!micAudio) {
      return displayStream;
    }

    // Try to get microphone; if denied and we have system audio, fallback to system-only
    let micStream: MediaStream | null = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.warn('Microphone not available, continuing without mic', e);
      return displayStream; // continue with whatever display has
    }

    // If no system audio track, but we have mic audio, attach mic directly
    if (displayStream.getAudioTracks().length === 0 && micStream) {
      const combined = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...micStream.getAudioTracks(),
      ]);
      (combined as any)._sources = [displayStream, micStream];
      return combined;
    }

    // Otherwise attempt to mix system + mic
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext: AudioContext = new AudioCtx();
      const destination = audioContext.createMediaStreamDestination();

      const connectIfHasAudio = (s: MediaStream) => {
        if (s.getAudioTracks().length > 0) {
          const src = audioContext.createMediaStreamSource(s);
          src.connect(destination);
        }
      };

      connectIfHasAudio(displayStream);
      if (micStream) connectIfHasAudio(micStream);

      const combined = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);
      (combined as any)._sources = [displayStream, micStream].filter(Boolean);
      (combined as any)._audioContext = audioContext;
      return combined;
    } catch (mixErr) {
      console.warn('Audio mixing failed, falling back to single audio track', mixErr);
      const audioTracks = displayStream.getAudioTracks().length > 0
        ? displayStream.getAudioTracks()
        : (micStream ? micStream.getAudioTracks() : []);
      const combined = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioTracks,
      ]);
      (combined as any)._sources = [displayStream, micStream].filter(Boolean);
      return combined;
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    intervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const next = prev + 1;
        if (next >= MAX_RECORDING_TIME) {
          stopRecording();
          return MAX_RECORDING_TIME;
        }
        return next;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const startRecording = async () => {
    try {
      setRecordedBlob(null);
      setMediaBlobUrl(null);
      chunksRef.current = [];

      const stream = await createCombinedStream();
      streamRef.current = stream;

      const hasAudio = stream.getAudioTracks().length > 0;
      const audioCandidates = hasAudio
        ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus']
        : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8'];
      const candidates = [...audioCandidates, 'video/webm'];
      const supported = candidates.find((c) => (window as any).MediaRecorder?.isTypeSupported?.(c));
      const options = supported ? { mimeType: supported } : undefined;

      const recorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (ev: any) => {
        console.error('MediaRecorder error', ev?.error || ev);
        toast({ title: 'Recording error', description: String(ev?.error || ev), variant: 'destructive' });
      };

      recorder.onstop = () => {
        // Allow the final dataavailable to flush into chunks before assembling
        setTimeout(() => {
          const type = supported || 'video/webm';
          const blob = new Blob(chunksRef.current, { type });
          setRecordedBlob(blob);
          const url = URL.createObjectURL(blob);
          setMediaBlobUrl(url);
          // Stop source tracks
          stream.getTracks().forEach((t) => t.stop());
          const ac: AudioContext | undefined = (stream as any)._audioContext;
          if (ac) ac.close().catch(() => { });
          const sources: MediaStream[] | undefined = (stream as any)._sources;
          sources?.forEach((s) => s?.getTracks().forEach((t) => t.stop()));
        }, 0);
      };

      recorder.start(250); // collect data in chunks
      startTimer();
      setRecording(true);
    } catch (err: any) {
      console.error('Failed to start recording', err);
      let description = 'Please allow screen and microphone permissions to record.';
      if (err?.name === 'NotAllowedError') description = 'Permissions denied. Please allow access to record.';
      if (err?.name === 'NotFoundError') description = 'No input device found. Check your mic and try again.';
      if (err?.name === 'NotReadableError') description = 'Hardware busy. Close other apps using mic/screen.';
      if (err?.message?.includes('MediaRecorder')) description = 'Recording format not supported in this browser.';
      toast({ title: 'Recording failed', description, variant: 'destructive' });
      setRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      const rec = recorderRef.current;
      if (rec && rec.state === 'recording') {
        try { rec.requestData(); } catch { }
        rec.stop();
      }
    } catch { }
    clearTimer();
    setRecording(false);
  };

  const handleUpload = async () => {
    if (!recordedBlob || !title.trim()) {
      toast({
        title: 'Error',
        description: 'Please record a video and provide a title',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // 1) get presigned URL
      const mime = recordedBlob.type || 'video/webm';
      const presigned = await api.post('/presigned-url', { contentType: mime });
      const { url: presignedUrl, key: fileKey } = presigned.data;

      // 2) upload to S3
      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: recordedBlob,
        headers: {
          'Content-Type': mime, 'Content-Disposition': 'attachment; filename="video.mp4"'
        },
      });
      if (!putRes.ok) throw new Error('Upload failed');

      // 3) create video record
      const videoRes = await api.post('/video', {
        url: fileKey,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      const videoData = videoRes.data;

      const videoWithUrl = {
        ...videoData.videoData,
        url: buildVideoUrl(fileKey),
        key: fileKey,
      };
      addVideo(videoWithUrl);

      toast({ title: 'Success!', description: 'Your recording has been uploaded' });
      // reset and close
      resetState();
      setRecordModalOpen(false);
    } catch (e) {
      console.error('Upload error:', e);
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setRecordedBlob(null);
    if (mediaBlobUrl) URL.revokeObjectURL(mediaBlobUrl);
    setMediaBlobUrl(null);
    setTitle('');
    setDescription('');
    setRecordingTime(0);
    setNoSystemAudio(false);
    // Stop any leftover tracks
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const ac: AudioContext | undefined = (streamRef.current as any)?._audioContext;
      if (ac) ac.close().catch(() => { });
    } catch { }
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    clearTimer();
    setRecording(false);
  };

  const closeModal = () => {
    if (recording) {
      stopRecording();
    }
    resetState();
    setRecordModalOpen(false);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      resetState();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isRecordModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">Record Screen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!recordedBlob ? (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-primary" />
                    <p className="text-xl font-mono">
                      {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
                    </p>
                  </div>
                  {recording ? (
                    <Button onClick={stopRecording} variant="destructive">
                      <Square className="w-4 h-4 mr-2" /> Stop
                    </Button>
                  ) : (
                    <Button onClick={startRecording} className="glow-primary">
                      <Play className="w-4 h-4 mr-2" /> Start
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">System audio</p>
                      <p className="text-xs text-muted-foreground">Capture tab/system sound</p>
                    </div>
                    <Switch checked={systemAudio} onCheckedChange={setSystemAudio} disabled={recording} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">Microphone</p>
                      <p className="text-xs text-muted-foreground">Include mic input</p>
                    </div>
                    <Switch checked={micAudio} onCheckedChange={setMicAudio} disabled={recording} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: System audio capture is best supported when sharing a browser tab.
                </p>
                {systemAudio && noSystemAudio && (
                  <p className="text-xs text-amber-500">
                    No system audio detected. Share a browser tab and enable "Share tab audio" to capture system sound.
                  </p>
                )}
              </div>
              {recording && (
                <p className="text-sm text-muted-foreground text-center">Recording in progress...</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {mediaBlobUrl && (
                <video src={mediaBlobUrl} controls className="w-full rounded-lg" />
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter video title..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter video description... (optional)" rows={3} />
              </div>

              <div className="flex gap-2">
                <Button onClick={closeModal} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleUpload} className="flex-1 glow-primary" disabled={isUploading}>
                  <Upload className="w-4 h-4 mr-2" /> {isUploading ? 'Uploading...' : 'Save Video'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};