const TOTAL = 10;

const praise = ["Super!", "Brawo!", "Tak jest!", "Świetnie!", "Mistrz!"];
const retry = ["Prawie!", "Spróbuj jeszcze raz", "Następnym razem się uda"];

const state = {
  limit: 10,
  mode: "mixed",
  index: 0,
  score: 0,
  locked: false,
  current: null,
  typed: "",
};

const els = {
  menu: document.getElementById("screen-menu"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result"),
  question: document.getElementById("question"),
  feedback: document.getElementById("feedback"),
  progress: document.getElementById("stat-progress"),
  score: document.getElementById("stat-score"),
  bar: document.getElementById("progress-bar"),
  typed: document.getElementById("typed-answer"),
  numpad: document.getElementById("numpad"),
  resultTitle: document.getElementById("result-title"),
  resultScore: document.getElementById("result-score"),
  resultText: document.getElementById("result-text"),
  stars: document.getElementById("stars"),
};

document.querySelectorAll("[data-limit]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-limit]").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.limit = Number(btn.dataset.limit);
  });
});

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    state.mode = btn.dataset.mode;
  });
});

document.getElementById("btn-start").addEventListener("click", startGame);
document.getElementById("btn-again").addEventListener("click", startGame);
document.getElementById("btn-menu").addEventListener("click", showMenu);
document.getElementById("btn-home").addEventListener("click", showMenu);

function show(screen) {
  els.menu.classList.toggle("hidden", screen !== "menu");
  els.quiz.classList.toggle("hidden", screen !== "quiz");
  els.result.classList.toggle("hidden", screen !== "result");
}

function showMenu() {
  show("menu");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildQuestion(prevKey) {
  let question = null;
  let guard = 0;

  while (guard < 50) {
    const operation = state.mode === "mixed" ? (Math.random() < 0.5 ? "add" : "sub") : state.mode;
    const limit = state.limit;
    let numbers;

    if (operation === "add") {
      const a = randomInt(0, limit);
      const b = randomInt(0, limit - a);
      const c = randomInt(0, limit - a - b);
      numbers = [a, b, c, a + b + c];
    } else {
      const a = randomInt(0, limit);
      const b = randomInt(0, a);
      const c = randomInt(0, a - b);
      numbers = [a, b, c, a - b - c];
    }

    const missing = randomInt(0, 3);
    const symbols = operation === "add" ? ["+", "+", "="] : ["-", "-", "="];
    const parts = numbers.map((number, index) => index === missing ? "?" : String(number));
    const expression = `${parts[0]} ${symbols[0]} ${parts[1]} ${symbols[1]} ${parts[2]} ${symbols[2]} ${parts[3]}`;
    question = {
      answer: numbers[missing],
      key: expression.replaceAll(" ", ""),
      text: expression,
    };

    if (!prevKey || question.key !== prevKey) break;
    guard += 1;
    question = null;
  }

  return question || buildQuestion(null);
}

function startGame() {
  state.index = 0;
  state.score = 0;
  state.typed = "";
  show("quiz");
  nextQuestion();
}

function nextQuestion() {
  state.locked = false;
  state.typed = "";
  const prev = state.current?.key;
  state.current = buildQuestion(prev);

  els.question.textContent = state.current.text;
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.progress.textContent = `${state.index + 1} / ${TOTAL}`;
  els.score.textContent = `★ ${state.score}`;
  els.bar.style.width = `${((state.index + 1) / TOTAL) * 100}%`;
  els.typed.textContent = "?";
  els.typed.className = "typed-answer";
}

function submit(value) {
  if (state.locked) return;
  state.locked = true;
  const ok = Number(value) === state.current.answer;

  if (ok) {
    state.score += 1;
    els.feedback.textContent = praise[Math.floor(Math.random() * praise.length)];
    els.feedback.className = "feedback good";
    els.typed.classList.add("good");
    ding(true);
  } else {
    els.feedback.textContent = `${retry[Math.floor(Math.random() * retry.length)]} — poprawna odpowiedź to ${state.current.answer}`;
    els.feedback.className = "feedback bad";
    els.typed.classList.add("bad");
    ding(false);
  }

  els.score.textContent = `★ ${state.score}`;

  window.setTimeout(() => {
    state.index += 1;
    if (state.index >= TOTAL) finish();
    else nextQuestion();
  }, ok ? 850 : 1400);
}

function finish() {
  show("result");
  const ratio = state.score / TOTAL;
  els.resultScore.textContent = `${state.score} / ${TOTAL}`;

  if (ratio === 1) {
    els.resultTitle.textContent = "Mistrz liczenia!";
    els.resultText.textContent = "Wszystko dobrze. Jesteś gwiazdą!";
    els.stars.textContent = "⭐⭐⭐";
  } else if (ratio >= 0.7) {
    els.resultTitle.textContent = "Świetna robota!";
    els.resultText.textContent = "Już prawie wszystko pamiętasz.";
    els.stars.textContent = "⭐⭐✨";
  } else if (ratio >= 0.4) {
    els.resultTitle.textContent = "Dobry start!";
    els.resultText.textContent = "Jeszcze trochę ćwiczeń i będzie super.";
    els.stars.textContent = "⭐✨✨";
  } else {
    els.resultTitle.textContent = "Ćwiczymy dalej!";
    els.resultText.textContent = "Każda runda robi z Ciebie silniejszego.";
    els.stars.textContent = "✨✨✨";
  }
}

function buildNumpad() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"];
  els.numpad.innerHTML = "";

  keys.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "key";
    btn.textContent = label;
    if (label === "OK") btn.classList.add("ok");
    btn.addEventListener("click", () => onKey(label));
    els.numpad.appendChild(btn);
  });
}

function onKey(label) {
  if (state.locked || els.quiz.classList.contains("hidden")) return;

  if (label === "⌫") {
    state.typed = state.typed.slice(0, -1);
  } else if (label === "OK") {
    if (state.typed === "") return;
    submit(Number(state.typed));
    return;
  } else if (state.typed.length < 2) {
    state.typed += label;
  }

  els.typed.textContent = state.typed || "?";
}

document.addEventListener("keydown", (event) => {
  if (els.quiz.classList.contains("hidden")) return;
  if (event.key >= "0" && event.key <= "9") onKey(event.key);
  if (event.key === "Backspace") onKey("⌫");
  if (event.key === "Enter") onKey("OK");
});

function ding(good) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = good ? 660 : 220;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // autoplay / headless
  }
}

buildNumpad();
show("menu");
