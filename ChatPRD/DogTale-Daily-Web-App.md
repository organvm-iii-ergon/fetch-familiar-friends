---
title: "DogTale Daily Web App"
date: "2025-10-23T08:26:50 (UTC -04:00)"
source: chatgpt.com
---

<!-- AI Handoff Header -->
**AI Handoff Overview:** This document is structured for seamless agent transitions. Coordinate updates with the orchestration plan in `AGENT_ORCHESTRATION.md`.
<!-- /AI Handoff Header -->

## Q: 
Create an interactive React web app called DogTale Daily with these key features and style requirements. Do not include any real AI or backend logic—everything should be a polished, animated shell with placeholder content. • Platform & Tech • Framework: React (Create React App or Next.js) • Styling: Tailwind CSS (custom gradients + utilities) • Animations: Framer Motion (variants for fade, slide, breath, float) • Assets: use `https://via.placeholder.com/400x300` for images; Lottie JSON stubs for icon loops • Global UI & Theming • Four gradient themes:1. Park: `from-lime-400 → emerald-600` 2. Beach: `from-sky-400 → blue-600` 3. Forest: `from-green-500 → green-800` 4. Tundra: `from-cyan-400 → sky-700` • Inter font: 400 (body), 600 (buttons), 700 (headers) • Design tokens for radii (12 px/16 px), shadows (low/med/high) • Theme toggle UI in header switches whole-app background gradient • Page Structure & Components1. Home – Calendar View• Header: theme dropdown, title “DogTale Daily”, Freaky Friday toggle (bone icon wag on click) • Main card: glassmorphic panel (80% width × 50% height) with placeholder image, date/title overlay, nav arrows (slide on click) • Footer nav: four neumorphic icon buttons (Game 🧩, Generate ✏️, Community 🌐, Save 💾) with breath-loop hover 2. Photo Upload Modal• Trigger: click “Upload” nav button → modal slides up • Grid: 3×2 dog-photo slots + 1×2 human-photo slot, each slot fades in staggered • Save button: neumorphic, pulses on hover, triggers confetti Lottie on click 3. Story & Image Generator• Tabs: “Image” / “Story” (neumorphic pill toggles) with slide-in underline • Content: large placeholder image OR 5–7 line text box • Inline Freaky Friday toggle: flips labels “Dog→Human” / “Human→Dog” • Actions: “Generate New” (loader spin + fade) and “Save/Share” (breath loop) 4. Game Hub• Modal with header tabs (Jigsaw / Memory / Fetch) • Jigsaw: 4×4 grid of square placeholders, cells flip on tap • Memory: 3×4 card grid with flip animation • Fetch: full-width canvas placeholder with drifting treat emoji loop • Footer: Back & Share buttons (slide-up entry) 5. Community & Gifting• Segmented control: Feed / Gift • Feed: masonry grid of square placeholders with caption lines, fade-up on scroll • Gift: form placeholders (Email, Message, Calendar Type dropdown), Send Gift button wiggles on hover 6. Save & Export• Tabs: Saved / Export • Saved: 2×3 grid of saved-item placeholders (image + title) • Export: three stacked neumorphic buttons (Digital iCal, Printable PDF, Merch Preview), each slide in sequence • Animations & Interactions • Entry animations: all pages wrap in `<motion.div>` with `fadeIn` + `slideUp` variants • Hover/press: `breathLoop` variant on buttons, icons • Decorative float: random emoji `<motion.span>` with `floatLoop` behind key elements • Modal transitions: slide-up for open/close, backdrop fade (200 ms ease-in-out) • Responsive Breakpoints • Desktop ≥1024px: 12-column centered layout, full header/nav • Tablet 768–1023px: 8-column, hamburger menu triggers slide-out drawer • Mobile <768px: single-column, bottom nav bar, accordions in Gift & Features Deliverable: A single Markdown prompt that, when submitted to Claude, returns: • A complete React project scaffold (file/folder tree) • `package.json`, `tailwind.config.js`, global CSS imports • Full `.jsx`/`.tsx` content for each page and component, using Tailwind classes and Framer Motion variants • Placeholder assets and Lottie JSON references • No backend code or AI API calls—just the animated, dynamic shell of DogTale Daily.

## A: 
Here is your **Claude-ready Markdown prompt** that will return a full, polished **React web app scaffold** for **DogTale Daily** — animated shell only, with placeholder assets, Framer Motion effects, Tailwind gradients/themes, and full component structure.

* * *

```markdown
You are a full-stack React/Tailwind/Framer Motion engineer. I need you to return a **complete frontend scaffold** for an interactive React web app called **DogTale Daily**. There is **no real backend logic or AI integration**—just a fully animated, stylized shell with placeholder content.

### 🐾 Project Overview
**DogTale Daily** is a whimsical, animated pet-centered app. Each page and component uses placeholder images, Lottie references, and Framer Motion transitions.

---

### ✅ Requirements

#### 📦 Framework & Tech Stack
- **Framework**: Next.js (with App Router or Pages OK)
- **Styling**: Tailwind CSS (with `tailwind.config.js`)
- **Animations**: Framer Motion (`fadeIn`, `slideUp`, `breathLoop`, `floatLoop`)
- **Assets**: `https://via.placeholder.com/400x300` for images; fake Lottie references (e.g. `/lotties/confetti.json`)
- **Font**: Inter (400 body, 600 buttons, 700 headers)

---

### 🎨 Global UI & Theme System

- 4 gradient themes (class-based system or tailwind `bg-gradient-to-br`):
  1. **Park**: `from-lime-400 to-emerald-600`
  2. **Beach**: `from-sky-400 to-blue-600`
  3. **Forest**: `from-green-500 to-green-800`
  4. **Tundra**: `from-cyan-400 to-sky-700`

- Theming controlled via a **Theme Toggle** in header

- Design tokens:
  - Radius: `rounded-[12px]` and `rounded-[16px]`
  - Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`

- Responsive breakpoints:
  - Desktop ≥ 1024px: 12-col grid
  - Tablet 768–1023px: 8-col grid
  - Mobile <768px: single column, bottom navbar

---

### 📁 Folder Structure

```

/dogtale-daily  
/public  
/lotties  
confetti.json  
boneWag.json  
/components  
Header.jsx  
FooterNav.jsx  
ThemeToggle.jsx  
ModalWrapper.jsx  
UploadModal.jsx  
GeneratorTabs.jsx  
GameHubModal.jsx  
SaveExportTabs.jsx  
/pages  
index.jsx  
game.jsx  
generate.jsx  
community.jsx  
save.jsx  
/styles  
globals.css  
tailwind.config.js  
package.json  
README.md

```yaml

---

### 📄 Pages & Key Components

#### `index.jsx` – **Home / Calendar View**
- Header w/ title `"DogTale Daily"`, theme toggle, Freaky Friday toggle (bone icon wags)
- Main content card: glassmorphic panel w/ image, title/date, nav arrows (slide left/right)
- `<FooterNav />`: 4 neumorphic buttons (Game 🧩, Generate ✏️, Community 🌐, Save 💾)

#### `UploadModal.jsx`
- Triggered by clicking “Upload” in nav
- Modal slides up
- 3×2 grid dog photos + 1×2 grid human photos (fade-in staggered)
- Save button pulses on hover, triggers confetti Lottie on click

#### `generate.jsx` – **Story & Image Generator**
- Tabs: "Image" / "Story" (neumorphic toggles, sliding underline)
- Placeholder image OR text box
- Freaky Friday toggle: “Dog→Human” ↔ “Human→Dog”
- Buttons: “Generate New” (loader spin) + “Save/Share” (breath loop)

#### `game.jsx` – **Game Hub Modal**
- Modal w/ header tabs: Jigsaw, Memory, Fetch
- Jigsaw: 4×4 flip grid placeholders
- Memory: 3×4 flip card grid
- Fetch: full-width canvas placeholder w/ treat emoji float loop
- Back & Share buttons

#### `community.jsx` – **Community & Gifting**
- Segmented control: Feed / Gift
- Feed: masonry grid, caption placeholders, fade-up on scroll
- Gift: form inputs (email, msg, dropdown), Send Gift button wiggles

#### `save.jsx` – **Save & Export**
- Tabs: Saved / Export
- Saved: 2×3 saved-item placeholder grid
- Export: 3 neumorphic buttons (iCal, PDF, Merch), slide in sequence

---

### 🌀 Animations (Framer Motion Variants)

```js
// variants.js
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
};

export const slideUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
};

export const breathLoop = {
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  }
};

export const floatLoop = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
  }
};
```

* * *

### 📦 `package.json` – Include:

```json
{
  "dependencies": {
    "next": "^13.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "tailwindcss": "^3.x",
    "framer-motion": "^10.x",
    "lottie-react": "^2.x"
  }
}
```

* * *

### ⚙️ `tailwind.config.js`

```js
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { inter: ['Inter', 'sans-serif'] },
      colors: {
        park: { from: '#A3E635', to: '#059669' },
        beach: { from: '#38BDF8', to: '#2563EB' },
        forest: { from: '#22C55E', to: '#065F46' },
        tundra: { from: '#22D3EE', to: '#0EA5E9' }
      },
      borderRadius: {
        md: '12px',
        lg: '16px'
      },
      boxShadow: {
        low: '0 1px 3px rgba(0,0,0,0.1)',
        med: '0 4px 6px rgba(0,0,0,0.1)',
        high: '0 10px 15px rgba(0,0,0,0.2)'
      }
    }
  },
  plugins: []
};
```

* * *

### 🧼 `globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply font-inter bg-gradient-to-br from-lime-400 to-emerald-600 min-h-screen;
}
```

* * *

### 📝 Notes

*   Every page and modal is wrapped in `<motion.div>` with `initial="hidden"` and `animate="show"`
    
*   All icons use emoji for now (`🧩 ✏️ 🌐 💾`)
    
*   Use `<motion.span>` behind main elements with `floatLoop` and a random dog emoji 🐶🐾🦴
    
*   All UI logic is faked—only animation, layout, and placeholder visual shell
    

* * *

Return:

*   All files in correct folder structure
    
*   Each page/component in full with Tailwind + Framer Motion
    
*   A complete animated app shell with no API calls
    

Respond with the full codebase.

```yaml

--- 

Let me know if you want me to **render this project for local use**, **convert it into a downloadable `.zip`**, or prepare a **GitHub-ready repository scaffold**.
```


<!-- AI Handoff Footer -->
**Document Status:** Complete - Technical scaffold specification ready for implementation

**Closing Notes:**
- ✅ React/Next.js application architecture fully specified with Tailwind CSS and Framer Motion
- ✅ Component structure defined (Home, Upload Modal, Generator, Game Hub, Community, Save/Export)
- ✅ Theme system designed (Park, Beach, Forest, Tundra gradients) with responsive breakpoints
- ✅ Animation variants documented (fadeIn, slideUp, breathLoop, floatLoop) for polished UX
- ✅ Alignment with ROADMAP.md Phase 1 (Technical Spike - React Native/Next.js prototype)
- ⏭️ Next Action: @Copilot to implement scaffold using provided Claude prompt and coordinate with @Gemini for UX validation
- 📋 Cross-references: See `DogTale Daily Personalized Dog Calendar App.md` for product vision, `ROADMAP.md` Phase 1 for timeline
- 🔗 Dependencies: Awaiting stakeholder approval on product concept before full development begins
<!-- /AI Handoff Footer -->
