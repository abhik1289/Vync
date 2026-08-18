import express from "express";

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({ message: "Hello from Node.js TS inside Turborepo!" });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", (req, res) => {
  res.json({ message: "API endpoint reached!" });
});

app.listen(PORT, () => {
  console.log(`Server running Abhik on http://localhost:${PORT}`);
});
