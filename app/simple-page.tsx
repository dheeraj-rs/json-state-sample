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
                subtitle: 'Real-time state management',
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
            const response = await fetch(`/app-state.json?t=${Date.now()}`);
            if (response.ok) {
                const fileState = await response.json();
                this.state = { ...this.getDefaultState(), ...fileState };
                this.saveToLocalStorage();
                this.notifyObservers();
                return true;
            }
            await this.saveToFile();
        } catch (error) {
            console.error('Failed to load state:', error);
            await this.saveToFile();
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

        if (current[keys[keys.length - 1]] !== value) {
            current[keys[keys.length - 1]] = value;
            this.saveToLocalStorage();
            this.notifyObservers();
            await this.saveToFile();
        }
    }

    private async saveToFile(attempt = 1, maxAttempts = 3): Promise<void> {
        if (this.isSaving) return;
        this.isSaving = true;

        try {
            const response = await fetch('/api/save-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state, null, 2),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Failed to save state');
            }
        } catch (error) {
            console.error(`Error saving state (${attempt}/${maxAttempts}):`, error);
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                return this.saveToFile(attempt + 1, maxAttempts);
            }
            throw error;
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

export default function SimplePage() {
    const [state, setState] = useState<any>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        stateManager = new JSONStateManager();
        const unsubscribe = stateManager.subscribe(() => {
            setState({ ...stateManager.getState() });
        });

        const init = async () => {
            await stateManager.initialize();
            setState({ ...stateManager.getState() });
            setIsLoaded(true);
        };

        init();
        return () => unsubscribe();
    }, []);

    const handleInputChange = async (path: string, value: any, type: string = 'text') => {
        await stateManager?.updateState(path, type === 'number' ? parseInt(value) || 0 : value);
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b px-4 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                    <button
                        onClick={() => stateManager?.downloadJSON()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Theme Settings */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-600">
                            <Palette size={18} />
                            Theme
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                                <select
                                    value={state.theme?.mode}
                                    onChange={(e) => handleInputChange('theme.mode', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary</label>
                                    <input
                                        type="color"
                                        value={state.theme?.primaryColor}
                                        onChange={(e) => handleInputChange('theme.primaryColor', e.target.value)}
                                        className="w-full h-10 rounded cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary</label>
                                    <input
                                        type="color"
                                        value={state.theme?.secondaryColor}
                                        onChange={(e) => handleInputChange('theme.secondaryColor', e.target.value)}
                                        className="w-full h-10 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Layout Settings */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
                            <Layout size={18} />
                            Layout
                        </h2>
                        <div className="space-y-4">
                            {['sidebar', 'header', 'footer'].map((item) => (
                                <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700 capitalize">{item}</label>
                                    <input
                                        type="checkbox"
                                        checked={state.layout?.[item] || false}
                                        onChange={(e) => handleInputChange(`layout.${item}`, e.target.checked, 'checkbox')}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
                                <select
                                    value={state.layout?.columns}
                                    onChange={(e) => handleInputChange('layout.columns', e.target.value, 'number')}
                                    className="w-full p-2 border rounded-md"
                                >
                                    {[1, 2, 3, 4].map((num) => (
                                        <option key={num} value={num}>{num} Column{num !== 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-600">
                            <Settings size={18} />
                            Features
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(state.features || {}).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <label className="text-sm font-medium text-gray-700 capitalize">{key}</label>
                                    <input
                                        type="checkbox"
                                        checked={!!value}
                                        onChange={(e) => handleInputChange(`features.${key}`, e.target.checked, 'checkbox')}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* JSON Preview */}
                <div className="mt-8 bg-gray-900 rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 bg-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={16} className="text-blue-400" />
                            <span className="text-white font-medium">JSON Preview</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-green-400 text-xs">Live</span>
                        </div>
                    </div>
                    <pre className="p-4 overflow-auto max-h-96">
                        <code className="text-gray-100 text-sm">
                            {JSON.stringify(state, null, 2)}
                        </code>
                    </pre>
                </div>
            </main>
        </div>
    );
}
