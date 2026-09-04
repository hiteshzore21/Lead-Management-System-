const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const leadRoutes = require("./routes/leadRoutes");

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/leads", leadRoutes);


app.get("/", (req, res) => {
  res.json({
    message: "Lead Management API is running",
  });
});


const PORT = process.env.PORT || 5000;


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });