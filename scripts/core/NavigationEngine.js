/* ============================================
   AI Browser - Navigation Engine
   Web content rendering and navigation
   ============================================ */

import EventBus from './EventBus.js';
import TabManager from './TabManager.js';
import StorageManager from '../storage/StorageManager.js';
import { normalizeUrl, generateId, getFaviconUrl, getUrlDomain } from '../utils/helpers.js';
import { validateCsp, getIframeSandboxAttributes } from '../utils/security.js';
import { SPECIAL_URLS } from '../utils/constants.js';

class NavigationEngine {
    constructor() {
        this.viewportElement = null;
        this.currentIframe = null;
    }
    
    init(viewportElement) {
        this.viewportElement = viewportElement;
        
        // Listen to navigation events
        EventBus.on('tab:navigate', ({ tab, url }) => {
            this.loadUrl(url, tab.id);
        });
        
        EventBus.on('tab:reload', (tab) => {
            this.reload(tab.id);
        });
        
        EventBus.on('tab:activated', (tab) => {
            this.loadUrl(tab.url, tab.id);
        });
    }
    
    async loadUrl(url, tabId) {
        const tab = TabManager.getTab(tabId);
        if (!tab) return;
        
        TabManager.setLoading(tabId, true);
        
        // Clear viewport
        this.viewportElement.innerHTML = '';
        
        // Handle special URLs
        if (this.isSpecialUrl(url)) {
            this.loadSpecialPage(url, tabId);
            TabManager.setLoading(tabId, false);
            return;
        }
        
        // Normalize URL
        const normalizedUrl = normalizeUrl(url);
        
        if (!normalizedUrl) {
            // Treat as search query
            this.loadSearchPage(url, tabId);
            TabManager.setLoading(tabId, false);
            return;
        }
        
        // Validate URL
        if (!validateCsp(normalizedUrl)) {
            this.loadErrorPage('Blocked URL', 'This URL is not allowed for security reasons.', tabId);
            TabManager.setLoading(tabId, false);
            return;
        }
        
        // Try to load in iframe
        try {
            await this.loadInIframe(normalizedUrl, tabId);
            
            // Add to history
            this.addToHistory(normalizedUrl, tab.title);
            
            // Update tab
            TabManager.updateTab(tabId, {
                url: normalizedUrl,
                favicon: getFaviconUrl(normalizedUrl)
            });
        } catch (error) {
            console.error('Load error:', error);
            this.loadErrorPage('Cannot Load Page', error.message, tabId);
        }
        
        TabManager.setLoading(tabId, false);
    }
    
    async loadInIframe(url, tabId) {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.className = 'content-iframe';
            iframe.sandbox = getIframeSandboxAttributes();
            iframe.style.cssText = 'width: 100%; height: 100%; border: none; display: block;';
            
            let loaded = false;
            
            iframe.onload = () => {
                if (loaded) return;
                loaded = true;
                
                this.currentIframe = iframe;
                
                // Try to get page title
                try {
                    const title = iframe.contentDocument?.title || getUrlDomain(url);
                    TabManager.updateTab(tabId, { title });
                } catch (e) {
                    // Cross-origin, can't access
                    TabManager.updateTab(tabId, { title: getUrlDomain(url) });
                }
                
                resolve();
            };
            
            iframe.onerror = () => {
                if (loaded) return;
                loaded = true;
                reject(new Error('Failed to load page'));
            };
            
            // Timeout fallback
            setTimeout(() => {
                if (!loaded) {
                    loaded = true;
                    reject(new Error('Page load timeout'));
                }
            }, 10000);
            
            iframe.src = url;
            this.viewportElement.appendChild(iframe);
        });
    }
    
    isSpecialUrl(url) {
        return url.startsWith('about:');
    }
    
    loadSpecialPage(url, tabId) {
        switch (url) {
            case SPECIAL_URLS.NEW_TAB:
                this.loadNewTabPage(tabId);
                break;
            case SPECIAL_URLS.BLANK:
                this.loadBlankPage(tabId);
                break;
            case SPECIAL_URLS.HISTORY:
                this.loadHistoryPage(tabId);
                break;
            case SPECIAL_URLS.BOOKMARKS:
                this.loadBookmarksPage(tabId);
                break;
            default:
                this.loadBlankPage(tabId);
        }
    }
    
    loadNewTabPage(tabId) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: var(--bg-primary);
                        color: var(--text-primary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    .container {
                        text-align: center;
                        max-width: 600px;
                        padding: 2rem;
                    }
                    h1 {
                        font-size: 2.5rem;
                        margin-bottom: 1rem;
                        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    p {
                        font-size: 1.1rem;
                        color: #6b7280;
                        margin-bottom: 2rem;
                    }
                    .greeting {
                        font-size: 1rem;
                        color: #9ca3af;
                        margin-bottom: 2rem;
                    }
                    .quick-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    .action-card {
                        background: #f9fafb;
                        padding: 1.5rem;
                        border-radius: 1rem;
                        border: 1px solid #e5e7eb;
                        cursor: pointer;
                        transition: all 0.2s;
                        min-width: 150px;
                    }
                    .action-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    .action-icon {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                    }
                    .action-title {
                        font-weight: 600;
                        margin-bottom: 0.25rem;
                    }
                    .action-desc {
                        font-size: 0.875rem;
                        color: #6b7280;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="greeting">Good ${this.getTimeOfDay()}!</div>
                    <h1>Welcome to AI Browser</h1>
                    <p>Your intelligent browsing companion</p>
                    
                    <div class="quick-actions">
                        <div class="action-card" onclick="parent.postMessage({action:'ai-search'}, '*')">
                            <div class="action-icon">🔍</div>
                            <div class="action-title">AI Search</div>
                            <div class="action-desc">Search with AI</div>
                        </div>
                        <div class="action-card" onclick="parent.postMessage({action:'history'}, '*')">
                            <div class="action-icon">📚</div>
                            <div class="action-title">History</div>
                            <div class="action-desc">Recent pages</div>
                        </div>
                        <div class="action-card" onclick="parent.postMessage({action:'bookmarks'}, '*')">
                            <div class="action-icon">⭐</div>
                            <div class="action-title">Bookmarks</div>
                            <div class="action-desc">Saved pages</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        iframe.srcdoc = html;
        
        this.viewportElement.appendChild(iframe);
        TabManager.updateTab(tabId, { title: 'New Tab' });
    }
    
    loadBlankPage(tabId) {
        this.viewportElement.innerHTML = '';
        TabManager.updateTab(tabId, { title: 'Blank Page' });
    }
    
    loadSearchPage(query, tabId) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 2rem;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: var(--bg-primary);
                        color: var(--text-primary);
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 { margin-bottom: 2rem; }
                    .search-query {
                        background: #f9fafb;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        border-left: 4px solid #3b82f6;
                        margin-bottom: 1.5rem;
                    }
                    .suggestion {
                        background: white;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        margin-bottom: 1rem;
                        border: 1px solid #e5e7eb;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .suggestion:hover {
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Search Results</h1>
                    <div class="search-query">
                        <strong>Query:</strong> ${query}
                    </div>
                    <p>Use the AI Assistant to search the web with AI-powered results.</p>
                    <div class="suggestion" onclick="parent.postMessage({action:'ai-search', query:'${query}'}, '*')">
                        🤖 Search with AI Assistant
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        iframe.srcdoc = html;
        
        this.viewportElement.appendChild(iframe);
        TabManager.updateTab(tabId, { title: `Search: ${query}` });
    }
    
    loadErrorPage(title, message, tabId) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: var(--bg-primary);
                        color: var(--text-primary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                    }
                    .error-container {
                        text-align: center;
                        max-width: 500px;
                        padding: 2rem;
                    }
                    .error-icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    h1 {
                        font-size: 1.5rem;
                        margin-bottom: 1rem;
                        color: #ef4444;
                    }
                    p {
                        color: #6b7280;
                        margin-bottom: 2rem;
                        line-height: 1.6;
                    }
                    button {
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        font-size: 1rem;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    button:hover {
                        background: #2563eb;
                        transform: translateY(-1px);
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <h1>${title}</h1>
                    <p>${message}</p>
                    <button onclick="parent.postMessage({action:'reload'}, '*')">Try Again</button>
                </div>
            </body>
            </html>
        `;
        
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
        iframe.srcdoc = html;
        
        this.viewportElement.appendChild(iframe);
        TabManager.updateTab(tabId, { title });
    }
    
    loadHistoryPage(tabId) {
        // This would load history view - handled by UI
        EventBus.emit('view:history');
    }
    
    loadBookmarksPage(tabId) {
        // This would load bookmarks view - handled by UI
        EventBus.emit('view:bookmarks');
    }
    
    reload(tabId) {
        const tab = TabManager.getTab(tabId);
        if (tab) {
            this.loadUrl(tab.url, tabId);
        }
    }
    
    async addToHistory(url, title) {
        await StorageManager.addHistory({
            id: generateId(),
            url,
            title,
            timestamp: Date.now()
        });
    }
    
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    }
}

export default new NavigationEngine();
