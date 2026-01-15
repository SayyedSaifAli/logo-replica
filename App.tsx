import React, { useState, useEffect } from 'react';
import { DropArea } from './components/DropArea';
import { ReferenceList } from './components/ReferenceList';
import { getImageDimensions, generateReplicaZip } from './utils/imageUtils';
import { ReferenceImage, ProcessingStatus } from './types';
import { Loader2, Download, RefreshCw, AlertCircle, FileCheck, ArrowRightLeft, Layers } from 'lucide-react';
import JSZip from 'jszip'; // Ensure JSZip is available in scope

const App: React.FC = () => {
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    completed: false
  });

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      references.forEach(ref => URL.revokeObjectURL(ref.previewUrl));
      if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    };
  }, []); // Empty dependency array means this runs once on mount/unmount logic

  const handleReferenceSelect = async (files: File[]) => {
    const newRefs = await Promise.all(files.map(getImageDimensions));
    // Filter duplicates by name if necessary, or just append
    setReferences(prev => [...prev, ...newRefs]);
    setStatus(prev => ({ ...prev, completed: false, error: undefined }));
  };

  const handleSourceSelect = (files: File[]) => {
    if (files.length > 0) {
      if (sourcePreview) URL.revokeObjectURL(sourcePreview);
      setSourceImage(files[0]);
      setSourcePreview(URL.createObjectURL(files[0]));
      setStatus(prev => ({ ...prev, completed: false, error: undefined }));
    }
  };

  const handleRemoveReference = (id: string) => {
    setReferences(prev => {
      const target = prev.find(r => r.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(r => r.id !== id);
    });
  };

  const handleClearReferences = () => {
    references.forEach(r => URL.revokeObjectURL(r.previewUrl));
    setReferences([]);
    setStatus(prev => ({ ...prev, completed: false }));
  };

  const handleProcess = async () => {
    if (!sourceImage || references.length === 0) return;

    setStatus({ isProcessing: true, progress: 0, completed: false });

    try {
      const zipBlob = await generateReplicaZip(
        sourceImage,
        references,
        (progress) => setStatus(prev => ({ ...prev, progress }))
      );

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resized_logos_batch_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ isProcessing: false, progress: 100, completed: true });
    } catch (err: any) {
      setStatus({ 
        isProcessing: false, 
        progress: 0, 
        completed: false, 
        error: err.message || "An unexpected error occurred" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left pt-4">
          <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-lg shadow-indigo-200 flex-shrink-0">
             <Layers className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Logo Replica & Resizer
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Upload your old logo files to detect their sizes and names. 
              Then upload a new logo to automatically generate replacements 
              matching all original specifications.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: References */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">1. Upload Old Images</h2>
              <DropArea 
                label="Drop old images here"
                subLabel="Upload the files you want to replace (e.g. logo.png, logo-sm.jpg)"
                multiple={true}
                onFilesSelected={handleReferenceSelect}
                compact={references.length > 0}
              />
              
              <div className="mt-6 flex-1 min-h-[300px]">
                {references.length > 0 ? (
                  <ReferenceList 
                    references={references}
                    onRemove={handleRemoveReference}
                    onClear={handleClearReferences}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 p-6">
                    <p className="text-sm font-medium">No reference images yet</p>
                    <p className="text-xs mt-1">Upload at least 7 items to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Source & Action */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step 2: New Logo */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">2. Upload New Logo</h2>
              {!sourceImage ? (
                <DropArea 
                  label="Drop new high-res logo"
                  subLabel="This image will be resized to match the references"
                  onFilesSelected={handleSourceSelect}
                />
              ) : (
                <div className="relative group bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-video flex items-center justify-center">
                  <img 
                    src={sourcePreview!} 
                    alt="New Source" 
                    className="max-w-full max-h-full object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => {
                        setSourceImage(null);
                        setSourcePreview(null);
                        setStatus(prev => ({ ...prev, completed: false }));
                      }}
                      className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-slate-50 transition-transform active:scale-95"
                    >
                      Change Logo
                    </button>
                  </div>
                </div>
              )}
              {sourceImage && (
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="truncate max-w-[200px] font-medium">{sourceImage.name}</span>
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-700">New Source</span>
                </div>
              )}
            </div>

            {/* Step 3: Action */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">3. Process & Download</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                  <span>Targets found:</span>
                  <span className="font-mono font-bold text-slate-900">{references.length}</span>
                </div>
                
                {status.error && (
                   <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                     <AlertCircle size={16} className="mt-0.5 flex-shrink-0"/>
                     {status.error}
                   </div>
                )}

                <button
                  onClick={handleProcess}
                  disabled={!sourceImage || references.length === 0 || status.isProcessing}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-2
                    ${(!sourceImage || references.length === 0)
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-[0.99] shadow-indigo-200'
                    }
                  `}
                >
                  {status.isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Processing {status.progress}%
                    </>
                  ) : status.completed ? (
                    <>
                      <FileCheck />
                      Downloaded! Process Again?
                    </>
                  ) : (
                    <>
                      <RefreshCw />
                      Resize & Rename All
                    </>
                  )}
                </button>

                {status.completed && (
                  <p className="text-center text-sm text-emerald-600 font-medium">
                    Batch processing complete. Check your downloads.
                  </p>
                )}
              </div>
            </div>
            
            {/* Quick Preview of Plan */}
            {references.length > 0 && sourceImage && (
               <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Generation Plan</h4>
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ArrowRightLeft size={14} className="text-indigo-400" />
                        <span>Resizing <strong>{sourceImage.name}</strong> into:</span>
                     </div>
                     <ul className="text-xs space-y-1 text-slate-500 ml-6 list-disc">
                        {references.slice(0, 3).map(r => (
                           <li key={r.id}>
                              <span className="font-mono text-slate-700">{r.name}</span> 
                              <span className="opacity-60 ml-1">({r.width}x{r.height})</span>
                           </li>
                        ))}
                        {references.length > 3 && (
                           <li className="list-none text-slate-400 italic pl-1">
                              + {references.length - 3} more...
                           </li>
                        )}
                     </ul>
                  </div>
               </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full py-6 mt-8 text-center border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <p className="text-sm text-slate-500">
          Developed by <a href="https://sitesbysayyad.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">SitesBySayyad.com</a>
        </p>
      </footer>
    </div>
  );
};

export default App;