
const app = document.getElementById("app");

// カード作成
const card = document.createElement("div");
card.className = "card";

// タイトル
const title = document.createElement("h1");
title.textContent = "今からDoする？";

// ボタンの箱
const group = document.createElement("div");
group.className = "button-group";

// ボタン① 家
const homeBtn = document.createElement("button");
homeBtn.textContent = "家に帰る";

// ボタン② 大学
const uniBtn = document.createElement("button");
uniBtn.textContent = "大学に行く";

// クリックイベント（仮）
homeBtn.onclick = () => {
  alert("家に帰るを選択");
};

uniBtn.onclick = () => {
  alert("大学に行くを選択");
};

// まとめる
group.appendChild(homeBtn);
group.appendChild(uniBtn);

card.appendChild(title);
card.appendChild(group);

app.appendChild(card);