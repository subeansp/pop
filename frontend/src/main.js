const app = document.getElementById("app");

let userSettings = {
  homeStation: localStorage.getItem("homeStation") || "高槻駅",
  campusStation: localStorage.getItem("campusStation") || "JR茨木駅",
};

// 仮データ
const trainData = {
  toHome: [
    {
      depart: "17:12",
      arrive: "17:20",
      line: "JR京都線",
    },
    {
      depart: "17:18",
      arrive: "17:26",
      line: "JR京都線",
    },
    {
      depart: "17:27",
      arrive: "17:35",
      line: "JR京都線",
    },
    {
      depart: "17:34",
      arrive: "17:42",
      line: "JR京都線",
    },
  ],
  toCampus: [
    {
      depart: "08:10",
      arrive: "08:18",
      line: "JR京都線",
    },
    {
      depart: "08:17",
      arrive: "08:25",
      line: "JR京都線",
    },
    {
      depart: "08:25",
      arrive: "08:33",
      line: "JR京都線",
    },
    {
      depart: "08:34",
      arrive: "08:42",
      line: "JR京都線",
    },
  ],
};

const homeStationOptions = ["高槻駅", "吹田駅", "大阪駅", "京都駅"];
const campusStationOptions = ["JR茨木駅", "阪急南茨木駅", "大阪モノレール宇野辺駅"];

function showSettings() {
  title.textContent = "駅を設定する";
  group.className = "settings-form";
  group.innerHTML = "";

  const homeLabel = document.createElement("label");
  homeLabel.textContent = "家の最寄駅";

  const homeSelect = document.createElement("select");

  homeStationOptions.forEach((station) => {
    const option = document.createElement("option");
    option.value = station;
    option.textContent = station;

    if (station === userSettings.homeStation) {
      option.selected = true;
    }

    homeSelect.appendChild(option);
  });

  const campusLabel = document.createElement("label");
  campusLabel.textContent = "大学で利用する駅";

  const campusSelect = document.createElement("select");

  campusStationOptions.forEach((station) => {
    const option = document.createElement("option");
    option.value = station;
    option.textContent = station;

    if (station === userSettings.campusStation) {
      option.selected = true;
    }

    campusSelect.appendChild(option);
  });

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "保存する";
  saveBtn.className = "primary";

  saveBtn.onclick = () => {
    userSettings.homeStation = homeSelect.value;
    userSettings.campusStation = campusSelect.value;

    localStorage.setItem("homeStation", userSettings.homeStation);
    localStorage.setItem("campusStation", userSettings.campusStation);

    showHome();
  };

  group.appendChild(homeLabel);
  group.appendChild(homeSelect);
  group.appendChild(campusLabel);
  group.appendChild(campusSelect);
  group.appendChild(saveBtn);
}

// メニューバー作成
const menuBar = document.createElement("header");
menuBar.className = "menu-bar";

const appName = document.createElement("div");
appName.className = "app-name";
appName.textContent = "OIC Transit";

appName.onclick = () => {
  showHome();
};

const nav = document.createElement("nav");
nav.className = "nav-menu";

const homeMenuBtn = document.createElement("button");
homeMenuBtn.className = "menu-btn";
homeMenuBtn.textContent = "ホーム";

const settingMenuBtn = document.createElement("button");
settingMenuBtn.className = "menu-btn";
settingMenuBtn.textContent = "設定";

homeMenuBtn.onclick = () => {
  showHome();
};

settingMenuBtn.onclick = () => {
  showSettings();
};

nav.appendChild(homeMenuBtn);
nav.appendChild(settingMenuBtn);

menuBar.appendChild(appName);
menuBar.appendChild(nav);

app.appendChild(menuBar);

// カード作成
const card = document.createElement("div");
card.className = "card";

// タイトル
const title = document.createElement("h1");

// ボタン・内容の箱
const group = document.createElement("div");
group.className = "button-group";

// ボタン① 家
const homeBtn = document.createElement("button");
homeBtn.textContent = "家に帰る";

// ボタン② 大学
const uniBtn = document.createElement("button");
uniBtn.textContent = "大学に行く";

function showHome() {
  title.textContent = "今からDoする？";
  group.className = "button-group";
  group.innerHTML = "";

  group.appendChild(homeBtn);
  group.appendChild(uniBtn);
}

function showTrainInfo(type) {
  const trains = trainData[type];

  let fromStation;
  let toStation;

  if (type === "toHome") {
    fromStation = userSettings.campusStation;
    toStation = userSettings.homeStation;
  } else {
    fromStation = userSettings.homeStation;
    toStation = userSettings.campusStation;
  }

  title.textContent = `${fromStation} → ${toStation}`;

  group.className = "train-list";
  group.innerHTML = "";

  trains.forEach((train) => {
    const item = document.createElement("div");
    item.className = "train-item";

    item.innerHTML = `
      <div class="train-line">${train.line}</div>
      <div class="train-time">
        ${fromStation} ${train.depart}発 → ${toStation} ${train.arrive}着
      </div>
    `;

    group.appendChild(item);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "戻る";
  backBtn.onclick = showHome;

  group.appendChild(backBtn);
}

homeBtn.onclick = () => {
  showTrainInfo("toHome");
};

uniBtn.onclick = () => {
  showTrainInfo("toCampus");
};

card.appendChild(title);
card.appendChild(group);
app.appendChild(card);

showHome();