"use client";

import { Download, Code, Palette, Settings, Monitor, FileText } from 'lucide-react';
import { useJSONState } from '../hooks/useJSONState';

export default function Home() {
  const { state, updateState, downloadJSON } = useJSONState();

  const handleInputChange = async (path: string, value: any, type: string = 'text') => {
    let processedValue = value;
    if (type === 'number') {
      processedValue = parseInt(value) || 0;
    } else if (type === 'checkbox') {
      processedValue = value;
    }
    updateState(path, processedValue);
  };

  const formatJSON = (obj: any) => {
    if (!obj) return '';
    const jsonString = JSON.stringify(obj, null, 2);
    return jsonString
      .replace(/(".*?")\s*:/g, '<span class="json-key">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex-shrink-0"></div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">JSON State Manager</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Real-time JSON state management</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadJSON}
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
                <Settings size={18} className="text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={state.theme?.color || '#3B82F6'}
                      onChange={(e) => handleInputChange('theme.color', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700">Sidebar</label>
                    <input
                      type="checkbox"
                      checked={state.layout?.sidebar || false}
                      onChange={(e) => handleInputChange('layout.sidebar', e.target.checked, 'checkbox')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

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