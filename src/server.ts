
import express from "express";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/health-check", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Application is healthy",
    status: "UP",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
