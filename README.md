# AI Browser 🚀

A production-grade browser-in-browser application with AI-powered browsing capabilities. Built with vanilla JavaScript, featuring a clean modern Arc-inspired interface, multi-tab management, OpenRouter API integration, and client-side authentication.

## ✨ Features

### Core Browser
- **Multi-Tab System**: Full tab management with history, favicon support, and keyboard shortcuts
- **Smart Address Bar**: URL detection, search query handling, and autocomplete
- **Navigation Engine**: Secure iframe rendering with fallback pages
- **History & Bookmarks**: Persistent browsing history and bookmark management
- **Command Palette** (Ctrl+K): Quick actions and navigation

### AI Integration
- **OpenRouter API**: Support for multiple AI models (Claude, GPT-4, Gemini, etc.)
- **Streaming Responses**: Real-time token streaming for smooth UX
- **Multiple Modes**:
  - Chat - General conversation
  - AI Search - Web-enhanced answers
  - Explain Page - Summarize current page
  - Ask About Page - Context-aware Q&A
  - Compare Tabs - Analyze multiple pages
  - Code Assistant - Programming help
  - Research Mode - Structured research

### Authentication
- **Client-Side Auth**: Secure password hashing with Web Crypto API
- **Firebase-Ready**: Architecture designed for easy Firebase integration
- **User Profiles**: Display name, settings persistence per user
- **Guest Mode**: Use without account

### Storage
- **IndexedDB**: Large structured data (tabs, history, bookmarks, chats)
- **localStorage**: Quick access for preferences and settings
- **Data Export/Import**: JSON backup system
- **Auto-Save**: Automatic tab and settings persistence

### UI/UX
- **Arc-Inspired Design**: Clean, modern SaaS aesthetic
- **Dark/Light Themes**: Multiple theme support with auto mode
- **Smooth Animations**: Intentional micro-interactions
- **Responsive**: Works on desktop and tablets
- **Accessibility**: Keyboard navigation, ARIA labels, focus management

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))

### Installation

1. **Download the project**
   ```bash
   # Clone or download the ai-browser folder
   ```

2. **Open in browser**
   - Simply open `index.html` in your browser
   - OR use a local server:
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

3. **Configure API Key**
   - Click Settings (⚙️) in sidebar
   - Enter your OpenRouter API key
   - Select your preferred AI model
   - Click save

4. **Start Browsing!**
   - Create tabs with Ctrl+T
   - Enter URLs or search queries
   - Toggle AI Assistant with the chat icon

## 📁 Project Structure

```
ai-browser/
├── index.html              # Main HTML file
├── styles/
│   ├── main.css           # Core styles
│   ├── themes.css         # Light/dark themes
│   └── animations.css     # Animation system
├── scripts/
│   ├── app.js             # Main entry point
│   ├── core/
│   │   ├── EventBus.js    # Global event system
│   │   ├── TabManager.js  # Tab management
│   │   └── NavigationEngine.js  # Web content handling
│   ├── ui/
│   │   └── UIManager.js   # DOM interactions
│   ├── ai/
│   │   └── AIService.js   # OpenRouter integration
│   ├── auth/
│   │   ├── LocalAuth.js   # Client-side auth
│   │   └── AuthManager.js # Auth abstraction layer
│   ├── storage/
│   │   ├── IndexedDBHelper.js  # IndexedDB wrapper
│   │   └── StorageManager.js   # Unified storage API
│   └── utils/
│       ├── constants.js   # Configuration
│       ├── helpers.js     # Utility functions
│       └── security.js    # Security utilities
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New Tab |
| `Ctrl+W` | Close Tab |
| `Ctrl+L` | Focus Address Bar |
| `Ctrl+R` | Reload Page |
| `Ctrl+K` | Command Palette |
| `Ctrl+Shift+A` | Toggle AI Assistant |
| `Ctrl+Tab` | Next Tab |
| `Ctrl+Shift+Tab` | Previous Tab |

## 🎨 Customization

### Themes
Edit `styles/themes.css` to customize colors:

```css
:root {
    --bg-primary: #ffffff;
    --text-primary: #111827;
    --accent-primary: #3b82f6;
    /* ... */
}
```

### AI Models
Add new models in `scripts/utils/constants.js`:

```javascript
{
    id: 'your-model-id',
    name: 'Model Name',
    provider: 'Provider',
    contextWindow: 128000
}
```

### Keyboard Shortcuts
Modify `CONFIG.SHORTCUTS` in `constants.js`

## 🔒 Security

- **No Server Required**: Runs entirely client-side
- **Secure Storage**: API keys encrypted in localStorage
- **Password Hashing**: SHA-256 via Web Crypto API
- **XSS Protection**: Input sanitization and CSP validation
- **Sandboxed Iframes**: Restricted permissions for web content

## 🚧 Firebase Integration (Future)

The architecture is ready for Firebase:

1. **Install Firebase**
   ```bash
   npm install firebase
   ```

2. **Update AuthManager**
   - Set `useFirebase = true`
   - Implement Firebase Auth methods
   - Add Firestore for cloud sync

3. **Data Migration**
   - Use `AuthManager.migrateToFirebase()`
   - Transfers local data to cloud

## 📊 Performance

- **Lazy Loading**: Inactive tabs don't render
- **Debouncing**: Input events optimized
- **Efficient DOM**: Minimal reflows and repaints
- **IndexedDB**: Large data offloaded from memory

## 🐛 Troubleshooting

### Tabs not loading
- Check if site allows iframe embedding
- Some sites block X-Frame-Options
- Try AI Search instead

### AI not responding
- Verify API key in Settings
- Check browser console for errors
- Ensure OpenRouter credits available

### Storage errors
- Check browser storage permissions
- Clear site data and reload
- Export data before clearing

## 🎯 Roadmap

- [x] Core tab system
- [x] AI integration
- [x] Authentication
- [x] Storage system
- [ ] History page UI
- [ ] Bookmarks manager
- [ ] Split view mode
- [ ] Tab groups
- [ ] Extensions/plugins
- [ ] Cloud sync (Firebase)
- [ ] Mobile app

## 🤝 Contributing

This is a student project but feel free to:
- Report bugs
- Suggest features
- Fork and customize
- Share improvements

## 📝 License

MIT License - feel free to use for learning or personal projects.

## 🙏 Credits

- **Architecture**: Inspired by Arc Browser
- **AI**: Powered by OpenRouter
- **Icons**: Feather Icons (inline SVG)
- **Fonts**: Inter & JetBrains Mono

## 📧 Support

Issues? Questions? Ideas?
- Check the code comments
- Review the architecture docs
- Open an issue (if available)

---

Built with 🔥 for the future of AI-powered browsing.

**Note**: This is an educational project demonstrating modern web development patterns, modular architecture, and AI integration best practices.



## 🔧 Upgrades Applied (GPT Finishing Pass)

- Tab manager upgraded with:
  - pinned tabs (double-click tab)
  - recently closed tab restore (Ctrl+Shift+T)
  - safer session restore
  - improved history handling

- UI improvements:
  - XSS-safe tab titles (escaped HTML)
  - middle-click to close tabs
  - double-click to pin/unpin
  - better tab rendering stability

- Security:
  - Added `escapeHtml()` utility to prevent injected titles in UI

These changes are incremental and keep the original architecture intact.
