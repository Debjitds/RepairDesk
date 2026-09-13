---
name: Industrial Editorial
colors:
  surface: '#fef9ef'
  surface-dim: '#dedad0'
  surface-bright: '#fef9ef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3e9'
  surface-container: '#f2ede3'
  surface-container-high: '#ede8de'
  surface-container-highest: '#e7e2d8'
  on-surface: '#1d1c16'
  on-surface-variant: '#444748'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f5f0e6'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#ab3600'
  on-secondary: '#ffffff'
  secondary-container: '#fe5e1e'
  on-secondary-container: '#551600'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191e00'
  on-tertiary-container: '#7a8c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59c'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#832700'
  tertiary-fixed: '#d3f000'
  tertiary-fixed-dim: '#b9d300'
  on-tertiary-fixed: '#191e00'
  on-tertiary-fixed-variant: '#414c00'
  background: '#fef9ef'
  on-background: '#1d1c16'
  surface-variant: '#e7e2d8'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  mono-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system establishes a high-precision, industrial aesthetic for RepairDesk. It merges the raw honesty of Neo-Brutalism with the refined execution of a premium luxury brand. The visual language is authoritative and technical, designed to evoke confidence in mechanical precision and professional service.

The style is characterized by "structural clarity"—using heavy line weights, high-contrast intersections, and hard shadows to define a physical sense of space. It avoids soft gradients and organic blurs in favor of a rigid, editorial layout that feels both timeless and aggressively modern.

## Colors

The palette is rooted in a warm, utilitarian "Gallery" cream (#F5F0E6) which prevents the high-contrast black from feeling overly clinical. 

- **Background (Neutral):** Used for all primary page surfaces to provide a sophisticated, non-white canvas.
- **Primary / Text:** A dense Near-Black (#1A1A1A) used for all structural borders, shadows, and body text.
- **Accent (Signal Orange):** Reserved for primary actions, critical status alerts, and branding highlights. It represents urgency and mechanical precision.
- **Tertiary (Electric Yellow):** Used sparingly for secondary highlights, "New" badges, or tooltips to provide a high-visibility contrast against the black and cream.

## Typography

The typography strategy pairs **Space Grotesk** for headlines and structural labels with **Inter** for long-form data and body text. 

Headlines should be set with tight letter-spacing to emphasize their geometric construction. Use the `label-caps` style for section headers and navigation to maintain an "official" or "technical manual" feel. Large display sizes should prioritize a bold weight to stand up against the heavy 3px border weights used throughout the UI.

## Layout & Spacing

This design system utilizes a **Rigid Column Grid**. The layout is strictly structured, mirroring a technical blueprint. 

- **Desktop:** 12-column grid with 24px gutters. Content is housed in "Cells" defined by 2px black borders.
- **Mobile:** 4-column grid with 16px margins. 
- **Rhythm:** All spacing must be a multiple of 8px. Use 32px or 48px padding for large containers to ensure the UI feels spacious and "premium" despite the heavy visual elements. 

Components should frequently "touch" the grid lines, creating a seamless tiled effect rather than floating in space.

## Elevation & Depth

Depth is conveyed through **Hard-Offset Shadows** rather than z-index blurring. This "Pop-out" effect creates a tactile, physical quality.

- **Primary Elevation:** All interactive cards and buttons utilize a `4px 4px 0px #1A1A1A` box shadow.
- **Active State:** On click/press, the shadow reduces to `0px 0px 0px #1A1A1A`, and the element translates +4px on both X and Y axes to simulate a physical button being depressed.
- **Layering:** Use 2px or 3px solid black borders to separate content tiers. No soft shadows or blurs are permitted. Background overlays for modals should be a solid color at 40% opacity or a dense noise texture.

## Shapes

The shape language is predominantly sharp. While the base `roundedness` is set to 1 (4px), it is used only to take the "sting" off the corners. 

- **Primary containers:** Use 0px (sharp) corners for a more architectural look.
- **Interactive elements (Buttons/Inputs):** Use 4px roundedness to provide a subtle hint of modern UI affordance.
- **Icons:** Must be stroke-based, using a 2px minimum line weight to match the UI borders.

## Components

### Buttons
- **Primary:** Solid Signal Orange background, 2px black border, 4px black hard shadow. Text is bold and uppercase.
- **Secondary:** Warm Cream background, 2px black border, 4px black hard shadow.
- **Tertiary:** No background, 2px black border, no shadow until hover.

### Input Fields
- **Default:** 2px black border, Warm Cream background. On focus, the border thickens to 3px or changes to Signal Orange.
- **Labels:** Always use `label-caps` positioned strictly above the input.

### Cards
- Always bordered with 2px solid black.
- Use a "Header" section within the card separated by a horizontal 2px line.
- Background remains Warm Cream unless the card is a "Highlighted State" (Signal Orange).

### Lists & Tables
- Table headers use the Electric Yellow background with a 2px bottom border.
- Row separators are 1px solid black. 
- High-contrast hover states (Near-Black background with Cream text) are encouraged for list items.

### Chips/Badges
- Small, rectangular with 0px roundedness.
- Use the Tertiary Electric Yellow for "Active" or "Success" states to ensure they pierce through the industrial aesthetic.