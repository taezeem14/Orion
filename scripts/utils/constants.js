/* ============================================
   AI Browser - Constants & Configuration
   ============================================ */

export const CONFIG = {
    APP_NAME: 'AI Browser',
    VERSION: '1.0.0',
    
    // Storage Keys
    STORAGE_KEYS: {
        USER_SESSION: 'aib_user_session',
        TABS: 'aib_tabs',
        HISTORY: 'aib_history',
        BOOKMARKS: 'aib_bookmarks',
        SETTINGS: 'aib_settings',
        AI_CHATS: 'aib_ai_chats',
        API_KEY: 'aib_api_key',
        THEME: 'aib_theme',
        ACTIVE_TAB: 'aib_active_tab'
    },
    
    // IndexedDB Configuration
    INDEXEDDB: {
        NAME: 'AIBrowserDB',
        VERSION: 1,
        STORES: {
            TABS: 'tabs',
            HISTORY: 'history',
            BOOKMARKS: 'bookmarks',
            AI_CHATS: 'ai_chats',
            SETTINGS: 'settings'
        }
    },
    
    // Tab Settings
    TAB: {
        MAX_TABS: 20,
        NEW_TAB_URL: 'about:newtab',
        DEFAULT_TITLE: 'New Tab',
        MAX_HISTORY_PER_TAB: 50
    },
    
    // AI Configuration
    AI: {
        OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1/chat/completions',
        DEFAULT_MODEL: 'anthropic/claude-3.5-sonnet',
        MODELS: [
            {
                id: 'anthropic/claude-3.5-sonnet',
                name: 'Claude 3.5 Sonnet',
                provider: 'Anthropic',
                contextWindow: 200000
            },
            {
                id: 'anthropic/claude-3-opus',
                name: 'Claude 3 Opus',
                provider: 'Anthropic',
                contextWindow: 200000
            },
            {
                id: 'openai/gpt-4-turbo',
                name: 'GPT-4 Turbo',
                provider: 'OpenAI',
                contextWindow: 128000
            },
            {
                id: 'openai/gpt-4',
                name: 'GPT-4',
                provider: 'OpenAI',
                contextWindow: 8192
            },
            {
                id: 'google/gemini-pro-1.5',
                name: 'Gemini Pro 1.5',
                provider: 'Google',
                contextWindow: 1000000
            },
            {
                id: 'meta-llama/llama-3.1-70b-instruct',
                name: 'Llama 3.1 70B',
                provider: 'Meta',
                contextWindow: 8192
            },
            {
                id: 'mistralai/mistral-large',
                name: 'Mistral Large',
                provider: 'Mistral',
                contextWindow: 32000
            },
            {
                id: 'deepseek/deepseek-chat',
                name: 'DeepSeek Chat',
                provider: 'DeepSeek',
                contextWindow: 64000
            }
        ],
        MODES: {
            CHAT: 'chat',
            SEARCH: 'search',
            EXPLAIN: 'explain',
            ASK: 'ask',
            COMPARE: 'compare',
            CODE: 'code',
            RESEARCH: 'research'
        },
        MAX_TOKENS: 4096,
        TEMPERATURE: 0.7,
        STREAM: true
    },
    
    // History Settings
    HISTORY: {
        MAX_ENTRIES: 1000,
        RETENTION_DAYS: 90
    },
    
    // Bookmarks Settings
    BOOKMARKS: {
        MAX_FOLDERS: 50,
        MAX_PER_FOLDER: 100
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300,
        THROTTLE_DELAY: 100
    },
    
    // Keyboard Shortcuts
    SHORTCUTS: {
        NEW_TAB: 'ctrl+t',
        CLOSE_TAB: 'ctrl+w',
        NEXT_TAB: 'ctrl+tab',
        PREV_TAB: 'ctrl+shift+tab',
        COMMAND_PALETTE: 'ctrl+k',
        FOCUS_ADDRESS: 'ctrl+l',
        RELOAD: 'ctrl+r',
        FIND: 'ctrl+f',
        BOOKMARK: 'ctrl+d',
        HISTORY: 'ctrl+h',
        SETTINGS: 'ctrl+,',
        AI_ASSISTANT: 'ctrl+shift+a'
    },
    
    // Regex Patterns
    PATTERNS: {
        URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        IP: /^(\d{1,3}\.){3}\d{1,3}$/
    },
    
    // Default Settings
    DEFAULT_SETTINGS: {
        theme: 'light',
        defaultModel: 'anthropic/claude-3.5-sonnet',
        aiMode: 'chat',
        autoSave: true,
        showBookmarksBar: false,
        enableAnimations: true,
        compactMode: false
    }
};

// AI Mode Prompts
export const AI_PROMPTS = {
    [CONFIG.AI.MODES.SEARCH]: (query) => `Search the web for: ${query}. Provide a comprehensive answer with sources.`,
    
    [CONFIG.AI.MODES.EXPLAIN]: (pageContent) => `Explain this web page in simple terms:\n\n${pageContent}`,
    
    [CONFIG.AI.MODES.ASK]: (question, pageContent) => `Based on this web page:\n\n${pageContent}\n\nAnswer this question: ${question}`,
    
    [CONFIG.AI.MODES.COMPARE]: (tab1Content, tab2Content) => `Compare these two web pages:\n\nPage 1:\n${tab1Content}\n\nPage 2:\n${tab2Content}`,
    
    [CONFIG.AI.MODES.CODE]: (request) => `Act as a coding assistant. ${request}`,
    
    [CONFIG.AI.MODES.RESEARCH]: (topic) => `Provide a structured research summary on: ${topic}. Include key points, sources, and analysis.`
};

// Error Messages
export const ERRORS = {
    NO_API_KEY: 'Please configure your OpenRouter API key in Settings.',
    INVALID_API_KEY: 'Invalid API key. Please check your OpenRouter API key.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
    MAX_TABS: `Maximum number of tabs (${CONFIG.TAB.MAX_TABS}) reached.`,
    STORAGE_ERROR: 'Error accessing storage. Please check browser permissions.',
    IFRAME_BLOCKED: 'This website cannot be displayed in an iframe due to security restrictions.',
    UNKNOWN: 'An unexpected error occurred. Please try again.'
};

// Success Messages
export const SUCCESS = {
    TAB_CREATED: 'New tab created',
    TAB_CLOSED: 'Tab closed',
    BOOKMARK_ADDED: 'Bookmark added',
    BOOKMARK_REMOVED: 'Bookmark removed',
    HISTORY_CLEARED: 'History cleared',
    DATA_EXPORTED: 'Data exported successfully',
    SETTINGS_SAVED: 'Settings saved'
};

// URL Helpers
export const SPECIAL_URLS = {
    NEW_TAB: 'about:newtab',
    BLANK: 'about:blank',
    HISTORY: 'about:history',
    BOOKMARKS: 'about:bookmarks',
    SETTINGS: 'about:settings'
};

// Export all
export default {
    CONFIG,
    AI_PROMPTS,
    ERRORS,
    SUCCESS,
    SPECIAL_URLS
};
