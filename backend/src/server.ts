import express from "express";

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("What If");
});

app.listen(PORT, () => {
  console.log("Server started");
});
