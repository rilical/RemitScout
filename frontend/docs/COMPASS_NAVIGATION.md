# Compass Navigation System

## Overview
The Compass navigation is a journey-first, tabbed mega menu that replaces the traditional navigation with a rich, personalized experience unique to RemitScout.

## Key Features

### 1. **5 Journey-Based Tabs**
- 💸 **Move Money** - "Get the most pesos for your yuan"
- 🏦 **Bank Smarter** - "Accounts that travel with you"
- 📱 **Stay Connected** - "Signal before suitcase"
- 🛡️ **Get Covered** - "Insurance that actually pays"
- 🏡 **Settle In** - "Real-life checklists for day 1, 30, 90"

### 2. **Three-Rail Layout**
Each tab contains:
- **Left Rail**: Primary action + quick access chips + pinned items
- **Middle Rail**: Guides & resources with pin functionality
- **Right Rail**: Location-aware local links

### 3. **Smart Features**

#### Pinning System
- Hover any guide link → "📌 Pin" button appears
- Pins persist in localStorage
- "Pinned by you" section shows at top of left rail
- No account required

#### Live Rate Glance (Move Money tab only)
- Shows last viewed corridor
- Updates every 30 seconds
- Displays mid-market rate
- Persists in localStorage

#### Scoped Search
- Press `/` to focus search
- Searches only within active tab
- Real-time filtering of guides and chips
- ESC to clear and close

#### Location Detection
- Auto-detects user's country
- Dynamically replaces `{{country}}` in local links
- Shows "Location detected" badge

### 4. **Accessibility**
- Full ARIA compliance
- Keyboard navigation (Arrow keys, Home, End, ESC)
- Focus trapping within panel
- Screen reader friendly

### 5. **Mobile Experience**
- Full-screen accordion menu
- Tap to expand each section
- Search at top
- Body scroll lock when open

## File Structure

```
config/
  └── compassNav.ts          # Navigation data & configuration

components/nav/
  ├── MegaMenu.vue           # Main container with tab switching
  ├── MegaMenuTab.vue        # 3-rail layout for each tab
  ├── PinButton.vue          # Pin/unpin functionality
  └── RateGlance.vue         # Live rate display

components/nav/
  └── SiteHeader.vue         # Integrated mega menu
```

## LocalStorage Keys

- `remitscout_last_corridor` - Last viewed money transfer corridor
- `remitscout_pinned_items` - Set of pinned item IDs
- `remitscout_pinned_data` - Full pinned item data per tab

## Customization

### Adding New Tabs
Edit `config/compassNav.ts`:

```typescript
{
  id: 'new-tab',
  label: 'New Tab',
  tagline: 'Your catchy tagline',
  icon: '🎯',
  primary: { label: 'Main Action', href: '/path' },
  chips: [...],
  guides: [...],
  local: [...]
}
```

### Dynamic Links
Use `{{country}}` and `{{countrySlug}}` placeholders:

```typescript
{
  label: 'Best eSIMs for {{country}}',
  href: '/connect/esim/{{countrySlug}}',
  dynamic: true
}
```

### Quick Tools (Footer)
Edit `quickTools` array in `config/compassNav.ts`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `←` `→` | Navigate tabs |
| `Home` | First tab |
| `End` | Last tab |
| `ESC` | Close menu |

## Design Philosophy

### Why This is Different from Monito
1. **Journey-first** vs product-first categorization
2. **Personalization without login** via pins and memory
3. **Live data integration** (rate glance)
4. **Scoped search** per tab, not global
5. **Location-aware** dynamic content
6. **Playful, helpful copy** vs corporate speak

### Copy Principles
- Short, punchy headlines
- Active verbs in guide titles
- Friendly tone (e.g., "Beat the FX spread" not "Understanding Exchange Rates")
- Taglines that sell benefits, not features

## Performance Notes
- Lazy-loads tab content
- Debounced search
- Efficient localStorage reads/writes
- Rate updates only when visible
- No unnecessary re-renders

## Future Enhancements
- [ ] Analytics tracking for pinned items
- [ ] A/B test different tab orders
- [ ] Smart suggestions based on behavior
- [ ] Deep linking to specific tabs
- [ ] Share pinned collections
- [ ] Export/import pinboards

## Testing Checklist
- [ ] All tabs load correctly
- [ ] Search works in each tab
- [ ] Pinning persists across sessions
- [ ] Rate glance updates
- [ ] Location detection works
- [ ] Mobile accordion functions
- [ ] Keyboard navigation smooth
- [ ] Click outside closes menu
- [ ] ESC closes menu
- [ ] / focuses search

## Support
For questions or issues, refer to the component source code or contact the dev team.



