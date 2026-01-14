# Desktop Mode - Visual Layout Guide

## Layout Overview

PulseDrift automatically switches to a two-column desktop layout when the viewport width is ≥ 1024px.

### Mobile Layout (< 1024px)
```
┌────────────────────────────┐
│         Header             │
├────────────────────────────┤
│      Daily Quote           │
├────────────────────────────┤
│                            │
│       Timer Circle         │
│                            │
├────────────────────────────┤
│    Preset Buttons          │
├────────────────────────────┤
│    Timer Controls          │
├────────────────────────────┤
│    Sound Controls          │
├────────────────────────────┤
│    Intention Input         │
└────────────────────────────┘
```

### Desktop Layout (≥ 1024px)
```
┌──────────────────────────────────────────────────────────────┐
│                         Header (Full Width)                   │
│               Logo | Focus | History | Settings              │
├───────────────────────────┬──────────────────────────────────┤
│                           │                                   │
│   LEFT SIDEBAR (400px)    │    CENTER/RIGHT (Flexible)       │
│   ─────────────────────   │    ───────────────────────       │
│                           │                                   │
│   ┌───────────────────┐   │         ┌─────────────┐         │
│   │   Daily Quote     │   │         │             │         │
│   │   "..."           │   │         │             │         │
│   └───────────────────┘   │         │   Timer     │         │
│                           │         │   Circle    │         │
│   ┌───────────────────┐   │         │   400px     │         │
│   │ [5] [10] [15]    │   │         │             │         │
│   │ [20] [30] [Custom]│   │         │             │         │
│   └───────────────────┘   │         └─────────────┘         │
│                           │                                   │
│   ┌───────────────────┐   │     ┌───────┐ ┌───────┐ ┌──────┐│
│   │ ▼ Breathing Guide│   │     │ Reset │ │ Play  │ │Breath││
│   ├───────────────────┤   │     └───────┘ └───────┘ └──────┘│
│   │  [Breath Circle] │   │                                   │
│   │  Pattern: 4-4    │   │                                   │
│   │  [Start]         │   │                                   │
│   └───────────────────┘   │                                   │
│                           │                                   │
│   ┌───────────────────┐   │                                   │
│   │ Bell: 🔔         │   │                                   │
│   │ Ambient: 🌊      │   │                                   │
│   │ Volume: ━━━━○━   │   │                                   │
│   └───────────────────┘   │                                   │
│                           │                                   │
│   ┌───────────────────┐   │                                   │
│   │ Intention:       │   │                                   │
│   │ [____________]   │   │                                   │
│   └───────────────────┘   │                                   │
│                           │                                   │
└───────────────────────────┴──────────────────────────────────┘
```

## Key Desktop Enhancements

### 1. Two-Column Grid Layout
- **Grid Template**: `400px` (sidebar) | `1fr` (timer area)
- **Gap**: Spacious 48px between columns
- **Max Width**: 1400px container (centered)

### 2. Left Sidebar Features
- **Sticky Positioning**: Stays visible while scrolling
- **Smooth Scrollbar**: Custom-styled, minimal width (6px)
- **Card-Based Sections**: Each section has elevated background
- **2-Column Preset Grid**: Better space utilization

### 3. Integrated Breathing Guide
- **Collapsible Section**: Click to expand/collapse
- **Animated Circle**: 120px breathing visualization
- **Pattern Selector**: Choose breathing technique
- **In-Place Exercise**: No need for modal

### 4. Enhanced Timer Display
- **Larger Circle**: 400px (vs 280px mobile)
- **Bigger Font**: 6rem timer digits (vs 3.5rem)
- **Centered Layout**: Vertically and horizontally
- **Enhanced Controls**: Larger buttons with more spacing

### 5. Visual Enhancements

#### Hover Effects
```css
/* Preset Buttons */
- Scale up (1.02x)
- Lift 2px
- Enhanced shadow

/* Timer Controls */
- Lift 3px
- Glowing shadow on primary button

/* Icon Buttons */
- Scale 1.1x

/* Sound Selects */
- Border color change
- Background lighten
```

#### Animations
- Water ripples more visible
- Lotus pulse animation
- Smooth transitions (300ms ease)
- Breathing circle smooth scaling

### 6. Responsive Breakpoints

| Breakpoint | Layout | Timer Size | Sidebar Width |
|------------|--------|------------|---------------|
| < 768px | Mobile | 280px | N/A |
| 768-1023px | Tablet | 320px | N/A |
| 1024-1599px | Desktop | 400px | 400px |
| ≥ 1600px | Ultra-Wide | 450px | 450px |

## Focus Mode Behavior

### Desktop Focus Mode
When activated (press `F` or click icon):
- Sidebar completely hidden
- Timer area uses full width
- Controls centered
- Maximum distraction-free environment

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│                                                       │
│                   ┌─────────────┐                    │
│                   │             │                    │
│                   │   Timer     │                    │
│                   │   Circle    │                    │
│                   │   400px     │                    │
│                   │             │                    │
│                   └─────────────┘                    │
│                                                       │
│               ┌───────┐ ┌───────┐ ┌──────┐         │
│               │ Reset │ │ Play  │ │Breath│         │
│               └───────┘ └───────┘ └──────┘         │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Device Detection

### CSS Media Queries Only
No JavaScript detection required:

```css
/* Desktop Layout */
@media (min-width: 1024px) {
  .content-wrapper {
    display: grid;
    grid-template-columns: 400px 1fr;
  }
}

/* Ultra-Wide Enhancements */
@media (min-width: 1600px) {
  .content-wrapper {
    grid-template-columns: 450px 1fr;
  }
}

/* Enhanced Hover (Desktop with Mouse) */
@media (min-width: 1024px) and (hover: hover) {
  .preset-btn:hover {
    transform: translateY(-2px) scale(1.02);
  }
}
```

### Benefits
- ✅ Automatically responsive to window resize
- ✅ Works with tablets in landscape mode
- ✅ No JavaScript overhead
- ✅ Progressive enhancement
- ✅ SSR/Static site friendly

## Hidden Elements on Desktop

### Mobile-Only Features
- **Breathing Button** in timer controls (hidden on desktop)
  - Replaced by sidebar breathing guide
- **Mobile breathing modal** (still accessible via keyboard if needed)

### Desktop-Only Features
- **Sidebar Breathing Guide**
  - Hidden on mobile (display: none)
  - Visible at ≥1024px
- **Enhanced hover effects**
  - Only active with `(hover: hover)` media query

## Performance Considerations

### Desktop Optimizations
- Sticky sidebar uses `position: sticky` (no JS scroll listeners)
- CSS transforms for hover effects (GPU accelerated)
- Smooth scrolling with minimal repaints
- Custom scrollbar styling (webkit only, graceful degradation)

### Accessibility
- All keyboard shortcuts work identically
- Focus indicators maintained
- Screen reader compatible
- Reduced motion support

## Testing Viewports

### Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these widths:
   - 375px (Mobile)
   - 768px (Tablet)
   - 1024px (Desktop - breakpoint)
   - 1440px (Desktop)
   - 1920px (Large Desktop)

### Responsive Design Mode (Firefox)
1. Ctrl+Shift+M
2. Preset devices or custom dimensions

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Grid | ✅ 57+ | ✅ 52+ | ✅ 10.1+ | ✅ 16+ |
| Sticky Position | ✅ 56+ | ✅ 59+ | ✅ 13+ | ✅ 16+ |
| CSS Variables | ✅ 49+ | ✅ 31+ | ✅ 9.1+ | ✅ 15+ |
| Hover Media Query | ✅ 38+ | ✅ 64+ | ✅ 9+ | ✅ 12+ |

All modern browsers fully supported!

## Future Enhancements

Potential desktop-specific features:
- [ ] Three-panel layout for ultra-wide (≥1920px)
- [ ] Persistent stats panel on right
- [ ] Keyboard shortcut hints overlay
- [ ] Multi-window support (timer in separate window)
- [ ] Desktop notifications with more detail
- [ ] Export session data as CSV

---

**Desktop mode provides a productivity-focused, spacious meditation environment!** 🖥️✨
