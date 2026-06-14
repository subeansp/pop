const app = document.getElementById("app");

// 最寄り駅設定
const userSettings = {
  homeStation: "高槻駅",
  campusStation: "JR茨木駅",
};

// 仮データ
const trainData = {
  toHome: [
    {
      from: "JR茨木駅",
      to: "高槻駅",
      depart: "17:12",
      arrive: "17:20",
      line: "JR京都線",
    },
    {
      from: "JR茨木駅",
      to: "高槻駅",
      depart: "17:18",
      arrive: "17:26",
      line: "JR京都線",
    },
    {
      from: "JR茨木駅",
      to: "高槻駅",
      depart: "17:27",
      arrive: "17:35",
      line: "JR京都線",
    },
    {
      from: "JR茨木駅",
      to: "高槻駅",
      depart: "17:34",
      arrive: "17:42",
      line: "JR京都線",
    },
  ],
  toCampus: [
    {
      from: "高槻駅",
      to: "JR茨木駅",
      depart: "08:10",
      arrive: "08:18",
      line: "JR京都線",
    },
    {
      from: "高槻駅",
      to: "JR茨木駅",
      depart: "08:17",
      arrive: "08:25",
      line: "JR京都線",
    },
    {
      from: "高槻駅",
      to: "JR茨木駅",
      depart: "08:25",
      arrive: "08:33",
      line: "JR京都線",
    },
    {
      from: "高槻駅",
      to: "JR茨木駅",
      depart: "08:34",
      arrive: "08:42",
      line: "JR京都線",
    },
  ],
};

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
  alert("設定画面はあとで作る");
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

  if (type === "toHome") {
    title.textContent = `${userSettings.campusStation} → ${userSettings.homeStation}`;
  } else {
    title.textContent = `${userSettings.homeStation} → ${userSettings.campusStation}`;
  }

  group.className = "train-list";
  group.innerHTML = "";

  trains.forEach((train) => {
    const item = document.createElement("div");
    item.className = "train-item";

    item.innerHTML = `
      <div class="train-line">${train.line}</div>
      <div class="train-time">
        ${train.from} ${train.depart}発 → ${train.to} ${train.arrive}着
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