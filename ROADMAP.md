# Notenrechner - Product Roadmap

## Project Overview
Interactive grade calculator for the Swiss school system with configurable grading curves, real-time calculations, and comprehensive statistics.

---

## ✅ Completed Milestones

### Phase 1: Core Foundation (Completed)
- [x] **Grade Calculation Engine**
  - Flexible grading algorithms (Linear, Nice/Generous, Hard/Strict)
  - Configurable anchor points (points for grades 4.0 and 6.0)
  - Customizable rounding steps (0.1, 0.25, 0.5, 1.0)
  - Mathematical curve calculations (concave, linear, convex)
  - Grade clamping and validation

- [x] **Student Management System**
  - Add/remove students dynamically
  - Edit student names and points inline
  - Real-time grade calculation per student
  - Pass/fail status indicators
  - Student count tracking

- [x] **Data Import/Export**
  - CSV import functionality for bulk student addition
  - CSV export with grades and pass/fail status
  - Flexible CSV parsing (comma/semicolon delimiters)

### Phase 2: Visualization & Analytics (Completed)
- [x] **Statistics Dashboard**
  - Average grade calculation
  - Median grade calculation
  - Pass rate percentage
  - Standard deviation
  - Min/max grade display
  - KPI tile view with visual indicators

- [x] **Interactive Charts**
  - Grade distribution bar chart (6 grade brackets)
  - Grading curve line chart
  - Reference lines for passing grade (4.0)
  - Reference lines for anchor points
  - Responsive chart sizing
  - Dark mode compatible charts

- [x] **Configuration Panel**
  - Maximum possible points setting
  - Points for grade 6 (excellence threshold)
  - Points for grade 4 (passing threshold)
  - Minimum grade setting
  - Rounding step selector
  - Algorithm type selector with descriptions

### Phase 3: User Experience (Completed)
- [x] **Multi-language Support**
  - English (EN) translation
  - German (DE) translation
  - French (FR) translation
  - Language switcher in footer
  - Localized UI labels and messages

- [x] **Dark Mode**
  - System-wide dark mode toggle
  - Dark mode for all components
  - Chart color adaptation
  - Smooth transitions between themes

- [x] **Responsive Design**
  - Mobile-first responsive layout
  - Breakpoint-based grid system (lg, md, sm, xs, xxs)
  - Draggable grid layout (react-grid-layout)
  - Customizable component positioning
  - Layout persistence across modes

- [x] **Report/Presentation Mode**
  - Classroom presentation view
  - Print-optimized layout
  - Hide configuration panel in report mode
  - One-click print functionality
  - Professional report header/footer

### Phase 4: Polish & Refinement (Completed)
- [x] **UI/UX Enhancements**
  - Modern design with Tailwind CSS
  - Lucide React icon library integration
  - Hover states and transitions
  - Color-coded grade badges (pass/fail)
  - Accessibility considerations

- [x] **Grade Scale Table**
  - Visual grade-to-points mapping
  - Display in report mode
  - Reference for students and teachers

---

## 🚧 Planned Milestones

### Phase 5: Data Persistence & Multiple Exam Management
**Priority: High | Target: Q1 2026**

This phase transforms the single-exam calculator into a full exam management system with persistent storage.

#### **Architecture Decisions:**
- **Storage:** LocalStorage (with abstracted interface for future cloud migration)
- **Scope:** Exam management only (class management deferred to Phase 6)
- **No Limits:** Unlimited number of exams
- **Sorting:** Default sort by date (newest first)
- **No Templates:** Template functionality not implemented in this phase

---

#### **Phase 5.1: Data Structures & Storage Layer**
**Estimated: 4-6 hours**

- [ ] **Type Definitions**
  ```typescript
  interface Exam {
    id: string;                    // Unique identifier (UUID)
    name: string;                  // e.g., "Mathematik Test 1"
    subject?: string;              // e.g., "Mathematik"
    date: string;                  // ISO-8601 format
    config: GradingConfig;         // Grading configuration
    students: Student[];           // Students with points/grades
    createdAt: string;             // ISO-8601 timestamp
    updatedAt: string;             // ISO-8601 timestamp
  }
  ```

- [ ] **Storage Adapter Interface**
  - Create abstract `StorageAdapter` interface
  - Implement `LocalStorageAdapter` with methods:
    - `saveExam(exam: Exam): Promise<void>`
    - `loadExams(): Promise<Exam[]>`
    - `deleteExam(id: string): Promise<void>`
    - `getExam(id: string): Promise<Exam | null>`
    - `updateExam(id: string, updates: Partial<Exam>): Promise<void>`
  - Error handling and quota checks
  - Storage versioning for future migrations

- [ ] **Data Migration**
  - Migrate existing single-exam state to Exam structure
  - Create default exam from current state on first load
  - Preserve user's existing data
  - Add migration version tracking

---

#### **Phase 5.2: Exam Management Core**
**Estimated: 6-8 hours**

- [ ] **Context & State Management**
  - Create `ExamContext` with React Context API
  - Implement `ExamProvider` wrapping App component
  - State management for:
    - `exams: Exam[]` - All exams
    - `activeExamId: string | null` - Currently selected exam
    - `isLoading: boolean` - Loading state
    - `error: string | null` - Error messages

- [ ] **Core Operations**
  - **Create Exam**
    - Modal with form (name, subject, date)
    - Option to start empty or copy students from another exam
    - Generate unique ID (nanoid or uuid)
    - Auto-set as active exam
    - Auto-save to LocalStorage

  - **Switch Exam**
    - Load exam data from storage
    - Update activeExamId
    - Trigger re-render of all components
    - Smooth transition animation

  - **Update Exam**
    - Edit exam metadata (name, subject, date)
    - Update students and config
    - Auto-save on changes (debounced)
    - Optimistic UI updates

  - **Delete Exam**
    - Confirmation dialog with exam details
    - Remove from storage
    - Switch to most recent remaining exam
    - Handle last exam deletion gracefully

  - **Duplicate Exam**
    - Copy exam with new ID and timestamp
    - Option to copy students or start fresh
    - Auto-append " (Copy)" to name
    - Set as active exam

- [ ] **Auto-Save System**
  - Debounced save (500ms after last change)
  - Save on exam switch
  - Save on window beforeunload event
  - Visual indicator for save status (saved/saving/error)
  - Recovery mechanism for failed saves

---

#### **Phase 5.3: User Interface Components**
**Estimated: 8-10 hours**

- [ ] **Exam Selector (Dropdown)**
  - Header component showing current exam
  - Click to expand dropdown with all exams
  - Each exam shows:
    - Name and date
    - Subject (if set)
    - Number of students
    - Average grade (if calculated)
  - Search/filter functionality
  - Keyboard navigation (arrow keys, Enter, Escape)
  - Sort options:
    - Date (newest first) - DEFAULT
    - Date (oldest first)
    - Name (A-Z)
    - Name (Z-A)

- [ ] **Create Exam Modal**
  - Form fields:
    - Exam name (required)
    - Subject (optional)
    - Date (default: today)
    - "Copy students from" dropdown (optional)
      - "Start empty"
      - List of existing exams
  - Form validation
  - Create & switch to new exam
  - Cancel button

- [ ] **Exam Options Menu (3-dot menu)**
  - Edit metadata (name, subject, date)
  - Duplicate exam
  - Export options:
    - "Export this exam" (CSV)
    - "Export all exams" (ZIP with multiple CSVs)
    - "Export as JSON backup"
  - Delete exam (with confirmation)

- [ ] **Empty State**
  - Show when no exams exist
  - Large "Create your first exam" button
  - Optional: Quick start guide/tips

- [ ] **Exam List View (in dropdown)**
  ```
  ┌─────────────────────────────────────────┐
  │ 🔍 Search exams...                      │
  ├─────────────────────────────────────────┤
  │ ✓ Mathematik Test 1        05.01.2026   │
  │   25 Schüler · Ø 4.8                    │
  │   ⋮ [Edit][Duplicate][Delete]           │
  ├─────────────────────────────────────────┤
  │   Deutsch Aufsatz          03.01.2026   │
  │   22 Schüler · Ø 4.2                    │
  ├─────────────────────────────────────────┤
  │   Physik Klausur           20.12.2025   │
  │   25 Schüler · Ø 4.5                    │
  ├─────────────────────────────────────────┤
  │ + Neue Prüfung erstellen                │
  └─────────────────────────────────────────┘
  ```

- [ ] **Toast Notifications**
  - Exam created
  - Exam saved
  - Exam deleted
  - Exam duplicated
  - Save errors
  - Storage quota warnings

---

#### **Phase 5.4: Enhanced Export Features**
**Estimated: 3-4 hours**

- [ ] **Export Options**
  - **Single Exam Export (CSV)**
    - Current exam only
    - Same format as existing export

  - **All Exams Export (ZIP)**
    - Create ZIP file with:
      - One CSV per exam (named: `{exam-name}_{date}.csv`)
      - `index.txt` with exam list
    - Use JSZip library

  - **JSON Backup Export**
    - Complete data export for backup/migration
    - All exams with full metadata
    - Includes settings and preferences
    - Human-readable JSON format

  - **JSON Import**
    - Import from JSON backup
    - Validation and error handling
    - Merge with existing data or replace

- [ ] **Export UI**
  - Export button in exam options menu
  - Modal with export options
  - Progress indicator for large exports
  - Download confirmation

---

#### **Phase 5.5: Polish & UX Improvements**
**Estimated: 4-5 hours**

- [ ] **Keyboard Shortcuts**
  - `Cmd/Ctrl + N` - New exam
  - `Cmd/Ctrl + S` - Manual save (usually auto)
  - `Cmd/Ctrl + D` - Duplicate current exam
  - `Cmd/Ctrl + E` - Focus exam selector
  - `Escape` - Close modals/dropdowns

- [ ] **Loading States**
  - Skeleton loaders for exam list
  - Spinner during save operations
  - Smooth transitions between exams

- [ ] **Error Handling**
  - Storage quota exceeded warning
  - Corrupt data recovery
  - Network errors (for future cloud sync)
  - User-friendly error messages

- [ ] **Animations & Transitions**
  - Fade in/out for modals
  - Slide animation for exam switch
  - Smooth dropdown open/close
  - Success/error toast animations

- [ ] **Responsive Design**
  - Mobile-optimized exam selector
  - Touch-friendly dropdowns
  - Swipe gestures for exam navigation
  - Condensed UI for small screens

---

#### **Phase 5.6: Testing & Documentation**
**Estimated: 3-4 hours**

- [ ] **Unit Tests**
  - Storage adapter tests
  - Exam CRUD operations
  - Data migration tests
  - Error handling tests

- [ ] **Integration Tests**
  - Complete exam lifecycle
  - Multi-exam workflows
  - Export/import functionality

- [ ] **User Documentation**
  - How to create exams
  - How to switch between exams
  - How to backup/restore data
  - FAQ section

---

#### **User Stories - Phase 5**

**As a teacher, I want to...**
1. ✅ Create multiple exams for different subjects and classes
2. ✅ Quickly switch between my exams without losing data
3. ✅ Duplicate an exam to reuse the same student list
4. ✅ See all my exams in one organized list with key stats
5. ✅ Have my data automatically saved so I never lose work
6. ✅ Export a backup of all my exams for safekeeping
7. ✅ Delete old exams I no longer need
8. ✅ Search through my exams when I have many
9. ✅ Copy students from one exam to another to save time
10. ✅ Know when my data is saved vs. saving

---

#### **Technical Implementation Notes**

**Storage Structure (LocalStorage):**
```json
{
  "version": "1.0.0",
  "activeExamId": "exam-abc123",
  "exams": [
    {
      "id": "exam-abc123",
      "name": "Mathematik Test 1",
      "subject": "Mathematik",
      "date": "2026-01-05",
      "config": { /* GradingConfig */ },
      "students": [ /* Student[] */ ],
      "createdAt": "2026-01-05T10:00:00.000Z",
      "updatedAt": "2026-01-05T14:30:00.000Z"
    }
  ],
  "settings": {
    "language": "de",
    "darkMode": false
  }
}
```

**File Structure:**
```
src/
├── contexts/
│   └── ExamContext.tsx          # Context & Provider
├── services/
│   ├── storage/
│   │   ├── StorageAdapter.ts    # Interface
│   │   └── LocalStorageAdapter.ts
│   └── examService.ts           # Business logic
├── components/
│   ├── ExamSelector.tsx         # Dropdown component
│   ├── CreateExamModal.tsx      # Creation dialog
│   ├── ExamOptionsMenu.tsx      # 3-dot menu
│   └── ExamListItem.tsx         # List item component
├── hooks/
│   └── useExams.ts              # Custom hook
└── types/
    └── exam.ts                  # Exam interfaces
```

**Dependencies to Add:**
- `nanoid` or `uuid` for ID generation
- `jszip` for multi-exam ZIP export
- `date-fns` for date formatting (already have?)
- `react-hot-toast` or similar for notifications

---

#### **Success Criteria - Phase 5**

- [ ] User can create unlimited exams
- [ ] User can switch between exams in <1 second
- [ ] No data loss on browser refresh
- [ ] Auto-save works reliably within 500ms
- [ ] Export/import preserves all data accurately
- [ ] UI is responsive and intuitive
- [ ] LocalStorage usage is optimized (<5MB typical)
- [ ] Works offline 100% of the time

### Phase 6: Class Management & Advanced Features
**Priority: Medium | Target: Q2 2026**

- [ ] **Class Management** *(Deferred from Phase 5)*
  - Manage multiple classes
  - Class roster templates
  - Reuse student lists across exams
  - Class-level statistics
  - Link exams to specific classes

- [ ] **Enhanced Analytics**
  - Grade trend analysis over time
  - Student performance comparison
  - Percentile rankings
  - Z-score calculations
  - Item analysis (if question-level data available)
  - Grade improvement tracking

- [ ] **Weighted Grading System**
  - Multiple assessment categories (exams, homework, participation)
  - Custom weight distribution
  - Category-based grade calculation
  - Final grade computation
  - Grade component breakdown view

- [ ] **Custom Grading Scales**
  - Save custom grading configurations as templates
  - Share grading scales between exams
  - Predefined templates (cantonal standards)
  - Import/export grading scale configs

### Phase 7: Export & Reporting
**Priority: Medium | Target: Q2 2026**

- [ ] **Advanced Export Options**
  - PDF report generation
  - Detailed student reports with charts
  - Class summary reports
  - Customizable report templates
  - Export with school branding/logo

- [ ] **Batch Operations**
  - Bulk student import with validation
  - Export to Excel (.xlsx) format
  - JSON export for data backup
  - Print multiple student reports at once

### Phase 8: Collaboration & Cloud
**Priority: Medium | Target: Q3 2026**

- [ ] **User Authentication**
  - Teacher account creation
  - Secure login system
  - Password recovery
  - Profile management

- [ ] **Cloud Storage**
  - Save data to cloud database
  - Sync across devices
  - Data backup and recovery
  - Share exams with colleagues

- [ ] **Multi-user Features**
  - Share read-only links
  - Collaborate with co-teachers
  - Grade moderation workflows
  - Comment and annotation system

### Phase 9: Student Portal
**Priority: Low | Target: Q4 2026**

- [ ] **Student Access**
  - View-only student portal
  - Individual grade access with secure codes
  - Personal performance dashboard
  - Grade history view

- [ ] **Parent Portal**
  - Parent/guardian access
  - View child's grades
  - Performance notifications
  - Download report cards

### Phase 10: Integration & Extensions
**Priority: Low | Target: 2027**

- [ ] **LMS Integration**
  - Moodle plugin/integration
  - Canvas LMS compatibility
  - Google Classroom integration
  - Microsoft Teams integration

- [ ] **Mobile Application**
  - iOS native app
  - Android native app
  - Offline mode support
  - Mobile-optimized grade entry

- [ ] **API Development**
  - RESTful API for integrations
  - Webhook support
  - Third-party app connections
  - Data export automation

### Phase 11: Advanced Analytics & AI
**Priority: Low | Target: 2027+**

- [ ] **Predictive Analytics**
  - Grade prediction based on trends
  - At-risk student identification
  - Performance forecasting
  - Recommended interventions

- [ ] **AI-Powered Insights**
  - Automatic anomaly detection
  - Grading fairness analysis
  - Recommended curve adjustments
  - Natural language report generation

- [ ] **Benchmarking**
  - Compare with cantonal averages
  - National grade distributions
  - Historical comparisons
  - Anonymous peer benchmarking

---

## 🔧 Technical Debt & Improvements

### Code Quality
- [ ] Add comprehensive unit tests (Jest/Vitest)
- [ ] Add integration tests
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Implement error boundaries
- [ ] Add loading states
- [ ] Improve type safety (stricter TypeScript)

### Performance
- [ ] Optimize re-renders with React.memo
- [ ] Implement virtualization for large student lists
- [ ] Lazy load chart components
- [ ] Bundle size optimization
- [ ] Image optimization (if images added)

### Accessibility
- [ ] ARIA labels and roles
- [ ] Keyboard navigation improvements
- [ ] Screen reader testing
- [ ] Color contrast validation
- [ ] Focus management

### Developer Experience
- [ ] Add Storybook for component documentation
- [ ] Setup CI/CD pipeline
- [ ] Automated deployments
- [ ] Code coverage reporting
- [ ] Automated dependency updates

---

## 📊 Success Metrics

### User Adoption
- Number of active teachers using the platform
- Number of students/grades processed
- User retention rate
- Session duration

### Performance
- Page load time < 2 seconds
- Time to interactive < 3 seconds
- Chart render time < 500ms
- 99.9% uptime (for cloud version)

### Quality
- Test coverage > 80%
- Zero critical bugs
- User satisfaction score > 4.5/5
- Mobile responsiveness score > 90%

---

## 🎯 Vision Statement

To become the leading grade calculation and analytics tool for Swiss educators, providing powerful, flexible, and intuitive grading solutions that save time, ensure fairness, and provide actionable insights into student performance.

---

## 📝 Notes

- All milestones are subject to change based on user feedback
- Priority levels may be adjusted based on user demand
- Timeline estimates are approximate and may shift
- Community contributions and feature requests are welcome
- Swiss educational standards compliance is maintained throughout

---

**Last Updated:** January 5, 2026
**Version:** 1.0
**Maintainer:** Notenrechner Development Team
