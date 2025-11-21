// database.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open or create the database file
const db = new Database(path.join(__dirname, 'books.db'));

// Create the books table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'to-read' CHECK(status IN ('to-read', 'reading', 'read')),
    rating INTEGER CHECK(rating IS NULL OR (rating >= 1 AND rating <= 5)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Database helper functions
export const dbHelpers = {
  // Get all books (with optional filters)
  getAllBooks: (filters = {}) => {
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.q) {
      query += ' AND (title LIKE ? OR author LIKE ?)';
      const searchTerm = `%${filters.q}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  // Get a single book by ID
  getBookById: (id) => {
    const stmt = db.prepare('SELECT * FROM books WHERE id = ?');
    return stmt.get(id);
  },

  // Create a new book
  createBook: (book) => {
    const stmt = db.prepare(`
      INSERT INTO books (title, author, status, rating)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(book.title, book.author, book.status || 'to-read', book.rating || null);
    return dbHelpers.getBookById(result.lastInsertRowid);
  },

  // Update a book
  updateBook: (id, book) => {
    const stmt = db.prepare(`
      UPDATE books 
      SET title = ?, author = ?, status = ?, rating = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(book.title, book.author, book.status, book.rating || null, id);
    return dbHelpers.getBookById(id);
  },

  // Delete a book
  deleteBook: (id) => {
    const stmt = db.prepare('DELETE FROM books WHERE id = ?');
    return stmt.run(id);
  }
};

// Close database connection on process exit
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

export default db;

