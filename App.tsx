import React, { useState, useRef } from 'react';
import { Clapperboard, Upload, Sparkles, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { ShotData } from './types';
import { analyzeSceneAndGeneratePrompts } from './services/geminiService';
import { ShotCard } from './components/ShotCard';

const App: React.FC = () => {
  const [sceneDescription, setSceneDescription] = useState('');
  const [refImage, setRefImage] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<ShotData[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extract pure base64 and mime type
      const match = base64String.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        setRefImage({
          mimeType: match[1],
          base64: match[2],
          name: file.name
        });
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setRefImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!sceneDescription.trim()) {
      setError('Please describe your scene.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setShots([]);

    try {
      const generatedShots = await analyzeSceneAndGeneratePrompts(
        sceneDescription,
        refImage?.base64,
        refImage?.mimeType
      );
      setShots(generatedShots);
    } catch (err) {
      setError('Failed to analyze scene. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-zinc-200 selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#0f0f12]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Clapperboard className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">CinePrompt AI</h1>
            <p className="text-xs text-zinc-500 font-medium">Cinematic Shot Generator</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-20 space-y-8">
        
        {/* Input Section */}
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2 text-center mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Direct Your Scene</h2>
            <p className="text-zinc-400">Describe your vision. AI will generate 9 perfectly consistent cinematic shots.</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Scene Description
                </label>
                <textarea
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder="e.g. A cyberpunk detective standing in heavy rain under neon signs, looking at a holographic map..."
                  className="w-full h-32 bg-black/40 border border-zinc-700 rounded-xl p-4 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* File Upload */}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {!refImage ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-12 border border-dashed border-zinc-700 rounded-xl hover:bg-zinc-800/50 hover:border-zinc-500 transition-all flex items-center justify-center gap-2 text-zinc-400 text-sm group"
                    >
                      <Upload size={16} className="group-hover:text-indigo-400 transition-colors" />
                      Upload Reference Image (Optional)
                    </button>
                  ) : (
                    <div className="w-full h-12 bg-indigo-900/20 border border-indigo-500/30 rounded-xl flex items-center justify-between px-4">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <ImageIcon size={16} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-sm text-indigo-200 truncate">{refImage.name}</span>
                      </div>
                      <button onClick={clearImage} className="p-1 hover:bg-indigo-900/40 rounded-full text-indigo-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isAnalyzing || !sceneDescription.trim()}
                  className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/20 flex-shrink-0 sm:w-auto w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate 9 Shots
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        </section>

        {/* Results Grid */}
        {shots.length > 0 && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Shot List</h3>
                <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md border border-zinc-700">
                  Total: {shots.length} Shots
                </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shots.map((shot) => (
                  <ShotCard key={shot.id} shot={shot} />
                ))}
             </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default App;
