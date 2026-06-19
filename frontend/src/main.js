// localStorage のキー接頭辞（将来の衝突を避けるため）
const LS_PREFIX = "pop.";
// API ベース URL
const API_BASE_URL = "/api";

// localStorage から駅情報を読み込む。旧フォーマット（キーに接頭辞がない場合）をマイグレートする。
function loadStation(key, defaultStation) {
  let saved = localStorage.getItem(key);

  // 互換性: 新しい名前空間キーに保存がなければ、旧キー（接頭辞なし）を探して移行する
  if (!saved && key.startsWith(LS_PREFIX)) {
    const oldKey = key.slice(LS_PREFIX.length);
    const old = localStorage.getItem(oldKey);
    if (old) {
      try {
        const parsed = JSON.parse(old);
        localStorage.setItem(key, old);
        return parsed;
      } catch {
        const obj = { id: old, name: old };
        localStorage.setItem(key, JSON.stringify(obj));
        return obj;
      }
    }
  }

  if (!saved) return defaultStation;

  try {
    return JSON.parse(saved);
  } catch {
    return { id: saved, name: saved };
  }
}

// localStorage に駅情報を保存する
function saveStation(key, station) {
  if (station == null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(station));
  }
}

// アプリ状態（localStorage から初期値を読み込む）
const userSettings = {
  homeStation: loadStation(LS_PREFIX + "homeStation", null),
  campusStation: loadStation(LS_PREFIX + "campusStation", {
    id: "00000494",
    name: "茨木〔ＪＲ〕",
  }),
};

// 大学側の駅候補（固定）
const campusStationOptions = [
  { id: "00000494", name: "茨木〔ＪＲ〕" },
  { id: "00000495", name: "茨木市〔阪急線〕" },
  { id: "00007041", name: "南茨木〔阪急線〕" },
  { id: "00007042", name: "南茨木（大阪モノレール）" },
];

// 駅検索 API を呼ぶ。ローカルに保存されたユーザーの最寄駅が検索語にマッチする場合はそれを先に返す。
async function searchHomeStations(keyword) {
  if (!keyword || !keyword.trim()) return [];

  // まず localStorage の homeStation を確認して、キーワードにマッチすればそれを返す
  const cached = loadStation(LS_PREFIX + "homeStation", null);
  if (
    cached &&
    cached.name &&
    cached.name.toLowerCase().includes(keyword.trim().toLowerCase())
  ) {
    return [cached];
  }

  const url = `${API_BASE_URL}/fetch-station-data?keyword=${encodeURIComponent(keyword)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("駅検索に失敗しました");
  return await res.json();
}

// 運行情報 API を呼ぶ（from/to は駅オブジェクト）
async function fetchTrainInfo(fromStation, toStation) {
  const startVal =
    fromStation && fromStation.id
      ? fromStation.id
      : (fromStation && fromStation.name) || "";
  const goalVal =
    toStation && toStation.id
      ? toStation.id
      : (toStation && toStation.name) || "";
  const url = `${API_BASE_URL}/fetch-transit-info?start=${encodeURIComponent(startVal)}&goal=${encodeURIComponent(goalVal)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("運行情報の取得に失敗しました");
  return await res.json();
}

// UI (DOM 作成・レンダリング・イベント登録)

const app = document.getElementById("app");
if (!app) throw new Error("#app 要素が見つかりません");

// DOM 要素作成
const menuBar = document.createElement("header");
const appName = document.createElement("div");
const nav = document.createElement("nav");
const homeMenuBtn = document.createElement("button");
const settingMenuBtn = document.createElement("button");

const card = document.createElement("div");
const title = document.createElement("h1");
const group = document.createElement("div");

const homeBtn = document.createElement("button");
const uniBtn = document.createElement("button");

const rightFloatingMenu = createFloatingMenu("right");
const leftFloatingMenu = createFloatingMenu("left");

// 基本プロパティ
menuBar.className = "menu-bar";
appName.className = "app-name";
appName.textContent = "OIC Transit";
nav.className = "nav-menu";
homeMenuBtn.className = "menu-btn";
homeMenuBtn.textContent = "ホーム";
settingMenuBtn.className = "menu-btn";
settingMenuBtn.textContent = "設定";
card.className = "card";
group.className = "button-group";
homeBtn.textContent = "家に帰る";
uniBtn.textContent = "大学に行く";



let searchTimer = null;

function createFloatingMenu(side) {
  const menu = document.createElement("div");
  menu.className = `floating-menu ${side}-floating-menu`;

  const mainBtn = document.createElement("button");
  mainBtn.className = "floating-main-btn";
  mainBtn.textContent = "+";

  const homeFloatingBtn = document.createElement("button");
  homeFloatingBtn.className = "floating-item floating-home";
  homeFloatingBtn.textContent = "⌂";
  homeFloatingBtn.title = "ホーム";

  const settingFloatingBtn = document.createElement("button");
  settingFloatingBtn.className = "floating-item floating-setting";
  settingFloatingBtn.textContent = "⚙";
  settingFloatingBtn.title = "設定";

  const linksFloatingBtn = document.createElement("button");
  linksFloatingBtn.className = "floating-item floating-links";
  linksFloatingBtn.textContent = "↗";
  linksFloatingBtn.title = "大学リンク";

  mainBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    menu.classList.toggle("open");
  });

  homeFloatingBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    showHome();
    menu.classList.remove("open");
  });

  settingFloatingBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    showSettings();
    menu.classList.remove("open");
  });

  linksFloatingBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    showUniversityLinks();
    menu.classList.remove("open");
  });

  menu.appendChild(homeFloatingBtn);
  menu.appendChild(settingFloatingBtn);
  menu.appendChild(linksFloatingBtn);
  menu.appendChild(mainBtn);

  app.appendChild(menu);

  return menu;
}

// ホーム画面表示
function showHome() {
  setActiveMenu("home");
  title.textContent = "今からどうする？";
  group.className = "button-group home-buttons";
  group.innerHTML = "";
  group.appendChild(homeBtn);
  group.appendChild(uniBtn);
}

// 運行情報画面を表示
async function showTrainInfo(type) {
  setActiveMenu(null);
  if (!userSettings.homeStation) {
    alert("最寄駅を設定してください");
    showSettings();
    return;
  }

  const fromStation =
    type === "toHome" ? userSettings.campusStation : userSettings.homeStation;
  const toStation =
    type === "toHome" ? userSettings.homeStation : userSettings.campusStation;

  title.textContent = `${fromStation.name} → ${toStation.name}`;
  group.className = "train-list";
  group.innerHTML = "読み込み中...";

  try {
    const result = await fetchTrainInfo(fromStation, toStation);
    const trains = result.trains || result.routes || [];

    group.innerHTML = "";

    trains.forEach((train) => {
      const item = document.createElement("div");
      item.className = "train-item";
      const lineDiv = document.createElement("div");
      lineDiv.className = "train-line";
      lineDiv.textContent = train.line || "";
      const timeDiv = document.createElement("div");
      timeDiv.className = "train-time";
      timeDiv.textContent = `${fromStation.name} ${train.depart}発 → ${toStation.name} ${train.arrive}着`;
      item.appendChild(lineDiv);
      item.appendChild(timeDiv);
      group.appendChild(item);
    });
  } catch (err) {
    console.error(err);
    group.innerHTML = "運行情報を取得できませんでした";
  }

  const backBtn = document.createElement("button");
  backBtn.textContent = "戻る";
  backBtn.addEventListener("click", showHome);
  group.appendChild(backBtn);
}

// 設定画面を表示
function showSettings() {
  setActiveMenu("settings");

  title.textContent = "駅を設定する";
  group.className = "settings-form";
  group.innerHTML = "";

  let selectedHomeStation = userSettings.homeStation;
  let selectedCampusStation = userSettings.campusStation;

  const homeLabel = document.createElement("label");
  homeLabel.textContent = "家の最寄駅";

  const homeInput = document.createElement("input");
  homeInput.type = "text";
  homeInput.placeholder = "駅名を入力";
  homeInput.value = selectedHomeStation ? selectedHomeStation.name : "";

  const homeSelect = document.createElement("select");
  homeSelect.innerHTML = `<option value=\"\">未検索</option>`;

  // 入力をデバウンスして検索
  homeInput.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const keyword = homeInput.value.trim();
      if (!keyword) {
        homeSelect.innerHTML = `<option value=\"\">未検索</option>`;
        return;
      }

      homeSelect.innerHTML = `<option value=\"\">検索中...</option>`;
      try {
        const stations = await searchHomeStations(keyword);
        homeSelect.innerHTML = `<option value=\"\">${stations.length}件見つかりました</option>`;
        stations.forEach((station, index) => {
          const option = document.createElement("option");
          option.value = String(index);
          option.textContent = station.name;
          homeSelect.appendChild(option);
        });

        // 選択時は項目を反映するが、保存は「保存する」ボタンを押すまで行わない
        homeSelect.onchange = () => {
          if (homeSelect.value === "") {
            selectedHomeStation = null;
            return;
          }
          selectedHomeStation = stations[Number(homeSelect.value)];

          // 入力フィールドに選択内容を反映
          homeInput.value = selectedHomeStation.name;
        };
      } catch (err) {
        console.error(err);
        homeSelect.innerHTML = `<option value=\"\">検索に失敗しました</option>`;
      }
    }, 500);
  };

  const campusLabel = document.createElement("label");
  campusLabel.textContent = "大学で利用する駅";

  const campusSelect = document.createElement("select");
  campusStationOptions.forEach((station, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = station.name;
    if (station.id === selectedCampusStation.id) option.selected = true;
    campusSelect.appendChild(option);
  });

  campusSelect.onchange = () => {
    selectedCampusStation = campusStationOptions[Number(campusSelect.value)];
  };

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "保存する";
  saveBtn.className = "primary";

  // 保存ボタンで両方の設定を確定して保存する
  saveBtn.onclick = () => {
    if (!selectedHomeStation) {
      alert("家の最寄駅を選択してください");
      return;
    }
    userSettings.homeStation = selectedHomeStation;
    userSettings.campusStation = selectedCampusStation;
    saveStation(LS_PREFIX + "homeStation", userSettings.homeStation);
    saveStation(LS_PREFIX + "campusStation", userSettings.campusStation);
    showHome();
  };

  group.appendChild(homeLabel);
  group.appendChild(homeInput);
  group.appendChild(homeSelect);
  group.appendChild(campusLabel);
  group.appendChild(campusSelect);
  group.appendChild(saveBtn);
}

// 大学リンク表示
function showUniversityLinks() {
  setActiveMenu(null);
  title.textContent = "大学リンク";
  group.className = "link-list";
  group.innerHTML = "";

  const links = [
    { label: "moodle+R", url: "https://lms.ritsumei.ac.jp/" },
    {
      label: "STUDENT POTAL",
      url: "https://sp.ritsumei.ac.jp/studentportal/s/",
    },
    { label: "CAMPUS WEB", url: "https://campusweb.ritsumei.ac.jp/" },
    { label: "立命館大学", url: "https://www.ritsumei.ac.jp/" },
    { label: "OICライブラリー", url: "https://www.ritsumei.ac.jp/lib/" },
  ];

  links.forEach((link) => {
    const a = document.createElement("a");
    a.className = "university-link";
    a.textContent = link.label;
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    group.appendChild(a);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "戻る";
  backBtn.addEventListener("click", showHome);
  group.appendChild(backBtn);
}

// メニューのアクティブ状態更新
function setActiveMenu(activePage) {
  homeMenuBtn.classList.remove("active");
  settingMenuBtn.classList.remove("active");
  if (activePage === "home") homeMenuBtn.classList.add("active");
  if (activePage === "settings") settingMenuBtn.classList.add("active");
}

// イベント登録
appName.addEventListener("click", showHome);
homeMenuBtn.addEventListener("click", showHome);
settingMenuBtn.addEventListener("click", showSettings);
homeBtn.addEventListener("click", () => showTrainInfo("toHome"));
uniBtn.addEventListener("click", () => showTrainInfo("toCampus"));

// クリック外でフローティングメニューを閉じる
document.addEventListener("click", (ev) => {
  if (!floatingMenu.contains(ev.target)) floatingMenu.classList.remove("open");
});

// DOM 組み立て
nav.appendChild(homeMenuBtn);
nav.appendChild(settingMenuBtn);
menuBar.appendChild(appName);
menuBar.appendChild(nav);
app.appendChild(menuBar);
card.appendChild(title);
card.appendChild(group);
app.appendChild(card);

document.addEventListener("click", (ev) => {
  if (!rightFloatingMenu.contains(ev.target)) {
    rightFloatingMenu.classList.remove("open");
  }

  if (!leftFloatingMenu.contains(ev.target)) {
    leftFloatingMenu.classList.remove("open");
  }
});
// 初期表示
showHome();
