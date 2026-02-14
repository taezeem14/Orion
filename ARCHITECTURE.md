# AI Browser - Architecture Documentation

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERFACE                       │
│  (index.html + styles/main.css + themes.css)            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    UI MANAGER                            │
│  - DOM Interactions                                      │
│  - Event Delegation                                      │
│  - Toast Notifications                                   │
└─────────┬────────────────────────────┬──────────────────┘
          │                            │
┌─────────▼─────────┐        ┌────────▼────────────┐
│   TAB MANAGER     │        │   NAV ENGINE        │
│  - Create Tabs    │        │  - Load URLs        │
│  - Switch Tabs    │        │  - Iframe Handling  │
│  - Close Tabs     │        │  - Special Pages    │
│  - History Stack  │        │  - Error Pages      │
└─────────┬─────────┘        └──────────┬──────────┘
          │                              │
          └──────────┬───────────────────┘
                     │
         ┌───────────▼───────────┐
         │    EVENT BUS          │
         │  Global Events        │
         └───────────┬───────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼─────┐   ┌────▼──────┐   ┌───▼────────┐
│AI SERVICE│   │ AUTH MGR  │   │  STORAGE   │
│OpenRouter│   │Local/FB   │   │ IndexedDB  │
└──────────┘   └───────────┘   └────────────┘
```

## 📦 Module Breakdown

### Core Modules

#### 1. EventBus (`core/EventBus.js`)
**Purpose**: Decoupled communication between modules

**Key Methods**:
- `on(event, callback)` - Subscribe to event
- `emit(event, data)` - Publish event
- `off(event, callback)` - Unsubscribe
- `once(event, callback)` - One-time subscription

**Events**:
- `tab:created`, `tab:closed`, `tab:activated`, `tab:updated`
- `tab:navigate`, `tab:reload`
- `auth:signed-in`, `auth:signed-out`
- `ai:key-updated`, `ai:model-changed`

#### 2. TabManager (`core/TabManager.js`)
**Purpose**: Complete tab lifecycle management

**Data Structure**:
```javascript
{
    id: string,
    title: string,
    url: string,
    favicon: string,
    loading: boolean,
    history: string[],
    historyIndex: number,
    scrollPosition: number,
    timestamp: number,
    aiContext: array
}
```

**Key Methods**:
- `createTab(url, options)` - New tab
- `closeTab(tabId)` - Remove tab
- `activateTab(tabId)` - Switch to tab
- `navigate(tabId, url)` - Load URL
- `goBack()`, `goForward()` - History navigation
- `reload()` - Refresh current page

#### 3. NavigationEngine (`core/NavigationEngine.js`)
**Purpose**: Render web content safely

**Rendering Strategy**:
1. **Special URLs** (`about:*`) → Custom pages
2. **Valid URLs** → Iframe sandbox
3. **Search queries** → AI search suggestion
4. **Blocked URLs** → Error page

**Security**:
- CSP validation
- Sandbox attributes
- XSS prevention
- Script stripping

### Storage Layer

#### IndexedDBHelper (`storage/IndexedDBHelper.js`)
**Purpose**: Low-level IndexedDB operations

**Object Stores**:
- `tabs` - Tab data
- `history` - Browsing history
- `bookmarks` - Saved pages
- `ai_chats` - Conversation history
- `settings` - User preferences

#### StorageManager (`storage/StorageManager.js`)
**Purpose**: Unified storage API

**Dual Strategy**:
- **IndexedDB**: Large data (history, chats)
- **localStorage**: Quick access (settings)

**Key Features**:
- Auto-save tabs
- Export/import JSON
- Clear all data
- Query filtering

### AI Integration

#### AIService (`ai/AIService.js`)
**Purpose**: OpenRouter API integration

**Features**:
- Streaming responses
- Multiple models
- Rate limiting
- Error handling

**API Flow**:
```
User Input → AIService.chat()
           → Fetch OpenRouter
           → Stream response
           → Yield chunks
           → Complete
```

**Supported Models**:
- Claude 3.5 Sonnet
- GPT-4 Turbo
- Gemini Pro 1.5
- Llama 3.1
- Mistral Large
- DeepSeek

### Authentication

#### LocalAuth (`auth/LocalAuth.js`)
**Purpose**: Client-side authentication

**Security**:
- SHA-256 password hashing
- Secure session tokens
- No plaintext storage

**User Object**:
```javascript
{
    id: string,
    email: string,
    passwordHash: string,
    displayName: string,
    createdAt: number,
    lastLogin: number
}
```

#### AuthManager (`auth/AuthManager.js`)
**Purpose**: Auth provider abstraction

**Design Pattern**: Strategy Pattern
- Current: LocalAuth
- Future: Firebase Auth
- Easy provider swap

### UI Layer

#### UIManager (`ui/UIManager.js`)
**Purpose**: DOM manipulation and event handling

**Responsibilities**:
- Render tabs
- Handle address bar
- AI panel management
- Command palette
- Toast notifications
- Theme switching

**Rendering**:
- Template literals
- Event delegation
- Minimal reflows
- Debounced inputs

## 🔄 Data Flow Examples

### Creating a New Tab

```
User clicks "New Tab"
    ↓
UIManager.newTabBtn.click
    ↓
TabManager.createTab()
    ↓
EventBus.emit('tab:created')
    ↓
UIManager renders new tab
    ↓
NavigationEngine.loadUrl()
    ↓
Viewport updated
```

### AI Chat Message

```
User types message
    ↓
UIManager.handleAIMessage()
    ↓
AIService.streamChat()
    ↓
Fetch OpenRouter API
    ↓
Stream chunks
    ↓
UIManager.addAIMessage() (progressive)
    ↓
Auto-scroll messages
    ↓
Complete
```

### Authentication

```
User submits login
    ↓
AuthManager.signin()
    ↓
LocalAuth.verifyPassword()
    ↓
EventBus.emit('auth:signed-in')
    ↓
UIManager.updateUserProfile()
    ↓
Load user data
```

## 🎯 Design Patterns Used

### 1. Singleton Pattern
All managers (TabManager, AIService, etc.) are singletons
```javascript
class TabManager { }
export default new TabManager();
```

### 2. Observer Pattern
EventBus implements pub/sub
```javascript
EventBus.on('event', callback);
EventBus.emit('event', data);
```

### 3. Strategy Pattern
AuthManager can swap providers
```javascript
this.provider = useFirebase ? FirebaseAuth : LocalAuth;
```

### 4. Module Pattern
ES6 modules for encapsulation
```javascript
import { function } from './module.js';
export default class { }
```

## 🔐 Security Measures

### Password Security
- SHA-256 hashing via Web Crypto API
- No plaintext storage
- Secure session tokens

### XSS Prevention
- Input sanitization
- HTML escaping
- Script stripping

### CSP Validation
- Protocol checking
- Domain whitelisting
- Iframe sandbox

### API Key Protection
- Masked display
- localStorage encryption
- Never sent to third parties

## 📈 Performance Optimizations

### Tab Management
- Lazy rendering (only active tab)
- History limited to 50 entries
- Debounced saves

### AI Streaming
- Token-by-token display
- Async generators
- Cancel support

### DOM Operations
- Event delegation
- Minimal queries
- Batch updates

### Storage
- IndexedDB for bulk data
- localStorage for quick access
- Compressed JSON

## 🚀 Scaling Considerations

### Adding Firebase

1. **Install SDK**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
```

2. **Create FirebaseAuth.js**
```javascript
class FirebaseAuth {
    async signin(email, password) {
        return await signInWithEmailAndPassword(auth, email, password);
    }
}
```

3. **Update AuthManager**
```javascript
this.provider = this.useFirebase ? new FirebaseAuth() : LocalAuth;
```

### Adding Features

#### History Page
1. Create `ui/HistoryView.js`
2. Subscribe to `view:history` event
3. Query `StorageManager.getHistory()`
4. Render with virtual scrolling

#### Split View
1. Duplicate viewport container
2. Track `splitMode` state
3. Resize handlers
4. Two active tabs

#### Tab Groups
1. Add `groupId` to tab object
2. Create `TabGroup` class
3. UI for group management
4. Color coding

## 🧪 Testing Strategy

### Unit Tests
- Test each manager independently
- Mock EventBus
- Mock storage

### Integration Tests
- Full flow tests
- Tab lifecycle
- Auth flow
- AI chat

### E2E Tests
- Selenium/Playwright
- User scenarios
- Cross-browser

## 📊 Performance Metrics

### Target Goals
- Initial load: < 2s
- Tab switch: < 100ms
- AI response start: < 500ms
- Smooth 60 FPS animations

### Monitoring
- Performance API
- Memory usage
- Storage quota
- Network calls

## 🔧 Configuration

### Constants (`utils/constants.js`)
All magic numbers and config centralized:
- Tab limits
- API endpoints
- Storage keys
- Keyboard shortcuts
- Theme colors

### Environment
No build step required:
- Pure ES6 modules
- Native browser APIs
- No bundler needed

## 📝 Code Style

### Naming Conventions
- Classes: PascalCase
- Methods: camelCase
- Constants: UPPER_SNAKE_CASE
- Private: _prefixed

### File Organization
- One class per file
- Related files grouped
- Clear export/import

### Comments
```javascript
/* ===== Section Header ===== */

// Inline comment

/**
 * JSDoc for complex functions
 * @param {string} param - Description
 * @returns {Promise<void>}
 */
```

## 🎓 Learning Resources

### Concepts Demonstrated
- ES6 Modules
- Async/Await
- Event-Driven Architecture
- Web Crypto API
- IndexedDB
- Service Worker (future)
- PWA principles

### Further Reading
- MDN Web Docs
- JavaScript.info
- Web.dev
- Firebase Docs

---

This architecture is designed for:
✅ Maintainability
✅ Scalability  
✅ Performance
✅ Security
✅ Developer Experience
