import React, { useRef, useState } from 'react';
import { Upload, FileImage, Plus } from 'lucide-react';

interface DropAreaProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  label: string;
  subLabel?: string;
  compact?: boolean;
  accept?: string;
}

export const DropArea: React.FC<DropAreaProps> = ({ 
  onFilesSelected, 
  multiple = false,
  label,
  subLabel,
  compact = false,
  accept = "image/*"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      // Filter for images if needed, though accept attribute handles explorer
      const imageFiles = fileList.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        onFilesSelected(multiple ? imageFiles : [imageFiles[0]]);
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files) as File[];
      onFilesSelected(multiple ? fileList : [fileList[0]]);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-200 ease-in-out
        border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' 
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 bg-white'
        }
        ${compact ? 'p-4 min-h-[120px]' : 'p-8 min-h-[200px]'}
      `}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        multiple={multiple}
        accept={accept}
        className="hidden"
      />
      
      <div className={`p-3 rounded-full mb-3 ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
        {compact ? <Plus size={24} /> : <Upload size={32} />}
      </div>
      
      <h3 className="font-semibold text-slate-700">
        {label}
      </h3>
      {subLabel && (
        <p className="text-sm text-slate-500 mt-1 max-w-[200px]">
          {subLabel}
        </p>
      )}
    </div>
  );
};