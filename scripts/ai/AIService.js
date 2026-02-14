/* ============================================
   AI Browser - AI Service
   OpenRouter API integration with streaming
   ============================================ */

import { CONFIG, AI_PROMPTS, ERRORS } from '../utils/constants.js';
import { storage } from '../utils/helpers.js';
import { validateApiKey, RateLimiter } from '../utils/security.js';
import EventBus from '../core/EventBus.js';

class AIService {
    constructor() {
        this.apiKey = null;
        this.baseUrl = CONFIG.AI.OPENROUTER_BASE_URL;
        this.currentModel = CONFIG.AI.DEFAULT_MODEL;
        this.rateLimiter = new RateLimiter(20, 60000); // 20 requests per minute
        this.activeStreams = new Map();
    }
    
    init() {
        // Load API key from storage
        this.apiKey = storage.get(CONFIG.STORAGE_KEYS.API_KEY);
        this.currentModel = storage.get('ai_model', CONFIG.AI.DEFAULT_MODEL);
    }
    
    setApiKey(apiKey) {
        if (!validateApiKey(apiKey)) {
            throw new Error('Invalid API key format');
        }
        
        this.apiKey = apiKey;
        storage.set(CONFIG.STORAGE_KEYS.API_KEY, apiKey);
        EventBus.emit('ai:key-updated');
    }
    
    getApiKey() {
        return this.apiKey;
    }
    
    hasApiKey() {
        return !!this.apiKey && validateApiKey(this.apiKey);
    }
    
    setModel(modelId) {
        this.currentModel = modelId;
        storage.set('ai_model', modelId);
        EventBus.emit('ai:model-changed', modelId);
    }
    
    getModel() {
        return this.currentModel;
    }
    
    getAvailableModels() {
        return CONFIG.AI.MODELS;
    }
    
    async chat(messages, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error(ERRORS.NO_API_KEY);
        }
        
        if (!this.rateLimiter.checkLimit()) {
            throw new Error(ERRORS.RATE_LIMIT);
        }
        
        const model = options.model || this.currentModel;
        const stream = options.stream !== false;
        const temperature = options.temperature || CONFIG.AI.TEMPERATURE;
        const maxTokens = options.maxTokens || CONFIG.AI.MAX_TOKENS;
        
        const requestBody = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream
        };
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': CONFIG.APP_NAME
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error?.message || `API Error: ${response.status}`);
            }
            
            if (stream) {
                return this._handleStreamResponse(response, options.onChunk);
            } else {
                const data = await response.json();
                return data.choices[0].message.content;
            }
        } catch (error) {
            console.error('AI Service error:', error);
            throw error;
        }
    }
    
    async *_handleStreamResponse(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.trim() === '') continue;
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        
                        if (data === '[DONE]') {
                            return;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content;
                            
                            if (content) {
                                if (onChunk) onChunk(content);
                                yield content;
                            }
                        } catch (e) {
                            console.warn('Failed to parse SSE data:', data);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
    
    async streamChat(messages, onChunk, options = {}) {
        const stream = await this.chat(messages, { ...options, stream: true, onChunk });
        let fullResponse = '';
        
        for await (const chunk of stream) {
            fullResponse += chunk;
        }
        
        return fullResponse;
    }
    
    cancelStream(streamId) {
        const stream = this.activeStreams.get(streamId);
        if (stream) {
            stream.cancel();
            this.activeStreams.delete(streamId);
        }
    }
    
    // Convenience methods for different AI modes
    async search(query, onChunk) {
        const messages = [
            {
                role: 'user',
                content: AI_PROMPTS.search(query)
            }
        ];
        
        return await this.streamChat(messages, onChunk);
    }
    
    async explainPage(pageContent, onChunk) {
        const messages = [
            {
                role: 'user',
                content: AI_PROMPTS.explain(pageContent)
            }
        ];
        
        return await this.streamChat(messages, onChunk);
    }
    
    async askAboutPage(question, pageContent, onChunk) {
        const messages = [
            {
                role: 'user',
                content: AI_PROMPTS.ask(question, pageContent)
            }
        ];
        
        return await this.streamChat(messages, onChunk);
    }
    
    async compareTabs(tab1Content, tab2Content, onChunk) {
        const messages = [
            {
                role: 'user',
                content: AI_PROMPTS.compare(tab1Content, tab2Content)
            }
        ];
        
        return await this.streamChat(messages, onChunk);
    }
    
    async codeAssist(request, onChunk) {
        const messages = [
            {
                role: 'user',
                content: AI_PROMPTS.code(request)
            }
        ];
        
        return await this.streamChat(messages, onChunk);
    }
    
    async research(topic, onChunk) {
        const messages = [
            {
                role: 'user',
                content: AI_PROMPTS.research(topic)
            }
        ];
        
        return await this.streamChat(messages, onChunk);
    }
    
    // Conversation management
    buildConversation(history) {
        return history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }
    
    async continueConversation(history, newMessage, onChunk) {
        const messages = [
            ...this.buildConversation(history),
            {
                role: 'user',
                content: newMessage
            }
        ];
        
        return await this.streamChat(messages, onChunk);
    }
}

export default new AIService();
