"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Download, Settings, History, Sparkles, Trash2, Copy, Moon, Sun, Loader2, Zap, ImageIcon, Palette, Share2 } from 'lucide-react';

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

// Helper for keyboard navigation, add this outside any component or in a utils file
function focusFirstOrReturn(element: HTMLElement | null, shouldReturnFocusTo?: HTMLElement | null) {
  if (element) {
    const focusable = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
      return;
    }
  }
  shouldReturnFocusTo?.focus();
}


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

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" aria-hidden="true" />
    <span className="sr-only">Loading...</span>
  </div>
);

const ImageCard = ({ image, onDelete, onCopy, onDownload, onEnlarge, theme }: { // Added theme prop
  image: GeneratedImage;
  onDelete: (id: string) => void;
  onCopy: (image: GeneratedImage) => void;
  onDownload: (url: string) => void;
  onEnlarge: (image: GeneratedImage) => void;
  theme: string; // Added theme prop
}) => (
  <div className={`group relative rounded-lg overflow-hidden border transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 ${
    theme === 'dark' ? 'bg-gray-800/70 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
  }`}>
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

// Main Component
export default function ModernImagen() {
  // State variables for prompt, dimensions, model, and seed
  const [prompt, setPrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [model, setModel] = useState('flux');
  const [seed, setSeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>('https://placehold.co/1024x1024/111827/4f4f52?text=Your+Image+Will+Appear+Here');
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'presets'>('generate');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Custom hooks for local storage and theme
  const [images, setImages] = useLocalStorage<GeneratedImage[]>('generated-images', []);
  const [presets, setPresets] = useLocalStorage<Preset[]>('image-presets', []);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'generate' && !prompt && promptTextareaRef.current && isMounted) {
      // Small delay to ensure the element is visible and transition is complete if any
      setTimeout(() => {
        promptTextareaRef.current?.focus();
      }, 100);
    }
  }, [activeTab, prompt, isMounted]);

  // Ref for handling image download
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // Function to display a toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Function to generate an image
  const generateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent default form submission

    // Validate prompt input
    if (!prompt.trim()) {
      showToast('Please enter a prompt to generate an image.', 'error');
      return;
    }

    setIsGenerating(true); // Set generating state to true

    try {
      // Encode prompt and construct URL parameters
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const params = new URLSearchParams({
        width: width.toString(),
        height: height.toString(),
        model: model,
        nologo: 'true' // Added nologo parameter
      });

      if (seed && seed.trim()) {
        params.append('seed', seed.trim());
      }

      const finalURL = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
      console.log('Generating image with URL:', finalURL);
      
      // Load image to check for errors before setting it
      const testImage = new Image();
      testImage.crossOrigin = 'anonymous'; // Required for cross-origin images

      await new Promise((resolve, reject) => {
        testImage.onload = () => {
          console.log('Image loaded successfully');
          resolve(testImage);
        };
        testImage.onerror = (error) => {
          console.error('Image failed to load:', error);
          reject(error);
        };
        testImage.src = finalURL;
      });
      
      // Create a new GeneratedImage object and add to history
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: finalURL,
        prompt: prompt.trim(),
        model,
        width,
        height,
        seed: seed?.trim() || undefined,
        timestamp: Date.now()
      };

      setCurrentImage(finalURL); // Set the current displayed image
      setImages(prev => [newImage, ...prev.slice(0, 49)]); // Add to history, keeping max 50 images
      showToast('Image generated successfully!', 'success');
    } catch (error) {
      console.error('Generation error:', error);
      showToast('Failed to generate image. Please try again.', 'error');
      // Set a specific error placeholder image
      setCurrentImage('https://placehold.co/1024x1024/111827/ff4d4d?text=Error+Loading+Image');
    } finally {
      setIsGenerating(false); // Reset generating state
    }
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

  // Function to save current settings as a preset
  const savePreset = () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt before saving preset.', 'error');
      return;
    }

    if (isMounted) {
      const name = window.prompt('Enter preset name:'); // Prompt user for preset name
      if (!name) return; // If no name entered, do nothing

      const newPreset: Preset = {
        id: Date.now().toString(),
        name,
        prompt,
        model,
        width,
        height
      };

      setPresets(prev => [newPreset, ...prev]); // Add new preset to state
      showToast('Preset saved successfully!', 'success');
    }
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

                  {/* Seed Input with Random Button */}
                  <div className="space-y-1">
                    <label htmlFor="seed" className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Seed (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id="seed"
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="Leave empty for random"
                        className={`flex-1 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[44px] ${
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={randomSeed}
                        className={`px-4 py-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center ${
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
                      onClick={savePreset}
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
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {images.length} image{images.length === 1 ? '' : 's'}
                </span>
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
                      theme={theme} // Pass theme
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
    </div>
  );
}
