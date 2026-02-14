/* ============================================
   AI Browser - Auth Manager
   Abstraction layer for auth providers
   Supports: LocalAuth (current) + Firebase (future)
   ============================================ */

import LocalAuth from './LocalAuth.js';
import EventBus from '../core/EventBus.js';

class AuthManager {
    constructor() {
        this.provider = null;
        this.useFirebase = false; // Set to true when Firebase is integrated
    }
    
    async init() {
        // Choose auth provider
        if (this.useFirebase) {
            // TODO: Initialize Firebase Auth
            // this.provider = new FirebaseAuth();
            throw new Error('Firebase not yet implemented');
        } else {
            this.provider = LocalAuth;
        }
        
        await this.provider.init();
        
        // Forward events
        this._setupEventForwarding();
        
        return this.provider.getCurrentUser();
    }
    
    async signup(email, password) {
        return await this.provider.signup(email, password);
    }
    
    async signin(email, password) {
        return await this.provider.signin(email, password);
    }
    
    signout() {
        this.provider.signout();
    }
    
    getCurrentUser() {
        return this.provider.getCurrentUser();
    }
    
    isSignedIn() {
        return this.provider.isSignedIn();
    }
    
    updateProfile(updates) {
        return this.provider.updateProfile(updates);
    }
    
    async changePassword(currentPassword, newPassword) {
        return await this.provider.changePassword(currentPassword, newPassword);
    }
    
    deleteAccount() {
        return this.provider.deleteAccount();
    }
    
    // Future: Firebase-specific methods
    async signInWithGoogle() {
        if (!this.useFirebase) {
            throw new Error('Firebase required for Google Sign-In');
        }
        // TODO: Implement Firebase Google Sign-In
    }
    
    async signInWithGithub() {
        if (!this.useFirebase) {
            throw new Error('Firebase required for GitHub Sign-In');
        }
        // TODO: Implement Firebase GitHub Sign-In
    }
    
    async resetPassword(email) {
        if (!this.useFirebase) {
            throw new Error('Firebase required for password reset');
        }
        // TODO: Implement Firebase password reset
    }
    
    _setupEventForwarding() {
        // This ensures AuthManager events work regardless of provider
        const events = [
            'auth:signed-in',
            'auth:signed-out',
            'auth:signed-up',
            'auth:profile-updated',
            'auth:password-changed',
            'auth:account-deleted'
        ];
        
        // Events are already emitted by LocalAuth
        // Firebase integration would emit the same events
    }
    
    // Migration helper (for when adding Firebase)
    async migrateToFirebase() {
        if (this.useFirebase) {
            throw new Error('Already using Firebase');
        }
        
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return;
        }
        
        // TODO: Implement migration logic
        // 1. Create Firebase account
        // 2. Migrate user data
        // 3. Switch provider
        // 4. Remove local account
        
        throw new Error('Migration not yet implemented');
    }
}

export default new AuthManager();
