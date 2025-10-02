# AI Development Rules - Sirius Ambiental

## Tech Stack Overview

- **React 18** with TypeScript for the frontend framework and type safety
- **Vite** as the build tool and development server
- **Supabase** as the backend database and authentication service
- **Tailwind CSS** for styling and responsive design
- **shadcn/ui** component library for consistent UI components
- **React Router** for client-side routing and navigation
- **TanStack Query** for server state management and caching
- **Lucide React** for consistent iconography
- **React Hook Form** with Zod for form validation and management

## Library Usage Guidelines

### UI Components
- **Always use shadcn/ui components** as the primary UI library
- Do not create custom UI components when a shadcn equivalent exists
- Extend shadcn components only when absolutely necessary and follow their patterns
- Use Radix UI primitives directly only when creating entirely new component types

### State Management
- **Use TanStack Query** for all server state (API calls, database queries)
- Use React's built-in state (useState, useReducer) for local component state
- Do not use external state management libraries like Redux, Zustand, or MobX
- Implement custom hooks for complex state logic that doesn't involve server data

### Forms & Validation
- **Use React Hook Form** with Zod resolvers for all form handling
- Implement proper validation schemas using Zod for type-safe form validation
- Do not use uncontrolled forms or manual form state management
- Use the built-in form components from shadcn/ui (Input, Select, etc.)

### Routing
- **Use React Router** exclusively for navigation and routing
- Keep all route definitions in `src/App.tsx`
- Use protected routes with the `ProtectedRoute` component for authentication
- Implement proper route-based code splitting for better performance

### Database & Authentication
- **Use Supabase client** for all database operations and authentication
- Use the provided Supabase hooks and utilities
- Do not implement custom authentication logic or direct database connections
- Follow the existing database schema and migration patterns

### Styling
- **Use Tailwind CSS classes** for all styling
- Do not write custom CSS files unless absolutely necessary
- Follow the existing design system colors and spacing defined in `index.css`
- Use responsive design patterns with Tailwind's responsive prefixes

### Icons
- **Use Lucide React** for all icons throughout the application
- Do not use other icon libraries or custom SVG icons unless necessary
- Maintain consistent icon sizes and usage patterns

### File Organization
- Keep components in `src/components/` with descriptive names
- Organize pages in `src/pages/` by feature (admin/, portal/)
- Place hooks in `src/hooks/` with clear, descriptive names
- Use TypeScript interfaces for all data structures and API responses

### Code Quality
- Write TypeScript for all new code - no JavaScript files
- Follow existing code patterns and naming conventions
- Implement proper error handling with try-catch blocks where appropriate
- Use meaningful variable and function names in Portuguese for business logic

### Performance
- Implement proper loading states and error boundaries
- Use React.memo for expensive components only when necessary
- Lazy load routes and components where appropriate
- Optimize images and assets for web performance

## Prohibited Practices

- ❌ Do not install additional UI libraries beyond shadcn/ui
- ❌ Do not use CSS-in-JS libraries (styled-components, emotion)
- ❌ Do not implement custom authentication systems
- ❌ Do not use direct database connections outside Supabase
- ❌ Do not create duplicate components when shadcn alternatives exist
- ❌ Do not use JavaScript - all code must be TypeScript
- ❌ Do not ignore TypeScript errors or use `any` type excessively
- ❌ Do not implement complex state management without proper hooks

## Required Dependencies

All necessary dependencies are already installed. Do not add new packages without explicit approval. The current setup includes:

- React ecosystem (react, react-dom, react-router-dom)
- UI framework (tailwindcss, shadcn/ui components)
- Database and auth (@supabase/supabase-js)
- Forms and validation (@hookform/resolvers, zod)
- State management (@tanstack/react-query)
- Development tools (typescript, vite, eslint)

## Code Review Checklist

Before submitting code, ensure:

- [ ] TypeScript types are properly defined
- [ ] shadcn/ui components are used where applicable
- [ ] Forms use React Hook Form with Zod validation
- [ ] Server state uses TanStack Query
- [ ] Responsive design is implemented
- [ ] Error handling is appropriate
- [ ] Code follows existing patterns and conventions
- [ ] No prohibited libraries or practices are used