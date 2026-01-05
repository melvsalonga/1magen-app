"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Camera, Download, Settings, History, Sparkles, Trash2, Copy, Loader2, Zap, ImageIcon, Palette, Share2, Lightbulb, Image as ImageIconLucide, Film, Brush, Square as SquareIcon, Mic2, Wand2, Check, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import { generateImageWithAPI, fileToBase64 } from '@/lib/api';
import { API_CONFIG, ModelName } from '@/config/api';

// Types
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
  seed?: string;
  timestamp: number;
}

interface Preset {
  id: string;
  name: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
}

// Custom hooks
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  // Effect to load value from localStorage on component mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Function to set value in state and localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (isMounted) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
};

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div
    className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-[100] transition-all duration-300 ${ // Increased z-index
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    role={type === 'error' ? "alert" : "status"}
    aria-live={type === 'error' ? "assertive" : "polite"}
  >
    <div className="flex items-center space-x-2">
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-75 focus:ring-2 focus:ring-white rounded" // Added focus style
        aria-label="Close notification"
      >×</button>
    </div>
  </div>
);

const ImageModal = ({ imageUrl, prompt, onClose, onDownload }: {
  imageUrl: string;
  prompt: string;
  onClose: () => void;
  onDownload: (url: string) => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4"
      onClick={onClose} // Close on overlay click
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-prompt"
    >
      <div
        className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full transition-colors bg-white/10 hover:bg-white/20 text-white focus:ring-2 focus:ring-white/50"
          aria-label="Close image preview"
        >
          ×
        </button>
        <img
          src={imageUrl}
          alt={prompt || "Enlarged generated image"} // More descriptive alt
          className="max-w-[calc(95vw-4rem)] max-h-[calc(95vh-8rem)] object-contain mb-4 rounded-lg"
        />
        {prompt && (
          <p id="image-modal-prompt" className="text-center text-sm max-w-[80%] truncate mb-2 text-gray-200">{prompt}</p>
        )}
        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => onDownload(imageUrl)}
            className="p-2 px-4 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300 min-h-[44px] flex items-center bg-green-600 hover:bg-green-700 hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] text-white focus:ring-2 focus:ring-green-500"
            aria-label="Download enlarged image"
          >
            <Download className="w-4 h-4 inline mr-2" /> Download
          </button>
          {navigator.share && ( // Conditionally render share button if API is available
            <button
              onClick={async () => {
                try {
                  await navigator.share({
                    title: '1magen AI Image',
                    text: prompt || 'Check out this AI-generated image!',
                    url: imageUrl,
                  });
                } catch (error) {
                  console.error('Error sharing:', error);
                }
              }}
              className="p-2 px-4 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 min-h-[44px] flex items-center bg-blue-600 hover:bg-blue-700 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] text-white focus:ring-2 focus:ring-blue-500"
              aria-label="Share image"
            >
              <Share2 className="w-4 h-4 inline mr-2" /> Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SavePresetModal = ({
  isOpen,
  onClose,
  onSave,
  presetName,
  setPresetName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  presetName: string;
  setPresetName: (name: string) => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null); // For focusing on save button initially
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      // Focus the input field when the modal opens
      inputRef.current?.focus();
    } else {
      previouslyFocusedElement.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && presetName.trim()) {
        onSave();
      }
      // Basic tab trapping
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'input, button, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => el.offsetParent !== null); // Filter out hidden elements

        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onSave, presetName]);


  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4" // Ensure high z-index
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-preset-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl bg-gray-900 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="save-preset-modal-title" className="text-xl font-semibold mb-4 text-white">
          Save Preset
        </h2>

        <div className="space-y-2 mb-6">
          <label htmlFor="presetNameInput" className="block text-sm font-medium text-gray-400">
            Preset Name
          </label>
          <input
            id="presetNameInput"
            ref={inputRef}
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="e.g., My Awesome Style"
            className="w-full rounded-lg p-3 border border-white/10 focus:ring-2 focus:border-blue-500 transition-all duration-200 min-h-[44px] bg-white/5 text-white placeholder-gray-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] bg-white/5 hover:bg-white/10 text-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Cancel
          </button>
          <button
            ref={saveButtonRef}
            onClick={onSave}
            disabled={!presetName.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] flex items-center justify-center shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${!presetName.trim()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
              }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" aria-hidden="true" />
    <span className="sr-only">Loading...</span>
  </div>
);

const ImageCard = ({
  image,
  onDelete,
  onCopy,
  onDownload,
  onEnlarge,
  isSelected,
  onSelect
}: {
  image: GeneratedImage;
  onDelete: (id: string) => void;
  onCopy: (image: GeneratedImage) => void;
  onDownload: (url: string) => void;
  onEnlarge: (image: GeneratedImage) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => (
  <div className={`group relative rounded-xl overflow-hidden border transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 bg-white/5 border-white/10 hover:border-blue-500/50 ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}>
    <div
      className="absolute top-2 right-2 z-10 p-1.5 rounded-full cursor-pointer transition-colors focus:ring-2 focus:ring-offset-1"
      onClick={(e) => {
        e.stopPropagation(); // Prevent onEnlarge when clicking checkbox
        onSelect(image.id);
      }}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0} // Make it focusable
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onSelect(image.id); } }}
      aria-label={`Select image for comparison: ${image.prompt}`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
        ? 'bg-blue-600 border-blue-500'
        : 'border-white/30 hover:border-white/50 bg-black/20'
        }`}>
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
    </div>
    <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={() => onEnlarge(image)} role="button" aria-label={`View details for image: ${image.prompt}`}>
      <img
        src={image.url}
        alt={image.prompt} // Prompt is already good alt text
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
    <div className="p-3">
      <p className="text-sm truncate text-gray-300">{image.prompt}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{image.model}</span>
        <div className="flex space-x-1">
          <button
            onClick={() => onDownload(image.url)}
            className="p-1.5 rounded transition-colors focus:ring-2 focus:ring-offset-1 text-gray-400 hover:text-white hover:bg-white/10 focus:ring-blue-500 focus:ring-offset-gray-900"
            aria-label="Download image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCopy(image)}
            className="p-1.5 rounded transition-colors focus:ring-2 focus:ring-offset-1 text-gray-400 hover:text-white hover:bg-white/10 focus:ring-gray-600 focus:ring-offset-gray-900"
            aria-label="Copy image settings"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(image.id)}
            className="p-1.5 rounded transition-colors focus:ring-2 focus:ring-offset-1 text-gray-400 hover:text-white hover:bg-red-500/20 focus:ring-red-500 focus:ring-offset-gray-900"
            aria-label="Delete image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PresetCard = ({ preset, onLoad, onDelete }: {
  preset: Preset;
  onLoad: (preset: Preset) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="rounded-xl p-4 border transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10">
    <h3 className="font-medium mb-2 text-white">{preset.name}</h3>
    <p className="text-sm mb-3 truncate text-gray-400">{preset.prompt}</p>
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{preset.model}</span>
      <div className="flex space-x-2">
        <button
          onClick={() => onLoad(preset)}
          className="px-3 py-1.5 text-xs rounded-lg transition-colors min-h-[38px] flex items-center focus:ring-2 focus:ring-offset-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 focus:ring-blue-500 focus:ring-offset-gray-900"
        >
          Load
        </button>
        <button
          onClick={() => onDelete(preset.id)}
          className="px-3 py-1.5 text-xs rounded-lg transition-colors min-h-[38px] flex items-center focus:ring-2 focus:ring-offset-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 focus:ring-red-500 focus:ring-offset-gray-900"
          aria-label={`Delete preset titled ${preset.name}`}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const ComparisonModal = ({
  imagesToCompare,
  allImages,
  onClose,
  onDownload
}: {
  imagesToCompare: string[];
  allImages: GeneratedImage[];
  onClose: () => void;
  onDownload: (url: string) => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const selectedImagesData = allImages.filter(img => imagesToCompare.includes(img.id));

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Basic tab trapping
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4 overflow-y-auto" // Higher z-index than image modal
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl p-4 sm:p-6 bg-gray-900 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="comparison-modal-title" className="text-xl sm:text-2xl font-semibold text-white">
            Compare Images ({selectedImagesData.length})
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-full transition-colors bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white focus:ring-gray-500 focus:ring-2"
            aria-label="Close comparison view"
          >
            ×
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar spacing */}
          <div className={`grid grid-cols-1 md:grid-cols-${selectedImagesData.length > 1 ? selectedImagesData.length : 2} gap-4 sm:gap-6`}>
            {selectedImagesData.map((image) => (
              <div key={image.id} className="rounded-xl border p-3 flex flex-col bg-white/5 border-white/10">
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="w-full aspect-square object-cover rounded-lg mb-3"
                />
                <div className="space-y-1.5 text-xs overflow-hidden">
                  <p className="text-gray-300" title={image.prompt}>
                    <strong className="text-white">Prompt:</strong> <span className="block max-h-10 overflow-y-auto text-ellipsis">{image.prompt}</span>
                  </p>
                  <p className="text-gray-400">
                    <strong className="text-white">Model:</strong> {image.model}
                  </p>
                  <p className="text-gray-400">
                    <strong className="text-white">Size:</strong> {image.width}x{image.height}
                  </p>
                  {image.seed && (
                    <p className="text-gray-400">
                      <strong className="text-white">Seed:</strong> {image.seed}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDownload(image.url)}
                  className="mt-3 w-full p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-900"
                >
                  <Download className="w-3 h-3 mr-1.5" /> Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// Main Component
export default function ModernImagen({ isPreview = false }: { isPreview?: boolean }) {
  // State variables for prompt, dimensions, model, and seed
  const [prompt, setPrompt] = useState('');
  // Numeric width and height for API
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  // String width and height for input fields
  const [widthInput, setWidthInput] = useState('1024');
  const [heightInput, setHeightInput] = useState('1024');
  const [selectedPresetKey, setSelectedPresetKey] = useState('sq_1024'); // For resolution presets
  const [model, setModel] = useState('flux');
  const [seed, setSeed] = useState('');
  const [batchSize, setBatchSize] = useState(1); // Added batchSize state
  const [isGenerating, setIsGenerating] = useState(false);
  // currentImage is now primarily for the enlarged view or as a fallback if needed.
  // The main display on generate tab will use currentBatchImages.
  const [currentImage, setCurrentImage] = useState<string>('https://placehold.co/1024x1024/1a1a1a/4f4f52?text=Your+Image+Will+Appear+Here');
  const [currentBatchImages, setCurrentBatchImages] = useState<GeneratedImage[]>([]);
  const [currentBatchImageIndex, setCurrentBatchImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'presets'>('generate');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const stylePresetsContainerRef = useRef<HTMLDivElement>(null);

  const [canScrollStylePresetsLeft, setCanScrollStylePresetsLeft] = useState(false);
  const [canScrollStylePresetsRight, setCanScrollStylePresetsRight] = useState(false);

  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparisonView, setShowComparisonView] = useState(false);

  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Reference image state for gptimage model
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialDarkPlaceholder = 'https://placehold.co/1024x1024/1a1a1a/4f4f52?text=Your+Image+Will+Appear+Here';

  // Custom hooks for local storage
  const [images, setImages] = useLocalStorage<GeneratedImage[]>('generated-images', []);
  const [presets, setPresets] = useLocalStorage<Preset[]>('image-presets', []);

  const RESOLUTION_PRESETS = useMemo(() => [
    { key: "custom", name: "Custom", w: 0, h: 0 }, // Must be first if we want it as default/fallback visual
    { key: 'sq_1024', name: 'Square (1024x1024)', w: 1024, h: 1024 },
    { key: 'sq_512', name: 'Square (512x512)', w: 512, h: 512 },
    { key: 'sq_256', name: 'Square (256x256)', w: 256, h: 256 },
    { key: 'sq_1080', name: 'Instagram Post (1080x1080)', w: 1080, h: 1080 },
    { key: 'p_768_1024', name: 'Portrait (768x1024 - 3:4)', w: 768, h: 1024 },
    { key: 'p_1000_1500', name: 'Pinterest Pin (1000x1500 - 2:3)', w: 1000, h: 1500 },
    { key: 'p_720_1280', name: 'Story HD (720x1280 - 9:16)', w: 720, h: 1280 },
    { key: 'p_1080_1920', name: 'Story FHD (1080x1920 - 9:16)', w: 1080, h: 1920 },
    { key: 'l_640_480', name: 'SD (640x480 - 4:3)', w: 640, h: 480 },
    { key: 'l_1024_768', name: 'Landscape (1024x768 - 4:3)', w: 1024, h: 768 },
    { key: 'l_1280_720', name: 'HD (1280x720 - 16:9)', w: 1280, h: 720 },
    { key: 'l_1920_1080', name: 'Full HD (1920x1080 - 16:9)', w: 1920, h: 1080 },
    { key: 'l_1280_540', name: 'Ultrawide (1280x540 - 21:9ish)', w: 1280, h: 540 },
    // { key: 'banner_728_90', name: 'Web Banner (728x90)', w: 728, h: 90 }, // Optional
  ], []);

  // Effect to synchronize selectedPresetKey with manual width/height inputs
  useEffect(() => {
    const currentW = parseInt(widthInput, 10);
    const currentH = parseInt(heightInput, 10);

    if (!isNaN(currentW) && currentW > 0 && !isNaN(currentH) && currentH > 0) {
      const matchedPreset = RESOLUTION_PRESETS.find(p => p.w === currentW && p.h === currentH && p.key !== "custom");
      if (matchedPreset) {
        setSelectedPresetKey(matchedPreset.key);
      } else {
        setSelectedPresetKey("custom");
      }
    } else {
      // If inputs are invalid or empty, reflect as custom
      setSelectedPresetKey("custom");
    }
  }, [widthInput, heightInput, RESOLUTION_PRESETS]);


  // Define Style Presets - MOVED EARLIER & MEMOIZED
  const stylePresets = useMemo(() => [
    { id: 'photo', name: 'Photorealistic', promptSuffix: ', photorealistic, 8k, sharp focus', icon: ImageIconLucide },
    { id: 'film', name: 'Cinematic', promptSuffix: ', cinematic lighting, film grain, dramatic', icon: Film },
    { id: 'brush', name: 'Painting', promptSuffix: ', oil painting, impressionistic, textured brush strokes', icon: Brush },
    { id: 'vector', name: 'Vector Art', promptSuffix: ', vector illustration, flat colors, clean lines', icon: SquareIcon },
    { id: 'pixel', name: 'Pixel Art', promptSuffix: ', pixel art, 16-bit, retro game style', icon: Wand2 },
    { id: 'fantasy', name: 'Fantasy', promptSuffix: ', fantasy art, epic, detailed illustration', icon: Mic2 },
  ], []); // Empty dependency array means it's created once

  useEffect(() => {
    if (batchSize < 1) setBatchSize(1);
    if (batchSize > 5) setBatchSize(5); // Max 5 images per batch
  }, [batchSize]);

  const checkStylePresetScrollability = () => {
    const container = stylePresetsContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollStylePresetsLeft(scrollLeft > 0);
      setCanScrollStylePresetsRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for precision issues
    }
  };

  useEffect(() => {
    const container = stylePresetsContainerRef.current;
    checkStylePresetScrollability(); // Initial check

    container?.addEventListener('scroll', checkStylePresetScrollability);
    window.addEventListener('resize', checkStylePresetScrollability); // Recalculate on resize

    // Also check after presets might have rendered/changed
    const timeoutId = setTimeout(checkStylePresetScrollability, 100);


    return () => {
      container?.removeEventListener('scroll', checkStylePresetScrollability);
      window.removeEventListener('resize', checkStylePresetScrollability);
      clearTimeout(timeoutId);
    };
  }, [stylePresets]); // Re-check if stylePresets array changes, though it's static here

  const scrollStylePresets = (direction: 'left' | 'right') => {
    const container = stylePresetsContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth / 2; // Scroll by half the visible width
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const predefinedSuggestions = [
    "cinematic lighting", "hyperrealistic", "fantasy art", "sci-fi concept",
    "impressionist painting", "close-up portrait", "wide angle landscape",
    "vector art", "pixel art", "steampunk", "cyberpunk", "vaporwave",
    "detailed illustration", "oil painting", "watercolor", "charcoal sketch",
    "low poly", "isometric view", "depth of field", "golden hour", "blue hour",
    "dramatic lighting", "volumetric lighting", "studio lighting", "softbox lighting",
    "8k resolution", "highly detailed", "intricate details", "sharp focus",
    "vibrant colors", "monochromatic", "sepia tone", "black and white"
  ];

  // useEffect for theme dependent placeholder (Keep this early if it doesn't depend on later declarations)
  useEffect(() => {
    setIsMounted(true);
    // This effect might need adjustment based on currentBatchImages for placeholder logic
    const mainDisplayedUrl = currentBatchImages[currentBatchImageIndex]?.url;
    if (!mainDisplayedUrl && !isGenerating) { // Only set placeholder if no image and not generating
      if (currentImage !== initialDarkPlaceholder) {
        setCurrentImage(initialDarkPlaceholder);
      }
    } else if (mainDisplayedUrl && currentImage !== mainDisplayedUrl) {
      // This might not be needed if currentImage state is phased out for main display
      // setCurrentImage(mainDisplayedUrl);
    }
  }, [currentBatchImages, currentBatchImageIndex, isGenerating, initialDarkPlaceholder, currentImage]);

  useEffect(() => {
    if (activeTab === 'generate' && !prompt && promptTextareaRef.current && isMounted) {
      // Small delay to ensure the element is visible and transition is complete if any
      setTimeout(() => {
        promptTextareaRef.current?.focus();
      }, 100);
    }
  }, [activeTab, prompt, isMounted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the suggestions dropdown and the suggestion button
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('#suggestion-button')) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(prev => {
      const newPrompt = prev.trim();
      // Add a comma if the prompt isn't empty and doesn't end with a comma
      if (newPrompt && !newPrompt.endsWith(',')) {
        return `${newPrompt}, ${suggestion}`;
      }
      // If prompt is empty or ends with a comma, just append the suggestion
      return `${newPrompt} ${suggestion}`;
    });
    setShowSuggestions(false); // Hide suggestions after selection
    promptTextareaRef.current?.focus(); // Focus back on the prompt
  };

  const handleStylePresetClick = (suffix: string) => {
    setPrompt(prev => {
      const newPrompt = prev.trim();
      if (newPrompt && !newPrompt.endsWith(',')) {
        return `${newPrompt}, ${suffix.startsWith(',') ? suffix.substring(1).trim() : suffix.trim()}`;
      }
      return `${newPrompt} ${suffix.startsWith(',') ? suffix.substring(1).trim() : suffix.trim()}`;
    });
    showToast('Style applied to prompt!', 'success');
    promptTextareaRef.current?.focus();
  };

  const toggleSelectForComparison = (id: string) => {
    setSelectedForComparison(prev =>
      prev.includes(id) ? prev.filter(imageId => imageId !== id) : [...prev, id]
    );
  };

  // Ref for handling image download
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // Function to display a toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Function to generate an image
  const generateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Strict validation for width and height inputs
    const trimmedWidthInput = widthInput.trim();
    const trimmedHeightInput = heightInput.trim();
    const parsedWidth = parseInt(trimmedWidthInput, 10);
    const parsedHeight = parseInt(trimmedHeightInput, 10);

    if (trimmedWidthInput === '' || trimmedHeightInput === '') {
      showToast('Width and Height fields cannot be empty.', 'error');
      setIsGenerating(false);
      return;
    }

    if (isNaN(parsedWidth) || parsedWidth <= 0 || isNaN(parsedHeight) || parsedHeight <= 0) {
      showToast('Width and Height must be valid positive numbers.', 'error');
      setIsGenerating(false);
      return;
    }

    // If validation passes, update the numeric states for the API call
    setWidth(parsedWidth);
    setHeight(parsedHeight);

    if (!prompt.trim()) {
      showToast('Please enter a prompt to generate an image.', 'error');
      return;
    }

    setIsGenerating(true);
    const currentBatchSize = Math.max(1, Math.min(batchSize, 5));
    let generatedCount = 0;
    const newImagesBatch: GeneratedImage[] = [];

    if (currentBatchSize > 1) {
      showToast(`Starting batch generation for ${currentBatchSize} images...`, 'success');
    }

    for (let i = 0; i < currentBatchSize; i++) {
      try {
        const currentSeed = (i === 0 && seed.trim()) ? seed.trim() : Math.floor(Math.random() * 1000000).toString();

        showToast(`Generating image ${i + 1} of ${currentBatchSize}... (Seed: ${currentSeed})`, 'success');

        // Use the new API utility function
        const dataUrl = await generateImageWithAPI({
          prompt: prompt.trim(),
          model: model as ModelName,
          width: parsedWidth,
          height: parsedHeight,
          seed: currentSeed,
          referenceImage: referenceImage || undefined,
        });

        const newImage: GeneratedImage = {
          id: `${Date.now()}-${i}`,
          url: dataUrl,
          prompt: prompt.trim(),
          model,
          width: parsedWidth,
          height: parsedHeight,
          seed: currentSeed,
          timestamp: Date.now(),
        };
        newImagesBatch.push(newImage);
        generatedCount++;
      } catch (error) {
        console.error(`Error generating image ${i + 1} in batch:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showToast(`Failed to generate image ${i + 1}: ${errorMessage}`, 'error');
        if (i === 0 && currentBatchSize === 1) {
          setCurrentImage('https://placehold.co/1024x1024/111827/ff4d4d?text=Error+Loading+Image');
        }
      }
    }

    if (newImagesBatch.length > 0) {
      setImages(prev => [...newImagesBatch, ...prev.slice(0, 50 - newImagesBatch.length)]);
      setCurrentBatchImages(newImagesBatch);
      setCurrentBatchImageIndex(0);
    } else {
      setCurrentBatchImages([]);
    }

    // Toast notifications based on outcome
    if (currentBatchSize > 1) {
      if (generatedCount === currentBatchSize) {
        showToast(`Batch complete! ${generatedCount} images generated.`, 'success');
      } else if (generatedCount > 0) {
        showToast(`Batch partially complete. ${generatedCount} of ${currentBatchSize} images generated.`, 'success');
      } else {
        showToast(`Batch failed. No images were generated.`, 'error');
      }
    } else if (generatedCount === 1) {
      showToast('Image generated successfully!', 'success');
    } else if (currentBatchSize === 1 && generatedCount === 0) {
      showToast('Failed to generate image.', 'error');
    }

    setIsGenerating(false);
  };

  // Function to download the current image
  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob(); // Get image as a blob
      const url = window.URL.createObjectURL(blob); // Create an object URL

      // Trigger download using a hidden anchor tag
      if (downloadRef.current) {
        downloadRef.current.href = url;
        downloadRef.current.download = `1magen_${Date.now()}.png`;
        downloadRef.current.click();
      }

      window.URL.revokeObjectURL(url); // Clean up the object URL
      showToast('Image downloaded successfully!', 'success');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      showToast('Failed to download image.', 'error');
    }
  };

  // Function to initiate saving current settings as a preset
  const initiateSavePreset = () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt before saving preset.', 'error');
      return;
    }
    setPresetName(''); // Clear previous name
    setShowSavePresetModal(true);
  };

  // Function to actually save the preset after modal confirmation
  const handleSavePresetConfirm = () => {
    if (!presetName.trim()) {
      showToast('Preset name cannot be empty.', 'error');
      return;
    }
    if (!prompt.trim()) { // Should not happen if initiateSavePreset was called, but good check
      showToast('Prompt is empty, cannot save preset.', 'error');
      setShowSavePresetModal(false);
      return;
    }

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      prompt: prompt.trim(),
      model,
      width,
      height,
    };

    setPresets(prev => [newPreset, ...prev]);
    showToast('Preset saved successfully!', 'success');
    setShowSavePresetModal(false);
    setPresetName(''); // Clear name for next time
  };


  // Function to load a saved preset into the generator
  const loadPreset = (preset: Preset) => {
    setPrompt(preset.prompt);
    setModel(preset.model);
    setWidthInput(String(preset.width)); // Update string input
    setHeightInput(String(preset.height)); // Update string input
    setWidth(preset.width); // Also update numeric state directly
    setHeight(preset.height); // Also update numeric state directly
    // Sync resolution preset dropdown if loaded preset matches one
    const matchedResPreset = RESOLUTION_PRESETS.find(rp => rp.w === preset.width && rp.h === preset.height && rp.key !== "custom");
    if (matchedResPreset) {
      setSelectedPresetKey(matchedResPreset.key);
    } else {
      setSelectedPresetKey("custom");
    }
    setActiveTab('generate'); // Switch to generate tab
    showToast('Preset loaded successfully!', 'success');
  };

  // Function to delete an image from history
  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    showToast('Image deleted successfully!', 'success');
  };

  // Function to delete a preset
  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(preset => preset.id !== id));
    showToast('Preset deleted successfully!', 'success');
  };

  // Function to copy image settings from history to generator
  const copyToGenerate = (image: GeneratedImage) => {
    setPrompt(image.prompt);
    setModel(image.model);
    setWidthInput(String(image.width)); // Update string input
    setHeightInput(String(image.height)); // Update string input
    setWidth(image.width); // Also update numeric state directly
    setHeight(image.height); // Also update numeric state directly
    if (image.seed) setSeed(image.seed); // Copy seed if it exists
    // Sync resolution preset dropdown if copied image dimensions match one
    const matchedResPreset = RESOLUTION_PRESETS.find(rp => rp.w === image.width && rp.h === image.height && rp.key !== "custom");
    if (matchedResPreset) {
      setSelectedPresetKey(matchedResPreset.key);
    } else {
      setSelectedPresetKey("custom");
    }
    setActiveTab('generate'); // Switch to generate tab
    showToast('Settings copied to generator!', 'success');
  };

  // Function to handle image enlargement
  const enlargeImage = (url: string, prompt: string = '') => {
    setEnlargedImage({ url, prompt });
  };

  // Function to close enlarged image modal
  const closeEnlargedImage = () => {
    setEnlargedImage(null);
  };

  // Function to generate a random seed
  const randomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000).toString());
  };

  return (
    <div className="text-white">
      {/* Toast Notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Internal Tab Switcher - Hidden in preview mode */}
      {!isPreview && (
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex space-x-1">
            {[
              { id: 'generate', label: 'Generate', icon: Camera },
              { id: 'history', label: 'History', icon: History },
              { id: 'presets', label: 'Presets', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'generate' | 'history' | 'presets')}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <main>
          {activeTab === 'generate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start">

              {/* Image Generation Form */}
              <div className="rounded-2xl shadow-2xl border border-white/10 p-8 bg-white/5 backdrop-blur-sm">
                <div className="space-y-6">

                  {/* Prompt Input */}
                  <div className="space-y-1">
                    <label htmlFor="prompt" className="block text-sm font-medium mb-1 text-gray-300">
                      Prompt <span className="text-xs text-gray-500">({prompt.length}/1000)</span>
                    </label>
                    <div className="relative">
                      <textarea
                        id="prompt"
                        ref={promptTextareaRef} // Assign ref
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                        rows={4}
                        style={{ minHeight: 'calc(1.5em * 4 + 2 * 0.75rem + 2px)' }}
                        className="w-full rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-y min-h-[44px] bg-white/5 text-white placeholder-gray-500"
                        placeholder="e.g., A majestic lion in a futuristic city, cinematic lighting"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            generateImage();
                          }
                        }}
                        maxLength={1000}
                      />
                      <button
                        id="suggestion-button"
                        type="button"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="absolute top-2 right-2 p-2 rounded-lg transition-colors bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
                        aria-label="Show prompt suggestions"
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>
                      {showSuggestions && (
                        <div
                          ref={suggestionsRef}
                          className="absolute z-10 top-full right-0 mt-1 w-64 max-h-60 overflow-y-auto rounded-lg shadow-xl py-1 text-sm bg-gray-900 border border-white/10 ring-1 ring-black ring-opacity-5 focus:outline-none"
                        >
                          {predefinedSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-left px-4 py-2 text-gray-300 hover:bg-white/10 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Style Presets Section */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Style Presets
                    </label>
                    <div className="flex items-center space-x-2">
                      {canScrollStylePresetsLeft && (
                        <button
                          onClick={() => scrollStylePresets('left')}
                          className="p-2 rounded-full transition-colors hover:bg-white/10 text-gray-400"
                          aria-label="Scroll style presets left"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}
                      <div ref={stylePresetsContainerRef} className="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1 hide-native-scrollbar">
                        {stylePresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => handleStylePresetClick(preset.promptSuffix)}
                            title={preset.name}
                            className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 p-2 rounded-xl border border-white/10 transition-all duration-300 flex flex-col items-center justify-center space-y-2 text-center bg-white/5 hover:bg-white/10 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] group"
                          >
                            <preset.icon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 group-hover:text-blue-400 transition-colors" />
                            <span className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                      {canScrollStylePresetsRight && (
                        <button
                          onClick={() => scrollStylePresets('right')}
                          className="p-2 rounded-full transition-colors hover:bg-white/10 text-gray-400"
                          aria-label="Scroll style presets right"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resolution Preset Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="resolutionPreset" className="block text-sm font-medium mb-1 text-gray-300">
                      Resolution Preset
                    </label>
                    <select
                      id="resolutionPreset"
                      value={selectedPresetKey}
                      onChange={(e) => {
                        const newKey = e.target.value;
                        setSelectedPresetKey(newKey);
                        if (newKey !== "custom") {
                          const preset = RESOLUTION_PRESETS.find(p => p.key === newKey);
                          if (preset) {
                            setWidthInput(String(preset.w));
                            setHeightInput(String(preset.h));
                            // Also update numeric state directly for immediate effect if generation happens before re-render
                            setWidth(preset.w);
                            setHeight(preset.h);
                          }
                        }
                      }}
                      className="w-full rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] appearance-none bg-white/5 text-white"
                    >
                      {RESOLUTION_PRESETS.map(preset => (
                        <option key={preset.key} value={preset.key} className="bg-gray-900">
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Width and Height Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="width" className="block text-sm font-medium mb-1 text-gray-300">
                        Width
                      </label>
                      <input
                        id="width"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={widthInput}
                        onChange={(e) => {
                          setWidthInput(e.target.value);
                        }}
                        className="w-full rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] bg-white/5 text-white placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="height" className="block text-sm font-medium mb-1 text-gray-300">
                        Height
                      </label>
                      <input
                        id="height"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={heightInput}
                        onChange={(e) => {
                          setHeightInput(e.target.value);
                        }}
                        className="w-full rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] bg-white/5 text-white placeholder-gray-500"
                      />
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-1">
                    <label htmlFor="model" className="block text-sm font-medium mb-1 text-gray-300">
                      Model
                    </label>
                    <select
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] appearance-none bg-white/5 text-white"
                    >
                      {Object.entries(API_CONFIG.models).map(([key, modelInfo]) => (
                        <option key={key} value={key} className="bg-gray-900">
                          {modelInfo.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Size Input */}
                  <div className="space-y-1">
                    <label htmlFor="batchSize" className="block text-sm font-medium mb-1 text-gray-300">
                      Number of Images (1-5)
                    </label>
                    <input
                      id="batchSize"
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      min="1"
                      max="5"
                      className="w-full rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] bg-white/5 text-white"
                    />
                  </div>

                  {/* Seed Input with Random Button */}
                  <div className="space-y-1">
                    <label htmlFor="seed" className="block text-sm font-medium mb-1 text-gray-300">
                      Seed (Optional)
                    </label>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <input
                        id="seed"
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="Leave empty for random"
                        className="flex-1 rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] min-w-0 bg-white/5 text-white placeholder-gray-500"
                      />
                      <button
                        type="button"
                        onClick={randomSeed}
                        className="px-4 py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/10"
                        aria-label="Generate random seed"
                      >
                        <Zap className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Reference Image Upload (only for gptimage model) - HIDDEN FOR NOW */}
                  {/* {model === 'gptimage' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Reference Image (Optional)
                      </label>
                      <div className="flex flex-col space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await fileToBase64(file);
                                setReferenceImage(base64);
                                setReferenceImageFile(file);
                                showToast('Reference image uploaded!', 'success');
                              } catch (error) {
                                console.error('Error uploading image:', error);
                                showToast('Failed to upload image', 'error');
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 px-4 py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/10"
                          >
                            <Upload className="w-5 h-5 mr-2" />
                            {referenceImageFile ? referenceImageFile.name : 'Upload Image'}
                          </button>
                          {referenceImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setReferenceImage(null);
                                setReferenceImageFile(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                                showToast('Reference image removed', 'success');
                              }}
                              className="px-4 py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30"
                              aria-label="Remove reference image"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        {referenceImage && (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/10">
                            <img
                              src={referenceImage}
                              alt="Reference"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}


                  {/* Action Buttons: Generate and Save Preset */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={generateImage}
                      disabled={isGenerating}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3 px-4 sm:px-6 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center min-h-[44px]"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate
                        </>
                      )}
                    </button>
                    <button
                      onClick={initiateSavePreset}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full transition-colors min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    >
                      Save Preset
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Display Area */}
              <div className="rounded-2xl border border-white/10 p-4 sm:p-6 flex flex-col bg-black/50 backdrop-blur-sm">
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 border border-white/10">
                  {isGenerating && currentBatchImages.length === 0 ? ( // Show spinner only if generating AND no images yet from current batch
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <>
                      <img
                        src={currentBatchImages[currentBatchImageIndex]?.url || initialDarkPlaceholder}
                        alt={currentBatchImages[currentBatchImageIndex]?.prompt || prompt || "Generated image"}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => {
                          const displayedImg = currentBatchImages[currentBatchImageIndex];
                          if (displayedImg) {
                            enlargeImage(displayedImg.url, displayedImg.prompt);
                          } else if (currentImage && currentImage !== initialDarkPlaceholder) {
                            // Fallback for a single non-batch image if currentImage holds it
                            enlargeImage(currentImage, prompt);
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const displayedImg = currentBatchImages[currentBatchImageIndex];
                          if (displayedImg) {
                            downloadImage(displayedImg.url);
                          } else if (currentImage && currentImage !== initialDarkPlaceholder) {
                            downloadImage(currentImage);
                          }
                        }}
                        className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-300 bg-green-600 hover:bg-green-500 text-white ${(!currentBatchImages[currentBatchImageIndex]?.url && currentImage === initialDarkPlaceholder) ? 'hidden' : ''}`} // Hide if placeholder
                        aria-label="Download image"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Prompt Display for current batch image */}
                {(currentBatchImages.length > 0 && currentBatchImages[currentBatchImageIndex]) && (
                  <p className="text-xs sm:text-sm text-gray-300 mb-2 truncate" title={currentBatchImages[currentBatchImageIndex]?.prompt}>
                    {currentBatchImages[currentBatchImageIndex]?.prompt}
                  </p>
                )}

                {/* Batch Navigation Controls */}
                {currentBatchImages.length > 1 && (
                  <div className="flex items-center justify-center space-x-3 mt-auto pt-2"> {/* mt-auto to push to bottom if card is taller, pt-2 for spacing */}
                    <button
                      onClick={() => setCurrentBatchImageIndex(i => (i - 1 + currentBatchImages.length) % currentBatchImages.length)}
                      className="p-2 rounded-full transition-colors hover:bg-white/10 text-gray-300"
                      aria-label="Previous image in batch"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-sm text-gray-400">
                      {currentBatchImageIndex + 1} / {currentBatchImages.length}
                    </span>
                    <button
                      onClick={() => setCurrentBatchImageIndex(i => (i + 1) % currentBatchImages.length)}
                      className="p-2 rounded-full transition-colors hover:bg-white/10 text-gray-300"
                      aria-label="Next image in batch"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Generation History</h2>
                <div className="flex items-center space-x-4">
                  {selectedForComparison.length >= 2 && (
                    <button
                      onClick={() => setShowComparisonView(true)}
                      className="px-4 py-2 rounded-full transition-colors min-h-[44px] flex items-center justify-center text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Compare Selected ({selectedForComparison.length})
                    </button>
                  )}
                  <span className="text-sm text-gray-400">
                    {images.length} image{images.length === 1 ? '' : 's'}
                    {selectedForComparison.length > 0 && ` (${selectedForComparison.length} selected)`}
                  </span>
                </div>
              </div>
              {images.length === 0 ? (
                <div className="text-center py-10 sm:py-12 rounded-2xl bg-white/5 border border-white/10">
                  <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
                  <p className="text-sm sm:text-base text-gray-400">
                    No images generated yet. Create your first masterpiece!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      onDelete={deleteImage}
                      onCopy={copyToGenerate}
                      onDownload={downloadImage}
                      onEnlarge={(img) => enlargeImage(img.url, img.prompt)}
                      isSelected={selectedForComparison.includes(image.id)}
                      onSelect={toggleSelectForComparison}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Presets Tab Content */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Saved Presets</h2>
                <span className="text-sm text-gray-400">
                  {presets.length} preset{presets.length === 1 ? '' : 's'}
                </span>
              </div>
              {presets.length === 0 ? (
                <div className="text-center py-10 sm:py-12 rounded-2xl bg-white/5 border border-white/10">
                  <Palette className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-600" />
                  <p className="text-sm sm:text-base text-gray-400">
                    No presets saved yet. Save your favorite settings for quick access!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {presets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      onLoad={loadPreset}
                      onDelete={deletePreset}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Hidden download link (used programmatically for downloads) */}
      <a ref={downloadRef} style={{ display: 'none' }} />

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <ImageModal
          imageUrl={enlargedImage.url}
          prompt={enlargedImage.prompt}
          onClose={closeEnlargedImage}
          onDownload={downloadImage}
        />
      )}

      {showComparisonView && selectedForComparison.length >= 2 && (
        <ComparisonModal
          imagesToCompare={selectedForComparison}
          allImages={images}
          onClose={() => {
            setShowComparisonView(false);
          }}
          onDownload={downloadImage}
        />
      )}

      <SavePresetModal
        isOpen={showSavePresetModal}
        onClose={() => {
          setShowSavePresetModal(false);
          setPresetName(''); // Clear name on close
        }}
        onSave={handleSavePresetConfirm}
        presetName={presetName}
        setPresetName={setPresetName}
      />
    </div>
  );
}
