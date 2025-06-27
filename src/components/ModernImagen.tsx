"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Camera, Download, Settings, History, Sparkles, Trash2, Copy, Moon, Sun, Loader2, Zap, ImageIcon, Palette, Share2, Lightbulb, Image as ImageIconLucide, Film, Brush, Square as SquareIcon, Mic2, Wand2, Check, ChevronLeft, ChevronRight } from 'lucide-react';

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

const useTheme = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
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

const ImageModal = ({ imageUrl, prompt, onClose, onDownload, theme }: { 
  imageUrl: string; 
  prompt: string; 
  onClose: () => void; 
  onDownload: (url: string) => void;
  theme: string;
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
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" // Ensure modal is above other content but below toast
      onClick={onClose} // Close on overlay click
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-prompt"
      aria-describedby="image-modal-description" // Optional: for more details
    >
      <div 
        className={`relative max-w-[95vw] max-h-[95vh] flex flex-col items-center p-4 rounded-lg ${
           theme === 'dark' ? 'bg-gray-800' : 'bg-white' // Modal background
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${ // Adjusted position
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white focus:ring-gray-500'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 focus:ring-gray-400'
          } focus:ring-2 `}
          aria-label="Close image preview"
        >
          ×
        </button>
        <img 
          src={imageUrl} 
          alt={prompt || "Enlarged generated image"} // More descriptive alt
          className="max-w-[calc(95vw-4rem)] max-h-[calc(95vh-8rem)] object-contain mb-4" // Ensure padding is accounted for
        />
        {prompt && (
          <p id="image-modal-prompt" className={`text-center text-sm max-w-[80%] truncate mb-2 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          }`}>{prompt}</p>
        )}
        {/* <p id="image-modal-description" className="sr-only">This is an enlarged view of the generated image.</p> */}
        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => onDownload(imageUrl)}
            className={`p-2 px-4 rounded-lg shadow-lg transition-all duration-300 min-h-[44px] flex items-center ${
               theme === 'dark'
                 ? 'bg-green-700 hover:bg-green-600 text-white focus:ring-green-500'
                 : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-400'
            } focus:ring-2`}
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
                    url: imageUrl, // Sharing the direct image URL might not always work as expected in all apps
                                   // Consider sharing a page URL that displays the image if issues arise
                  });
                } catch (error) {
                  console.error('Error sharing:', error);
                  // Optionally show a toast message for error
                  // showToast('Could not share image.', 'error');
                }
              }}
              className={`p-2 px-4 rounded-lg shadow-lg transition-all duration-300 min-h-[44px] flex items-center ${
                 theme === 'dark'
                   ? 'bg-blue-700 hover:bg-blue-600 text-white focus:ring-blue-500'
                   : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400'
              } focus:ring-2`}
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
  theme
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  presetName: string;
  setPresetName: (name: string) => void;
  theme: string;
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
      className="fixed inset-0 bg-black/75 z-[80] flex items-center justify-center p-4" // Ensure high z-index
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-preset-modal-title"
    >
      <div
        className={`relative w-full max-w-md rounded-xl p-6 shadow-xl ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="save-preset-modal-title" className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Save Preset
        </h2>

        <div className="space-y-2 mb-6">
          <label htmlFor="presetNameInput" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Preset Name
          </label>
          <input
            id="presetNameInput"
            ref={inputRef}
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="e.g., My Awesome Style"
            className={`w-full rounded-lg p-3 border focus:ring-2 focus:border-blue-500 transition-all duration-200 min-h-[44px] ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
            }`}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              theme === 'dark'
                ? 'bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-400'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400'
            } focus:ring-2 focus:ring-offset-2 ${theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
          >
            Cancel
          </button>
          <button
            ref={saveButtonRef}
            onClick={onSave}
            disabled={!presetName.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] flex items-center justify-center shadow-sm ${
              !presetName.trim()
                ? (theme === 'dark' ? 'bg-gray-500 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                : (theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                    : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400')
            } focus:ring-2 focus:ring-offset-2 ${theme === 'dark' ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
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
  theme,
  isSelected,
  onSelect
}: {
  image: GeneratedImage;
  onDelete: (id: string) => void;
  onCopy: (image: GeneratedImage) => void;
  onDownload: (url: string) => void;
  onEnlarge: (image: GeneratedImage) => void;
  theme: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => (
  <div className={`group relative rounded-lg overflow-hidden border transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 ${
    theme === 'dark' ? 'bg-gray-800/70 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
  } ${isSelected ? (theme === 'dark' ? 'ring-2 ring-blue-500 border-blue-500' : 'ring-2 ring-blue-500 border-blue-500') : ''}`}>
    <div
      className="absolute top-2 right-2 z-10 p-1.5 rounded-full cursor-pointer transition-colors focus:ring-2 focus:ring-offset-1"
      onClick={(e) => {
        e.stopPropagation(); // Prevent onEnlarge when clicking checkbox
        onSelect(image.id);
      }}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0} // Make it focusable
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onSelect(image.id); }}}
      aria-label={`Select image for comparison: ${image.prompt}`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
        isSelected
          ? (theme === 'dark' ? 'bg-blue-600 border-blue-500' : 'bg-blue-600 border-blue-500')
          : (theme === 'dark' ? 'border-gray-400 hover:border-gray-300' : 'border-gray-500 hover:border-gray-400')
      }`}>
        {isSelected && <Check className={`w-3 h-3 ${theme === 'dark' ? 'text-white' : 'text-white'}`} />}
      </div>
    </div>
    <div className="aspect-square relative overflow-hidden cursor-pointer" onClick={() => onEnlarge(image)} role="button" aria-label={`View details for image: ${image.prompt}`}>
      <img 
        src={image.url} 
        alt={image.prompt} // Prompt is already good alt text
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </div>
    <div className="p-3">
      <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{image.prompt}</p>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{image.model}</span>
        <div className="flex space-x-1">
          <button
            onClick={() => onDownload(image.url)}
            className={`p-1.5 rounded transition-colors focus:ring-2 focus:ring-offset-1 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800'
                : 'text-gray-500 hover:text-blue-700 hover:bg-blue-100 focus:ring-blue-500 focus:ring-offset-white'
            }`}
            aria-label="Download image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCopy(image)}
            className={`p-1.5 rounded transition-colors focus:ring-2 focus:ring-offset-1 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-700 focus:ring-gray-600 focus:ring-offset-gray-800'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 focus:ring-gray-500 focus:ring-offset-white'
            }`}
            aria-label="Copy image settings"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(image.id)}
            className={`p-1.5 rounded transition-colors focus:ring-2 focus:ring-offset-1 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-red-600 focus:ring-red-500 focus:ring-offset-gray-800'
                : 'text-gray-500 hover:text-red-700 hover:bg-red-100 focus:ring-red-500 focus:ring-offset-white'
            }`}
            aria-label="Delete image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PresetCard = ({ preset, onLoad, onDelete, theme }: { // Added theme prop
  preset: Preset;
  onLoad: (preset: Preset) => void;
  onDelete: (id: string) => void;
  theme: string; // Added theme prop
}) => (
  <div className={`rounded-lg p-4 border transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 ${
    theme === 'dark' ? 'bg-gray-800/70 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
  }`}>
    <h3 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{preset.name}</h3>
    <p className={`text-sm mb-3 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{preset.prompt}</p>
    <div className="flex justify-between items-center">
      <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{preset.model}</span>
      <div className="flex space-x-2">
        <button
          onClick={() => onLoad(preset)}
          className={`px-3 py-1.5 text-xs rounded transition-colors min-h-[38px] flex items-center focus:ring-2 focus:ring-offset-1 ${
            theme === 'dark'
              ? 'bg-blue-700 hover:bg-blue-600 text-white focus:ring-blue-500 focus:ring-offset-gray-800'
              : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-white'
          }`}
        >
          Load
        </button>
        <button
          onClick={() => onDelete(preset.id)}
          className={`px-3 py-1.5 text-xs rounded transition-colors min-h-[38px] flex items-center focus:ring-2 focus:ring-offset-1 ${
             theme === 'dark'
              ? 'bg-red-700 hover:bg-red-600 text-white focus:ring-red-500 focus:ring-offset-gray-800'
              : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-white'
          }`}
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
  theme,
  onClose,
  onDownload
}: {
  imagesToCompare: string[];
  allImages: GeneratedImage[];
  theme: string;
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
      className="fixed inset-0 bg-black/85 z-[70] flex items-center justify-center p-4 overflow-y-auto" // Higher z-index than image modal
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
    >
      <div
        className={`relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-xl p-4 sm:p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="comparison-modal-title" className={`text-xl sm:text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Compare Images ({selectedImagesData.length})
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white focus:ring-gray-500'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 focus:ring-gray-400'
            } focus:ring-2`}
            aria-label="Close comparison view"
          >
            ×
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar spacing */}
          <div className={`grid grid-cols-1 md:grid-cols-${selectedImagesData.length > 1 ? selectedImagesData.length : 2} gap-4 sm:gap-6`}>
            {selectedImagesData.map((image) => (
              <div key={image.id} className={`rounded-lg border p-3 flex flex-col ${theme === 'dark' ? 'bg-gray-700/70 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="w-full aspect-square object-cover rounded-md mb-3"
                />
                <div className="space-y-1.5 text-xs overflow-hidden">
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} title={image.prompt}>
                    <strong className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}>Prompt:</strong> <span className="block max-h-10 overflow-y-auto text-ellipsis">{image.prompt}</span>
                  </p>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <strong className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}>Model:</strong> {image.model}
                  </p>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <strong className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}>Size:</strong> {image.width}x{image.height}
                  </p>
                  {image.seed && (
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <strong className={`${theme === 'dark' ? 'text-white' : 'text-black'}`}>Seed:</strong> {image.seed}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDownload(image.url)}
                  className={`mt-3 w-full p-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center ${
                    theme === 'dark'
                      ? 'bg-blue-700 hover:bg-blue-600 text-white focus:ring-blue-500'
                      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400'
                  } focus:ring-2 focus:ring-offset-1 ${theme === 'dark' ? 'focus:ring-offset-gray-700' : 'focus:ring-offset-gray-50' }`}
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
export default function ModernImagen() {
  // State variables for prompt, dimensions, model, and seed
  const [prompt, setPrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [model, setModel] = useState('flux');
  const [seed, setSeed] = useState('');
  const [batchSize, setBatchSize] = useState(1); // Added batchSize state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>('https://placehold.co/1024x1024/111827/4f4f52?text=Your+Image+Will+Appear+Here');
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'presets'>('generate');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const initialDarkPlaceholder = 'https://placehold.co/1024x1024/111827/4f4f52?text=Your+Image+Will+Appear+Here';
  const initialLightPlaceholder = 'https://placehold.co/1024x1024/f3f4f6/1f2937?text=Your+Image+Will+Appear+Here'; // bg-gray-200, text-gray-800

  // Custom hooks for local storage and theme
  const [images, setImages] = useLocalStorage<GeneratedImage[]>('generated-images', []);
  const [presets, setPresets] = useLocalStorage<Preset[]>('image-presets', []);
  const { theme, toggleTheme } = useTheme();

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
      setCanScrollStylePresetsRight(scrollLeft < scrollWidth - clientWidth -1); // -1 for precision issues
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
    // Check if currentImage is the default dark placeholder and theme is light
    if (theme === 'light' && currentImage === initialDarkPlaceholder) {
      setCurrentImage(initialLightPlaceholder);
    }
    // Or if currentImage is the default light placeholder and theme is dark (e.g. if theme changed while placeholder was visible)
    else if (theme === 'dark' && currentImage === initialLightPlaceholder) {
      setCurrentImage(initialDarkPlaceholder);
    }
  }, [theme, currentImage]); // Add currentImage to dependencies to handle theme changes while placeholder is shown

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

    if (!prompt.trim()) {
      showToast('Please enter a prompt to generate an image.', 'error');
      return;
    }

    setIsGenerating(true);
    const currentBatchSize = Math.max(1, Math.min(batchSize, 5)); // Ensure batchSize is within 1-5
    let generatedCount = 0;
    const newImagesBatch: GeneratedImage[] = [];

    if (currentBatchSize > 1) {
      showToast(`Starting batch generation for ${currentBatchSize} images...`, 'success');
    }

    for (let i = 0; i < currentBatchSize; i++) {
      try {
        const currentSeed = (i === 0 && seed.trim()) ? seed.trim() : Math.floor(Math.random() * 1000000).toString();

        showToast(`Generating image ${i + 1} of ${currentBatchSize}... (Seed: ${currentSeed})`, 'success');

        const encodedPrompt = encodeURIComponent(prompt.trim());
        const params = new URLSearchParams({
          width: width.toString(),
          height: height.toString(),
          model: model,
          nologo: 'true',
          seed: currentSeed, // Use currentSeed for each image
        });

        const finalURL = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
        console.log(`Generating image ${i + 1}/${currentBatchSize} with URL:`, finalURL);

        const testImage = new Image();
        testImage.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
          testImage.onload = () => {
            console.log(`Image ${i + 1} loaded successfully`);
            resolve(testImage);
          };
          testImage.onerror = (error) => {
            console.error(`Image ${i + 1} failed to load:`, error);
            reject(error);
          };
          testImage.src = finalURL;
        });

        const newImage: GeneratedImage = {
          id: `${Date.now()}-${i}`,
          url: finalURL,
          prompt: prompt.trim(),
          model,
          width,
          height,
          seed: currentSeed,
          timestamp: Date.now(),
        };
        newImagesBatch.push(newImage);
        setCurrentImage(finalURL); // Update current image preview with the latest one
        generatedCount++;

      } catch (error) {
        console.error(`Error generating image ${i + 1} in batch:`, error);
        showToast(`Failed to generate image ${i + 1} of ${currentBatchSize}.`, 'error');
        if (i === 0 && currentBatchSize === 1) { // Only set error placeholder if it's a single image or first in batch fails badly
             setCurrentImage('https://placehold.co/1024x1024/111827/ff4d4d?text=Error+Loading+Image');
        }
        // Continue to next image in batch
      }
    }

    if (newImagesBatch.length > 0) {
      setImages(prev => [...newImagesBatch, ...prev.slice(0, 50 - newImagesBatch.length)]);
    }

    if (currentBatchSize > 1) {
        if (generatedCount === currentBatchSize) {
            showToast(`Batch complete! ${generatedCount} images added to history.`, 'success');
            if (generatedCount > 0) setActiveTab('history');
        } else if (generatedCount > 0) {
            showToast(`Batch partially complete. ${generatedCount} of ${currentBatchSize} images added to history.`, 'success');
            setActiveTab('history');
        } else {
             showToast(`Batch failed. No images were generated.`, 'error');
        }
    } else if (generatedCount === 1) { // Single image success
        showToast('Image generated successfully!', 'success');
    } else if (currentBatchSize === 1 && generatedCount === 0) { // Single image fail
        // Error toast for single image failure is already shown in the catch block.
        // Ensure currentImage is set to placeholder if it failed.
        setCurrentImage(theme === 'dark' ? initialDarkPlaceholder : initialLightPlaceholder);
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
      // Keep modal open, let user correct
      // inputRef.current?.focus(); // This line caused a build error as inputRef is not in this scope. Modal input focuses on open anyway.
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
    setWidth(preset.width);
    setHeight(preset.height);
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
    setWidth(image.width);
    setHeight(image.height);
    if (image.seed) setSeed(image.seed); // Copy seed if it exists
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
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Toast Notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
                  1magen
                </h1>
              </div>

              {/* Desktop Navigation and Theme Toggle */}
              <div className="hidden md:flex items-center space-x-4">
                <nav className={`flex rounded-xl p-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  {[
                    { id: 'generate', label: 'Generate', icon: Camera },
                    { id: 'history', label: 'History', icon: History },
                    { id: 'presets', label: 'Presets', icon: Settings }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as 'generate' | 'history' | 'presets')}
                      className={`flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base ${
                        activeTab === id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
                <button
                  onClick={toggleTheme}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {/* Mobile Menu Button and Theme Toggle */}
              <div className="md:hidden flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className={`p-3 rounded-xl border transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(!isMenuOpen);
                    // If opening menu, focus it later or first item
                  }}
                  className={`p-3 rounded-xl border transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-menu-nav"
                >
                  {isMenuOpen ? <Settings className="w-5 h-5" /> : <Camera className="w-5 h-5" /> } {/* Placeholder icons */}
                </button>
              </div>
            </div>

            {/* Mobile Menu (Hamburger Menu) */}
            {isMenuOpen && (
              <nav
                id="mobile-menu-nav"
                className={`md:hidden mt-4 rounded-xl p-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}
                ref={(node) => { // Auto focus first item when menu opens
                  if (node && isMenuOpen) {
                    const firstButton = node.querySelector('button');
                    firstButton?.focus();
                  }
                }}
              >
                {[
                  { id: 'generate', label: 'Generate', icon: Camera },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'presets', label: 'Presets', icon: Settings }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveTab(id as 'generate' | 'history' | 'presets');
                      setIsMenuOpen(false); // Close menu on selection
                      // Focus should ideally return to the menu button, handled by previouslyFocusedElement in a more robust setup
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 my-1 rounded-lg transition-all duration-300 text-left ${
                      activeTab === id
                        ? 'bg-blue-600 text-white shadow-md'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </nav>
            )}
             <p className={`text-center text-md sm:text-lg mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Create stunning visuals with the power of AI
            </p>
          </header>

          {/* Conditional Rendering based on Active Tab (Main Content Area) */}
          <main className="mt-8"> {/* Added main tag and margin top */}
          {activeTab === 'generate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Image Generation Form */}
              <div className={`rounded-2xl shadow-2xl border p-8 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm' 
                  : 'bg-white border-gray-200'
              }`}>
                {/* Wrapped form content in a div since the form is replaced by a button */}
                <div className="space-y-6"> 
                  
                  {/* Prompt Input */}
                  <div className="space-y-1">
                    <label htmlFor="prompt" className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Prompt <span className="text-xs">({prompt.length}/1000)</span>
                    </label>
                    <div className="relative">
                      <textarea
                        id="prompt"
                        ref={promptTextareaRef} // Assign ref
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                      rows={4}
                      style={{ minHeight: 'calc(1.5em * 4 + 2 * 0.75rem + 2px)' }}
                      className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-y min-h-[44px] ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
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
                        className={`absolute top-2 right-2 p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900'
                        }`}
                        aria-label="Show prompt suggestions"
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>
                      {showSuggestions && (
                        <div
                          ref={suggestionsRef}
                          className={`absolute z-10 top-full right-0 mt-1 w-64 max-h-60 overflow-y-auto rounded-md shadow-lg py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        >
                          {predefinedSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                theme === 'dark'
                                  ? 'text-gray-200 hover:bg-gray-600'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
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
                    <label className={`block text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Style Presets
                    </label>
                    <div className="flex items-center space-x-2">
                      {canScrollStylePresetsLeft && (
                        <button
                          onClick={() => scrollStylePresets('left')}
                          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                          aria-label="Scroll style presets left"
                        >
                          <ChevronLeft className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                      )}
                      <div ref={stylePresetsContainerRef} className="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1 hide-native-scrollbar"> {/* Changed to hide-native-scrollbar */}
                        {stylePresets.map((preset) => (
                          <button
                            key={preset.id}
                          onClick={() => handleStylePresetClick(preset.promptSuffix)}
                          title={preset.name}
                          className={`flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center space-y-1 text-center ${
                            theme === 'dark'
                              ? 'bg-gray-700/60 border-gray-600 hover:border-blue-500 hover:bg-gray-700'
                              : 'bg-gray-100 border-gray-300 hover:border-blue-500 hover:bg-gray-200'
                          }`}
                        >
                          <preset.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                          <span className={`text-xs sm:text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {preset.name}
                          </span>
                        </button>
                      ))}
                      </div>
                      {canScrollStylePresetsRight && (
                        <button
                          onClick={() => scrollStylePresets('right')}
                          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                          aria-label="Scroll style presets right"
                        >
                          <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Width and Height Inputs - Stacked on mobile, side-by-side on md+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="width" className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Width
                      </label>
                      <input
                        id="width"
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] ${
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="height" className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Height
                      </label>
                      <input
                        id="height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] ${
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-1">
                    <label htmlFor="model" className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Model
                    </label>
                    <select
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] appearance-none ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="flux">Flux</option>
                      <option value="gptimage">GPT-Image</option>
                      <option value="turbo">Turbo</option>
                    </select>
                  </div>

                  {/* Batch Size Input */}
                  <div className="space-y-1">
                    <label htmlFor="batchSize" className={`block text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Number of Images (1-5)
                      </label>
                      <input
                        id="batchSize"
                        type="number"
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        min="1"
                        max="5"
                        className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] ${
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                  </div>

                  {/* Seed Input with Random Button */}
                  <div className="space-y-1">
                    <label htmlFor="seed" className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Seed (Optional)
                    </label>
                    {/* Container for input and button: flex-col by default, sm:flex-row */}
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <input
                        id="seed"
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="Leave empty for random"
                        className={`flex-1 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] min-w-0 ${ // Added min-w-0
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={randomSeed}
                        className={`px-4 py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center sm:w-auto ${ // sm:w-auto to allow button to size to content on larger screens if input takes flex-1
                          theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                        aria-label="Generate random seed"
                      >
                        <Zap className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Generate and Save Preset - Stacked on mobile, side-by-side on sm+ */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={generateImage}
                      disabled={isGenerating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center min-h-[44px]"
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
                      className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center ${
                        theme === 'dark'
                          ? 'bg-green-700 hover:bg-green-600 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      Save Preset
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Display Area */}
              <div className={`rounded-2xl border p-4 sm:p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  {isGenerating ? (
                    <div className={`w-full h-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-gray-700/70' : 'bg-gray-200/70' // Skeleton background
                    }`}>
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <>
                      <img
                        src={currentImage}
                        alt={prompt ? `Generated image for prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}` : "Generated image"}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => enlargeImage(currentImage, prompt)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(currentImage);
                        }}
                        className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 sm:p-3 rounded-lg shadow-lg transition-all duration-300 ${
                          theme === 'dark'
                            ? 'bg-green-700 hover:bg-green-600 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        aria-label="Download image"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">Generation History</h2>
                <div className="flex items-center space-x-4">
                  {selectedForComparison.length >= 2 && (
                    <button
                      onClick={() => setShowComparisonView(true)}
                      className={`px-4 py-2 rounded-lg transition-colors min-h-[44px] flex items-center justify-center text-sm font-medium shadow-sm ${
                        theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      Compare Selected ({selectedForComparison.length})
                    </button>
                  )}
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {images.length} image{images.length === 1 ? '' : 's'}
                    {selectedForComparison.length > 0 && ` (${selectedForComparison.length} selected)`}
                  </span>
                </div>
              </div>
              {images.length === 0 ? (
                <div className={`text-center py-10 sm:py-12 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                }`}>
                  <ImageIcon className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
                      theme={theme}
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
                <h2 className="text-xl sm:text-2xl font-bold">Saved Presets</h2>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {presets.length} preset{presets.length === 1 ? '' : 's'}
                </span>
              </div>
              {presets.length === 0 ? (
                <div className={`text-center py-10 sm:py-12 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                }`}>
                  <Palette className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
                      theme={theme} // Pass theme
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          </main> {/* Closing main tag */}
        </div>
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
          theme={theme}
        />
      )}

      {showComparisonView && selectedForComparison.length >= 2 && (
        <ComparisonModal
          imagesToCompare={selectedForComparison}
          allImages={images}
          theme={theme}
          onClose={() => {
            setShowComparisonView(false);
            // Optionally, clear selection after closing:
            // setSelectedForComparison([]);
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
        theme={theme}
      />
    </div>
  );
}
