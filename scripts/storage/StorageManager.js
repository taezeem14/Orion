/* ============================================
   AI Browser - Storage Manager
   Unified storage interface (localStorage + IndexedDB)
   ============================================ */

import IndexedDBHelper from './IndexedDBHelper.js';
import { CONFIG } from '../utils/constants.js';
import { storage } from '../utils/helpers.js';

class StorageManager {
    constructor() {
        this.db = IndexedDBHelper;
        this.ready = false;
    }
    
    async init() {
        try {
            await this.db.init();
            this.ready = true;
            console.log('Storage initialized');
        } catch (error) {
            console.error('Storage initialization failed:', error);
            throw error;
        }
    }
    
    // ===== Tab Operations =====
    async saveTabs(tabs) {
        try {
            // Save to IndexedDB
            for (const tab of tabs) {
                await this.db.put(CONFIG.INDEXEDDB.STORES.TABS, tab);
            }
            
            // Also save to localStorage for quick access
            storage.set(CONFIG.STORAGE_KEYS.TABS, tabs);
            
            return true;
        } catch (error) {
            console.error('Error saving tabs:', error);
            return false;
        }
    }
    
    async loadTabs() {
        try {
            // Try IndexedDB first
            const tabs = await this.db.getAll(CONFIG.INDEXEDDB.STORES.TABS);
            
            if (tabs && tabs.length > 0) {
                return tabs;
            }
            
            // Fallback to localStorage
            return storage.get(CONFIG.STORAGE_KEYS.TABS, []);
        } catch (error) {
            console.error('Error loading tabs:', error);
            return [];
        }
    }
    
    async deleteTab(tabId) {
        try {
            await this.db.delete(CONFIG.INDEXEDDB.STORES.TABS, tabId);
            return true;
        } catch (error) {
            console.error('Error deleting tab:', error);
            return false;
        }
    }
    
    // ===== History Operations =====
    async addHistory(entry) {
        try {
            await this.db.add(CONFIG.INDEXEDDB.STORES.HISTORY, entry);
            return true;
        } catch (error) {
            console.error('Error adding history:', error);
            return false;
        }
    }
    
    async getHistory(limit = 100) {
        try {
            const allHistory = await this.db.getAll(CONFIG.INDEXEDDB.STORES.HISTORY);
            return allHistory
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }
    
    async searchHistory(query) {
        try {
            const allHistory = await this.db.getAll(CONFIG.INDEXEDDB.STORES.HISTORY);
            const lowerQuery = query.toLowerCase();
            
            return allHistory.filter(entry => 
                entry.title?.toLowerCase().includes(lowerQuery) ||
                entry.url?.toLowerCase().includes(lowerQuery)
            ).sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Error searching history:', error);
            return [];
        }
    }
    
    async clearHistory() {
        try {
            await this.db.clear(CONFIG.INDEXEDDB.STORES.HISTORY);
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    }
    
    // ===== Bookmark Operations =====
    async addBookmark(bookmark) {
        try {
            await this.db.add(CONFIG.INDEXEDDB.STORES.BOOKMARKS, bookmark);
            return true;
        } catch (error) {
            console.error('Error adding bookmark:', error);
            return false;
        }
    }
    
    async getBookmarks(folder = null) {
        try {
            if (folder) {
                return await this.db.query(CONFIG.INDEXEDDB.STORES.BOOKMARKS, 'folder', folder);
            }
            return await this.db.getAll(CONFIG.INDEXEDDB.STORES.BOOKMARKS);
        } catch (error) {
            console.error('Error getting bookmarks:', error);
            return [];
        }
    }
    
    async deleteBookmark(bookmarkId) {
        try {
            await this.db.delete(CONFIG.INDEXEDDB.STORES.BOOKMARKS, bookmarkId);
            return true;
        } catch (error) {
            console.error('Error deleting bookmark:', error);
            return false;
        }
    }
    
    async isBookmarked(url) {
        try {
            const bookmarks = await this.db.getAll(CONFIG.INDEXEDDB.STORES.BOOKMARKS);
            return bookmarks.some(b => b.url === url);
        } catch (error) {
            return false;
        }
    }
    
    // ===== AI Chat Operations =====
    async saveChatMessage(message) {
        try {
            await this.db.add(CONFIG.INDEXEDDB.STORES.AI_CHATS, message);
            return true;
        } catch (error) {
            console.error('Error saving chat message:', error);
            return false;
        }
    }
    
    async getChatHistory(tabId = null) {
        try {
            if (tabId) {
                return await this.db.query(CONFIG.INDEXEDDB.STORES.AI_CHATS, 'tabId', tabId);
            }
            return await this.db.getAll(CONFIG.INDEXEDDB.STORES.AI_CHATS);
        } catch (error) {
            console.error('Error getting chat history:', error);
            return [];
        }
    }
    
    async clearChatHistory(tabId = null) {
        try {
            if (tabId) {
                const chats = await this.getChatHistory(tabId);
                for (const chat of chats) {
                    await this.db.delete(CONFIG.INDEXEDDB.STORES.AI_CHATS, chat.id);
                }
            } else {
                await this.db.clear(CONFIG.INDEXEDDB.STORES.AI_CHATS);
            }
            return true;
        } catch (error) {
            console.error('Error clearing chat history:', error);
            return false;
        }
    }
    
    // ===== Settings Operations =====
    async saveSetting(key, value) {
        try {
            await this.db.put(CONFIG.INDEXEDDB.STORES.SETTINGS, { key, value });
            storage.set(key, value);
            return true;
        } catch (error) {
            console.error('Error saving setting:', error);
            return false;
        }
    }
    
    async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.db.get(CONFIG.INDEXEDDB.STORES.SETTINGS, key);
            return setting ? setting.value : (storage.get(key) || defaultValue);
        } catch (error) {
            return storage.get(key, defaultValue);
        }
    }
    
    async getAllSettings() {
        try {
            const settings = await this.db.getAll(CONFIG.INDEXEDDB.STORES.SETTINGS);
            return settings.reduce((acc, { key, value }) => {
                acc[key] = value;
                return acc;
            }, {});
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }
    
    // ===== Export/Import =====
    async exportData() {
        try {
            const data = {
                tabs: await this.loadTabs(),
                history: await this.getHistory(CONFIG.HISTORY.MAX_ENTRIES),
                bookmarks: await this.getBookmarks(),
                settings: await this.getAllSettings(),
                exportDate: new Date().toISOString()
            };
            return data;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }
    
    async importData(data) {
        try {
            if (data.tabs) {
                for (const tab of data.tabs) {
                    await this.db.put(CONFIG.INDEXEDDB.STORES.TABS, tab);
                }
            }
            
            if (data.history) {
                for (const entry of data.history) {
                    await this.db.put(CONFIG.INDEXEDDB.STORES.HISTORY, entry);
                }
            }
            
            if (data.bookmarks) {
                for (const bookmark of data.bookmarks) {
                    await this.db.put(CONFIG.INDEXEDDB.STORES.BOOKMARKS, bookmark);
                }
            }
            
            if (data.settings) {
                for (const [key, value] of Object.entries(data.settings)) {
                    await this.saveSetting(key, value);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
    
    // ===== Clear All Data =====
    async clearAll() {
        try {
            await this.db.clear(CONFIG.INDEXEDDB.STORES.TABS);
            await this.db.clear(CONFIG.INDEXEDDB.STORES.HISTORY);
            await this.db.clear(CONFIG.INDEXEDDB.STORES.BOOKMARKS);
            await this.db.clear(CONFIG.INDEXEDDB.STORES.AI_CHATS);
            storage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }
}

export default new StorageManager();
