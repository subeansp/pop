const div = document.getElementById("app");

const h1 = document.createElement("h1");
h1.textContent = "Hello from main.js!!!";
div.appendChild(h1);

const h2 = document.createElement("h2");
const res = await fetch("http://localhost:3000");
const content = await res.text();
h2.textContent = content;
div.appendChild(h2);
