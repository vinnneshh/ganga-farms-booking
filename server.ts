import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Ensure files exist
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
}

// Helper functions for data access
const readBookings = (): any[] => {
  try {
    if (!fs.existsSync(BOOKINGS_FILE)) {
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    const bookings = JSON.parse(data || "[]");
    
    // Migration: Ensure all bookings have an id
    let changed = false;
    const migratedBookings = bookings.map((b: any) => {
      if (!b.id) {
        b.id = b.bookingId || "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        changed = true;
      }
      return b;
    });
    
    if (changed) {
      writeBookings(migratedBookings);
    }
    
    return migratedBookings;
  } catch (e) {
    console.error("Error reading bookings file:", e);
    throw e;
  }
};

const writeBookings = (bookings: any[]) => {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    return true;
  } catch (e) {
    console.error("Error writing bookings file:", e);
    return false;
  }
};

const readSessions = (): string[] => {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (e) {
    console.error("Error reading sessions file:", e);
    return [];
  }
};

const writeSessions = (sessions: string[]) => {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    return true;
  } catch (e) {
    console.error("Error writing sessions file:", e);
    return false;
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log all requests
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Auth Middleware
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    const sessions = readSessions();
    if (token && sessions.includes(token)) {
      next();
    } else {
      console.warn(`Unauthorized access attempt: ${req.method} ${req.url}`);
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // --- API Routes ---

  // Login
  app.post("/api/login", (req, res) => {
    const username = (req.body.username || "").trim();
    const password = (req.body.password || "").trim();
    
    console.log(`Login attempt for user: ${username}`);
    
    if (username === "admin" && password === "ganga@farms") {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const sessions = readSessions();
      sessions.push(token);
      if (writeSessions(sessions)) {
        console.log(`Login successful for ${username}. Token generated and saved.`);
        res.json({ token });
      } else {
        console.error("Failed to save session token to disk.");
        res.status(500).json({ error: "Internal server error" });
      }
    } else {
      console.warn(`Login failed for ${username}: Invalid credentials`);
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      let sessions = readSessions();
      sessions = sessions.filter(s => s !== token);
      writeSessions(sessions);
      console.log("User logged out.");
    }
    res.json({ success: true });
  });

  // Get all bookings
  app.get("/api/bookings", authenticate, (req, res) => {
    try {
      res.json(readBookings());
    } catch (e) {
      res.status(500).json({ error: "Failed to read bookings" });
    }
  });

  // Create booking
  app.post("/api/bookings", authenticate, (req, res) => {
    try {
      console.log("Creating new booking...");
      const bookings = readBookings();
      
      const { id: _, createdAt, ...bookingData } = req.body;
      const newBooking = {
        ...bookingData,
        id: "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
        createdAt: new Date().toISOString()
      };
      
      bookings.push(newBooking);
      if (writeBookings(bookings)) {
        console.log("Booking successfully created:", newBooking.id);
        res.json(newBooking);
      } else {
        throw new Error("Failed to write to file");
      }
    } catch (error) {
      console.error("CRITICAL: Failed to create booking:", error);
      res.status(500).json({ error: "Failed to save booking to database" });
    }
  });

  // Update booking
  app.put("/api/bookings/:id", authenticate, (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Updating booking: ${id}`);
      let bookings = readBookings();
      
      const index = bookings.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        const { id: _, createdAt, ...updateData } = req.body;
        bookings[index] = { 
          ...bookings[index], 
          ...updateData,
          id: bookings[index].id,
          createdAt: bookings[index].createdAt
        };
        
        if (writeBookings(bookings)) {
          console.log("Booking successfully updated:", id);
          res.json(bookings[index]);
        } else {
          throw new Error("Failed to write to file");
        }
      } else {
        console.warn(`Update failed: Booking not found: ${id}`);
        res.status(404).json({ error: "Booking not found" });
      }
    } catch (error) {
      console.error("CRITICAL: Failed to update booking:", error);
      res.status(500).json({ error: "Failed to update booking in database" });
    }
  });

  // Delete booking
  app.delete("/api/bookings/:id", authenticate, (req, res) => {
    try {
      const { id } = req.params;
      let bookings = readBookings();
      const initialLength = bookings.length;
      bookings = bookings.filter((b: any) => b.id !== id);
      
      if (bookings.length < initialLength) {
        if (writeBookings(bookings)) {
          res.json({ success: true });
        } else {
          throw new Error("Failed to write to file");
        }
      } else {
        res.status(404).json({ error: "Booking not found" });
      }
    } catch (error) {
      console.error("CRITICAL: Failed to delete booking:", error);
      res.status(500).json({ error: "Failed to delete booking from database" });
    }
  });

  // --- Vite / Static Files ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
