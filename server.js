// server.js
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { dbHelpers } from "./database.js";

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

// Redirect root to books
app.get("/", (req, res) => res.redirect("/books"));

// Temporary route to verify EJS works
app.get("/hello", (req, res) => {
  res.render("hello", { name: "Book Tracker" });
});

// Books list route with filtering
app.get("/books", (req, res) => {
  const filter = {
    status: req.query.status || "",
    q: req.query.q || ""
  };
  const books = dbHelpers.getAllBooks(filter);
  res.render("books/index", { books, filter });
});

// Show form to add a new book
app.get("/books/new", (req, res) => {
  res.render("books/new", { book: null, errors: null });
});

// Create a new book
app.post("/books", (req, res) => {
  const { title, author, status, rating } = req.body;
  const errors = {};

  // Validation
  if (!title || title.trim() === "") {
    errors.title = "Title is required";
  }
  if (!author || author.trim() === "") {
    errors.author = "Author is required";
  }
  if (rating && (isNaN(rating) || rating < 1 || rating > 5)) {
    errors.rating = "Rating must be between 1 and 5";
  }

  if (Object.keys(errors).length > 0) {
    return res.render("books/new", {
      book: { title, author, status, rating },
      errors
    });
  }

  try {
    const book = dbHelpers.createBook({
      title: title.trim(),
      author: author.trim(),
      status: status || "to-read",
      rating: rating ? parseInt(rating) : null
    });
    res.redirect(`/books/${book.id}`);
  } catch (error) {
    console.error("Error creating book:", error);
    res.render("books/new", {
      book: { title, author, status, rating },
      errors: { general: "Failed to create book. Please try again." }
    });
  }
});

// Individual book page
app.get("/books/:id", (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = dbHelpers.getBookById(bookId);
  
  if (!book) {
    return res.status(404).render("404", { message: "Book not found" });
  }
  
  res.render("books/show", { book });
});

// Show form to edit a book
app.get("/books/:id/edit", (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = dbHelpers.getBookById(bookId);
  
  if (!book) {
    return res.status(404).render("404", { message: "Book not found" });
  }
  
  res.render("books/edit", { book, errors: null });
});

// Update a book
app.post("/books/:id", (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = dbHelpers.getBookById(bookId);
  
  if (!book) {
    return res.status(404).render("404", { message: "Book not found" });
  }

  const { title, author, status, rating } = req.body;
  const errors = {};

  // Validation
  if (!title || title.trim() === "") {
    errors.title = "Title is required";
  }
  if (!author || author.trim() === "") {
    errors.author = "Author is required";
  }
  if (rating && (isNaN(rating) || rating < 1 || rating > 5)) {
    errors.rating = "Rating must be between 1 and 5";
  }

  if (Object.keys(errors).length > 0) {
    return res.render("books/edit", {
      book: { id: bookId, title, author, status, rating },
      errors
    });
  }

  try {
    const updatedBook = dbHelpers.updateBook(bookId, {
      title: title.trim(),
      author: author.trim(),
      status: status || "to-read",
      rating: rating ? parseInt(rating) : null
    });
    res.redirect(`/books/${updatedBook.id}`);
  } catch (error) {
    console.error("Error updating book:", error);
    res.render("books/edit", {
      book: { id: bookId, title, author, status, rating },
      errors: { general: "Failed to update book. Please try again." }
    });
  }
});

// Delete a book
app.post("/books/:id/delete", (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = dbHelpers.getBookById(bookId);
  
  if (!book) {
    return res.status(404).render("404", { message: "Book not found" });
  }

  try {
    dbHelpers.deleteBook(bookId);
    res.redirect("/books");
  } catch (error) {
    console.error("Error deleting book:", error);
    res.redirect(`/books/${bookId}?error=delete_failed`);
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).render("404", { message: "Page not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Book Tracker running at http://localhost:${PORT}`);
});
