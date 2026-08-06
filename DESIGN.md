---
name: Helios Engineering System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed01b'
  on-secondary-container: '#6f5900'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffe083'
  secondary-fixed-dim: '#eec200'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-value:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter-mobile: 16px
  gutter-desktop: 24px
  margin-safe: 20px
  touch-target: 44px
---

## Brand & Style

This design system is built on the principles of **technical precision, field utility, and high-stakes reliability**. It is designed for solar energy field executives who require an "engineered" interface that mirrors the accuracy of the hardware they install. 

The aesthetic is **Corporate Modern with a Technical/Scientific edge**. It prioritizes extreme legibility for outdoor use and a data-driven visual language inspired by architectural sun-path diagrams. The interface should feel like a high-end diagnostic tool—efficient, authoritative, and robust.

**Key visual drivers:**
- **Clarity under sun:** High-contrast elements and generous white space to combat screen glare.
- **Precision:** Use of hair-line borders, monospaced data readouts, and mathematical annotations.
- **Workflow-centric:** A linear, wizard-based logic that guides users through complex site assessments without cognitive overload.

## Colors

The palette is anchored in **Deep Navy (#0f172a)** and **Slate** to establish professional authority. **Solar Yellow (#facc15)** is reserved for primary actions and critical energy data, while **Energy Orange** provides secondary highlights.

**Functional Color Usage:**
- **Backgrounds:** Use `slate-surface` for large screen areas to reduce eye strain in bright light while maintaining a clean, "engineered" look.
- **Primary Actions:** Buttons and progress indicators use the high-contrast Deep Navy with Yellow accents.
- **Semantic Feedback:** Red, Yellow, and Green are strictly reserved for urgency and status (e.g., overdue visits vs. completed uploads).
- **Data Visualization:** Use `data-line` (Slate 400) for grid lines and non-critical diagram paths to ensure the UI doesn't become visually cluttered.

## Typography

The typography system balances modern accessibility with technical specificity. 
- **Hanken Grotesk** is used for headlines to provide a sharp, contemporary engineering feel.
- **Inter** handles all body copy and form inputs for maximum legibility in the field.
- **JetBrains Mono** is utilized for technical data, coordinates, and solar metrics (kWh, azimuth, tilt). This monospaced choice reinforces the "calculated" nature of the application and ensures tabular data remains perfectly aligned.

**Outdoor Legibility:**
- Never use a font weight lighter than 400 for body text.
- Maintain high contrast ratios (minimum 7:1) for all data-carrying labels.

## Layout & Spacing

This system employs a **mobile-first, 8px grid system** (with 4px sub-units) to ensure hit areas are optimized for field executives who may be wearing gloves or operating devices in bright sunlight.

**Layout Model:**
- **Mobile:** Single-column stacked layout for forms. "Wizard" steps appear as a persistent header with a progress bar.
- **Desktop/Tablet:** A 12-column fluid grid. Dashboards use a Kanban-style layout for lead management, where each column is a fixed 320px width.
- **Padding:** Generous internal padding within cards (min 20px) to prevent data density from feeling overwhelming.
- **Touch Targets:** All interactive elements (buttons, checkboxes, navigation) must adhere to a minimum 44px height for accessibility.

## Elevation & Depth

The system uses **Low-contrast outlines** and **Tonal Layers** rather than heavy shadows to maintain an "engineered" and flat aesthetic.

- **Base Layer:** `slate-surface` (#F8FAFC).
- **Component Layer:** White (#FFFFFF) surfaces for cards and inputs, defined by a 1px border in `border-subtle` (#E2E8F0).
- **Active State:** A subtle, 4px blur tinted with the primary navy color is used only for active modals or focused input cards to provide "soft depth."
- **Visual Hierarchy:** Established primarily through thickness of borders and color-blocking (e.g., a Navy header on a White card) rather than elevation shadows.

## Shapes

The shape language is **Rounded (0.5rem)**. This increased rounding provides a more modern, approachable feel while maintaining the structural integrity of the technical layout.

- **Buttons & Inputs:** 8px (0.5rem) radius.
- **Large Cards:** 16px (1rem) radius.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish status indicators from functional buttons.
- **Diagrams:** Use sharp angles or perfect circles (e.g., for sun-path markers) to maintain the "blueprint" aesthetic.

## Components

**Buttons:**
- **Primary:** Deep Navy background, White text. High contrast, solid fill.
- **Secondary:** White background, 1px Navy border.
- **Actionable Icons:** Solar Yellow fill for high-priority field actions (e.g., "Capture Photo").

**Input Fields:**
- Clear labels using `data-label` style.
- Active states indicated by a 2px Solar Yellow left-border "accent" to show focus without changing the field's footprint.

**Cards:**
- Used for Lead entries and Financial Summaries.
- Must include a `status-strip` (a 4px vertical bar on the left edge) color-coded to the lead's urgency level.

**Technical Data Viz:**
- Inspired by the sun-path diagram: use thin (1px) `data-line` strokes.
- Use circle markers with 50% opacity fills for data points.
- Annotations should use `JetBrains Mono` at `body-sm` size for a "CAD" drawing feel.

**Photo Upload Slots:**
- Square containers with dashed borders and a large central icon. 
- Successful uploads switch the border to solid Green with a checkmark overlay.