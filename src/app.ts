import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import route from "./routes/index";
import { dbConfig } from "./config/dbConfig";
import { updateData, updateValidators } from "./controllers";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MongoDB connection
mongoose
  .connect(dbConfig.mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Set up routes
app.use("/api", route);
// Start the server
app.listen(PORT, () => {
  updateData();
  updateValidators();
  console.log(`Server is running on port ${PORT}`);
});
