# Book Tracker - Complete Project Breakdown

## 📚 Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Why This Stack?](#why-this-stack)
3. [Project Architecture](#project-architecture)
4. [File-by-File Breakdown](#file-by-file-breakdown)
5. [Data Flow](#data-flow)
6. [Key Concepts & Patterns](#key-concepts--patterns)

---

## Tech Stack Overview

### Core Technologies

1. **Node.js** (Runtime Environment)

   - JavaScript runtime built on Chrome's V8 engine
   - Enables server-side JavaScript execution
   - Version: 18+ required

2. **Express.js** (Web Framework)

   - Version: 5.1.0
   - Minimal, unopinionated web framework for Node.js
   - Handles HTTP requests, routing, middleware

3. **EJS** (Embedded JavaScript Templates)

   - Version: 3.1.10
   - Server-side templating engine
   - Allows embedding JavaScript in HTML

4. **better-sqlite3** (Database)

   - Version: 12.4.5
   - Synchronous SQLite3 database driver
   - File-based database (no separate server needed)

5. **Morgan** (HTTP Request Logger)
   - Version: 1.10.1
   - Middleware for logging HTTP requests
   - Helps with debugging and monitoring

---

## Why This Stack?

### Node.js + Express

- **Simplicity**: Express is minimal and doesn't force you into a specific structure
- **JavaScript Everywhere**: Same language for frontend and backend (if you add client-side JS later)
- **Fast Development**: Quick to set up and iterate
- **Large Ecosystem**: Huge npm package ecosystem
- **Perfect for Learning**: Great for understanding web fundamentals without framework complexity

### EJS (Server-Side Rendering)

- **No Build Step**: Templates compile on-the-fly, no webpack/vite needed
- **Simple Syntax**: Easy to learn if you know HTML/JS
- **Server-Side Rendering**: HTML generated on server, good for SEO and initial load
- **Template Reusability**: Can include partials (like `layout.ejs`)

### SQLite (better-sqlite3)

- **Zero Configuration**: No database server to install/configure
- **File-Based**: Database is a single file (`books.db`)
- **Perfect for Small Apps**: Ideal for personal projects, prototypes, small-scale apps
- **Synchronous API**: Simpler than async database drivers (no promises/async-await needed)
- **ACID Compliant**: Still has transactions, data integrity
- **Portable**: Can copy the `.db` file anywhere

### Morgan

- **Development Tool**: Logs every HTTP request (method, URL, status, response time)
- **Debugging**: Helps see what routes are being hit
- **No Production Overhead**: Can be disabled in production

---

## Project Architecture

```
booktracker/
├── server.js          # Main application entry point, routes, middleware
├── database.js        # Database connection and CRUD operations
├── books.db           # SQLite database file (created automatically)
├── package.json       # Dependencies and project metadata
├── public/            # Static files (CSS, images, JS)
│   └── styles.css     # Global styles
└── views/             # EJS templates
    ├── layout.ejs     # Base template (header, footer, structure)
    ├── 404.ejs        # Error page
    ├── hello.ejs      # Test page
    └── books/         # Book-related views
        ├── index.ejs  # List all books
        ├── show.ejs   # View single book
        ├── new.ejs    # Create new book form
        └── edit.ejs   # Edit book form
```

### Architecture Pattern: **MVC (Model-View-Controller)**

- **Model**: `database.js` - Data layer, database operations
- **View**: `views/` - EJS templates, presentation layer
- **Controller**: `server.js` - Routes handle requests, call models, render views

---

## File-by-File Breakdown

### 1. `package.json`

```json
{
  "type": "module" // Uses ES6 modules (import/export)
}
```

- Defines project metadata and dependencies
- `"type": "module"` enables ES6 import/export syntax (instead of CommonJS `require()`)
- Scripts: `npm start` runs `node server.js`

### 2. `server.js` - The Application Core

#### Key Sections:

**A. Module Imports & Setup (Lines 1-9)**

```javascript
import express from "express";
import { fileURLToPath } from "url";
```

- ES6 module imports
- `fileURLToPath` needed because `__dirname` doesn't exist in ES modules
- Creates `__dirname` equivalent for path operations

**B. Express App Initialization (Line 11)**

```javascript
const app = express();
```

- Creates Express application instance

**C. Middleware Stack (Lines 13-24)**

```javascript
app.use(morgan("dev"));                    // Logging
app.use(express.urlencoded({ extended: true }));  // Parse form data
app.use(express.static(...));              // Serve static files
app.set("view engine", "ejs");             // Set templating engine
```

**Middleware Order Matters!** They execute in the order they're defined:

1. **Morgan**: Logs the request
2. **urlencoded**: Parses POST form data into `req.body`
3. **static**: Serves files from `public/` directory
4. **view engine**: Tells Express to use EJS for rendering

**D. Security: XSS Prevention (Lines 26-38)**

```javascript
function escapeHtml(str) {
  // Escapes HTML special characters
}
app.locals.escapeHtml = escapeHtml;
```

- Prevents Cross-Site Scripting (XSS) attacks
- Makes `escapeHtml` available in all EJS templates
- **Critical**: Always escape user input before rendering!

**E. Routes (Lines 40-195)**

Routes follow RESTful conventions:

| Method | Path                | Purpose           | Handler                         |
| ------ | ------------------- | ----------------- | ------------------------------- |
| GET    | `/`                 | Redirect to books | Redirects to `/books`           |
| GET    | `/books`            | List all books    | `getAllBooks()` with filters    |
| GET    | `/books/new`        | Show create form  | Renders form template           |
| POST   | `/books`            | Create book       | Validates, calls `createBook()` |
| GET    | `/books/:id`        | Show single book  | `getBookById()`, renders detail |
| GET    | `/books/:id/edit`   | Show edit form    | Renders edit form               |
| POST   | `/books/:id`        | Update book       | Validates, calls `updateBook()` |
| POST   | `/books/:id/delete` | Delete book       | Calls `deleteBook()`            |

**Route Parameters**: `:id` in `/books/:id` is accessible via `req.params.id`

**F. Validation Pattern (Lines 68-84)**

```javascript
const errors = {};
if (!title || title.trim() === "") {
  errors.title = "Title is required";
}
if (Object.keys(errors).length > 0) {
  return res.render("books/new", { book, errors });
}
```

- Server-side validation (never trust client-side alone!)
- Collects all errors before rendering
- Re-renders form with errors if validation fails

**G. Error Handling**

- Try-catch blocks around database operations
- 404 handler for unknown routes
- Custom 404 page rendering

### 3. `database.js` - Data Layer

**A. Database Connection (Lines 9-10)**

```javascript
const db = new Database(path.join(__dirname, "books.db"));
```

- Opens/creates SQLite database file
- If `books.db` doesn't exist, SQLite creates it

**B. Schema Creation (Lines 12-23)**

```sql
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'to-read'
    CHECK(status IN ('to-read', 'reading', 'read')),
  rating INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Schema Breakdown:**

- `id`: Auto-incrementing primary key
- `title`, `author`: Required text fields
- `status`: Enum-like constraint (only 3 valid values)
- `rating`: Optional, must be 1-5 if provided
- `created_at`, `updated_at`: Automatic timestamps

**C. Database Helpers Object (Lines 26-81)**

All database operations are wrapped in `dbHelpers`:

1. **`getAllBooks(filters)`**

   - Builds dynamic SQL query based on filters
   - Uses `LIKE` for text search (case-insensitive pattern matching)
   - Returns array of book objects

2. **`getBookById(id)`**

   - Uses prepared statement (prevents SQL injection)
   - Returns single book object or `undefined`

3. **`createBook(book)`**

   - Inserts new record
   - Returns the created book (fetched by ID)

4. **`updateBook(id, book)`**

   - Updates existing record
   - Updates `updated_at` timestamp
   - Returns updated book

5. **`deleteBook(id)`**
   - Deletes record by ID
   - Returns result object

**Prepared Statements:**

```javascript
const stmt = db.prepare("SELECT * FROM books WHERE id = ?");
stmt.get(id); // Safe from SQL injection
```

- `?` is a placeholder
- Parameters passed separately prevent SQL injection

**D. Graceful Shutdown (Lines 83-92)**

- Closes database connection on process termination
- Prevents data corruption

### 4. `views/layout.ejs` - Base Template

```ejs
<%- body %>
```

- Uses EJS include syntax
- `<%-` outputs unescaped HTML (for the body content)
- `<%=` would escape HTML (safer for user input)
- Provides consistent header/navigation across all pages

### 5. `views/books/index.ejs` - Book List

**Key Features:**

- **Filtering Form**: GET request with query parameters
- **Template Literals**: Uses backticks for multi-line HTML
- **Array Mapping**: `books.map()` generates list items
- **Conditional Rendering**: Shows "No books found" if empty
- **XSS Protection**: Uses `escapeHtml()` on all user data

**Query Parameters:**

- `?status=reading` filters by status
- `?q=harry` searches title/author
- `?status=read&q=tolkien` combines filters

### 6. `views/books/new.ejs` & `edit.ejs` - Forms

**Form Submission Flow:**

1. User fills form → submits POST request
2. Server validates → if errors, re-render form with errors
3. If valid → save to database → redirect to book detail page

**Error Display:**

- Errors object passed to template
- Conditional error messages shown
- Form values preserved on error (user doesn't lose input)

**Form Method Override:**

- HTML forms only support GET/POST
- Uses POST for both create and update
- Delete uses POST to `/books/:id/delete`

### 7. `views/books/show.ejs` - Book Detail

- Displays single book information
- Action buttons: Edit, Delete, Back
- Delete confirmation via JavaScript `confirm()`

### 8. `public/styles.css` - Styling

- CSS custom properties (variables) for theming
- Utility classes (`.row`, `.muted`, `.badge`)
- Status-based badge colors
- Minimal, functional styling

---

## Data Flow

### Creating a Book (Example)

1. **User Action**: Clicks "Add Book" → GET `/books/new`
2. **Server**: Renders `views/books/new.ejs` with empty form
3. **User Action**: Fills form, submits → POST `/books`
4. **Server Processing**:
   ```
   req.body = { title: "1984", author: "Orwell", status: "read", rating: "5" }
   ↓
   Validation (check required fields, rating range)
   ↓
   If errors → re-render form with errors
   If valid → dbHelpers.createBook({ title, author, status, rating })
   ↓
   Database: INSERT INTO books ...
   ↓
   Redirect to /books/:id (the new book's detail page)
   ```
5. **User Sees**: New book's detail page

### Reading Books (Example)

1. **User Action**: Visits `/books?status=reading&q=harry`
2. **Server Processing**:
   ```
   Extract query params: { status: "reading", q: "harry" }
   ↓
   dbHelpers.getAllBooks({ status: "reading", q: "harry" })
   ↓
   Database: SELECT * FROM books WHERE status = ? AND (title LIKE ? OR author LIKE ?)
   ↓
   Returns filtered array of books
   ↓
   Render views/books/index.ejs with books and filter data
   ```
3. **User Sees**: Filtered list of books

---

## Key Concepts & Patterns

### 1. **Server-Side Rendering (SSR)**

- HTML generated on server before sending to browser
- Opposite of Single Page Applications (SPAs)
- Pros: SEO-friendly, fast initial load, works without JavaScript
- Cons: Full page reloads on navigation

### 2. **RESTful Routing**

- URLs represent resources (`/books`, `/books/:id`)
- HTTP methods indicate actions (GET=read, POST=create, etc.)
- Clean, predictable URL structure

### 3. **Middleware Pattern**

- Functions that run between request and response
- Can modify request/response, end request early, or pass to next middleware
- Express middleware stack executes in order

### 4. **Prepared Statements**

- SQL queries with placeholders (`?`)
- Prevents SQL injection attacks
- Database can optimize query execution

### 5. **Template Inheritance**

- `layout.ejs` provides base structure
- Child templates inject content via `body` variable
- DRY principle: don't repeat header/footer code

### 6. **XSS Prevention**

- Always escape user input: `escapeHtml(userData)`
- EJS `<%=` escapes automatically, `<%-` does not
- Never use `<%-` with user input!

### 7. **Validation Strategy**

- **Client-side**: HTML5 `required`, `min`, `max` (user experience)
- **Server-side**: Always validate (security, data integrity)
- Never trust client-side validation alone

### 8. **Error Handling**

- Try-catch around database operations
- Graceful error messages to user
- Log errors for debugging (console.error)

### 9. **Redirect After POST (PRG Pattern)**

- POST → Process → Redirect to GET
- Prevents duplicate submissions on refresh
- Clean URLs after form submission

### 10. **File-Based Database**

- SQLite stores everything in `books.db` file
- No separate database server process
- Perfect for development and small deployments
- Can be backed up by copying the file

---

## Security Considerations

### ✅ Implemented:

- XSS prevention via `escapeHtml()`
- SQL injection prevention via prepared statements
- Server-side validation
- Input sanitization (trimming whitespace)

### ⚠️ Not Implemented (for future):

- Authentication/authorization
- CSRF protection (for production)
- Rate limiting
- Input sanitization beyond HTML escaping
- HTTPS enforcement

---

## Development Workflow

1. **Start Server**: `npm start` or `node server.js`
2. **View Logs**: Morgan logs every request to console
3. **Database**: SQLite file created automatically
4. **Templates**: EJS compiles on-the-fly (no build step)
5. **Static Files**: Served from `public/` directory

---

## Next Steps / Potential Enhancements

1. **User Authentication**: Login, personal book lists
2. **Search Improvements**: Full-text search, fuzzy matching
3. **Pagination**: For large book collections
4. **Image Uploads**: Book cover images
5. **Export/Import**: CSV, JSON export
6. **Statistics**: Reading progress, time tracking
7. **API Endpoints**: JSON API for mobile apps
8. **Testing**: Unit tests, integration tests

---

## Summary

This is a **classic server-side web application** using:

- **Express** for routing and middleware
- **EJS** for server-side templating
- **SQLite** for simple, file-based data storage
- **RESTful routes** for clean URL structure
- **Server-side rendering** for fast, SEO-friendly pages

It's a perfect learning project because it demonstrates:

- Full-stack development (database → server → view)
- CRUD operations (Create, Read, Update, Delete)
- Form handling and validation
- Security basics (XSS, SQL injection prevention)
- Template rendering and reusability

The stack is intentionally simple - no build tools, no complex frameworks, just the essentials for building a functional web application.
