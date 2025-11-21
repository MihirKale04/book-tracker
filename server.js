// server.js
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Logging
app.use(morgan("dev"));

// Parse form bodies (for later steps)
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, images)
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as the templating engine and views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Helper function to escape HTML (prevent XSS attacks)
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Make escapeHtml available to all EJS templates
app.locals.escapeHtml = escapeHtml;

// Redirect root to books (we'll implement books soon)
app.get("/", (req, res) => res.redirect("/books"));

// Temporary route to verify EJS works
app.get("/hello", (req, res) => {
  res.render("hello", { name: "Book Tracker" });
});

// Placeholder books list route (will render a template)
app.get("/books", (req, res) => {
  // Dummy data until we add the database
  const books = [
    { id: 1, title: "Demo Book", author: "Jane Doe", status: "to-read", rating: null },
    { id: 2, title: "Another Demo", author: "John Smith", status: "reading", rating: 4 },
  ];
  res.render("books/index", { books, filter: { status: "", q: "" } });
});

// Individual book page route (placeholder for now)
app.get("/books/:id", (req, res) => {
  const bookId = parseInt(req.params.id);
  // Dummy data until we add the database
  const books = [
    { id: 1, title: "Demo Book", author: "Jane Doe", status: "to-read", rating: null },
    { id: 2, title: "Another Demo", author: "John Smith", status: "reading", rating: 4 },
  ];
  const book = books.find(b => b.id === bookId);
  
  if (!book) {
    return res.status(404).render("404", { message: "Book not found" });
  }
  
  res.render("books/show", { book });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).render("404", { message: "Page not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Book Tracker running at http://localhost:${PORT}`);
});
