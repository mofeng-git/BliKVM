# Persistence Strategy Rationale

## Current localStorage Usage Review (2024)

### ✅ Approved localStorage Items (User Preferences & Auth):

1. **locale** - Language preference
2. **cursorStatus** - Whether custom cursor is enabled
3. **cursorValue** - Which cursor style
4. **alertLocation** - Where notifications appear
5. **mouseSensitivity** - Mouse speed preference
6. **wheelDeriction** - Scroll direction (typo: should be wheelDirection)
7. **videoMode** - Preferred video quality
8. **token** - Authentication JWT
9. **sessionExpiration** - Auth session timeout
10. **app** (settings.isVisible) - Nav drawer preference

### ❌ Never Store in localStorage:

- Real-time data (device status, temperatures, health metrics)
- Temporary UI states (modals, dialogs, expanded panels)
- Form data (unless explicitly saved)
- Search/filter states
- Connection states
- Session-specific data

### 📝 Technical Debt to Address:

1. **Fix typo**: `wheelDeriction` → `wheelDirection` throughout codebase
2. **Centralize token access**: Multiple files directly access localStorage.getItem("token") - should go through store
3. **Consider migration**: Move user preferences to Pinia persist for consistency

### Persistence Strategy

## Overview

This change implements persistence for the navigation drawer state using Pinia's persistence plugin with localStorage.

## Design Decision

### Default Behavior: Pinia Store (Session Memory)

Most application state lives in Pinia store and persists only during the session:

- Device status and real-time data
- Modal/dialog visibility states
- Form data and temporary UI states
- Connection states and health metrics

**Rationale**: These are temporary working states that should reset when starting a new session.

### Exception: Nav Drawer State → localStorage

The navigation drawer visibility (`settings.isVisible`) is persisted to localStorage.

**Rationale**:

- The nav drawer is a workspace preference, not temporary UI state
- Users who prefer it closed (for more screen space) want it to stay closed
- Users who prefer it open (for quick access) want it to stay open
- This is similar to other persisted preferences like theme, language, or layout
- Reduces friction - users don't need to close/open it every session

## Implementation

- Installed `pinia-plugin-persistedstate` for selective persistence
- Configured to persist ONLY `settings.isVisible` to localStorage
- All other Pinia state remains session-only (default behavior)

## Benefits

1. **Minimal localStorage usage**: Only persists what truly needs persistence
2. **User experience**: Remembers workspace layout preference
3. **Clean architecture**: Centralized persistence logic via Pinia plugin
4. **Selective control**: Easy to add/remove persisted properties via configuration

## Future Considerations

If other properties need persistence, they can be added to the `paths` array in the store configuration. Current candidates might include:

- Theme preferences (when implemented)
- Layout preferences
- Workspace configurations

But NOT:

- Real-time data
- Temporary UI states
- Session-specific information
