---
name: Artisanal Hearth
colors:
  surface: '#fefccf'
  surface-dim: '#dedcb1'
  surface-bright: '#fefccf'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f6c9'
  surface-container: '#f2f0c4'
  surface-container-high: '#eceabe'
  surface-container-highest: '#e6e5b9'
  on-surface: '#1d1d03'
  on-surface-variant: '#54433a'
  inverse-surface: '#323214'
  inverse-on-surface: '#f5f3c7'
  outline: '#877369'
  outline-variant: '#dac2b6'
  surface-tint: '#934b19'
  primary: '#6c2f00'
  on-primary: '#ffffff'
  primary-container: '#8b4513'
  on-primary-container: '#ffc29f'
  inverse-primary: '#ffb68c'
  secondary: '#5e604d'
  on-secondary: '#ffffff'
  secondary-container: '#e1e1c9'
  on-secondary-container: '#636451'
  tertiary: '#523e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6f5400'
  on-tertiary-container: '#fec72c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68c'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#753401'
  secondary-fixed: '#e4e4cc'
  secondary-fixed-dim: '#c8c8b0'
  on-secondary-fixed: '#1b1d0e'
  on-secondary-fixed-variant: '#474836'
  tertiary-fixed: '#ffdf98'
  tertiary-fixed-dim: '#f5bf22'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4300'
  background: '#fefccf'
  on-background: '#1d1d03'
  surface-variant: '#e6e5b9'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-margin-desktop: 80px
  container-margin-mobile: 20px
  gutter: 24px
  section-gap: 64px
---

## Brand & Style

This design system captures the tactile, sensory experience of an artisanal bakery. The brand personality is grounded, nourishing, and premium, targeting urban professionals who value craftsmanship and slow-living rituals. 

The visual style is a fusion of **Soft Minimalism** and **Tactile Modernism**. It prioritizes high-quality imagery of crumb textures and flour-dusted crusts against a serene, spacious interface. The emotional goal is to evoke the smell of fresh bread and the comfort of a morning routine through generous whitespace, "squishy" interactive affordances, and a palette that feels baked rather than rendered.

## Colors

The palette is derived from the lifecycle of grain and the chemistry of the oven. 
- **Primary (Toasted Brown):** Used for typography and essential structural elements to provide a sense of "well-baked" sturdiness.
- **Secondary (Wheat Beige):** The dominant surface color for containers and secondary buttons, reducing the starkness of pure white.
- **Tertiary (Mustard):** A warm, sun-drenched highlight for secondary actions or decorative accents.
- **Neutral (Cream):** The primary background color, providing a soft, milky canvas that feels warmer than standard digital neutrals.
- **Accent (Burnt Orange):** Reserved strictly for primary Call-to-Actions (CTAs) and critical notifications, mimicking the "ear" of a perfectly baked sourdough.

## Typography

The typographic hierarchy relies on the contrast between the literary elegance of **EB Garamond** and the friendly, contemporary clarity of **Be Vietnam Pro**.

- **Serif Headlines:** Use for all editorial content, product names, and section titles. Ensure large displays have slight negative letter-spacing to feel more "custom-set."
- **Sans-Serif Body:** Optimized for readability in subscription management and ingredient lists. Use a slightly heavier weight (500) for UI labels to maintain visibility against warm backgrounds.
- **Scale:** On mobile, headlines should aggressively downscale to ensure elegant word-wrapping without breaking the delicate serif flourishes.

## Layout & Spacing

The layout follows a **Fluid Grid** model with an emphasis on "breathing room."
- **Desktop:** 12-column grid with wide 80px margins to center the content and evoke a premium boutique feel.
- **Mobile:** 4-column grid with 20px margins. 
- **Rhythm:** Use an 8px base unit. Section spacing should be generous (64px+) to prevent the interface from feeling "crowded," mirroring the intentionality of a slow-ferment bakery.
- **Alignment:** Center-aligned layouts are preferred for landing pages to emphasize the "hero" photography of the bread. Functional dashboard views should revert to left-alignment for efficiency.

## Elevation & Depth

Depth is achieved through **Tonal Layers** and **Ambient Shadows** rather than sharp borders.
- **Surface Strategy:** Use slightly darker beige (#F5F5DC) for "sunken" elements like input fields and lighter cream (#FFFDD0) for "raised" elements like cards.
- **Shadows:** Shadows should be extremely soft, using a brown-tinted umbra (e.g., `rgba(139, 69, 19, 0.08)`) instead of grey. This maintains the warmth of the palette and avoids a "dirty" look on cream backgrounds.
- **Transitions:** Use subtle scale-up effects on hover (1.02x) for cards to provide a physical, tactile response.

## Shapes

The shape language is organic and "dough-like." 
- **Corner Radii:** Use a minimum of 16px for cards and containers to reflect the soft, rounded forms of boules and loaves. 
- **Buttons:** Fully pill-shaped (rounded-full) to encourage interaction and feel approachable.
- **Media:** Product photography should always feature rounded corners or organic, blob-like masking to avoid harsh geometric interruptions in the visual flow.

## Components

- **Buttons:** Primary buttons are Burnt Orange with white text. Secondary buttons use a thick Toasted Brown border with transparent backgrounds. Ensure high padding (16px vertical / 32px horizontal).
- **Cards:** Subscription cards should use the "Neutral" cream background with a subtle brown-tinted shadow. Use "Body-LG" for pricing and "Headline-SM" for bread variety names.
- **Selection Controls:** Checkboxes and radio buttons should be oversized and use the Mustard accent for the active state to feel "sunny" and clear.
- **Input Fields:** Use a subtle inset shadow to make the field feel "pressed" into the dough-like surface.
- **Imagery:** Implement "Texture Peeks" — small, circular thumbnails showing the internal crumb structure of the bread next to the main product title.
- **Chips:** Used for dietary tags (e.g., "Gluten-Free," "Vegan"). These should be low-contrast, using the Wheat Beige background with Brown text.