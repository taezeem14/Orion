/* ============================================
   AI Browser - Local Authentication
   Client-side auth with Web Crypto API
   Firebase-ready architecture
   ============================================ */

import { hashPassword, verifyPassword, generateSecureId } from '../utils/security.js';
import { storage } from '../utils/helpers.js';
import { CONFIG } from '../utils/constants.js';
import EventBus from '../core/EventBus.js';

class LocalAuth {
    constructor() {
        this.currentUser = null;
        this.sessionKey = CONFIG.STORAGE_KEYS.USER_SESSION;
    }
    
    async init() {
        // Check for existing session
        const session = storage.get(this.sessionKey);
        
        if (session && session.userId) {
            const user = this.getUser(session.userId);
            if (user) {
                this.currentUser = user;
                EventBus.emit('auth:signed-in', user);
            }
        }
        
        return this.currentUser;
    }
    
    async signup(email, password) {
        // Validate input
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        
        // Check if user exists
        const existingUser = this.getUserByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }
        
        // Hash password
        const passwordHash = await hashPassword(password);
        
        // Create user
        const user = {
            id: generateSecureId(),
            email,
            passwordHash,
            displayName: email.split('@')[0],
            createdAt: Date.now(),
            lastLogin: Date.now()
        };
        
        // Save user
        this.saveUser(user);
        
        // Create session
        this.createSession(user);
        
        EventBus.emit('auth:signed-up', user);
        EventBus.emit('auth:signed-in', user);
        
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName
        };
    }
    
    async signin(email, password) {
        // Get user
        const user = this.getUserByEmail(email);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);
        
        if (!isValid) {
            throw new Error('Invalid email or password');
        }
        
        // Update last login
        user.lastLogin = Date.now();
        this.saveUser(user);
        
        // Create session
        this.createSession(user);
        
        EventBus.emit('auth:signed-in', user);
        
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName
        };
    }
    
    signout() {
        this.currentUser = null;
        storage.remove(this.sessionKey);
        EventBus.emit('auth:signed-out');
    }
    
    getCurrentUser() {
        return this.currentUser ? {
            id: this.currentUser.id,
            email: this.currentUser.email,
            displayName: this.currentUser.displayName
        } : null;
    }
    
    isSignedIn() {
        return !!this.currentUser;
    }
    
    updateProfile(updates) {
        if (!this.currentUser) {
            throw new Error('Not signed in');
        }
        
        Object.assign(this.currentUser, updates);
        this.saveUser(this.currentUser);
        
        EventBus.emit('auth:profile-updated', this.currentUser);
    }
    
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            throw new Error('Not signed in');
        }
        
        // Verify current password
        const isValid = await verifyPassword(currentPassword, this.currentUser.passwordHash);
        
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }
        
        if (newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters');
        }
        
        // Hash new password
        const passwordHash = await hashPassword(newPassword);
        
        this.currentUser.passwordHash = passwordHash;
        this.saveUser(this.currentUser);
        
        EventBus.emit('auth:password-changed');
    }
    
    deleteAccount() {
        if (!this.currentUser) {
            throw new Error('Not signed in');
        }
        
        const userId = this.currentUser.id;
        
        // Remove user
        const users = this.getAllUsers();
        const filtered = users.filter(u => u.id !== userId);
        storage.set('aib_users', filtered);
        
        // Sign out
        this.signout();
        
        EventBus.emit('auth:account-deleted');
    }
    
    // Private methods
    createSession(user) {
        this.currentUser = user;
        storage.set(this.sessionKey, {
            userId: user.id,
            createdAt: Date.now()
        });
    }
    
    saveUser(user) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === user.id);
        
        if (index >= 0) {
            users[index] = user;
        } else {
            users.push(user);
        }
        
        storage.set('aib_users', users);
    }
    
    getUser(userId) {
        const users = this.getAllUsers();
        return users.find(u => u.id === userId);
    }
    
    getUserByEmail(email) {
        const users = this.getAllUsers();
        return users.find(u => u.email === email);
    }
    
    getAllUsers() {
        return storage.get('aib_users', []);
    }
}

export default new LocalAuth();
