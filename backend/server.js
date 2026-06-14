// 駅名から駅IDを取得するヘルパー
const stationNames = {
  home: "宇治",
  univ: "茨木",
};

const apiUrl = "https://navitime-transport.p.rapidapi.com/transport_node";
const apiKey = process.env.RAPIDAPI_KEY || "55cc7e59a7msh9027c9e71464916p19052cjsn5ec33c65833a";

const requestOptions = {
  method: "GET",
  headers: {
    "x-rapidapi-key": apiKey,
    "x-rapidapi-host": "navitime-transport.p.rapidapi.com",
    "Content-Type": "application/json",
  },
};

async function fetchStationId(stationName) {
  const response = await fetch(`${apiUrl}?word=${encodeURIComponent(stationName)}`, requestOptions);
  const data = await response.json();
  return data.items?.[0]?.id ?? null;
}

const homeStationId = await fetchStationId(stationNames.home);
const univStationId = await fetchStationId(stationNames.univ);

console.log({ homeStationId, univStationId });

export { homeStationId, univStationId, stationNames };

