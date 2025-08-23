"use client";

import { useEffect, useState } from 'react';
import { Download, Code, Palette, Settings, Monitor, FileText } from 'lucide-react';

class JSONStateManager {
  private state: any;
  private observers: Set<() => void> = new Set();
  private storageKey = 'app-json-state';
  private isSaving = false;

  constructor() {
    this.state = this.getDefaultState();
  }

  private getDefaultState() {
    return {
      theme: {
        mode: 'light',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        backgroundColor: '#ffffff',
        textColor: '#1f2937'
      },
      layout: {
        sidebar: true,
        header: true,
        footer: false,
        columns: 2
      },
      content: {
        title: 'JSON State Manager',
        subtitle: 'Real-time state management with file persistence',
        showImages: true,
        showButtons: true
      },
      features: {
        animations: true,
        transitions: true,
        shadows: true,
        gradients: false
      },
      settings: {
        autoSave: true,
        livePreview: true,
        showJson: true,
        fontSize: 16
      }
    };
  }

  async loadFromFile() {
    try {
      const response = await fetch(`/app-state.json?t=${Date.now()}`); // Cache busting
      if (response.ok) {
        const fileState = await response.json();
        this.state = { ...this.getDefaultState(), ...fileState }; // Merge with defaults
        this.saveToLocalStorage();
        this.notifyObservers();
        return true;
      }
      await this.saveToFile(); // Save defaults if file doesn't exist
    } catch (error) {
      console.error('Failed to load state from file:', error);
      await this.saveToFile(); // Save defaults on error
    }
    return false;
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }
  }

  private loadFromLocalStorage() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        try {
          this.state = JSON.parse(saved);
          return true;
        } catch (e) {
          console.error('Failed to parse saved state:', e);
        }
      }
    }
    return false;
  }

  async initialize() {
    const loadedFromStorage = this.loadFromLocalStorage();
    if (!loadedFromStorage) {
      await this.loadFromFile();
    }
    this.notifyObservers();
  }

  getState() {
    return this.state;
  }

  async updateState(path: string, value: any) {
    if (this.isSaving) return;

    const keys = path.split('.');
    let current = this.state;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    // Only update if value changed
    if (current[keys[keys.length - 1]] !== value) {
      current[keys[keys.length - 1]] = value;
      this.saveToLocalStorage();
      this.notifyObservers();
      await this.saveToFile();
    }
  }

  private async saveToFile(attempt = 1, maxAttempts = 3): Promise<void> {
    if (this.isSaving) {
      console.log('Save already in progress, skipping...');
      return;
    }

    this.isSaving = true;
    const startTime = Date.now();

    try {
      const response = await fetch('/api/save-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state, null, 2),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server responded with error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save state');
      }
    } catch (error) {
      console.error(`❌ Error saving state (attempt ${attempt}):`, error);

      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * attempt, 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.saveToFile(attempt + 1, maxAttempts);
      } else {
        console.error('Max retry attempts reached, giving up');
        throw error;
      }

    } finally {
      this.isSaving = false;
    }
  }

  subscribe(callback: () => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers() {
    requestAnimationFrame(() => {
      this.observers.forEach(callback => callback());
    });
  }

  downloadJSON() {
    const dataStr = JSON.stringify(this.state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'app-state.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Global state manager instance
let stateManager: JSONStateManager;

export default function Home() {
  const [state, setState] = useState<any>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize state manager
    stateManager = new JSONStateManager();

    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe(() => {
      const newState = stateManager.getState();
      setState({ ...newState });
    });

    // Initialize the state
    const init = async () => {
      await stateManager.initialize();
      const initialState = stateManager.getState();
      setState({ ...initialState });
      setIsLoaded(true);
    };

    init();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleInputChange = async (path: string, value: any, type: string = 'text') => {
    let processedValue = value;

    if (type === 'number') {
      processedValue = parseInt(value) || 0;
    } else if (type === 'checkbox') {
      processedValue = value;
    }

    await stateManager?.updateState(path, processedValue);
  };

  const formatJSON = (obj: any) => {
    if (!obj) return '';

    const jsonString = JSON.stringify(obj, null, 2);

    // Create syntax highlighted JSON
    return jsonString
      .replace(/(".*?")\s*:/g, '<span class="json-key">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading JSON state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex-shrink-0"></div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">JSON State Manager</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Real-time state management with file persistence</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => stateManager?.downloadJSON()}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-2/5 xl:w-1/3 bg-white border-b lg:border-b-0 lg:border-r overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-6">

            {/* Theme Controls */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Palette size={18} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Theme Settings</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                  <select
                    value={state.theme?.mode || 'light'}
                    onChange={(e) => handleInputChange('theme.mode', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={state.theme?.primaryColor || '#3B82F6'}
                    onChange={(e) => handleInputChange('theme.primaryColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <input
                    type="color"
                    value={state.theme?.secondaryColor || '#10B981'}
                    onChange={(e) => handleInputChange('theme.secondaryColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                  <input
                    type="color"
                    value={state.theme?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleInputChange('theme.backgroundColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <input
                    type="color"
                    value={state.theme?.textColor || '#1f2937'}
                    onChange={(e) => handleInputChange('theme.textColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>
              </div>
            </section>

            {/* Layout Controls */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Monitor size={18} className="text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Layout Options</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Sidebar</label>
                    <input
                      type="checkbox"
                      checked={state.layout?.sidebar || false}
                      onChange={(e) => handleInputChange('layout.sidebar', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Header</label>
                    <input
                      type="checkbox"
                      checked={state.layout?.header || false}
                      onChange={(e) => handleInputChange('layout.header', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Footer</label>
                    <input
                      type="checkbox"
                      checked={state.layout?.footer || false}
                      onChange={(e) => handleInputChange('layout.footer', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
                  <select
                    value={state.layout?.columns || 2}
                    onChange={(e) => handleInputChange('layout.columns', e.target.value, 'number')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">1 Column</option>
                    <option value="2">2 Columns</option>
                    <option value="3">3 Columns</option>
                    <option value="4">4 Columns</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Content Controls */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Code size={18} className="text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Content Options</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={state.content?.title || ''}
                    onChange={(e) => handleInputChange('content.title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={state.content?.subtitle || ''}
                    onChange={(e) => handleInputChange('content.subtitle', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter subtitle..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Images</label>
                    <input
                      type="checkbox"
                      checked={state.content?.showImages || false}
                      onChange={(e) => handleInputChange('content.showImages', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Buttons</label>
                    <input
                      type="checkbox"
                      checked={state.content?.showButtons || false}
                      onChange={(e) => handleInputChange('content.showButtons', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Feature Controls */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Settings size={18} className="text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Features & Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Animations</label>
                    <input
                      type="checkbox"
                      checked={state.features?.animations || false}
                      onChange={(e) => handleInputChange('features.animations', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Transitions</label>
                    <input
                      type="checkbox"
                      checked={state.features?.transitions || false}
                      onChange={(e) => handleInputChange('features.transitions', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Shadows</label>
                    <input
                      type="checkbox"
                      checked={state.features?.shadows || false}
                      onChange={(e) => handleInputChange('features.shadows', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Gradients</label>
                    <input
                      type="checkbox"
                      checked={state.features?.gradients || false}
                      onChange={(e) => handleInputChange('features.gradients', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Auto Save</label>
                    <input
                      type="checkbox"
                      checked={state.settings?.autoSave || false}
                      onChange={(e) => handleInputChange('settings.autoSave', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Live Preview</label>
                    <input
                      type="checkbox"
                      checked={state.settings?.livePreview || false}
                      onChange={(e) => handleInputChange('settings.livePreview', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Size: {state.settings?.fontSize || 16}px</label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={state.settings?.fontSize || 16}
                    onChange={(e) => handleInputChange('settings.fontSize', e.target.value, 'number')}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>12px</span>
                    <span>18px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Panel - JSON Display */}
        <div className="flex-1 bg-gray-900 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* JSON Header */}
            <div className="bg-gray-800 px-4 lg:px-6 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText size={16} className="text-blue-400" />
                  <span className="text-white font-medium text-sm lg:text-base">JSON State View</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-xs">Live</span>
                  <span className="text-gray-400 text-xs ml-2">
                    {Object.keys(state).length} sections • {JSON.stringify(state).length} chars
                  </span>
                </div>
              </div>
            </div>

            {/* JSON Content */}
            <div className="flex-1 overflow-auto p-4 lg:p-6">
              <div className="json-container h-full">
                <div className="json-content bg-gray-900 p-6 rounded-b-lg flex-1 overflow-auto">
                  <pre className="text-gray-100 font-mono text-sm leading-relaxed">
                    <code dangerouslySetInnerHTML={{ __html: formatJSON(state) }} />
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .json-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .json-header {
          flex-shrink: 0;
        }
        
        .json-content {
          flex: 1;
          min-height: 0;
        }
        
        .json-key {
          color: #60a5fa;
          font-weight: 500;
        }
        
        .json-string {
          color: #34d399;
        }
        
        .json-number {
          color: #fbbf24;
        }
        
        .json-boolean {
          color: #f87171;
          font-weight: 500;
        }
        
        .json-null {
          color: #9ca3af;
          font-style: italic;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 1024px) {
          .json-content {
            font-size: 12px;
            padding: 1rem;
          }
        }
        
        @media (max-width: 640px) {
          .json-content {
            font-size: 11px;
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}