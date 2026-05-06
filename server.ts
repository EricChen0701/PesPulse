import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Memory store for locks (Simulating Redis TTL)
  // In a real app, this would be Redis
  const locks: Record<string, { clinicId: string; expiresAt: number; phone: string }> = {};

  // Mock Clinics
  const clinics = [
    { id: "1", name: "寵之星 24H 急診 (Star Pet 24H)", address: "台北市信義區忠孝東路五段2號", slots: 2, distance: "0.8km", lat: 25.0416, lng: 121.5672 },
    { id: "2", name: "愛生動物醫院 (Aisheng Animal Hospital)", address: "台北市大安區和平東路二段339號", slots: 1, distance: "1.2km", lat: 25.0258, lng: 121.5435 },
    { id: "3", name: "康和寵物急診中心 (Kanghe Emergency)", address: "台北市松山區南京東路四段10號", slots: 3, distance: "2.5km", lat: 25.0519, lng: 121.5582 },
  ];

  // API Routes
  app.get("/api/clinics", (req, res) => {
    // Cleanup expired locks first
    const now = Date.now();
    for (const id in locks) {
      if (locks[id].expiresAt < now) {
        delete locks[id];
      }
    }

    const activeLocksCount = (clinicId: string) => 
      Object.values(locks).filter(l => l.clinicId === clinicId).length;

    const availableClinics = clinics.map(c => ({
      ...c,
      availableSlots: Math.max(0, c.slots - activeLocksCount(c.id))
    }));

    res.json(availableClinics);
  });

  app.post("/api/lock", (req, res) => {
    const { clinicId, phone } = req.body;
    if (!clinicId || !phone) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // Check if clinic has slots
    const activeCount = Object.values(locks).filter(l => l.clinicId === clinicId && l.expiresAt > Date.now()).length;
    const clinic = clinics.find(c => c.id === clinicId);
    
    if (clinic && activeCount >= clinic.slots) {
      return res.status(409).json({ error: "No slots available" });
    }

    const lockId = Math.random().toString(36).substring(7);
    const expiresAt = Date.now() + 180 * 1000; // 180 seconds

    locks[lockId] = { clinicId, expiresAt, phone };
    
    res.json({ lockId, expiresAt, clinicName: clinic?.name });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
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
