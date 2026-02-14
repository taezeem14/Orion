/* ============================================
   AI Browser - Security Utilities
   Password hashing, sanitization, validation
   ============================================ */

/* ===== Password Hashing (Web Crypto API) ===== */
export const hashPassword = async (password) => {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Password hashing error:', error);
        throw error;
    }
};

export const verifyPassword = async (password, hash) => {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
};

/* ===== Input Sanitization ===== */
export const sanitizeHtml = (html) => {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
};

export const sanitizeUrl = (url) => {
    // Prevent javascript: and data: URLs
    if (url.startsWith('javascript:') || url.startsWith('data:')) {
        return 'about:blank';
    }
    return url;
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/* ===== XSS Protection ===== */
export const stripScripts = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all script tags
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove event handlers
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                element.removeAttribute(attr.name);
            }
        });
    });
    
    return temp.innerHTML;
};

/* ===== API Key Masking ===== */
export const maskApiKey = (key) => {
    if (!key || key.length < 8) return '****';
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
};

export const validateApiKey = (key) => {
    // OpenRouter keys typically start with 'sk-or-v1-'
    return key && key.startsWith('sk-or-v1-') && key.length > 20;
};

/* ===== CSRF Token Generation ===== */
export const generateCsrfToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/* ===== Secure Random ID ===== */
export const generateSecureId = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/* ===== Rate Limiting ===== */
export class RateLimiter {
    constructor(maxRequests, timeWindow) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = [];
    }
    
    checkLimit() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.timeWindow);
        
        if (this.requests.length >= this.maxRequests) {
            return false;
        }
        
        this.requests.push(now);
        return true;
    }
    
    reset() {
        this.requests = [];
    }
}

/* ===== Content Security Policy Validator ===== */
export const validateCsp = (url) => {
    try {
        const urlObj = new URL(url);
        
        // Block known dangerous protocols
        const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:'];
        if (dangerousProtocols.some(proto => url.toLowerCase().startsWith(proto))) {
            return false;
        }
        
        // Only allow http and https
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return false;
        }
        
        return true;
    } catch {
        return false;
    }
};

/* ===== Iframe Sandbox Attributes ===== */
export const getIframeSandboxAttributes = () => {
    return [
        'allow-scripts',
        'allow-same-origin',
        'allow-forms',
        'allow-popups',
        'allow-modals'
    ].join(' ');
};

/* ===== Export All ===== */
export default {
    hashPassword,
    verifyPassword,
    sanitizeHtml,
    sanitizeUrl,
    sanitizeInput,
    stripScripts,
    maskApiKey,
    validateApiKey,
    generateCsrfToken,
    generateSecureId,
    RateLimiter,
    validateCsp,
    getIframeSandboxAttributes
};
