import { useNavigate } from 'react-router-dom';
import { Zap, Shield, Globe } from 'lucide-react';
import { useVideoStore } from '@/stores/videoStore';
import GoogleAuth from '@/components/GoogleAuth';
import { useEffect } from 'react';
import { SpotlightNew } from '@/components/ui/spotlight-new';
import FlipWords from '@/components/ui/flip-words';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useVideoStore();

  const words = ["RECORD", "UPLOAD", "SHARE"];


  useEffect(() => {
    if (isAuthenticated) {
      navigate('/videos');
    }
  }, [isAuthenticated]);

  return (
    <div
      className="
        min-h-screen  
        w-full rounded-md flex md:items-center md:justify-center
        bg-black/[0.96] antialiased relative
        overflow-x-hidden  
        overflow-y-auto    
        md:overflow-hidden 
      "
    >
      <SpotlightNew />
      <div className="p-4 max-w-7xl mx-auto relative z-10 w-full pt-20 md:pt-0">
        {/* Hero Section */}
        <div className="text-center">
          {/* Logo with Flip Words */}
          <div className="mb-12 mt-16">
            <h1 className="text-4xl md:text-7xl font-bold text-center mb-6">
              {/* Flip words on their own line with fixed container */}
              <div className="min-h-[1.2em] flex justify-center items-center mb-2">
                <FlipWords
                  words={words}
                  duration={2000}
                  className="text-4xl md:text-7xl font-bold text-white"
                />
              </div>
              {/* Static text on second line */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <span className="text-white">
                  INSTANTLY WITH
                </span>
                <span className="text-4xl md:text-7xl font-bold text-white drop-shadow-2xl">
                  CLIPPR
                </span>
              </div>
            </h1>
            <p className="mt-4 font-normal text-base md:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              The modern way to capture and collaborate.
              Record, share, and manage your screen recordings with ease.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-20">
            <GoogleAuth />
            <p className="text-sm text-neutral-400 mt-4">
              Start recording in seconds
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group glass-card p-8 rounded-2xl text-center bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
              <Zap className="w-12 h-12 text-blue-400 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-semibold mb-3 text-neutral-200 text-lg">Lightning Fast</h3>
              <p className="text-neutral-400">
                Start recording instantly with one click. No downloads or installations required.
              </p>
            </div>

            <div className="group glass-card p-8 rounded-2xl text-center bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-semibold mb-3 text-neutral-200 text-lg">Secure & Private</h3>
              <p className="text-neutral-400">
                Your recordings are private by default. Share only what you want, when you want.
              </p>
            </div>

            <div className="group glass-card p-8 rounded-2xl text-center bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
              <Globe className="w-12 h-12 text-purple-400 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-semibold mb-3 text-neutral-200 text-lg">Share Anywhere</h3>
              <p className="text-neutral-400">
                Generate shareable links instantly. Works on any device, any browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
