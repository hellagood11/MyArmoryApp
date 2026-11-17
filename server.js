require("dotenv").config();

const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

const {
  MONGODB_URI,
  MONGODB_DB,
  MONGODB_COLLECTION
} = process.env;

if (!MONGODB_URI || !MONGODB_DB || !MONGODB_COLLECTION) {
  throw new Error(
    "Missing MongoDB environment variables. Set MONGODB_URI, MONGODB_DB, and MONGODB_COLLECTION in .env"
  );
}

async function startServer() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const database = client.db(MONGODB_DB);
  await database.command({ ping: 1 });

  const collection = database.collection(MONGODB_COLLECTION);

  function isValidInventoryItem(item) {
    return (
      item &&
      typeof item.name === "string" &&
      item.name.trim().length > 0 &&
      typeof item.caliber === "string" &&
      item.caliber.trim().length > 0 &&
      ["firearm", "ammunition"].includes(item.itemType) &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 0
    );
  }

  app.get("/api/health", async (req, res) => {
    try {
      await database.command({ ping: 1 });
      res.json({
        server: "running",
        database: "connected",
        collection: MONGODB_COLLECTION
      });
    } catch (error) {
      res.status(500).json({
        server: "running",
        database: "error",
        message: error.message
      });
    }
  });

  // Get all inventory items
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await collection.find({}).sort({ addedDate: -1 }).toArray();
      res.json(items);
    } catch (error) {
      console.error("Could not load inventory:", error);
      res.status(500).json({ error: "Could not load inventory." });
    }
  });

  // Add a new inventory item
  app.post("/api/inventory", async (req, res) => {
    const item = req.body;

    if (!isValidInventoryItem(item)) {
      return res.status(400).json({
        error: "Inventory item fields are invalid."
      });
    }

    const now = new Date();

    const newItem = {
      name: item.name.trim(),
      itemType: item.itemType,
      caliber: item.caliber.trim(),
      quantity: Number(item.quantity),
      addedDate: now,
      lastUpdated: now
    };

    try {
      const result = await collection.insertOne(newItem);
      res.status(201).json({
        ...newItem,
        _id: result.insertedId
      });
    } catch (error) {
      console.error("Could not add inventory item:", error);
      res.status(500).json({ error: "Could not add inventory item." });
    }
  });

  // Update an inventory item
  app.put("/api/inventory/:id", async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid item ID." });
    }

    const item = req.body;

    if (!isValidInventoryItem(item)) {
      return res.status(400).json({
        error: "Inventory item fields are invalid."
      });
    }

    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: item.name.trim(),
            itemType: item.itemType,
            caliber: item.caliber.trim(),
            quantity: Number(item.quantity),
            lastUpdated: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Inventory item not found." });
      }

      const updatedItem = await collection.findOne({ _id: new ObjectId(id) });
      res.json(updatedItem);
    } catch (error) {
      console.error("Could not update inventory item:", error);
      res.status(500).json({ error: "Could not update inventory item." });
    }
  });

  // Delete an inventory item
  app.delete("/api/inventory/:id", async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid item ID." });
    }

    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Inventory item not found." });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Could not delete inventory item:", error);
      res.status(500).json({ error: "Could not delete inventory item." });
    }
  });

  // Serve static front-end files
  app.use(express.static(path.join(__dirname, "public")));

  app.listen(port, () => {
    console.log(`MyArmoryApp server running at http://localhost:${port}`);
    console.log(`MongoDB database: ${MONGODB_DB}`);
    console.log(`MongoDB collection: ${MONGODB_COLLECTION}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
});