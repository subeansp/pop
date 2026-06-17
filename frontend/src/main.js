/***********
 * データ定義
 */
const app = document.getElementById("app");

function loadStation(key, defaultStation) {
  const savedStation = localStorage.getItem(key);

  if (!savedStation) {
    return defaultStation;
  }

  try {
    return JSON.parse(savedStation);
  } catch {
    return {
      id: savedStation,
      name: savedStation,
    };
  }
}

//ユーザーが設定する部分
let userSettings = {
  homeStation: loadStation("homeStation", null),
  campusStation: loadStation("campusStation", {
    id:"00000494",
    name: "茨木〔ＪＲ〕"
  }),

};

//大学の最寄り駅メニュー
const campusStationOptions = [
  { id: "00000494", name: "茨木〔ＪＲ〕" },
  { id: "00000495", name: "茨木市〔阪急線〕" },
  { id: "00007041", name: "南茨木〔阪急線〕" },
  { id: "00007042", name: "南茨木（大阪モノレール）" },
  { id: "", name: "宇野辺（大阪モノレール）" }
];

// 家の最寄り駅をキーワード検索する
async function searchHomeStations(keyword) {
  if (!keyword.trim()) {
    return [];
  }

  const response = await fetch(
    `/api/stations/search?keyword=${encodeURIComponent(keyword)}`
  );

  if (!response.ok) {
    throw new Error("駅検索に失敗しました");
  }

  return await response.json();
}

// 運行情報を取得する
async function fetchTrainInfo(fromStation, toStation) {
  const response = await fetch("/api/trains", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    //jsonへの変換、送信
    body: JSON.stringify({
      fromStation,
      toStation,
    }),
  });

  if (!response.ok) {
    throw new Error("運行情報の取得に失敗しました");
  }

  return await response.json();
}

const menuBar = document.createElement("header");
const appName = document.createElement("div");
const nav = document.createElement("nav");
const homeMenuBtn = document.createElement("button");
const settingMenuBtn = document.createElement("button");

const card = document.createElement("div");
const title = document.createElement("h1"); //タイトル
const group = document.createElement("div");

const homeBtn = document.createElement("button");
const uniBtn = document.createElement("button");

//扇形メニューバー
const floatingMenu = document.createElement("div");
const floatingMainBtn = document.createElement("button");
const floatingHomeBtn = document.createElement("button");
const floatingLinksBtn = document.createElement("button");
const floatingSettingBtn = document.createElement("button");
/*************
 * 表示オブジェクト設定
 */
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

//追加メニューバー
floatingMenu.className = "floating-menu";
floatingMainBtn.className = "floating-main-btn";
floatingMainBtn.textContent = "+";
floatingHomeBtn.className = "floating-item floating-home";
floatingHomeBtn.textContent = "⌂";
floatingHomeBtn.title = "ホーム";
floatingLinksBtn.className = "floating-item floating-links";
floatingLinksBtn.textContent = "↗";
floatingLinksBtn.title = "大学リンク";
floatingSettingBtn.className = "floating-item floating-setting";
floatingSettingBtn.textContent = "⚙";
floatingSettingBtn.title = "設定";
/*******
 * 画面表示
 */

//初期画面実装
function showHome() {
  setActiveMenu("home");

  title.textContent = "今からどうする？";
  group.className = "button-group home-buttons";
  group.innerHTML = "";

  group.appendChild(homeBtn);
  group.appendChild(uniBtn);
}

// 電車表示画面
async function showTrainInfo(type) {
  setActiveMenu(null);

  if (!userSettings.homeStation) {
    alert("最寄駅を設定してください");
    showSettings();
    return;
  }

  let fromStation;
  let toStation;

  if (type === "toHome") {
    fromStation = userSettings.campusStation;
    toStation = userSettings.homeStation;
  } else {
    fromStation = userSettings.homeStation;
    toStation = userSettings.campusStation;
  }

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

      item.innerHTML = `
        <div class="train-line">${train.line}</div>
        <div class="train-time">
          ${fromStation.name} ${train.depart}発 → ${toStation.name} ${train.arrive}着
        </div>
      `;

      group.appendChild(item);
    });
  } catch (error) {
    group.innerHTML = "運行情報を取得できませんでした";
  }

  const backBtn = document.createElement("button");
  backBtn.textContent = "戻る";
  backBtn.onclick = showHome;

  group.appendChild(backBtn);
}

// 設定ページ
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
  homeSelect.innerHTML = `<option value="">候補を選択</option>`;

  homeInput.oninput = async () => {
    const keyword = homeInput.value;

    homeSelect.innerHTML = `<option value="">検索中...</option>`;

    try {
      const stations = await searchHomeStations(keyword);

      homeSelect.innerHTML = `<option value="">候補を選択</option>`;

      stations.forEach((station, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${station.name}（${station.address_name}）`;
        homeSelect.appendChild(option);
      });

      homeSelect.onchange = () => {
        if(homeSelect.value === ""){
          selectedHomeStation = null;
          return;
        }

        selectedHomeStation = stations[Number(homeSelect.value)];
      };
    } catch (error) {
      homeSelect.innerHTML = `<option value="">検索に失敗しました</option>`;
    }
  };

  const campusLabel = document.createElement("label");
  campusLabel.textContent = "大学で利用する駅";

  const campusSelect = document.createElement("select");

  campusStationOptions.forEach((station, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = station.name;

    if (station.id === selectedCampusStation.id) {
      option.selected = true;
    }

    campusSelect.appendChild(option);
  });

  campusSelect.onchange = () => {
    selectedCampusStation = campusStationOptions[Number(campusSelect.value)];
  };

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "保存する";
  saveBtn.className = "primary";

  saveBtn.onclick = () => {
    if (!selectedHomeStation) {
      alert("家の最寄駅を選択してください");
      return;
    }

    userSettings.homeStation = selectedHomeStation;
    userSettings.campusStation = selectedCampusStation;

    localStorage.setItem("homeStation", JSON.stringify(userSettings.homeStation));
    localStorage.setItem("campusStation", JSON.stringify(userSettings.campusStation));

    showHome();
  };

  group.appendChild(homeLabel);
  group.appendChild(homeInput);
  group.appendChild(homeSelect);
  group.appendChild(campusLabel);
  group.appendChild(campusSelect);
  group.appendChild(saveBtn);
}

function showUniversityLinks() {
  setActiveMenu(null);

  title.textContent = "大学リンク";
  group.className = "link-list";
  group.innerHTML = "";

  const links = [
    {
      label: "moodle+R",
      url: "https://lms.ritsumei.ac.jp/",
    },
    {
      label: "CAMPUS WEB",
      url: "https://campusweb.ritsumei.ac.jp/",
    },
    {
      label: "立命館大学",
      url: "https://www.ritsumei.ac.jp/",
    },
    {
      label: "OICライブラリー",
      url: "https://www.ritsumei.ac.jp/lib/",
    },
  ];

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.className = "university-link";
    anchor.textContent = link.label;
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    group.appendChild(anchor);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "戻る";
  backBtn.onclick = showHome;

  group.appendChild(backBtn);
}

//current page
function setActiveMenu(activePage) {
  homeMenuBtn.classList.remove("active");
  settingMenuBtn.classList.remove("active");

  if (activePage === "home") {
    homeMenuBtn.classList.add("active");
  }

  if (activePage === "settings") {
    settingMenuBtn.classList.add("active");
  }
}

/************
 * イベント登録
 */

appName.onclick = () => {
  showHome();
};

homeMenuBtn.onclick = () => {
  showHome();
};

settingMenuBtn.onclick = () => {
  showSettings();
};

homeBtn.onclick = () => {
  showTrainInfo("toHome");
};

uniBtn.onclick = () => {
  showTrainInfo("toCampus");
};

floatingMainBtn.onclick = () => {
  floatingMenu.classList.toggle("open");
};

floatingHomeBtn.onclick = () => {
  showHome();
  floatingMenu.classList.remove("open");
};

floatingSettingBtn.onclick = () => {
  showSettings();
  floatingMenu.classList.remove("open");
};

floatingLinksBtn.onclick = () => {
  showUniversityLinks();
  floatingMenu.classList.remove("open");
};

//画面右下プラスマークを閉じるための
floatingMainBtn.onclick = (event) => {
  event.stopPropagation();
  floatingMenu.classList.toggle("open");
};

floatingHomeBtn.onclick = (event) => {
  event.stopPropagation();
  showHome();
  floatingMenu.classList.remove("open");
};

floatingSettingBtn.onclick = (event) => {
  event.stopPropagation();
  showSettings();
  floatingMenu.classList.remove("open");
};

floatingLinksBtn.onclick = (event) => {
  event.stopPropagation();
  showUniversityLinks();
  floatingMenu.classList.remove("open");
};

document.addEventListener("click", (event) => {
  const clickedInsideFloatingMenu = floatingMenu.contains(event.target);

  if (!clickedInsideFloatingMenu) {
    floatingMenu.classList.remove("open");
  }
});



nav.appendChild(homeMenuBtn);
nav.appendChild(settingMenuBtn);

menuBar.appendChild(appName);
menuBar.appendChild(nav);

app.appendChild(menuBar);

card.appendChild(title);
card.appendChild(group);
app.appendChild(card);

floatingMenu.appendChild(floatingHomeBtn);
floatingMenu.appendChild(floatingSettingBtn);
floatingMenu.appendChild(floatingLinksBtn);
floatingMenu.appendChild(floatingMainBtn);

app.appendChild(floatingMenu);

showHome();