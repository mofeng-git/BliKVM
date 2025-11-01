# BliKVM Matrix Client

A modern Vue.js web client for BliKVM - an open-source KVM (Keyboard, Video, Mouse) over IP solution.

## Overview

The BliKVM Matrix Client provides a comprehensive web interface for remote server management, featuring real-time video streaming, keyboard/mouse control, virtual media mounting, and system monitoring capabilities.

## Features

### Core KVM Functionality

- **Real-time Video Streaming** - WebRTC-based video capture and streaming
- **Keyboard & Mouse Control** - Full HID emulation with multiple keyboard layouts
- **Virtual Media** - Mount and manage ISO images, USB drives remotely
- **Serial Terminal** - Built-in terminal access via xterm.js

### System Management

- **ATX Power Control** - Remote power management (power on/off, reset)
- **System Monitoring** - Real-time health metrics and diagnostics
- **Network Configuration** - Network settings and connectivity management
- **Security Controls** - Authentication, authorization, and access control

### Advanced Features

- **Multi-language Support** - Internationalization with Vue i18n
- **HDMI Switch Control** - Manage connected HDMI switches
- **Wake-on-LAN** - Remote system wake capabilities
- **VPN Integration** - Built-in VPN management
- **File Upload/Download** - TUS-based resumable file transfers
- **OCR Text Extraction** - Screen text recognition using Tesseract.js
- **Audio Streaming** - Opus-based audio capture and playback
- **Dual Input Sources** - Simultaneous touch and mouse input handling with accurate cursor tracking
- **Code of Conduct** - Configurable Code of Conduct display

## Technology Stack

### Frontend Framework

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vuetify 3** - Material Design component library
- **Pinia** - State management store
- **Vue Router 4** - Client-side routing

### Build Tools & Development

- **Vite** - Fast build tool and development server
- **Sass** - CSS preprocessor with modern API
- **ESLint** - Code linting and formatting
- **Unplugin Auto Import** - Automatic imports for Vue APIs

### Media & Communication

- **WebRTC Adapter** - Cross-browser WebRTC compatibility
- **Janus Gateway** - WebRTC server integration
- **Axios** - HTTP client for API communication
- **WebSocket** - Real-time bidirectional communication

### UI & UX Libraries

- **Chart.js** - Data visualization and metrics charts
- **Simple Keyboard** - Virtual on-screen keyboard
- **Material Design Icons** - Comprehensive icon set
- **Clipboard.js** - Clipboard operations

### Specialized Libraries

- **@xterm/xterm** - Terminal emulator in the browser
- **Tesseract.js** - OCR text recognition
- **@uppy/tus** - Resumable file uploads
- **@casl/ability** - Access control and permissions

## Project Structure

```
src/
├── components/           # Vue components
│   ├── App*.vue         # Main application components
│   ├── Settings*.vue    # Configuration components
│   ├── Speeddial*.vue   # Quick action buttons
│   ├── dialog/          # Modal dialogs
│   ├── shared/          # Reusable UI components
│   └── experimental/    # Beta features
├── composables/         # Vue composition functions
│   ├── useKVM*.js      # KVM-related logic
│   ├── useVideo*.js    # Video streaming logic
│   ├── useAuth*.js     # Authentication logic
│   └── use*.js         # Various utilities
├── pages/              # Route pages
├── layouts/            # Layout templates
├── stores/             # Pinia state stores
├── utils/              # Utility functions
│   ├── http.js         # HTTP client configuration
│   ├── websocket.js    # WebSocket utilities
│   └── locales/        # Internationalization
└── styles/             # Global styles and themes
```

## Development Setup

### Prerequisites

- Node.js 18+
- SSL certificates (cert.pem, key.pem) for HTTPS development

### Recommended VS Code Extensions

- **Prettier**: [esbenp.prettier-vscode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - Code formatting

### Installation

```bash
# Clone the repository
git clone https://github.com/blikvm/dev_blikvm.git
cd dev_blikvm

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Server

- **URL**: https://localhost:10005
- **Network**: https://192.168.1.217:10005
- **HTTPS**: Required for WebRTC and modern browser features

## Build & Deployment

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Code linting
npm run lint
```

## Configuration

### Vite Configuration

- **Port**: 10005 (HTTPS)
- **Proxy**: TUS server proxy for file uploads
- **SSL**: Self-signed certificates for development
- **Sass**: Modern API configuration

### Server Integration

The client connects to the BliKVM server via:

- **REST API**: HTTP endpoints for configuration and control
- **WebSocket**: Real-time communication
- **WebRTC**: Video/audio streaming via Janus Gateway
- **TUS Protocol**: Resumable file uploads

## Key Components

### Core Components

- `AppKVM.vue` - Main KVM interface with video and controls
- `AppToolbar.vue` - Top navigation and quick actions
- `Settings.vue` - Comprehensive settings management
- `SerialTerminal.vue` - Built-in terminal emulator

### Settings Components

- `SettingsKVM.vue` - KVM-specific configuration
- `SettingsVideo.vue` - Video streaming settings
- `SettingsATX.vue` - Power management controls
- `SettingsMouse.vue` - Mouse/HID input configuration
- `SettingsNetwork.vue` - Network configuration
- `SettingsSecurity.vue` - Authentication and access control
- `SettingsText.vue` - Text input and clipboard settings
- `SettingsTextExtract.vue` - OCR text extraction
- `SettingsTextPaste.vue` - Text paste functionality

### Utility Components

- `VirtualMedia.vue` - ISO/USB mounting interface
- `Switch.vue` - HDMI switch management
- `Shortcuts.vue` - Keyboard shortcut configuration
- `HealthCheck.vue` - System health monitoring

## Composables (Business Logic)

### Authentication & Security

- `useAuthentication.js` - Login/logout functionality
- `useSecurity.js` - Security settings and access control
- `useACL.js` - Role-based permissions using CASL

### KVM Operations

- `useAppKVMVideo.js` - Video streaming management
- `useKeyboard-new.js` - Keyboard input handling
- `useMouse.js` - Mouse input processing
- `useClipboard.js` - Clipboard synchronization

### System Management

- `useSystemInfo.js` - Hardware and system information
- `useSystemOperations.js` - System control operations
- `useTemperature.js` - Temperature monitoring
- `usePrometheus.js` - Metrics collection

### Media & Communication

- `useVirtualMedia.js` - Virtual media management
- `useVideo.js` - Video configuration and control
- `useSerialTerminal.js` - Terminal communication

## Internationalization

Supports multiple languages via Vue i18n:

- English (en.json)
- Chinese (zh.json)
- Extensible for additional languages

## Browser Compatibility

- **Chrome 90+** - Full feature support
- **Firefox 88+** - Full feature support
- **Safari 14+** - Limited WebRTC support
- **Edge 90+** - Full feature support

## Performance Notes

- **Startup Time**: Consider migrating to Bun for faster development builds
- **Memory Usage**: Optimized for embedded systems and resource-constrained environments
- **Network**: Designed for LAN deployment with low latency requirements

## Security Considerations

- **HTTPS Required**: All communication encrypted
- **Authentication**: JWT-based with optional 2FA
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Server-side validation for all inputs
- **CORS**: Configured for specific origins only

## License

Copyright (C) 2018-present by blicube info@blicube.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see https://www.gnu.org/licenses/.

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   - Ensure cert.pem and key.pem are present
   - Accept self-signed certificate in browser

2. **WebRTC Connection Failures**
   - Check Janus Gateway server status
   - Verify network connectivity and firewall rules

3. **API Connection Errors**
   - Confirm BliKVM server is running
   - Check server IP address configuration

4. **Performance Issues**
   - Monitor browser developer console for errors
   - Check network latency and bandwidth
   - Verify hardware acceleration is enabled

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature-name`)
5. Create Pull Request

## Commit Guidelines

The recommended format is as follows:

```
<type>: <subject>
```

`type` is the change category, with the following options:

- `feature` or `feat`: new function
- `fix`: fix bug
- `docs`: Documentation changes
- `style`: format (changes that do not affect code operation)
- `refactor`: Refactoring (that is, code changes that are not new features or bug fixes)
- `test`: add test
- `merge`: code merge
- `revert`: roll back to a certain commit
- `build`: used to update build configurations, development tools, etc.
- `chore`: Miscellaneous, other non-functional changes

`subject` is a short description of the commit, which is recommended to be no more than 50 characters.

## Support

- **Documentation**: [BliKVM Official Docs](https://github.com/blikvm)
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join the BliKVM community discussions

---

**Note**: This client requires a compatible BliKVM server for full functionality. Ensure both client and server versions are compatible.
