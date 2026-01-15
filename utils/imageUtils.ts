import JSZip from 'jszip';
import { ReferenceImage } from '../types';

export const getImageDimensions = (file: File): Promise<ReferenceImage> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      resolve({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        type: file.type,
        originalFile: file,
        previewUrl: url
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    
    img.src = url;
  });
};

export const resizeImage = async (
  sourceImg: HTMLImageElement,
  width: number,
  height: number,
  mimeType: string
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Use high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(sourceImg, 0, 0, width, height);

  // Fallback to PNG if the browser doesn't support the requested mime type writer
  // or if the mime type is not supported by canvas (e.g. svg, gif)
  let targetMime = mimeType;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
    targetMime = 'image/png'; 
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob failed'));
        }
      },
      targetMime,
      0.95 // quality for jpeg/webp
    );
  });
};

export const generateReplicaZip = async (
  sourceFile: File,
  references: ReferenceImage[],
  onProgress: (percent: number) => void
): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder("resized_logos");
  
  // Load source image once
  const sourceImg = new Image();
  const sourceUrl = URL.createObjectURL(sourceFile);
  
  await new Promise<void>((resolve, reject) => {
    sourceImg.onload = () => resolve();
    sourceImg.onerror = () => reject(new Error("Failed to load source logo"));
    sourceImg.src = sourceUrl;
  });

  let processedCount = 0;

  // Process each reference
  for (const ref of references) {
    try {
      const blob = await resizeImage(sourceImg, ref.width, ref.height, ref.type);
      if (folder) {
        folder.file(ref.name, blob);
      }
      processedCount++;
      onProgress(Math.round((processedCount / references.length) * 100));
    } catch (error) {
      console.error(`Failed to process ${ref.name}`, error);
    }
  }

  URL.revokeObjectURL(sourceUrl);
  
  return await zip.generateAsync({ type: "blob" });
};
