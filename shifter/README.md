# Shifter - Language Switcher Chrome Extension

Shifter is a Chrome extension that helps you manage language settings on websites. It detects language settings stored in both localStorage and sessionStorage and allows you to quickly switch between languages via the right-click context menu.

## Features

- Automatically detects language settings in both localStorage and sessionStorage
- Maintains a history of previously used languages
- Provides a right-click context menu to switch between languages
- Easy toggle to enable/disable the extension
- Updates all language-related keys in both localStorage and sessionStorage at once
- Reloads the page after language change

## Installation for Development

Follow these steps to install the extension in development mode:

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/shifter.git
   cd shifter
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the extension:
   ```
   npm run build
   ```

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked"
4. Select the `dist` folder from the project directory

The extension should now be installed in your browser.

## Development

### Running in Development Mode

For development with automatic rebuilding:

```
npm run dev
```

This will start webpack in watch mode, automatically rebuilding when you make changes.

### Running Tests

To run the unit tests:

```
npm test
```

## Usage

1. Visit any website that stores language settings in localStorage or sessionStorage
2. The extension will automatically detect the language and add it to the history
3. Right-click anywhere on the page to open the context menu
4. Select "Shifter Language" to see available options:
   - Enable/Disable the extension
   - Select a previously used language to switch to

## Configuration

The extension looks for the following storage keys (configurable in `src/languageKeys.json`):

- `language`
- `lang`
- `locale`
- `userLanguage`
- `i18n.locale`
- `currentLanguage`

You can modify this list to match the keys used by the websites you frequently visit.

## Storage Behavior

The extension handles both types of web storage:

- **localStorage**: Persists across browser sessions
- **sessionStorage**: Only available for the duration of the page session

When detecting languages, the extension checks localStorage first. If no language keys are found there, it then checks sessionStorage.

When updating languages, the extension updates both localStorage and sessionStorage if they contain any of the configured language keys.

## Building for Production

To build the extension for production:

```
npm run build
```

This will:
1. Compile TypeScript files
2. Copy the manifest file
3. Generate placeholder icons (in a real extension, you would replace these with proper icons)

The production-ready extension will be in the `dist` folder.

## License

ISC 