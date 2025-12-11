import React, { useEffect, useState } from 'react';
import { ShotData } from '../types';
import { generateImageFromPrompt } from '../services/geminiService';
import { Download, RefreshCw, Image as ImageIcon, Copy } from 'lucide-react';

interface ShotCardProps {
  shot: ShotData;
}

export const ShotCard: React.FC<ShotCardProps> = ({ shot }) => {
  const [imageState, setImageState] = useState<{
    isLoading: boolean;
    imageUrl: string | null;
    error: string | null;
  }>({
    isLoading: true, // Start loading immediately upon mount
    imageUrl: null,
    error: null,
  });

  const generate = async () => {
    setImageState({ isLoading: true, imageUrl: null, error: null });
    try {
      const base64Image = await generateImageFromPrompt(shot.prompt);
      setImageState({ isLoading: false, imageUrl: base64Image, error: null });
    } catch (err) {
      setImageState({
        isLoading: false,
        imageUrl: null,
        error: "Failed to generate image",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Small staggered delay to prevent hitting rate limits all at once if user has low quota
    const delay = shot.id * 1500; 

    const timeout = setTimeout(() => {
      if (isMounted) generate();
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shot.prompt]);

  const handleDownload = () => {
    if (!imageState.imageUrl) return;
    const link = document.createElement('a');
    link.href = imageState.imageUrl;
    link.download = `cineprompt_${shot.id}_${shot.title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(shot.prompt);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-lg transition-all hover:border-zinc-600 group">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
        <span className="text-xs font-mono text-indigo-400">#{shot.id}</span>
        <h3 className="text-sm font-semibold text-zinc-100 truncate flex-1 ml-2" title={shot.title}>
          {shot.title}
        </h3>
        <button 
          onClick={copyPrompt}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Copy Prompt"
        >
          <Copy size={14} />
        </button>
      </div>

      {/* Image Area */}
      <div className="relative aspect-[16/9] bg-black group-hover:bg-zinc-950 transition-colors flex items-center justify-center overflow-hidden">
        {imageState.isLoading ? (
          <div className="flex flex-col items-center justify-center text-zinc-500 gap-2 animate-pulse">
            <ImageIcon className="w-8 h-8 opacity-50" />
            <span className="text-xs font-medium">Generating visualization...</span>
          </div>
        ) : imageState.error ? (
          <div className="flex flex-col items-center justify-center text-red-400 gap-2 px-4 text-center">
            <span className="text-xs">{imageState.error}</span>
            <button 
              onClick={generate}
              className="mt-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        ) : imageState.imageUrl ? (
          <img 
            src={imageState.imageUrl} 
            alt={shot.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>

      {/* Prompt Text */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex-1">
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
            {shot.prompt}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
           <button
             onClick={generate}
             disabled={imageState.isLoading}
             className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
           >
             <RefreshCw size={12} className={imageState.isLoading ? 'animate-spin' : ''} />
             Regenerate
           </button>

           <button
             onClick={handleDownload}
             disabled={!imageState.imageUrl}
             className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
           >
             <Download size={12} />
             Download
           </button>
        </div>
      </div>
    </div>
  );
};
