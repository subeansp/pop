import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());

app.get("/", (_, res) => {
  res.send("Hello from server.js!!!");
});

app.listen(port);
