
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


app.get("/api/v1/products", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: [
      {
        id: 1,
        name: "Nike Air Max",
        price: 12000,
        category: "Shoes"
      },
      {
        id: 2,
        name: "Adidas Ultraboost",
        price: 15000,
        category: "Running Shoes"
      },
      {
        id: 3,
        name: "Puma RS-X",
        price: 9000,
        category: "Casual Shoes"
      }
    ]
  });
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
