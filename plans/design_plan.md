# Image Generation Page Redesign Plan

## Objective
Redesign `src/app/generate/page.tsx` and `src/components/ModernImagen.tsx` to strictly match the "Modern Dark/Glassmorphic" aesthetic of the homepage, while preserving all existing functionality.

## 1. Page Layout (`src/app/generate/page.tsx`)
The generation page needs to integrate into the main site structure.
- **Imports**: Import global `Navbar` and `Footer`.
- **Layout**:
    - Wrapper: `min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white`.
    - Content Padding: Add `pt-24` (or similar) to prevent the fixed Navbar from covering content.
    - Structure:
      ```tsx
      <div className="bg-black min-h-screen ...">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-32">
          <ModernImagen />
        </main>
        <Footer />
      </div>
      ```

## 2. Component Refactoring (`src/components/ModernImagen.tsx`)

### A. Cleanup & Removal
- **Theme Logic**: Remove `useTheme`, `toggleTheme`, `localstorage('theme')`, and all `theme === 'dark' ? ... : ...` conditionals.
    - **Action**: Hardcode all styles to the "Dark Mode" variants, specifically using the new Design System colors.
- **Internal Header**: Remove the top `<header>` section containing the Logo, Title, and Main Navigation links.
    - **Reason**: The global `Navbar` now handles branding and site navigation.
    - **Replacement**: Keep the `activeTab` state but move the controls (Generate vs History vs Presets) into a local "Tab Switcher" component within the main workspace.

### B. Design System Implementation (Glassmorphism)
Replace solid grays with translucent "glass" styles.

| Element | Old Style (Dark) | New Style (Homepage Match) |
| :--- | :--- | :--- |
| **Containers** | `bg-gray-800` | `bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl` |
| **Inputs/Selects** | `bg-gray-900 border-gray-600` | `bg-white/5 border-white/10 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500` |
| **Text** | `text-gray-300` | Headers: `text-white`, Body: `text-gray-400` |
| **Primary Button** | `bg-blue-600` | `bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]` |
| **Secondary Button** | `bg-gray-700` | `bg-white/10 hover:bg-white/20 border border-white/5 text-white` |
| **Icons** | `text-gray-400` | `text-blue-400` or `text-purple-400` for accents |

### C. Structural Changes

#### 1. Internal Tab Switcher (Segmented Control)
Instead of the top navbar, use a styled segmented control at the top of the component:
```tsx
<div className="flex space-x-4 mb-8 bg-white/5 p-1 rounded-xl border border-white/10 w-fit mx-auto">
  <button className="{active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'} ...">Generate</button>
  <button>History</button>
  <button>Presets</button>
</div>
```

#### 2. Generator Layout (Grid)
- **Left Column (Controls)**:
    - Apply `bg-white/5` container style.
    - Ensure input labels are `text-gray-400 font-medium`.
    - Style "Style Presets" buttons to be square glass cards (`bg-white/5 hover:bg-white/10 border-white/10`).
- **Right Column (Preview)**:
    - Apply `bg-black/50` (darker) container style for contrast.
    - Maintain the "Download" and "Expand" overlays but style them as circular glass buttons.

#### 3. History & Presets Grid
- **Cards**: Update `ImageCard` and `PresetCard`.
    - Base: `bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all group`.
    - Image Overlay: Gradient fade `bg-gradient-to-t from-black/80 to-transparent`.

## 3. Functionality Verification
Ensure the following still work:
- Image Generation (API call)
- LocalStorage persistence (History, Presets)
- Tab switching
- Modals (Preview, Compare, Save Preset) -> Update Modal styles to use `bg-black/90 backdrop-blur-xl`.
