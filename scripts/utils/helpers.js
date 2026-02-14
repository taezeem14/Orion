/* ============================================
   AI Browser - Utility Helpers
   ============================================ */

import { CONFIG, PATTERNS, SPECIAL_URLS } from './constants.js';

/* ===== ID Generation ===== */
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateShortId = () => {
    return Math.random().toString(36).substr(2, 9);
};

/* ===== URL Utilities ===== */
export const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
};

export const normalizeUrl = (input) => {
    if (!input) return '';
    
    input = input.trim();
    
    // Special URLs
    if (input.startsWith('about:')) {
        return input;
    }
    
    // Already has protocol
    if (input.startsWith('http://') || input.startsWith('https://')) {
        return input;
    }
    
    // Check if it looks like a URL
    if (PATTERNS.URL.test(input) || PATTERNS.IP.test(input)) {
        return `https://${input}`;
    }
    
    // Otherwise, treat as search query
    return null;
};

export const getUrlDomain = (url) => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return '';
    }
};

export const getFaviconUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
        return '';
    }
};

/* ===== String Utilities ===== */
export const truncate = (str, length = 50) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
};

export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (str) => {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

/* ===== Date/Time Utilities ===== */
export const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
        return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
};

export const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
};

export const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
};

/* ===== Array Utilities ===== */
export const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const unique = (array) => {
    return [...new Set(array)];
};

export const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
};

/* ===== Object Utilities ===== */
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

export const merge = (target, source) => {
    return { ...target, ...source };
};

export const pick = (obj, keys) => {
    return keys.reduce((result, key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
        return result;
    }, {});
};

export const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
};

/* ===== DOM Utilities ===== */
export const createElement = (tag, props = {}, children = []) => {
    const element = document.createElement(tag);
    
    Object.entries(props).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on')) {
            const event = key.substring(2).toLowerCase();
            element.addEventListener(event, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
};

export const query = (selector, parent = document) => {
    return parent.querySelector(selector);
};

export const queryAll = (selector, parent = document) => {
    return Array.from(parent.querySelectorAll(selector));
};

export const addClass = (element, ...classes) => {
    element.classList.add(...classes);
};

export const removeClass = (element, ...classes) => {
    element.classList.remove(...classes);
};

export const toggleClass = (element, className) => {
    element.classList.toggle(className);
};

export const hasClass = (element, className) => {
    return element.classList.contains(className);
};

/* ===== Event Utilities ===== */
export const debounce = (func, delay = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

export const throttle = (func, delay = 100) => {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
};

export const once = (func) => {
    let called = false;
    return (...args) => {
        if (!called) {
            called = true;
            return func(...args);
        }
    };
};

/* ===== Storage Utilities ===== */
export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

/* ===== Validation Utilities ===== */
export const validators = {
    email: (email) => PATTERNS.EMAIL.test(email),
    url: (url) => isValidUrl(url),
    notEmpty: (value) => value && value.trim().length > 0,
    minLength: (value, length) => value && value.length >= length,
    maxLength: (value, length) => value && value.length <= length,
    match: (value1, value2) => value1 === value2
};

/* ===== File Utilities ===== */
export const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const readJsonFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

/* ===== Copy to Clipboard ===== */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Clipboard error:', error);
        return false;
    }
};

/* ===== Color Utilities ===== */
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

export const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

/* ===== Random Utilities ===== */
export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomChoice = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

/* ===== Wait/Sleep ===== */
export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/* ===== Focus Management ===== */
export const trapFocus = (element) => {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const handleTab = (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    };
    
    element.addEventListener('keydown', handleTab);
    firstFocusable?.focus();
    
    return () => element.removeEventListener('keydown', handleTab);
};

/* ===== Export All ===== */
export default {
    generateId,
    generateShortId,
    isValidUrl,
    normalizeUrl,
    getUrlDomain,
    getFaviconUrl,
    truncate,
    capitalize,
    slugify,
    escapeHtml,
    formatDate,
    formatTimestamp,
    getTimeOfDay,
    shuffle,
    unique,
    groupBy,
    deepClone,
    merge,
    pick,
    omit,
    createElement,
    query,
    queryAll,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    debounce,
    throttle,
    once,
    storage,
    validators,
    downloadJson,
    readJsonFile,
    copyToClipboard,
    hexToRgb,
    rgbToHex,
    randomInt,
    randomChoice,
    sleep,
    trapFocus
};
