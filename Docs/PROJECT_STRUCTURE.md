# SigniStruct Project Structure

## Project Overview
SigniStruct is a unified system combining form builder and document signing capabilities. Users can create and manage forms while also sending and signing documents—all in one platform.

## Directory Structure

```
signistruct/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Business logic handlers
│   │   ├── models/             # MongoDB schemas
│   │   ├── routes/             # API endpoints
│   │   ├── middleware/         # Express middleware
│   │   └── server.js           # Entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── images/         # Logo and assets
│   │   │
│   │   ├── components/
│   │   │   ├── Navigation/     # Header, navigation components
│   │   │   ├── Forms/          # Form-related components
│   │   │   ├── Documents/      # Document-related components
│   │   │   └── Common/         # Reusable UI components
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard/      # Main dashboard page
│   │   │   ├── Forms/          # Forms management page
│   │   │   ├── Documents/      # Documents management page
│   │   │   ├── FormBuilder/    # Form creation interface
│   │   │   └── DocumentSign/   # Document signing interface
│   │   │
│   │   ├── contexts/           # React Context (Auth, etc.)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service clients
│   │   ├── styles/             # Global styles
│   │   ├── utils/              # Helper functions
│   │   ├── theme.js            # Design system (colors, typography, spacing)
│   │   ├── App.js              # Root component with routing
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   │
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── .env.example
│
├── package.json               # Root package.json for tooling
├── README.md                  # Project documentation
└── .gitignore
```

## Feature Breakdown

### Dashboard (`/dashboard`)
- Welcome section with user greeting
- Quick action buttons (Create Form, Upload Document)
- Stats grid showing:
  - Published & Draft Forms
  - Form responses count
  - Published, Assigned, & Draft Documents
- Recent activity for forms and documents
- Pending signatures notification

### Forms Management (`/forms`)
- **Published Forms Tab**: View all live forms with response counts
- **Draft Forms Tab**: Access and edit forms in progress
- Search functionality
- Form cards with:
  - Responses count
  - Creation date
  - Action buttons (View Details, Edit/Duplicate)

### Documents Management (`/documents`)
- **Published Documents Tab**: Manage signed documents
- **Assigned to Sign Tab**: View documents pending your signature
- **Draft Documents Tab**: Documents not yet published
- Table view with:
  - Document name, signer count, status
  - Status badges (Pending, Signed, Draft)
  - Creation date and due date (for assigned docs)
  - Action buttons

### Form Builder (`/form-builder/:formId`)
Three-panel layout:
1. **Toolbar (Left)**: Add field buttons
   - Text, Email, Phone
   - Textarea, Select
   - Checkbox, Radio
   - Date, Signature
2. **Canvas (Center)**: Form preview and editing
3. **Properties (Right)**: Field configuration
   - Label, placeholder
   - Required toggle
   - Field type settings

### Document Signing (`/document-sign/:documentId`)
- Document preview with content
- Signer list showing current and pending signers
- Signature input options:
  - Draw signature (canvas)
  - Type signature
  - Upload image
- Legal agreement checkbox
- Sign and cancel buttons

## Design System

### Color Palette
- **Primary**: Deep Blue (#1E3A8A) - Main actions, links
- **Primary Light**: #3B82F6
- **Primary Dark**: #1E40AF
- **Secondary**: Teal (#0D9488) - Signing actions
- **Accent**: Coral/Orange (#EA580C) - Highlights, signatures
- **Neutrals**: Gray scale for backgrounds, text, borders
- **Status**: Green (success), Orange (warning), Red (error)

### Typography
- Font Family: 'Segoe UI', 'Roboto', sans-serif
- Sizes: xs (12px) to 4xl (36px)
- Weights: Light (300), Normal (400), Medium (500), Bold (700)

### Spacing
- Consistent scale: xs (4px) to 3xl (48px)
- Padding and margins use theme values for consistency

### Components
- Cards with subtle shadows and hover effects
- Buttons with state transitions
- Tables for data display
- Modals and sidebars for detailed views
- Form inputs with focus states

## Key Pages and Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Dashboard | Landing/home page |
| `/dashboard` | Dashboard | Main user dashboard |
| `/forms` | Forms | Forms listing and management |
| `/documents` | Documents | Documents listing and management |
| `/form-builder/:id` | FormBuilder | Create/edit forms |
| `/document-sign/:id` | DocumentSign | Sign documents |

## Technology Stack

### Frontend
- React 18.2 with React Router v6
- Axios for API calls
- CSS-in-JS (color themes defined in JavaScript)
- Responsive design (mobile-first approach)

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication
- CORS enabled

## Development Workflow

### Adding a New Feature
1. Create component/page in appropriate folder
2. Add styles alongside component (Component.js + Component.css)
3. Update routing in App.js if needed
4. Use theme.js for consistent styling
5. Commit changes with descriptive message

### Best Practices
- Component-based architecture
- Reusable utility functions in `/utils`
- Custom hooks in `/hooks` for logic
- Context API for global state
- CSS classes follow BEM-like naming
- Responsive design for all screen sizes

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/signistruct
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Project

```bash
# Install all dependencies
npm run install-all

# Run development environment
npm run dev

# Build for production
npm run build
```

See [README.md](../README.md) for detailed setup instructions.
