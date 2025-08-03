# Ganger Platform UI Component Storybook

## Overview

This Storybook provides comprehensive documentation and interactive examples for all UI components in the Ganger Platform. It covers both the original `@ganger/ui` package and the modern `@ganger/ui-catalyst` package.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run Storybook locally
pnpm run storybook

# Build Storybook for production
pnpm run build-storybook
```

Storybook will be available at http://localhost:6006

## Component Libraries

### @ganger/ui (Original)
The original component library with 23 components including:
- **Core Components**: Alert, Avatar, Badge, Button, LoadingSpinner
- **Form Components**: Checkbox, Input, Select, FormField, Switch
- **Layout Components**: AppLayout, PageHeader, StaffPortalLayout
- **Data Display**: Card, DataTable, Modal, Progress, StatCard, Tabs
- **Utility Components**: ErrorBoundary, ThemeProvider, Toast
- **Branding**: GangerLogo, GangerHeader, GangerLogoCompact

### @ganger/ui-catalyst (Modern)
Modern Catalyst-based components with 18 color variants and enhanced styling:
- **Enhanced Components**: All core components with Catalyst design system
- **Unique Components**: LoadingButton, Skeleton (with TableSkeleton, CardSkeleton)
- **Legacy Support**: Each component includes a Legacy variant for backward compatibility

## Features

### 🎨 Theme Support
- **Dark Mode Toggle**: Global theme switcher in the toolbar
- **Theme Persistence**: Automatically saves theme preference
- **Live Updates**: All components respond to theme changes

### ♿ Accessibility
- **WCAG Compliance**: Built-in accessibility checks via @storybook/addon-a11y
- **ARIA Labels**: Proper accessibility attributes demonstrated
- **Keyboard Navigation**: All interactive components support keyboard usage

### 🔍 Component Exploration
- **Controls**: Interactive prop editing for all components
- **Docs**: Auto-generated documentation from TypeScript types
- **Code Examples**: View source code for each story

### 📱 Responsive Design
- **Viewport Addon**: Test components at different screen sizes
- **Mobile-First**: Components designed to work on all devices

## Organization

Stories are organized by package and component:
```
@ganger/ui/
  ├── Alert
  ├── AppLayout
  ├── Avatar
  ├── Badge
  ├── Button
  └── ... (all 23 components)

@ganger/ui-catalyst/
  ├── Alert
  ├── Avatar
  ├── Badge
  ├── Button
  └── ... (all components with modern variants)
```

## Key Stories

### Component Comparisons
Many Catalyst components include "LegacyComparison" stories showing:
- Modern Catalyst design (18 color options)
- Legacy design (5-6 variants)
- Migration guidance

### Real-World Examples
Look for stories named:
- `FormExample` - Shows components in form contexts
- `Dashboard` - Components in dashboard layouts
- `RealWorldExamples` - Production-ready implementations

### Interactive Demos
Stories with state management demonstrating:
- Loading states
- Form validation
- Modal interactions
- Toast notifications

## Development

### Adding New Stories

1. Create a new `.stories.tsx` file in the appropriate directory
2. Import the component and types
3. Define meta configuration
4. Create story variations

Example:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '@ganger/ui';

const meta: Meta<typeof ComponentName> = {
  title: '@ganger/ui/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Component description',
      },
    },
  },
  argTypes: {
    // Define controls
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

### Mock Providers

For components requiring context, use the provided mocks:
- `MockAuthProvider` - Simulates authentication context
- `MockThemeProvider` - Provides theme context
- Located in `src/stories/mocks/`

### Best Practices

1. **Comprehensive Coverage**: Include all prop variations
2. **Real Examples**: Show practical use cases
3. **Accessibility**: Ensure all stories are accessible
4. **Documentation**: Add descriptions to parameters
5. **Visual States**: Show hover, focus, active, disabled states

## Testing

### Manual Testing
- Review all stories in different themes
- Test keyboard navigation
- Check responsive behavior
- Verify accessibility warnings

### Visual Regression (Future)
Setup for visual regression testing is included but not yet configured.
To enable:
1. Install Chromatic or similar service
2. Add to CI/CD pipeline
3. Configure snapshot comparison

## Deployment

Storybook can be deployed as a static site:

```bash
# Build static files
pnpm run build-storybook

# Files will be in storybook-static/
# Deploy to any static hosting service
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all @ganger/* packages are built
2. **Theme Not Working**: Check ThemeProvider is in preview.tsx
3. **Stories Not Loading**: Verify story file naming (.stories.tsx)

### Getting Help

- Check existing stories for examples
- Review Storybook documentation at https://storybook.js.org
- Consult CLAUDE.md for platform-specific guidelines

## Future Enhancements

- [ ] Visual regression testing with Chromatic
- [ ] Performance benchmarks for components
- [ ] Automated accessibility reports
- [ ] Component usage analytics
- [ ] Design tokens documentation