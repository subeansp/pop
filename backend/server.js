import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 環境変数の読み込み
dotenv.config();

const NAVITIME_API_KEY = process.env.NAVITIME_API_KEY;
const app = express();
const port = 3000;

// CORS対策
app.use(cors());

// 駅ID取得用のヘルパー関数
async function fetchStationData(keyword) {
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": NAVITIME_API_KEY,
      "x-rapidapi-host": "navitime-transport.p.rapidapi.com",
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(
    `https://navitime-transport.p.rapidapi.com/transport_node?word=${encodeURIComponent(keyword)}`,
    options,
  );

  const data = await response.json();

  // 駅名と駅IDを含む新たな配列を返す
  const stationData = [];

  for (const d of data.items) {
    stationData.push({
      name: d.name,
      id: d.id,
    });
  }

  return stationData;
}

// 乗換案内取得用のヘルパー関数
async function fetchTransitInfo(start, goal) {
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": NAVITIME_API_KEY,
      "x-rapidapi-host": "navitime-route-totalnavi.p.rapidapi.com",
      "Content-Type": "application/json",
    },
  };

  // 現在時刻の取得とフォーマット
  const date = new Date();
  const currentTime = Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(" ", "T");

  const response = await fetch(
    `https://navitime-route-totalnavi.p.rapidapi.com/route_transit?start=${encodeURIComponent(start)}&goal=${encodeURIComponent(goal)}&start_time=${encodeURIComponent(currentTime)}`,
    options,
  );

  const data = await response.json();

  return data;
}

// エンドポイント
app.get("/fetch-station-data", async (req, res) => {
  const stationData = await fetchStationData(req.query.keyword);
  res.json(stationData);
});

app.get("/fetch-transit-info", async (req, res) => {
  const start = req.query.start;
  const goal = req.query.goal;
  const transitData = await fetchTransitInfo(start, goal);
  res.json(transitData);
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
