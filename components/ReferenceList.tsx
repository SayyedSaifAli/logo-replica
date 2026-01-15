import React from 'react';
import { ReferenceImage } from '../types';
import { X, ImageIcon, ArrowRight } from 'lucide-react';

interface ReferenceListProps {
  references: ReferenceImage[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const ReferenceList: React.FC<ReferenceListProps> = ({ references, onRemove, onClear }) => {
  if (references.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          Reference Images
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
            {references.length}
          </span>
        </h3>
        <button 
          onClick={onClear}
          className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[400px] custom-scrollbar">
        {references.map((ref) => (
          <div 
            key={ref.id}
            className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden flex-shrink-0 border border-slate-100">
              <img 
                src={ref.previewUrl} 
                alt={ref.name} 
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-700 text-sm truncate" title={ref.name}>
                {ref.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {ref.width} × {ref.height}
                </span>
                <span className="text-xs text-slate-400 uppercase">
                   {ref.name.split('.').pop()}
                </span>
              </div>
            </div>

            <button
              onClick={() => onRemove(ref.id)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
