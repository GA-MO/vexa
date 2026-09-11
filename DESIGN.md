<design-system>
  # Design Style: Corporate Trust

  ## 1. Design Philosophy
  This style embodies the **modern enterprise SaaS aesthetic** — professional yet approachable, sophisticated yet friendly. It draws inspiration from tech unicorns and high-growth startups that have successfully humanized the corporate experience. The design rejects the cold, sterile formality of traditional corporate websites in favor of a warm, confident, and inviting presence.

  **Core Principles:**
  - **Trustworthy Yet Vibrant**: Establishes credibility through clean structure and professional typography while maintaining visual energy through vibrant gradients and colorful accents
  - **Dimensional Depth**: Uses isometric perspectives, soft colored shadows, and subtle 3D transforms to create visual interest and break free from flat design
  - **Refined Elegance**: Every element is polished with attention to micro-interactions, smooth transitions, and sophisticated hover states
  - **Purposeful Gradients**: Indigo-to-violet gradients serve as the visual signature, used strategically in headlines, buttons, and decorative elements
  - **Professional Polish**: Generous white space, consistent spacing rhythms, and crisp typography create a premium, enterprise-ready feel

  **Keywords**: Trustworthy, Vibrant, Polished, Dimensional, Modern, Approachable, Enterprise-Ready, Elegant

  **Visual DNA**: The unmistakable signature of this style comes from:
  1. **Colored Shadows**: Soft shadows with blue/purple tints instead of neutral grays
  2. **Isometric Elements**: Subtle 3D transforms (rotate-x, rotate-y) on decorative cards and visualizations
  3. **Gradient Text**: Strategic use of gradient text for emphasis in headlines
  4. **Soft Blobs**: Large, blurred gradient orbs in the background for atmospheric depth
  5. **Elevated Cards**: White cards that lift on hover with enhanced shadows
  6. **Dual-Tone Palette**: Indigo (primary) + Violet (secondary) creating a cohesive gradient spectrum

  ## 2. Design Token System

  ### Colors (Light Mode)
  *   **Background**: `#F8FAFC` (Slate 50) - A very subtle cool grey/white base.
  *   **Foreground (Surface)**: `#FFFFFF` (White) - For cards and raised elements.
  *   **Primary**: `#4F46E5` (Indigo 600) - The core brand color. Vibrant blue-purple.alternatives or hidden from screen readers when paired with text

  ## 8. Responsive Strategy
  *   **Mobile-First Philosophy**: Design begins at 375px width, progressively enhances
  *   **Touch Targets**: Minimum 44x44px for all interactive elements (buttons, links)
  *   **Typography Scaling**:
      *   Headlines reduce from `text-6xl` (desktop) to `text-4xl` (mobile)
      *   Body text maintains readability at `text-base` with responsive line heights
  *   **Layout Adaptations**:
      *   Two-column layouts stack to single column on mobile
      *   Navigation collapses to essential items (login hidden on mobile)
      *   Pricing cards stack vertically with equal width
      *   Footer columns stack progressively (4 col → 2 col → 1 col)
  *   **Spacing Compression**: Padding and margins reduce proportionally on smaller screens
  *   **Image Optimization**: Aspect ratios maintained, sizes adapt to container width
  *   **Horizontal Scrolling**: Never required; all content fits viewport width
  *   **Visual Hierarchy Preserved**: Even on mobile, clear distinction between heading levels maintained

  ## 9. Accessibility & Best Practices
  *   **Color Contrast**: All text meets WCAG AA standards
      *   Slate 900 on Slate 50 background: AAA compliant
      *   White text on Indigo 900 background: AAA compliant
      *   Link colors tested for 4.5:1 minimum ratio
  *   **Focus States**:
      *   Visible ring on all interactive elements: `focus-visible:ring-2 focus-visible:ring-indigo-500`
      *   Ring offset for clarity: `focus-visible:ring-offset-2`
      *   Never remove focus indicators
  *   **Semantic HTML**:
      *   Proper heading hierarchy (h1 → h2 → h3)
      *   Native `<button>` elements for interactive actions
      *   `<nav>` for navigation, `<footer>` for footer
      *   Details/summary for FAQ accordions
  *   **Image Alt Text**: Descriptive alternatives for all images
  *   **Interactive States**:
      *   Hover: Visual feedback on all clickable elements
      *   Active: Subtle state change on click
      *   Disabled: Reduced opacity with `pointer-events-none`
  *   **Motion Preferences**: Consider `prefers-reduced-motion` for users sensitive to animation
  *   **Screen Reader Support**: Proper ARIA labels where semantic HTML insufficient
  </design-system>