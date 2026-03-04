# Document Editor Implementation Roadmap

## Overview
Implement a PDF document editor/viewer similar to Signify, allowing users to add interactive fields (signatures, initials, text, etc.) to their documents.

## Architecture Overview

```
DocumentEditorPage
├── DocumentViewer (react-pdf)
│   ├── PDF rendering
│   ├── Draggable field placement
│   ├── Page navigation
│   └── Zoom controls
├── LeftPanel (Tools)
│   ├── My Information (sender's data)
│   │   ├── My Signature
│   │   ├── My Initial
│   │   ├── My Email
│   │   └── My Full Name
│   └── Recipient Fields
│       ├── Recipient Signature
│       ├── Recipient Initial
│       ├── Recipient Email
│       └── Recipient Full Name
├── RightPanel (Properties)
│   ├── Field properties
│   ├── Styling (font, size, color)
│   ├── Recipient assignment (for recipient fields)
│   └── Delete field
└── TopBar
    ├── Page controls
    ├── Zoom controls
    ├── Save/Draft button
    └── Publish button
```

---

## Implementation Phases

### ✅✅✅ PHASE 1: COMPLETED ✅✅✅
### PHASE 1: Foundation Setup (Week 1)
**Objective:** Set up basic structure and components

#### ✅ 1.1: Dependencies Installation --- DONE
- [✅] Install `react-pdf` for PDF rendering
- [✅] Install `pdf-lib` (optional, for PDF manipulation backend)
- [✅] Install `dnd-kit` or use HTML5 drag-drop API
- [✅] Verify existing icon libraries (Lucide React, React Icons)

#### ✅ 1.2: Create DocumentEditorPage Component --- DONE
- [✅] Create `/frontend/src/pages/DocumentEditor/` folder
- [✅] Create main page layout with 3-column structure:
  - Left panel (300px, draggable tools)
  - Center (flex, PDF viewer)
  - Right panel (350px, properties)
- [✅] Add routing in App.js: `/documents/:documentId/editor`
- [✅] Create DocumentEditorPage.js with layout

#### ✅ 1.3: Connect View Button --- DONE
- [✅] Update Documents.js "View" button onClick
- [✅] Navigate to `/documents/{documentId}/editor`
- [✅] Pass document ID to params

**Deliverables:**
- DocumentEditorPage component structure
- Routing implemented
- View button wired
- Page loads and displays empty layout

---

### ✅✅✅ PHASE 2: COMPLETED ✅✅✅
### PHASE 2: PDF Viewer Integration (Week 1)
**Objective:** Display PDF in the editor

#### ✅ 2.1: DocumentViewer Component --- DONE
- [✅] Create `/frontend/src/components/DocumentEditor/DocumentViewer.js`
- [✅] Implement react-pdf Document and Page components
- [✅] Add PDF file loading from backend
- [✅] Display first page by default
- [✅] Add error handling for PDF loading

#### ✅ 2.2: Backend PDF Retrieval --- DONE
- [✅] Update `DocumentController.getDocument()` to return file data
- [✅] Serve PDF as base64 or direct URL
- [✅] Handle file security (check ownership)
- [✅] Add API endpoint: `GET /api/documents/:documentId/preview`

#### ✅ 2.3: Page Navigation --- DONE
- [✅] Display total page count
- [✅] Add previous/next page buttons
- [✅] Add page number input
- [✅] Add zoom controls (50%, 75%, 100%, 125%, 150%)

**Deliverables:**
- PDF displays in viewer
- Page navigation works
- Zoom controls functional
- Backend endpoint returns file data correctly

---

### ✅✅✅ PHASE 3: COMPLETED ✅✅✅
### PHASE 3: Left Panel - Tools (Week 2)
**Objective:** Create draggable field tools

#### ✅ 3.1: LeftPanel Component --- DONE
- [✅] Create `/frontend/src/components/DocumentEditor/LeftPanel.js`
- [✅] Organize tools into sections:
  - **My Information** (populated from user profile)
    - My Signature (fetch from UserSignature)
    - My Initial (fetch from UserSignature)
    - My Email (fetch from current user's email)
    - My Full Name (fetch from current user's First name + Last name)
  - **Recipient Fields** (available to assign)
    - Recipient Signature
    - Recipient Initial
    - Recipient Email
    - Recipient Full Name

#### ✅ 3.2: Tool Icon & Display --- DONE
- [✅] Use Lucide React and React Icons for tool icons
- [✅] Display sample values/placeholders
- [✅] Style tools with hover effects
- [✅] Add visual indicators for unsaved user data (e.g., signature)

#### ✅ 3.3: Drag & Drop Setup --- DONE
- [✅] Implement HTML5 drag-drop or dnd-kit library
- [✅] On dragstart: store tool data
- [✅] On dragend: calculate position on PDF
- [✅] Prevent dropping outside PDF bounds

**Deliverables:**
- Draggable tools display in left panel
- Tools can be dragged over PDF
- Tool data is captured on drop

---

#### ✅✅✅ PHASE 4: COMPLETED ✅✅✅
### PHASE 4: Field Placement & State Management (Week 2)
**Objective:** Place fields on PDF and manage state

#### ✅ 4.1: Field Model --- DONE
```javascript
Field {
  id: string (unique),
  toolId: number,
  label: string (e.g., "My Signature"),
  pageNumber: number,
  x: number (% from left),
  y: number (% from top),
  width: number (px),
  height: number (px),
  value: string or image data,
  assignedRecipients: [] (for recipient fields),
  fontFamily: string,
  fontSize: number,
  fontColor: string,
  fontStyles: { bold, italic, underline },
  createdAt: Date
}
```
✅ Utility functions: createField, updateField, updateFieldPosition, updateFieldSize, updateFieldStyling, validateField, cloneField, etc.
✅ Field constants and defaults (FIELD_TYPES, DEFAULT_FIELD_DIMENSIONS, DEFAULT_FIELD_STYLING)
✅ Serialization/deserialization for API transmission
✅ Helper functions for common operations (getFieldsOnPage, getFieldsByType, getRecipientFields, etc.)

#### 4.2: State Management --- DONE
✅ Create Context for document editor state:
  - `fields`: Array of placed fields
  - `selectedFieldId`: Currently selected field
  - `document`: Document metadata
  - `currentPage`: Current page viewing
✅ Created EditorContext with centralized state management
✅ Field actions: addField, removeField, updateFieldData, moveField, resizeField, updateFieldStyle, duplicateField
✅ Selection & navigation: selectField, deselectField, changePage
✅ Document operations: updateDocument, loadFields, reset
✅ Integrated EditorProvider wrapper in DocumentEditorPage
✅ Created useEditor hook for easy component consumption

#### ✅ 4.3: DocumentViewer Field Rendering --- DONE
- [✅] Render placed fields as overlays on PDF
- [✅] Style fields based on their properties
- [✅] Make fields draggable (adjust position)
- [✅] Make fields resizable (adjust width/height)
- [✅] Add selection highlight when clicked
- [✅] Show handles for resize/move

**Deliverables:**
- Fields can be dropped and placed on PDF
- Fields display with correct values
- Fields can be selected
- Selected field is highlighted

---

### PHASE 5: Right Panel - Properties (Week 2-3)
**Objective:** Manage field properties and recipients

#### 5.1: RightPanel Component
- [ ] Create `/frontend/src/components/DocumentEditor/RightPanel.js`
- [ ] Display properties for selected field:
  - Field name/label (read-only)
  - Field type indicator
  - Delete button
  - Font family dropdown
  - Font size input
  - Font color picker
  - Bold/Italic/Underline toggles
  - Recipient assignment (for recipient fields only)

#### 5.2: Font Controls
- [ ] Font family selector (Arial, Helvetica, Times New Roman, Courier, etc.)
- [ ] Font size input (8-72 px)
- [ ] Color picker (use HTML5 input[type="color"])
- [ ] Font style toggles (bold, italic, underline)
- [ ] Update DocumentViewer in real-time as user changes properties

#### 5.3: Recipient Assignment (Complex)
- [ ] For recipient fields only, show recipient search
- [ ] Search endpoint: `GET /api/users/search?q={email}`
- [ ] Add button to search and add recipient
- [ ] Display list of assigned recipients
- [ ] Show recipient status (pending, signed, etc.)
- [ ] Remove recipient button
- [ ] Clear all recipients button

#### 5.4: Backend Endpoints Needed
- [ ] `GET /api/users/search?q={email}` - Search users by email
- [ ] `GET /api/users/:userId/profile` - Get user profile with signature
- [ ] Already have: User model should include signature reference

**Deliverables:**
- RightPanel displays for selected field
- All font/styling controls work
- Changes apply to field in real-time
- Recipient assignment functional
 
---

### PHASE 6: Save & Persistence (Week 3)
**Objective:** Save document with fields to backend

#### 6.1: Backend Storage
- [ ] Add `fields` array to Document model:
  ```javascript
  fields: [{
    id, toolId, label, pageNumber, x, y, width, height,
    value, assignedRecipients, fontFamily, fontSize,
    fontColor, fontStyles
  }]
  ```
- [ ] Add `lastEditedAt` timestamp
- [ ] Add `status` field to track: draft, ready_to_sign, signed

#### 6.2: Save Functionality
- [ ] Create `PUT /api/documents/:documentId/fields` endpoint
- [ ] Save fields array to database
- [ ] Validate fields before saving
- [ ] Update document `lastEditedAt`
- [ ] Keep status as 'draft' until published

#### 6.3: Auto-Save (Optional)
- [ ] Debounce field changes (500ms)
- [ ] Auto-save to backend
- [ ] Show "Saving..." indicator
- [ ] Show "Saved" confirmation

#### 6.4: Load Fields on Editor Open
- [ ] Fetch document with fields on page load
- [ ] Populate editor with existing fields
- [ ] Allow editing existing fields

**Deliverables:**
- New document fields saved
- Existing documents load their fields
- Auto-save works (if implemented)
- Status tracking in DB

---

### PHASE 7: Publishing & Signing Workflow (Week 3-4)
**Objective:** Publish document and prepare for signing

#### 7.1: Publish Flow
- [ ] Add "Publish" button in DocumentEditorPage
- [ ] Validate all recipient fields have at least one recipient
- [ ] Create signing links for each recipient
- [ ] Send invitations to recipients (email)
- [ ] Update document status to 'pending_signature'
- [ ] Create DocumentSignature records for tracking

#### 7.2: Recipient Signing View
- [ ] Create `/documents/:documentId/sign/:signingToken` route
- [ ] Display document with fields awaiting their signature
- [ ] Recipient can see only their assigned fields
- [ ] Recipient can sign/initial/fill their fields
- [ ] Signature canvas for signature/initial fields
- [ ] Save signed data to DocumentSignature

#### 7.3: Backend Updates
- [ ] `POST /api/documents/:documentId/publish` - Publish and send invites
- [ ] `POST /api/documents/:documentId/fields/:fieldId/sign` - Submit signature
- [ ] Update DocumentSignature model with field data
- [ ] Generate signing tokens (JWT with document + field scope)

**Deliverables:**
- Document can be published
- Recipients receive email invitations
- Recipients can view and sign documents
- Signatures saved to database

---

### PHASE 8: UI Polish & Testing (Week 4)
**Objective:** Refine UX and test all flows

#### 8.1: UI Improvements
- [ ] Responsive design for different screen sizes
- [ ] Better styling for panels
- [ ] Loading indicators for PDF loading
- [ ] Error messages for failures
- [ ] Confirmation dialogs for destructive actions
- [ ] Keyboard shortcuts (Delete key, etc.)

#### 8.2: Testing
- [ ] Test PDF upload and loading
- [ ] Test field placement and movement
- [ ] Test field deletion
- [ ] Test styling changes
- [ ] Test recipient assignment
- [ ] Test publishing flow
- [ ] Test signing flow

#### 8.3: Optimizations
- [ ] Lazy load PDF pages
- [ ] Optimize field rendering for performance
- [ ] Cache fetched user data
- [ ] Compress field data before saving

**Deliverables:**
- Polished UI matching SigniStruct theme
- All flows tested and working
- Performance optimized

---

## Database Schema Changes

### Document Model
```javascript
{
  ...existing fields,
  fields: [{
    id: String,
    toolId: Number,
    label: String,
    pageNumber: Number,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    value: String,
    assignedRecipients: [{
      recipientId: ObjectId,
      recipientEmail: String,
      recipientName: String,
      status: String (pending/signed/declined),
      signatureData: String (base64),
      signedAt: Date
    }],
    fontFamily: String,
    fontSize: Number,
    fontColor: String,
    fontStyles: {
      bold: Boolean,
      italic: Boolean,
      underline: Boolean
    }
  }],
  lastEditedAt: Date,
  status: String (draft/pending_signature/partially_signed/fully_signed)
}
```

### New Endpoints Summary
```
GET    /api/documents/:documentId/preview        - Get PDF for viewing
PUT    /api/documents/:documentId/fields         - Save/update fields
POST   /api/documents/:documentId/publish        - Publish and send invites
POST   /api/users/search?q={query}               - Search users
GET    /api/users/:userId/profile                - Get user profile
POST   /api/documents/:documentId/fields/:fieldId/sign - Submit signature
```

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|------------|
| 1 | 1-2 days | Basic layout, routing |
| 2 | 2-3 days | PDF viewer with navigation |
| 3 | 2-3 days | Draggable tools |
| 4 | 2-3 days | Field placement & selection |
| 5 | 3-4 days | Properties panel & styling |
| 6 | 2-3 days | Save/load functionality |
| 7 | 3-4 days | Publishing & signing |
| 8 | 2-3 days | Polish & testing |
| **TOTAL** | **3-4 weeks** | **Complete editor** |

---

## Quick Start (Phase 1 Only)
If you want to start small and test the concept:

1. Install dependencies: `npm install react-pdf`
2. Create DocumentEditorPage with 3-column layout
3. Add routing: `/documents/:documentId/editor`
4. Create simple DocumentViewer component with react-pdf
5. Wire View button in Documents.js

This would take 1-2 days and give you a working PDF viewer. Then you can incrementally add features.

---

## Alternative: Phased Approach
**Recommended for quicker initial results:**

- **Week 1**: Phase 1-2 (60% done) + Phase 3 (basic dragging)
- **Week 2**: Complete Phase 3-4 (MVP editor working)
- **Week 3**: Phase 5-6 (save functionality)
- **Week 4+**: Phase 7-8 (publishing & refinement)

With this approach, users can start editing documents by end of Week 2.
