/* ============================================
   AI Browser - Main Application
   Entry point and initialization
   ============================================ */

import EventBus from './core/EventBus.js';
import TabManager from './core/TabManager.js';
import NavigationEngine from './core/NavigationEngine.js';
import StorageManager from './storage/StorageManager.js';
import AIService from './ai/AIService.js';
import AuthManager from './auth/AuthManager.js';
import UIManager from './ui/UIManager.js';
import { query } from './utils/helpers.js';

class App {
    constructor() {
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        
        console.log('🚀 AI Browser starting...');
        
        try {
            // Show loading
            UIManager.showLoading(true);
            
            // Initialize storage
            console.log('📦 Initializing storage...');
            await StorageManager.init();
            
            // Initialize AI service
            console.log('🤖 Initializing AI service...');
            AIService.init();
            
            // Initialize auth
            console.log('🔐 Initializing authentication...');
            const user = await AuthManager.init();
            
            if (!user) {
                // Show auth modal for guest
                this.showAuthModal();
            }
            
            // Initialize tab manager
            console.log('📑 Initializing tab manager...');
            await TabManager.init();
            
            // Initialize navigation engine
            console.log('🌐 Initializing navigation engine...');
            const viewportElement = query('#viewport');
            NavigationEngine.init(viewportElement);
            
            // Initialize UI
            console.log('🎨 Initializing UI...');
            UIManager.init();
            
            // Setup global error handler
            this.setupErrorHandling();
            
            // Setup settings handlers
            this.setupSettingsHandlers();
            
            // Setup auth handlers
            this.setupAuthHandlers();
            
            this.initialized = true;
            
            UIManager.showLoading(false);
            
            console.log('✅ AI Browser ready!');
            
            // Show welcome message
            UIManager.showToast('Welcome to AI Browser!', 'success');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            UIManager.showToast('Failed to initialize application', 'error');
            UIManager.showLoading(false);
        }
    }
    
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            UIManager.showToast('An error occurred', 'error');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            UIManager.showToast('An error occurred', 'error');
        });
    }
    
    setupSettingsHandlers() {
        // Settings button
        const settingsBtn = query('#settingsBtn');
        const settingsModal = query('#settingsModal');
        const closeSettingsModal = query('#closeSettingsModal');
        
        settingsBtn?.addEventListener('click', () => {
            settingsModal.classList.add('active');
            this.loadSettings();
        });
        
        closeSettingsModal?.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
        
        settingsModal?.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });
        
        // API Key
        const apiKeyInput = query('#apiKeyInput');
        const toggleApiKey = query('#toggleApiKey');
        
        toggleApiKey?.addEventListener('click', () => {
            const type = apiKeyInput.type === 'password' ? 'text' : 'password';
            apiKeyInput.type = type;
        });
        
        apiKeyInput?.addEventListener('change', () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                try {
                    AIService.setApiKey(key);
                    UIManager.showToast('API key saved', 'success');
                } catch (error) {
                    UIManager.showToast(error.message, 'error');
                }
            }
        });
        
        // Model selection
        const modelSelect = query('#modelSelect');
        modelSelect?.addEventListener('change', () => {
            AIService.setModel(modelSelect.value);
            UIManager.showToast('Model updated', 'success');
        });
        
        // Theme selection
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.setTheme(theme);
                
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });
        
        // Clear data
        const clearDataBtn = query('#clearDataBtn');
        clearDataBtn?.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all browsing data? This cannot be undone.')) {
                await StorageManager.clearAll();
                UIManager.showToast('All data cleared', 'success');
                location.reload();
            }
        });
        
        // Export data
        const exportDataBtn = query('#exportDataBtn');
        exportDataBtn?.addEventListener('click', async () => {
            try {
                const data = await StorageManager.exportData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ai-browser-export-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                UIManager.showToast('Data exported', 'success');
            } catch (error) {
                UIManager.showToast('Export failed', 'error');
            }
        });
        
        // Logout
        const logoutBtn = query('#logoutBtn');
        logoutBtn?.addEventListener('click', () => {
            AuthManager.signout();
            this.showAuthModal();
        });
    }
    
    setupAuthHandlers() {
        const authModal = query('#authModal');
        const loginForm = query('#loginForm');
        const signupForm = query('#signupForm');
        const showSignup = query('#showSignup');
        const showLogin = query('#showLogin');
        const continueAsGuest = query('#continueAsGuest');
        
        // Switch forms
        showSignup?.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.remove('active');
            signupForm.classList.add('active');
        });
        
        showLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.remove('active');
            loginForm.classList.add('active');
        });
        
        // Login
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = query('#loginEmail').value;
            const password = query('#loginPassword').value;
            
            try {
                await AuthManager.signin(email, password);
                authModal.classList.remove('active');
                UIManager.showToast('Welcome back!', 'success');
            } catch (error) {
                UIManager.showToast(error.message, 'error');
            }
        });
        
        // Signup
        signupForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = query('#signupEmail').value;
            const password = query('#signupPassword').value;
            const confirm = query('#signupPasswordConfirm').value;
            
            if (password !== confirm) {
                UIManager.showToast('Passwords do not match', 'error');
                return;
            }
            
            try {
                await AuthManager.signup(email, password);
                authModal.classList.remove('active');
                UIManager.showToast('Account created!', 'success');
            } catch (error) {
                UIManager.showToast(error.message, 'error');
            }
        });
        
        // Continue as guest
        continueAsGuest?.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }
    
    showAuthModal() {
        const authModal = query('#authModal');
        authModal.classList.add('active');
    }
    
    loadSettings() {
        // Load API key (masked)
        const apiKey = AIService.getApiKey();
        if (apiKey) {
            query('#apiKeyInput').value = apiKey;
        }
        
        // Load model
        const model = AIService.getModel();
        query('#modelSelect').value = model;
        
        // Load theme
        const theme = localStorage.getItem('aib_theme') || 'light';
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(opt => {
            if (opt.dataset.theme === theme) {
                opt.classList.add('active');
            }
        });
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('aib_theme', theme);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}

export default App;
