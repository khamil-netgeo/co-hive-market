# Layout System Documentation

## Overview
The CoopMarket layout system provides consistent, reusable components for structuring pages across the application. All components follow our design system tokens and maintain mobile-first responsive design.

## Core Layout Components

### PageLayout
Main container component for all pages.

```jsx
import PageLayout from "@/components/layout/PageLayout";

<PageLayout variant="default" background="default">
  {/* Page content */}
</PageLayout>
```

**Props:**
- `variant`: "default" | "full" | "narrow"
  - `default`: Standard container with max-width
  - `full`: Full width with minimal padding
  - `narrow`: Narrow container (max-width: 1024px)
- `background`: "default" | "gradient" | "muted"
  - `default`: No background styling
  - `gradient`: Subtle gradient background
  - `muted`: Muted background color

### PageHeader
Standardized page header with title, description, and actions.

```jsx
import PageHeader from "@/components/layout/PageHeader";

<PageHeader
  title="Page Title"
  description="Page description"
  size="default"
  actions={
    <Button>Action</Button>
  }
/>
```

**Props:**
- `title`: Page title (required)
- `description`: Optional description text
- `size`: "default" | "large" | "compact"
- `actions`: React node for action buttons

### SectionLayout
Wrapper for consistent section spacing and optional titles.

```jsx
import SectionLayout from "@/components/layout/SectionLayout";

<SectionLayout
  title="Section Title"
  description="Section description"
  spacing="default"
  actions={<Button>Action</Button>}
>
  {/* Section content */}
</SectionLayout>
```

**Props:**
- `title`: Optional section title
- `description`: Optional section description
- `spacing`: "default" | "large" | "compact"
- `titleLevel`: 2 | 3 (heading level)
- `actions`: React node for section actions

## Design System Integration

### Spacing Scale
All components use standardized spacing tokens from the design system:
- `--spacing-4` (1rem): Default base spacing
- `--spacing-6` (1.5rem): Medium spacing
- `--spacing-8` (2rem): Large spacing
- `--spacing-12` (3rem): Extra large spacing

### Typography
- H1: Page titles (automatically styled with gradient)
- H2: Section titles
- H3: Subsection titles
- Text variants for descriptions

### Responsive Behavior
- Mobile-first approach
- Consistent breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible layouts that adapt to screen size

## Usage Examples

### Standard Page Layout
```jsx
<PageLayout>
  <PageHeader
    title="My Dashboard"
    description="Overview of your account and activities"
    actions={<Button>New Item</Button>}
  />
  
  <SectionLayout
    title="Recent Activity"
    description="Your latest transactions and updates"
  >
    {/* Section content */}
  </SectionLayout>
</PageLayout>
```

### Profile/Settings Page
```jsx
<PageLayout variant="narrow" background="gradient">
  <PageHeader
    title="Profile Settings"
    description="Manage your account preferences"
    size="large"
  />
  
  <SectionLayout title="Personal Information">
    {/* Form content */}
  </SectionLayout>
  
  <SectionLayout title="Privacy Settings">
    {/* Settings content */}
  </SectionLayout>
</PageLayout>
```

### Full Width Landing Page
```jsx
<PageLayout variant="full">
  <Hero />
  
  <SectionLayout title="Featured Products" spacing="large">
    {/* Product grid */}
  </SectionLayout>
  
  <SectionLayout title="Testimonials" spacing="large">
    {/* Testimonials */}
  </SectionLayout>
</PageLayout>
```

## Best Practices

1. **Consistent Structure**: Always use PageLayout as the root container
2. **Semantic Hierarchy**: Use PageHeader for main titles, SectionLayout for content organization
3. **Mobile-First**: Design for mobile first, enhance for larger screens
4. **Accessibility**: Maintain proper heading hierarchy (H1 → H2 → H3)
5. **Spacing**: Use consistent spacing variants rather than custom CSS
6. **Actions**: Place related actions in header/section action areas

## Migration Guide

When updating existing pages:

1. Wrap content in `PageLayout`
2. Convert page titles to `PageHeader`
3. Group related content in `SectionLayout`
4. Remove custom container/spacing classes
5. Use standardized action placement

Before:
```jsx
<main className="container py-8">
  <div className="mb-6 flex items-center justify-between">
    <h1 className="text-2xl font-semibold">Title</h1>
    <Button>Action</Button>
  </div>
  {/* content */}
</main>
```

After:
```jsx
<PageLayout>
  <PageHeader
    title="Title"
    actions={<Button>Action</Button>}
  />
  {/* content */}
</PageLayout>
```