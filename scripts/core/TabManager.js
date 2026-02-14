/* ============================================
   AI Browser - Tab Manager (Upgraded)
   Adds:
   - Pinned tabs
   - Recently closed tabs
   - Session restore stability
   - Safer persistence
   - Better history handling
   ============================================ */

import EventBus from './EventBus.js';
import StorageManager from '../storage/StorageManager.js';
import { generateId } from '../utils/helpers.js';
import { CONFIG, SPECIAL_URLS } from '../utils/constants.js';

class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.maxTabs = CONFIG.TAB.MAX_TABS;
        this.recentlyClosed = [];
    }

    async init() {
        const savedTabs = await StorageManager.loadTabs();

        if (savedTabs && savedTabs.length > 0) {
            this.tabs = savedTabs.map(t => ({
                pinned: false,
                history: [],
                historyIndex: -1,
                aiContext: [],
                ...t
            }));
            this.activeTabId = this.tabs[0]?.id || null;
        } else {
            this.createTab();
        }

        EventBus.emit('tabs:loaded', this.tabs);
        return this.tabs;
    }

    createTab(url = SPECIAL_URLS.NEW_TAB, options = {}) {
        if (this.tabs.length >= this.maxTabs) {
            EventBus.emit('error', { message: `Maximum ${this.maxTabs} tabs allowed` });
            return null;
        }

        const tab = {
            id: generateId(),
            title: options.title || CONFIG.TAB.DEFAULT_TITLE,
            url,
            favicon: options.favicon || null,
            loading: false,
            pinned: !!options.pinned,
            history: [],
            historyIndex: -1,
            scrollPosition: 0,
            timestamp: Date.now(),
            aiContext: []
        };

        // pinned tabs always stay left
        if (tab.pinned) {
            const firstUnpinned = this.tabs.findIndex(t => !t.pinned);
            if (firstUnpinned === -1) this.tabs.push(tab);
            else this.tabs.splice(firstUnpinned, 0, tab);
        } else {
            this.tabs.push(tab);
        }

        this.activeTabId = tab.id;

        this._saveTabs();
        EventBus.emit('tab:created', tab);
        EventBus.emit('tab:activated', tab);

        return tab;
    }

    closeTab(tabId) {
        const index = this.tabs.findIndex(t => t.id === tabId);
        if (index === -1) return false;

        const tab = this.tabs[index];
        this.tabs.splice(index, 1);

        // save for restore (max 20)
        this.recentlyClosed.unshift({ ...tab, closedAt: Date.now() });
        this.recentlyClosed = this.recentlyClosed.slice(0, 20);

        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const newIndex = index < this.tabs.length ? index : index - 1;
                this.activeTabId = this.tabs[newIndex]?.id || null;
                if (this.activeTabId) EventBus.emit('tab:activated', this.getActiveTab());
            } else {
                this.createTab();
            }
        }

        this._saveTabs();
        EventBus.emit('tab:closed', tab);
        return true;
    }

    restoreClosedTab() {
        const tab = this.recentlyClosed.shift();
        if (!tab) return null;

        // clean ephemeral values
        tab.loading = false;
        tab.timestamp = Date.now();

        this.tabs.push(tab);
        this.activeTabId = tab.id;
        this._saveTabs();

        EventBus.emit('tab:created', tab);
        EventBus.emit('tab:activated', tab);
        return tab;
    }

    togglePin(tabId) {
        const tab = this.getTab(tabId);
        if (!tab) return false;
        tab.pinned = !tab.pinned;

        // reorder
        this.tabs = [
            ...this.tabs.filter(t => t.pinned).sort((a,b)=>a.timestamp-b.timestamp),
            ...this.tabs.filter(t => !t.pinned).sort((a,b)=>a.timestamp-b.timestamp),
        ];

        this._saveTabs();
        EventBus.emit('tab:updated', tab);
        return true;
    }

    activateTab(tabId) {
        const tab = this.getTab(tabId);
        if (!tab) return false;
        this.activeTabId = tabId;
        EventBus.emit('tab:activated', tab);
        return true;
    }

    updateTab(tabId, updates) {
        const tab = this.getTab(tabId);
        if (!tab) return false;
        Object.assign(tab, updates);
        this._saveTabs();
        EventBus.emit('tab:updated', tab);
        return true;
    }

    navigate(tabId, url) {
        const tab = this.getTab(tabId);
        if (!tab) return false;

        if (tab.url && tab.url !== url) {
            tab.history.splice(tab.historyIndex + 1);
            tab.history.push(tab.url);
            tab.historyIndex = tab.history.length - 1;

            if (tab.history.length > CONFIG.TAB.MAX_HISTORY_PER_TAB) {
                tab.history.shift();
                tab.historyIndex--;
            }
        }

        tab.url = url;
        tab.loading = true;

        this._saveTabs();
        EventBus.emit('tab:navigate', { tab, url });
        return true;
    }

    goBack(tabId) {
        const tab = this.getTab(tabId);
        if (!tab || tab.historyIndex < 0) return false;
        tab.url = tab.history[tab.historyIndex];
        tab.historyIndex--;
        this._saveTabs();
        EventBus.emit('tab:navigate', { tab, url: tab.url });
        return true;
    }

    goForward(tabId) {
        const tab = this.getTab(tabId);
        if (!tab || tab.historyIndex >= tab.history.length - 1) return false;
        tab.historyIndex++;
        tab.url = tab.history[tab.historyIndex];
        this._saveTabs();
        EventBus.emit('tab:navigate', { tab, url: tab.url });
        return true;
    }

    reload(tabId) {
        const tab = this.getTab(tabId);
        if (!tab) return false;
        EventBus.emit('tab:navigate', { tab, url: tab.url });
        return true;
    }

    setLoading(tabId, loading) {
        return this.updateTab(tabId, { loading });
    }

    canGoBack(tabId) {
        const tab = this.getTab(tabId);
        return !!tab && tab.historyIndex >= 0;
    }

    canGoForward(tabId) {
        const tab = this.getTab(tabId);
        return !!tab && tab.historyIndex < tab.history.length - 1;
    }

    getTab(tabId) {
        return this.tabs.find(t => t.id === tabId) || null;
    }

    getActiveTab() {
        return this.getTab(this.activeTabId);
    }

    getAllTabs() {
        return this.tabs;
    }

    _saveTabs() {
        StorageManager.saveTabs(this.tabs);
    }
}

export default new TabManager();
