/* ============================================
   AI Browser - UI Manager
   Main UI controller and DOM interactions
   ============================================ */

import EventBus from '../core/EventBus.js';
import TabManager from '../core/TabManager.js';
import NavigationEngine from '../core/NavigationEngine.js';
import AIService from '../ai/AIService.js';
import AuthManager from '../auth/AuthManager.js';
import StorageManager from '../storage/StorageManager.js';
import { query, queryAll, addClass, removeClass, toggleClass, debounce, escapeHtml } from '../utils/helpers.js';
import { CONFIG } from '../utils/constants.js';

class UIManager {
    constructor() {
        this.elements = {};
        this.state = {
            aiPanelOpen: false,
            commandPaletteOpen: false,
            settingsOpen: false,
            splitView: false
        };
    }
    
    init() {
        // Cache DOM elements
        this._cacheElements();
        
        // Setup event listeners
        this._setupEventListeners();
        
        // Setup EventBus listeners
        this._setupEventBusListeners();
        
        // Initialize theme
        this._initTheme();
        
        // Render initial UI
        this._render();
    }
    
    _cacheElements() {
        // Navigation
        this.elements.backBtn = query('#backBtn');
        this.elements.forwardBtn = query('#forwardBtn');
        this.elements.refreshBtn = query('#refreshBtn');
        this.elements.newTabBtn = query('#newTabBtn');
        
        // Address bar
        this.elements.addressInput = query('#addressInput');
        this.elements.clearAddressBtn = query('#clearAddressBtn');
        this.elements.suggestionsDropdown = query('#suggestionsDropdown');
        
        // Tabs
        this.elements.tabsContainer = query('#tabsContainer');
        
        // Viewport
        this.elements.viewport = query('#viewport');
        
        // AI Panel
        this.elements.aiPanel = query('#aiPanel');
        this.elements.aiMessages = query('#aiMessages');
        this.elements.aiInput = query('#aiInput');
        this.elements.aiSendBtn = query('#aiSendBtn');
        this.elements.aiAssistantBtn = query('#aiAssistantBtn');
        this.elements.closeAIPanel = query('#closeAIPanel');
        this.elements.aiModeSelect = query('#aiModeSelect');
        
        // Command Palette
        this.elements.commandPalette = query('#commandPalette');
        this.elements.commandInput = query('#commandInput');
        this.elements.commandResults = query('#commandResults');
        
        // Modals
        this.elements.settingsModal = query('#settingsModal');
        this.elements.authModal = query('#authModal');
        
        // Loading
        this.elements.loadingOverlay = query('#loadingOverlay');
        
        // Toast
        this.elements.toastContainer = query('#toastContainer');
        
        // User
        this.elements.userProfile = query('#userProfile');
    }
    
    _setupEventListeners() {
        // Navigation controls
        this.elements.backBtn.addEventListener('click', () => {
            const activeTab = TabManager.getActiveTab();
            if (activeTab) TabManager.goBack(activeTab.id);
        });
        
        this.elements.forwardBtn.addEventListener('click', () => {
            const activeTab = TabManager.getActiveTab();
            if (activeTab) TabManager.goForward(activeTab.id);
        });
        
        this.elements.refreshBtn.addEventListener('click', () => {
            const activeTab = TabManager.getActiveTab();
            if (activeTab) TabManager.reload(activeTab.id);
        });
        
        this.elements.newTabBtn.addEventListener('click', () => {
            TabManager.createTab();
        });
        
        // Address bar
        this.elements.addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this._handleAddressSubmit();
            }
        });
        
        this.elements.addressInput.addEventListener('input', debounce(() => {
            this._updateSuggestions();
        }, 300));
        
        this.elements.clearAddressBtn.addEventListener('click', () => {
            this.elements.addressInput.value = '';
            this.elements.addressInput.focus();
        });
        
        // AI Panel
        this.elements.aiAssistantBtn.addEventListener('click', () => {
            this.toggleAIPanel();
        });
        
        this.elements.closeAIPanel.addEventListener('click', () => {
            this.toggleAIPanel(false);
        });
        
        this.elements.aiSendBtn.addEventListener('click', () => {
            this._handleAIMessage();
        });
        
        this.elements.aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._handleAIMessage();
            }
        });
        
        // Command Palette
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleCommandPalette();
            }
            
            if (e.key === 'Escape') {
                if (this.state.commandPaletteOpen) {
                    this.toggleCommandPalette(false);
                }
            }
        });
        
        this.elements.commandPalette.addEventListener('click', (e) => {
            if (e.target === this.elements.commandPalette) {
                this.toggleCommandPalette(false);
            }
        });
        
        this.elements.commandInput.addEventListener('input', debounce(() => {
            this._updateCommandResults();
        }, 200));
        
        // Global shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                TabManager.createTab();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault();
                const activeTab = TabManager.getActiveTab();
                if (activeTab) TabManager.closeTab(activeTab.id);
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                this.elements.addressInput.select();
            }
        });
        
        // Handle messages from iframes
        window.addEventListener('message', (e) => {
            this._handleIframeMessage(e.data);
        });
    }
    
    _setupEventBusListeners() {
        EventBus.on('tab:created', (tab) => this._renderTabs());
        EventBus.on('tab:closed', () => this._renderTabs());
        EventBus.on('tab:activated', (tab) => {
            this._renderTabs();
            this._updateAddressBar(tab);
            this._updateNavigationButtons(tab);
        });
        EventBus.on('tab:updated', (tab) => {
            if (tab.id === TabManager.getActiveTab()?.id) {
                this._updateAddressBar(tab);
                this._updateNavigationButtons(tab);
            }
            this._renderTabs();
        });
        
        EventBus.on('auth:signed-in', (user) => this._updateUserProfile(user));
        EventBus.on('auth:signed-out', () => this._updateUserProfile(null));
        
        EventBus.on('error', (error) => this.showToast(error.message, 'error'));
        EventBus.on('success', (message) => this.showToast(message, 'success'));
    }
    
    _initTheme() {
        const theme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    _render() {
        this._renderTabs();
        const activeTab = TabManager.getActiveTab();
        if (activeTab) {
            this._updateAddressBar(activeTab);
            this._updateNavigationButtons(activeTab);
        }
    }
    
    _renderTabs() {
        const tabs = TabManager.getAllTabs();
        const activeTab = TabManager.getActiveTab();
        
        this.elements.tabsContainer.innerHTML = tabs.map(tab => `
            <div class="tab ${tab.id === activeTab?.id ? 'active' : ''} ${tab.loading ? 'loading' : ''}" 
                 data-tab-id="${tab.id}">
                <div class="tab-favicon">${tab.favicon ? `<img src="${tab.favicon}" alt="">` : '🌐'}</div>
                <span class="tab-title">${tab.title}</span>
                <button class="tab-close" data-tab-id="${tab.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');
        
        // Add event listeners to tabs
        queryAll('.tab', this.elements.tabsContainer).forEach(tabEl => {
            const tabId = tabEl.dataset.tabId;
            
            tabEl.addEventListener('click', (e) => {
                if (!e.target.closest('.tab-close')) {
                    TabManager.activateTab(tabId);
                }
            });
            
            const closeBtn = tabEl.querySelector('.tab-close');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                TabManager.closeTab(tabId);
            });
        });
    }
    
    _updateAddressBar(tab) {
        this.elements.addressInput.value = tab.url === 'about:newtab' ? '' : tab.url;
    }
    
    _updateNavigationButtons(tab) {
        this.elements.backBtn.disabled = !TabManager.canGoBack(tab.id);
        this.elements.forwardBtn.disabled = !TabManager.canGoForward(tab.id);
    }
    
    _updateUserProfile(user) {
        if (user) {
            const avatar = query('.avatar', this.elements.userProfile);
            const username = query('.username', this.elements.userProfile);
            
            avatar.textContent = user.displayName.charAt(0).toUpperCase();
            username.textContent = user.displayName;
        } else {
            const avatar = query('.avatar', this.elements.userProfile);
            const username = query('.username', this.elements.userProfile);
            
            avatar.textContent = 'G';
            username.textContent = 'Guest';
        }
    }
    
    _handleAddressSubmit() {
        const value = this.elements.addressInput.value.trim();
        if (!value) return;
        
        const activeTab = TabManager.getActiveTab();
        if (activeTab) {
            TabManager.navigate(activeTab.id, value);
        }
        
        this.elements.addressInput.blur();
    }
    
    _updateSuggestions() {
        // TODO: Implement suggestions from history/bookmarks
        this.elements.suggestionsDropdown.classList.remove('active');
    }
    
    async _handleAIMessage() {
        const message = this.elements.aiInput.value.trim();
        if (!message) return;
        
        // Clear input
        this.elements.aiInput.value = '';
        
        // Add user message
        this._addAIMessage(message, 'user');
        
        // Get AI response
        try {
            const responseContainer = this._addAIMessage('', 'assistant', true);
            
            await AIService.streamChat([{ role: 'user', content: message }], (chunk) => {
                const content = responseContainer.querySelector('.message-content');
                content.textContent += chunk;
                
                // Auto-scroll
                this.elements.aiMessages.scrollTop = this.elements.aiMessages.scrollHeight;
            });
            
            removeClass(responseContainer, 'message-streaming');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
    
    _addAIMessage(content, role, streaming = false) {
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ${role} ${streaming ? 'message-streaming' : ''}`;
        
        messageEl.innerHTML = `
            <div class="message-avatar">${role === 'user' ? 'U' : '🤖'}</div>
            <div class="message-content">${content}${streaming ? '<span class="typing-cursor"></span>' : ''}</div>
        `;
        
        this.elements.aiMessages.appendChild(messageEl);
        this.elements.aiMessages.scrollTop = this.elements.aiMessages.scrollHeight;
        
        return messageEl;
    }
    
    toggleAIPanel(open) {
        if (open === undefined) {
            this.state.aiPanelOpen = !this.state.aiPanelOpen;
        } else {
            this.state.aiPanelOpen = open;
        }
        
        toggleClass(this.elements.aiPanel, 'active');
    }
    
    toggleCommandPalette(open) {
        if (open === undefined) {
            this.state.commandPaletteOpen = !this.state.commandPaletteOpen;
        } else {
            this.state.commandPaletteOpen = open;
        }
        
        toggleClass(this.elements.commandPalette, 'active');
        
        if (this.state.commandPaletteOpen) {
            this.elements.commandInput.focus();
        }
    }
    
    _updateCommandResults() {
        // TODO: Implement command search
    }
    
    _handleIframeMessage(data) {
        if (!data || !data.action) return;
        
        switch (data.action) {
            case 'ai-search':
                this.toggleAIPanel(true);
                if (data.query) {
                    this.elements.aiInput.value = data.query;
                }
                break;
            case 'history':
                // TODO: Show history view
                break;
            case 'bookmarks':
                // TODO: Show bookmarks view
                break;
            case 'reload':
                const activeTab = TabManager.getActiveTab();
                if (activeTab) TabManager.reload(activeTab.id);
                break;
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✗',
            info: 'ℹ',
            warning: '⚠'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            addClass(toast, 'toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, CONFIG.UI.TOAST_DURATION);
    }
    
    showLoading(show) {
        toggleClass(this.elements.loadingOverlay, 'active');
    }
}

export default new UIManager();
