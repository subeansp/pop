import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// 環境変数の読み込み
dotenv.config();

// 必要な環境変数と設定
const { NAVITIME_API_KEY, PORT = "3000", CORS_ORIGIN = "*" } = process.env;
const port = Number(PORT) || 3000;

if (!NAVITIME_API_KEY) {
  console.error("Missing NAVITIME_API_KEY environment variable.");
  process.exit(1);
}

const app = express();

// CORS設定（必要なら環境変数でオリジンを制御できます）
app.use(cors(CORS_ORIGIN === "*" ? undefined : { origin: CORS_ORIGIN }));
app.use(express.json());

// 共通ヘッダー作成ヘルパー
const buildHeaders = (host) => ({
  "x-rapidapi-key": NAVITIME_API_KEY,
  "x-rapidapi-host": host,
  "Content-Type": "application/json",
});

// fetchのレスポンスを安全にJSONに変換
async function parseJsonResponse(response) {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(
      `Upstream API error: ${response.status} ${response.statusText} ${text ? `- ${text}` : ""}`,
    );
    err.status = response.status;
    throw err;
  }
  return response.json();
}

// JST(Asia/Tokyo) のローカル時刻を "YYYY-MM-DDTHH:mm:ss" 形式で返す
function getTokyoLocalIso(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
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
    .replace(/\s+/, "T");
}

// 駅ID取得用のヘルパー関数
async function fetchStationData(keyword) {
  if (!keyword) {
    const err = new Error("keyword is required");
    err.status = 400;
    throw err;
  }

  const url = `https://navitime-transport.p.rapidapi.com/transport_node?word=${encodeURIComponent(
    keyword,
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders("navitime-transport.p.rapidapi.com"),
  });

  const data = await parseJsonResponse(response);

  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map(({ name, id }) => ({ name, id }));
}

// 乗換案内取得用のヘルパー関数
async function fetchTransitInfo(start, goal) {
  if (!start || !goal) {
    const err = new Error("start and goal are required");
    err.status = 400;
    throw err;
  }

  // NAVITIME API に渡す出発時刻（サーバ時刻を JST でフォーマット）
  const start_time = getTokyoLocalIso();
  const params = new URLSearchParams({ start, goal, start_time });
  const url = `https://navitime-route-totalnavi.p.rapidapi.com/route_transit?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders("navitime-route-totalnavi.p.rapidapi.com"),
  });

  const data = await parseJsonResponse(response);
  const items = Array.isArray(data?.items) ? data.items : [];

  // レスポンスをフロントが扱いやすい形に整形して返す
  const trains = items.map((item) => {
    const summary = item.summary || {};
    const move = summary.move || {};
    const sections = Array.isArray(item.sections) ? item.sections : [];

    // 出発/到着時刻（優先順位: summary.move -> sections の最初/最後の move -> 空文字）
    let departIso = move.from_time || "";
    let arriveIso = move.to_time || "";

    if (!departIso || !arriveIso) {
      const firstMove = sections.find(
        (s) => s.type === "move" && (s.from_time || s.to_time),
      );
      const lastMove = [...sections]
        .reverse()
        .find((s) => s.type === "move" && (s.to_time || s.from_time));
      if (!departIso && firstMove)
        departIso = firstMove.from_time || firstMove.to_time || "";
      if (!arriveIso && lastMove)
        arriveIso = lastMove.to_time || lastMove.from_time || "";
    }

    const formatHm = (iso) => {
      if (!iso) return "";
      try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat("ja-JP", {
          timeZone: "Asia/Tokyo",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(d);
      } catch {
        return iso;
      }
    };

    const depart = formatHm(departIso);
    const arrive = formatHm(arriveIso);

    // 路線表示: 各区間の transport.name または line_name をつなげる（重複排除）
    const moveSections = sections.filter((s) => s.type === "move");
    const segmentNames = moveSections
      .map((s) => (s.transport && s.transport.name) || s.line_name || s.move)
      .filter(Boolean);
    const uniqueNames = [...new Set(segmentNames)];
    const line =
      uniqueNames.length > 0 ? uniqueNames.join(" → ") : move?.move || "";

    return {
      line,
      depart,
      arrive,
      duration: move.time ?? null,
      transfers: move.transit_count ?? null,
    };
  });

  return { trains };
}

// async route wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// エンドポイント
app.get(
  "/fetch-station-data",
  asyncHandler(async (req, res) => {
    const { keyword } = req.query;
    const stationData = await fetchStationData(keyword);
    res.json(stationData);
  }),
);

app.get(
  "/fetch-transit-info",
  asyncHandler(async (req, res) => {
    const { start, goal } = req.query;
    const transitData = await fetchTransitInfo(start, goal);
    res.json(transitData);
  }),
);

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

// サーバ起動
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
