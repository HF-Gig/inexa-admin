# Inexa Admin Dashboard: React.js, Vite, Material UI

Welcome to Inexa Admin Dashboard, a comprehensive educational administration solution built with React.js, Vite, and Material UI. This dashboard provides powerful tools for managing educational institutions, courses, staff, and users with a modern, responsive interface.

## Features

- **Dashboard Page:** Overview page for key metrics and insights (coming soon)
- **User Management:** Complete CRUD operations for user accounts with form validation
- **Course Management:** Comprehensive course and program management system
- **Staff Management:** Staff member administration with course assignment capabilities
- **Organization Management:** Institution and organization profile management
- **Authentication System:** Secure sign-in with protected routes
- **Responsive Design:** Mobile-friendly interface with Material UI components
- **Data Tables:** Advanced data management with sorting, pagination, and search
- **Form Validation:** Robust form handling with Formik and Yup validation

## Technology Stack

- **Frontend Framework:** React.js 18.2.0
- **Build Tool:** Vite 5.1.4
- **UI Framework:** Material UI 5.15.10
- **Routing:** React Router DOM 6.22.1
- **Form Management:** Formik 2.4.5 + Yup 1.3.3
- **HTTP Client:** Axios 1.10.0
- **Icons:** Material UI Icons
- **Data Grid:** MUI X Data Grid 6.19.5
- **Rich Text Editor:** React Quill 2.0.0
- **Sidebar:** React Pro Sidebar 1.1.0

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CommonTable.jsx     # Data table component
│   ├── CommonTextField.jsx # Form input component
│   ├── CommonSelect.jsx    # Dropdown component
│   ├── CommonSearchBar.jsx # Search functionality
│   ├── CommonTextEditor.jsx # Rich text editor
│   ├── Header.jsx          # Top navigation bar
│   ├── PrivateRoute.jsx    # Authentication guard
│   └── ToastProvider.jsx   # Notification system
├── scenes/              # Main application pages
│   ├── dashboard/          # Dashboard overview
│   ├── users/              # User management
│   ├── courses/            # Course management
│   ├── staff/              # Staff administration
│   ├── organization/       # Organization management
│   └── signin/             # Authentication
├── helpers/             # Utility functions
│   └── api.js              # API integration
├── constants/           # Application constants
├── theme.js            # Material UI theme configuration
└── Router.jsx          # Application routing
```

## Key Features

### User Management
- Create, read, update, and delete user accounts
- Form validation with Yup schemas
- Search and filter capabilities
- Pagination and sorting

### Course Management
- Support for both courses and programs
- CRUD operations with validation
- Category and status management
- Instructor assignment

### Staff Administration
- Staff member profiles and management
- Course assignment capabilities
- Photo management
- Search and filter functionality

### Organization Management
- Institution profile management
- Logo and branding assets
- Contact information
- Administrative settings

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd inexa-admin
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5174`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Development

### Project Configuration
- **Port:** 5174 (configurable in package.json)
- **Host:** 0.0.0.0 (accessible from network)
- **Build Tool:** Vite with React plugin
- **Linting:** ESLint with React-specific rules

### Code Style
- ESLint configuration for React best practices
- Consistent component structure
- Form validation with Yup schemas
- API integration with Axios
