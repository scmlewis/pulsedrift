# PulseDrift - Zen Meditation Timer

A beautiful, zen-styled meditation timer with breathing exercises, ambient sounds, and mindfulness features. Built with vanilla JavaScript, responsive design, and Web Audio API.

![PulseDrift](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core Timer
- **Preset Durations**: 5, 10, 15, 20, 30 minutes
- **Custom Timer**: Set any duration up to 3 hours
- **Visual Progress Ring**: Beautiful animated progress indicator with color transitions
- **Session Tracking**: localStorage-based history with streak tracking

### Audio System (Web Audio API)
- **Bell Sounds**:
  - Tibetan Singing Bowl (generated with harmonics and vibrato)
  - Soft Gong (deep, resonant tone)
  - Temple Bell (bright, clear tone)
  - Silence option
- **Ambient Sounds**:
  - Rain (filtered white noise)
  - Ocean Waves (modulated low-pass noise)
  - Forest Birds (procedural chirping with ambient wind)
  - Gentle Wind (multi-layered atmospheric noise)
- **Interval Bells**: Optional bells at regular intervals (1, 5, or 10 minutes)
- **Volume Control**: Adjustable master volume

### Breathing Exercises
- **3 Breathing Patterns**:
  - Calm Breathing (4-4): Simple inhale-exhale
  - Relaxing Breath (4-7-8): Deep relaxation technique
  - Box Breathing (4-4-4-4): Focus and stress reduction
- **Visual Guidance**: Animated breathing circle with instructions
- **Desktop Integration**: Collapsible breathing guide in sidebar
- **Auto-start Option**: Begin breathing guide with timer

### Mindfulness Features
- **Daily Quotes**: 40+ rotating mindfulness quotes
- **Personal Intentions**: Set daily meditation intentions
- **Focus Mode**: Distraction-free environment (press `F` or click icon)
- **Completion Celebration**: Beautiful overlay with motivational message
- **Data Import/Export**: Backup and restore your PulseDrift data

### Design
- **Dark Theme Default**: Easy on the eyes with light mode option
- **Zen Aesthetics**:
  - Water ripple animations
  - Lotus flower with pulse animation
  - Sand pattern gradients
  - Natural color palette
- **Responsive**: Mobile-first design with optimized desktop layout
- **Accessibility**: Respects `prefers-reduced-motion`

## Responsive Design

### Mobile (< 768px)
- Single-column layout
- Touch-optimized controls
- Compact timer display
- Stacked sections

### Tablet (768px - 1023px)
- Larger timer (320px)
- Enhanced spacing
- Improved typography

### Desktop (≥ 1024px)
- **Two-Column Layout**:
  - **Left Sidebar** (400px):
    - Daily quote
    - Preset buttons (2-column grid)
    - Integrated breathing guide (collapsible)
    - Sound controls
    - Intention input
  - **Center/Right Panel**:
    - Large timer display (400px)
    - Prominent controls
    - Breathing circle overlay
- **Enhanced Interactions**:
  - Hover effects with scale and glow
  - Smooth transitions
  - Elevated shadows
- **Larger Timer**: 6rem font size (vs 3.5rem mobile)
- **Sticky Sidebar**: Controls remain visible while scrolling

### Ultra-Wide (≥ 1600px)
- Expanded sidebar (450px)
- Even larger timer (450px)
- Maximum breathing space

## Keyboard Shortcuts

- `Space` - Start/Pause timer
- `R` - Reset timer
- `F` - Toggle focus mode
- `Escape` - Close modals/panels

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Requirements**: Modern browser with Web Audio API support

## Installation & Deployment

### Local Development
1. Clone the repository
2. Open `index.html` in a browser
3. No build process required!

### Deployment Options

#### GitHub Pages (Recommended)
```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Enable GitHub Pages
# Settings → Pages → Source: main branch
```

#### Netlify
- Drag and drop the folder to Netlify
- Or connect GitHub repo for continuous deployment

#### Vercel
```bash
vercel deploy
```

#### Traditional Hosting
- Upload `index.html`, `styles.css`, `app.js` to any web server
- No server-side processing needed

## File Structure

```
PulseDrift/
├── index.html          # Main HTML structure
├── styles.css          # All styling & animations
├── constants.js        # Configuration constants & safe storage utilities
├── app.js              # Core timer logic & state management
├── enhancements.js     # Templates, journal, achievements, analytics
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
├── icons/              # App icons for PWA
├── README.md           # Documentation
└── dev/                # Development files (git-ignored)
    ├── jest.config.js  # Test configuration
    ├── tests/          # Integration tests
    └── prompts/        # Copilot prompts
```

## Features Breakdown

### localStorage Keys
- `pulsedrift_settings` - User preferences
- `pulsedrift_sessions` - Session history
- `pulsedrift_volume` - Volume level
- `pulsedrift_bell` - Selected bell sound
- `pulsedrift_ambient` - Selected ambient sound
- `pulsedrift_intention` - Current intention
- `pulsedrift_templates` - Session templates
- `pulsedrift_achievements` - Unlocked achievements
- `pulsedrift_journal` - Journal entries

### Session History
- Total sessions count
- Total minutes meditated
- Day streak calculation
- Individual session records with timestamps
- Completed vs partial session tracking

### Web Audio API Sounds
All sounds are **procedurally generated** using Web Audio API:
- No external audio files needed
- Works completely offline
- Customizable frequencies and envelopes
- Efficient and lightweight

## Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --accent-primary: #58a6ff;
    --accent-zen: #7ee787;
    --accent-lotus: #d2a8ff;
    /* ... */
}
```

### Quotes
Add more quotes in `app.js`:
```javascript
const quotes = [
    { text: "Your quote here", author: "Author Name" },
    // ...
];
```

### Breathing Patterns
Add custom patterns in `app.js`:
```javascript
// Format: "inhale-hold-exhale-hold"
<option value="5-5-5-5">Custom (5-5-5-5)</option>
```

## Progressive Web App (PWA)
PulseDrift now ships with PWA support out of the box:
- `manifest.json` included
- `sw.js` enabled for offline caching
- App icons in `icons/`

## Performance

- **No dependencies**: Pure vanilla JavaScript
- **Lightweight**: < 50KB total (uncompressed)
- **Fast load**: < 1s on 3G connection
- **Smooth animations**: CSS transforms & GPU acceleration
- **Efficient audio**: Real-time synthesis vs audio files

## Development

### Running Tests
```bash
npm install          # Install dev dependencies (Jest)
npm test             # Run integration tests
```

### Test Coverage
- Timer lifecycle (start, pause, resume, reset)
- localStorage persistence & error handling
- Template operations with XSS prevention
- Achievement system
- Constants validation

### Code Quality
- Error-safe localStorage wrappers (`safeGetItem`, `safeSetItem`)
- Event delegation for dynamic content
- XSS prevention with HTML escaping
- Centralized constants for maintainability

## License

MIT License - feel free to use, modify, and distribute!

## Contributing

Contributions welcome! Areas for enhancement:
- Additional breathing patterns
- More ambient sound types
- Export/import session data
- Social sharing features
- Guided meditation scripts
- Multi-language support

## Credits

- **Font**: [Quicksand](https://fonts.google.com/specimen/Quicksand) by Google Fonts
- **Design Inspiration**: Zen gardens, nature, minimalism
- **Audio**: Web Audio API procedural generation

## Support

For issues or questions, please open an issue on GitHub.

---

**Breathe. Focus. Be present.** 🪷
