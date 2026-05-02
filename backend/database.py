"""
database.py — SQLite Chat History
AI Loan Advisor | Part 5
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "loan_advisor.db")

def get_db_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    return conn

def init_db():
    """Creates the necessary tables if they don't exist."""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,         -- 'user' or 'bot'
            content TEXT NOT NULL,      -- The text message
            extra_html TEXT,            -- Any HTML like the EMI card
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_message(role: str, content: str, extra_html: str = ""):
    """Saves a single message to the database."""
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO messages (role, content, extra_html) VALUES (?, ?, ?)',
        (role, content, extra_html)
    )
    conn.commit()
    conn.close()

def get_chat_history() -> list[dict]:
    """Retrieves all messages in chronological order."""
    conn = get_db_connection()
    cursor = conn.execute('SELECT role, content, extra_html, timestamp FROM messages ORDER BY id ASC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def clear_chat_history():
    """Deletes all messages from the database."""
    conn = get_db_connection()
    conn.execute('DELETE FROM messages')
    conn.commit()
    conn.close()
