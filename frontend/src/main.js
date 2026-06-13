const div = document.getElementById("app");
const h1 = document.createElement("h1");

const res = await fetch("http://localhost:3000");
const content = await res.text();

h1.textContent = content;
div.appendChild(h1);
