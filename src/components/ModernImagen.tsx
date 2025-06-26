"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Download, Settings, History, Sparkles, Trash2, Copy, Moon, Sun, Loader2, Zap, ImageIcon, Palette } from 'lucide-react';

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

// Components
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
  }`}>
    <div className="flex items-center space-x-2">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">×</button>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

const ImageCard = ({ image, onDelete, onCopy, onDownload }: {
  image: GeneratedImage;
  onDelete: (id: string) => void;
  onCopy: (image: GeneratedImage) => void;
  onDownload: (url: string) => void;
}) => (
  <div className="group relative bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300">
    <div className="aspect-square relative overflow-hidden">
      <img 
        src={image.url} 
        alt={image.prompt}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </div>
    <div className="p-3">
      <p className="text-sm text-gray-300 truncate">{image.prompt}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{image.model}</span>
        <div className="flex space-x-1">
          <button
            onClick={() => onDownload(image.url)}
            className="p-1 hover:bg-blue-600 rounded text-gray-400 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCopy(image)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(image.id)}
            className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
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
  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300">
    <h3 className="font-medium text-white mb-2">{preset.name}</h3>
    <p className="text-sm text-gray-400 mb-3 truncate">{preset.prompt}</p>
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{preset.model}</span>
      <div className="flex space-x-2">
        <button
          onClick={() => onLoad(preset)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          Load
        </button>
        <button
          onClick={() => onDelete(preset.id)}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
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
  
  // Custom hooks for local storage and theme
  const [images, setImages] = useLocalStorage<GeneratedImage[]>('generated-images', []);
  const [presets, setPresets] = useLocalStorage<Preset[]>('image-presets', []);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          <header className="text-center mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
                  1magen
                </h1>
              </div>
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-xl border transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-lg text-gray-400">Create stunning visuals with the power of AI</p>
          </header>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className={`flex rounded-xl p-1 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              {[
                { id: 'generate', label: 'Generate', icon: Camera },
                { id: 'history', label: 'History', icon: History },
                { id: 'presets', label: 'Presets', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as 'generate' | 'history' | 'presets')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Rendering based on Active Tab */}
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
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Prompt
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                      placeholder="e.g., A majestic lion in a futuristic city, cinematic lighting"
                      // Allow Ctrl/Cmd + Enter to generate
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          generateImage();
                        }
                      }}
                    />
                  </div>

                  {/* Width and Height Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Width
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Height
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className={`w-full rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
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
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Seed (Optional)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="Leave empty for random"
                        className={`flex-1 rounded-lg p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-600 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={randomSeed}
                        className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        <Zap className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Generate and Save Preset */}
                  <div className="flex space-x-4">
                    <button
                      onClick={generateImage}
                      disabled={isGenerating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center"
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
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Save Preset
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Display Area */}
              <div className={`rounded-2xl border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  {isGenerating ? (
                    <div className={`w-full h-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                    }`}>
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <>
                      <img
                        src={currentImage}
                        alt="Generated"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => downloadImage(currentImage)}
                        className="absolute bottom-4 right-4 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg shadow-lg transition-all duration-300"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Generation History</h2>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {images.length} images
                </span>
              </div>
              {images.length === 0 ? (
                // Display message if no images in history
                <div className={`text-center py-12 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                }`}>
                  <ImageIcon className={`w-16 h-16 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    No images generated yet. Create your first masterpiece!
                  </p>
                </div>
              ) : (
                // Display image cards if images exist
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      onDelete={deleteImage}
                      onCopy={copyToGenerate}
                      onDownload={downloadImage}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Presets Tab Content */}
          {activeTab === 'presets' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Saved Presets</h2>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {presets.length} presets
                </span>
              </div>
              {presets.length === 0 ? (
                // Display message if no presets saved
                <div className={`text-center py-12 rounded-xl ${
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                }`}>
                  <Palette className={`w-16 h-16 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    No presets saved yet. Save your favorite settings for quick access!
                  </p>
                </div>
              ) : (
                // Display preset cards if presets exist
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </div>

      {/* Hidden download link (used programmatically for downloads) */}
      <a ref={downloadRef} style={{ display: 'none' }} />
    </div>
  );
}
