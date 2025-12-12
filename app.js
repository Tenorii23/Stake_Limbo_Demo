const CONFIG = {
  defaultBet: 1.0,
  startingBalance: 200.0,
  maxHistoryPoints: 60,
  houseEdge: 0.01,
  minBet: 0.1,
  maxBet: 10000.0,
  minTarget: 1.01,
  maxTarget: 100000.0,
  minWinChance: 0.01,
  maxWinChance: 99.0
};
const tickSound = new Audio("sounds/tick.m4a");
tickSound.volume = 0.25;

let isAnimatingMultiplier = false;

let stopTickSound = false;


const balanceAmountEl = document.getElementById("balance-amount");
const betInput = document.getElementById("bet-input");
const betPreview = document.getElementById("bet-preview");
const profitOnWinEl = document.getElementById("profit-on-win");
const profitPreviewEl = document.getElementById("profit-preview");
const betBtn = document.getElementById("bet-btn");
const resultAmountEl = document.getElementById("result-amount");
const recentMultipliersEl = document.getElementById("recent-multipliers");
const autoInfo = document.getElementById("auto-info");
const tabButtons = document.querySelectorAll(".tab-btn");
const betActionButtons = document.querySelectorAll("[data-bet-action]");

const targetMultiplierInput = document.getElementById("target-multiplier");
const winChanceInput = document.getElementById("win-chance");
const clearTargetBtn = document.getElementById("clear-target");
const limboMultiplierEl = document.getElementById("limbo-multiplier");

const addBtn = document.getElementById("add-money-btn");
const addPopup = document.getElementById("add-money-popup");
const addQuickButtons = document.querySelectorAll(".add-popup-btn[data-add]");
const addCustomInput = document.getElementById("add-custom-input");
const addCustomBtn = document.getElementById("add-custom-btn");

const statsPanel = document.getElementById("stats-panel");
const statsClose = document.getElementById("stats-close");
const statsOpen = document.getElementById("stats-open");
const statsRefresh = document.getElementById("stats-refresh");
const statsProfit = document.getElementById("stats-profit");
const statsWagered = document.getElementById("stats-wagered");
const statsWins = document.getElementById("stats-wins");
const statsLosses = document.getElementById("stats-losses");
const statsChartCanvas = document.getElementById("stats-chart");
const statsChartCtx = statsChartCanvas.getContext("2d");

const notificationContainer = document.createElement("div");
notificationContainer.className = "notification-container";
document.body.appendChild(notificationContainer);

const statsAdvancedContainer = document.createElement("div");
statsAdvancedContainer.className = "stats-advanced";
document.querySelector(".stats-body").appendChild(statsAdvancedContainer);

const menuBtn = document.createElement("button");
menuBtn.className = "menu-btn";
menuBtn.innerHTML = "🎮 Menu";
document.querySelector(".top-nav-left").appendChild(menuBtn);

const menuPanel = document.createElement("div");
menuPanel.className = "menu-panel hidden";
menuPanel.innerHTML = `
  <div class="menu-header">
    <h3>Demo Games</h3>
    <button class="menu-close">&times;</button>
  </div>
  <div class="menu-games">
    <div class="game-card" data-game="mines">
      <div class="game-icon">💣</div>
      <div class="game-info">
        <h4>Mines</h4>
        <p>Find gems, avoid mines</p>
      </div>
      <div class="game-badge" style="background: #00C74D; color: #000;">Play Now!</div>
    </div>

    <div class="game-card" data-game="limbo" data-active="true">
      <div class="game-icon">🎯</div>
      <div class="game-info">
        <h4>Limbo</h4>
        <p>Instant multiplier game</p>
      </div>
      <div class="game-badge active">Playing</div>
    </div>

    <div class="game-card" data-game="crash">
      <div class="game-icon">🚀</div>
      <div class="game-info">
        <h4>Crash</h4>
        <p>Cash out before it crashes</p>
      </div>
      <div class="game-badge" style="background: #00C74D; color: #000;">Play Now!</div>
    </div>

    <div class="game-card" data-game="plinko">
      <div class="game-icon">🎯</div>
      <div class="game-info">
        <h4>Plinko</h4>
        <p>Drop balls for multipliers</p>
      </div>
      <div class="game-badge" style="background: #00C74D; color: #000;">Play Now!</div>
    </div>

    <div class="game-card" data-game="dice">
      <div class="game-icon">🎲</div>
      <div class="game-info">
        <h4>Dice</h4>
        <p>Predict dice rolls</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>

    <div class="game-card" data-game="roulette">
      <div class="game-icon">🎡</div>
      <div class="game-info">
        <h4>Roulette</h4>
        <p>Classic wheel betting</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>

    <div class="game-card" data-game="blackjack">
      <div class="game-icon">♠️</div>
      <div class="game-info">
        <h4>Blackjack</h4>
        <p>Beat the dealer</p>
      </div>
      <div class="game-badge">Coming Soon</div>
    </div>
  </div>
  <div class="menu-footer">
    <button class="btn dark small" id="reset-stats">Reset Stats</button>
  </div>
`;
document.body.appendChild(menuPanel);

const state = {
  balance: CONFIG.startingBalance,
  betAmount: CONFIG.defaultBet,
  targetMultiplier: 2.0,
  winChance: 49.5,
  lastEdited: "target",
  stats: {
    profit: 0,
    wagered: 0,
    wins: 0,
    losses: 0,
    history: [],
    highestMultiplier: 0,
    totalRounds: 0,
    bestProfitStreak: 0,
    currentStreak: 0,
    biggestWin: 0,
    biggestLoss: 0,
    sessionStartTime: Date.now()
  },
  recentMultipliers: []
};

function showNotification(message, type = "info", duration = 4000) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${getNotificationIcon(type)}</div>
    <div class="notification-content">${message}</div>
    <button class="notification-close">&times;</button>
  `;
  notificationContainer.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 10);

  notification.querySelector(".notification-close").addEventListener("click", () => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  });

  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }
  }, duration);
}

function getNotificationIcon(type) {
  switch (type) {
    case "success": return "✓";
    case "warning": return "⚠";
    case "error": return "✕";
    default: return "ℹ";
  }
}

function toggleMenu() {
  menuPanel.classList.toggle("hidden");
}

function setupMenu() {
  menuBtn.addEventListener("click", toggleMenu);

  document.querySelector(".menu-close").addEventListener("click", () => {
    menuPanel.classList.add("hidden");
  });

  document.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", () => {
      const game = card.dataset.game;

      if (game === "limbo") return;

      if (game === "mines") {
        window.location.href = "https://tenorii23.github.io/Stake_Mines_Demo/";
        return;
      }

      if (game === "crash") {
        window.location.href = "https://tenorii23.github.io/Stake_Crash_Demo/";
        return;
      }

      if (game === "plinko") {
        window.open("https://plinko-web-game.netlify.app/", "_blank");
        return;
      }

      showNotification(`🎮 ${card.querySelector("h4").textContent} coming soon!`, "info", 3000);

      document.querySelectorAll(".game-card").forEach((c) => {
        c.classList.remove("active");
        const badge = c.querySelector(".game-badge");
        if (badge) badge.classList.remove("active");
      });

      card.classList.add("active");
      const badge = card.querySelector(".game-badge");
      if (badge) {
        badge.textContent = "Selected";
        badge.classList.add("active");
      }
    });
  });

  document.getElementById("reset-stats").addEventListener("click", () => {
    if (confirm("Reset all statistics? This cannot be undone.")) {
      resetStats();
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification("Statistics reset", "info", 2000);
    }
  });

  document.addEventListener("click", (e) => {
    if (!menuPanel.contains(e.target) && !menuBtn.contains(e.target)) {
      menuPanel.classList.add("hidden");
    }
  });
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function formatMoney(v) {
  return Number(v).toFixed(2);
}

function formatMult(v) {
  return Number(v).toFixed(2) + "x";
}

function updateBalanceUI() {
  balanceAmountEl.textContent = formatMoney(state.balance);
  balanceAmountEl.style.transform = "scale(1.1)";
  setTimeout(() => (balanceAmountEl.style.transform = "scale(1)"), 200);
}

function updateBetPreview() {
  betPreview.textContent = "$" + formatMoney(state.betAmount);
}

function computeWinChanceFromTarget(target) {
  const t = clamp(target, CONFIG.minTarget, CONFIG.maxTarget);
  const chance = (99.0 * (1 - CONFIG.houseEdge)) / t;
  return clamp(chance, CONFIG.minWinChance, CONFIG.maxWinChance);
}

function computeTargetFromWinChance(chance) {
  const c = clamp(chance, CONFIG.minWinChance, CONFIG.maxWinChance);
  const target = (99.0 * (1 - CONFIG.houseEdge)) / c;
  return clamp(target, CONFIG.minTarget, CONFIG.maxTarget);
}

function syncTargetAndChance(origin) {
  if (origin === "target") {
    const t = parseFloat(targetMultiplierInput.value);
    const target = isNaN(t) ? CONFIG.minTarget : clamp(t, CONFIG.minTarget, CONFIG.maxTarget);
    state.targetMultiplier = target;
    state.winChance = computeWinChanceFromTarget(target);
    winChanceInput.value = state.winChance.toFixed(2);
    targetMultiplierInput.value = state.targetMultiplier.toFixed(2);
  } else {
    const c = parseFloat(winChanceInput.value);
    const chance = isNaN(c) ? 49.5 : clamp(c, CONFIG.minWinChance, CONFIG.maxWinChance);
    state.winChance = chance;
    state.targetMultiplier = computeTargetFromWinChance(chance);
    targetMultiplierInput.value = state.targetMultiplier.toFixed(2);
    winChanceInput.value = state.winChance.toFixed(2);
  }
  updateProfitOnWin();
}

function updateProfitOnWin() {
  const bet = state.betAmount;
  const target = state.targetMultiplier;
  const payout = bet * target;
  const profit = payout - bet;

  profitOnWinEl.value = formatMoney(profit);
  profitPreviewEl.textContent = "$" + formatMoney(profit);
}

function updateRecentMultipliers() {
  recentMultipliersEl.innerHTML = "";
  state.recentMultipliers.forEach((m) => {
    const el = document.createElement("div");
    el.className = "recent-value";
    el.textContent = formatMult(m);
    el.style.color = m >= 1.0 ? "#00C74D" : "#FF4141";
    recentMultipliersEl.appendChild(el);
  });
}

function pushProfitHistory() {
  state.stats.history.push(state.stats.profit);
  if (state.stats.history.length > CONFIG.maxHistoryPoints) state.stats.history.shift();
}

function updateStatsUI() {
  statsProfit.textContent = "$" + formatMoney(state.stats.profit);
  statsProfit.classList.toggle("positive", state.stats.profit >= 0);
  statsProfit.classList.toggle("negative", state.stats.profit < 0);

  statsWagered.textContent = "$" + formatMoney(state.stats.wagered);
  statsWins.textContent = state.stats.wins.toString();
  statsLosses.textContent = state.stats.losses.toString();
}

function resetStats() {
  state.stats = {
    profit: 0,
    wagered: 0,
    wins: 0,
    losses: 0,
    history: [],
    highestMultiplier: 0,
    totalRounds: 0,
    bestProfitStreak: 0,
    currentStreak: 0,
    biggestWin: 0,
    biggestLoss: 0,
    sessionStartTime: Date.now()
  };
}

function drawStatsChart() {
  const dpr = window.devicePixelRatio || 1;

  const container = statsChartCanvas.parentElement;
  const w = container.clientWidth;
  const h = container.clientHeight;

  statsChartCanvas.style.width = w + "px";
  statsChartCanvas.style.height = h + "px";
  statsChartCanvas.width = Math.floor(w * dpr);
  statsChartCanvas.height = Math.floor(h * dpr);

  statsChartCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const ctx = statsChartCtx;
  ctx.clearRect(0, 0, w, h);

  const bgGradient = ctx.createLinearGradient(0, 0, w, h);
  bgGradient.addColorStop(0, "#0A1622");
  bgGradient.addColorStop(1, "#0C1824");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);

  const values = state.stats.history;
  if (!values.length) {
    ctx.fillStyle = "#A7B3C3";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("No rounds yet", w / 2, h / 2);
    return;
  }

  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;

  const pad = 14;
  const usableW = w - pad * 2;
  const usableH = h - pad * 2;

  const zeroY = pad + (1 - (0 - minVal) / range) * usableH;

  ctx.beginPath();
  ctx.moveTo(pad, zeroY);
  ctx.lineTo(pad + usableW, zeroY);
  ctx.strokeStyle = "rgba(167, 179, 195, 0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * usableW;
    const y = pad + (1 - (v - minVal) / range) * usableH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  const lastVal = values[values.length - 1];
  const up = lastVal >= 0;

  ctx.strokeStyle = up ? "#00C74D" : "#FF4141";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = up ? "#00C74D" : "#FF4141";
  ctx.font = "bold 11px system-ui";
  ctx.textAlign = "right";
  ctx.fillText(`$${formatMoney(lastVal)}`, w - pad, Math.max(18, zeroY - 6));
}

function updateAdvancedStats() {
  const totalGames = state.stats.wins + state.stats.losses;
  const winRate = totalGames > 0 ? (state.stats.wins / totalGames) * 100 : 0;

  const sessionTime = Date.now() - state.stats.sessionStartTime;
  const hours = Math.floor(sessionTime / (1000 * 60 * 60));
  const minutes = Math.floor((sessionTime % (1000 * 60 * 60)) / (1000 * 60));

  const avgBet = totalGames > 0 ? state.stats.wagered / totalGames : 0;

  statsAdvancedContainer.innerHTML = `
    <div class="stats-advanced-grid">
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Win Rate</div>
        <div class="stats-advanced-value">${winRate.toFixed(1)}%</div>
        <div class="stats-advanced-sub">${state.stats.wins}W : ${state.stats.losses}L</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Highest Multiplier</div>
        <div class="stats-advanced-value">${state.stats.highestMultiplier.toFixed(2)}x</div>
        <div class="stats-advanced-sub">Best Streak: ${state.stats.bestProfitStreak}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Biggest Win</div>
        <div class="stats-advanced-value positive">+$${formatMoney(state.stats.biggestWin)}</div>
        <div class="stats-advanced-sub">Biggest Loss: -$${formatMoney(state.stats.biggestLoss)}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Avg Bet</div>
        <div class="stats-advanced-value">$${formatMoney(avgBet)}</div>
        <div class="stats-advanced-sub">Rounds: ${state.stats.totalRounds}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Current Streak</div>
        <div class="stats-advanced-value ${state.stats.currentStreak > 0 ? "positive" : "negative"}">${state.stats.currentStreak}</div>
        <div class="stats-advanced-sub">Profit: $${formatMoney(state.stats.profit)}</div>
      </div>
      <div class="stats-advanced-card">
        <div class="stats-advanced-label">Session Time</div>
        <div class="stats-advanced-value">${hours}h ${minutes}m</div>
        <div class="stats-advanced-sub">Wagered: $${formatMoney(state.stats.wagered)}</div>
      </div>
    </div>
  `;
}

/* Limbo roll: P(result >= x) = (1-houseEdge) / x  (x >= 1) */
function rollLimboMultiplier() {
  const u = Math.random();
  const m = (1 - CONFIG.houseEdge) / Math.max(u, 1e-12);
  return clamp(m, 1.0, CONFIG.maxTarget);
}


function setCenterResult(finalMult, didWin) {
    
  if (isAnimatingMultiplier) return;
  isAnimatingMultiplier = true;

  const startValue = 1.0;
  const endValue = finalMult;

  limboMultiplierEl.classList.remove("win", "lose");
  limboMultiplierEl.textContent = "1.00x";

  let duration = Math.min(900, 300 + endValue * 120);
  if (state.fastMode) duration = 160;
  if (state.turboMode) duration = 40;

  let lastTickValue = 1.0;

  animateMultiplier(
    startValue,
    endValue,
    duration,
    (value) => {
      limboMultiplierEl.textContent = value.toFixed(2) + "x";
const rounded = Math.floor(value * 20); // 0.05 steps
if (!state.turboMode && rounded > lastTickValue) {
  const tick = tickSound.cloneNode();
  tick.volume = 0.25;
  tick.play();
  lastTickValue = rounded;
}
 {
const tick = tickSound.cloneNode();
tick.volume = 0.25;
tick.play();

        lastTickValue = value;
      }
    },
    () => {
      limboMultiplierEl.textContent = endValue.toFixed(2) + "x";
      limboMultiplierEl.classList.add(didWin ? "win" : "lose");
      isAnimatingMultiplier = false;
    }
  );
}

let lastTickValue = 20; // 1.00 * 20



function playRound() {


  const bet = parseFloat(state.betAmount);
  if (isNaN(bet) || bet < CONFIG.minBet) {
    showNotification(`Minimum bet is $${CONFIG.minBet}`, "warning");
    return;
  }
  if (bet > state.balance) {
    showNotification("Insufficient balance", "error");
    return;
  }

  const target = state.targetMultiplier;
  if (isNaN(target) || target < CONFIG.minTarget) {
    showNotification(`Target must be at least ${CONFIG.minTarget.toFixed(2)}x`, "warning");
    return;
  }

  state.balance -= bet;
  state.stats.wagered += bet;
  state.stats.totalRounds += 1;

  const resultMult = rollLimboMultiplier();
  const win = resultMult >= target;

  if (win) {
    const payout = bet * target;
    const profit = payout - bet;

    state.balance += payout;
    state.stats.wins += 1;
    state.stats.profit += profit;
    state.stats.currentStreak += 1;

    if (state.stats.currentStreak > state.stats.bestProfitStreak) state.stats.bestProfitStreak = state.stats.currentStreak;
    if (profit > state.stats.biggestWin) state.stats.biggestWin = profit;
    if (target > state.stats.highestMultiplier) state.stats.highestMultiplier = target;

    showNotification(`✅ Won at ${target.toFixed(2)}x — Profit: +$${formatMoney(profit)}`, "success", 4500);
    resultAmountEl.textContent = "+$" + formatMoney(profit);
    resultAmountEl.style.color = "#00C74D";
  } else {
    state.stats.losses += 1;
    state.stats.profit -= bet;
    state.stats.currentStreak = 0;

    if (bet > state.stats.biggestLoss) state.stats.biggestLoss = bet;

    showNotification(`❌ Lost — Result ${resultMult.toFixed(2)}x (Target ${target.toFixed(2)}x)`, "error", 4500);
    resultAmountEl.textContent = "-$" + formatMoney(bet);
    resultAmountEl.style.color = "#FF4141";
  }

  state.recentMultipliers.unshift(resultMult);
  if (state.recentMultipliers.length > 8) state.recentMultipliers.pop();

  pushProfitHistory();
  updateBalanceUI();
  updateBetPreview();
  updateProfitOnWin();
  updateRecentMultipliers();
  updateStatsUI();
  updateAdvancedStats();
  drawStatsChart();
setCenterResult(resultMult, win);

}

function onBetInputChange() {
  const v = parseFloat(betInput.value);
  if (isNaN(v) || v < CONFIG.minBet) {
    state.betAmount = CONFIG.minBet;
    betInput.value = CONFIG.minBet.toFixed(2);
  } else if (v > state.balance) {
    state.betAmount = Math.min(state.balance, CONFIG.maxBet);
    betInput.value = formatMoney(state.betAmount);
    showNotification(`Bet cannot exceed balance of $${formatMoney(state.balance)}`, "warning");
  } else {
    state.betAmount = v;
  }
  updateBetPreview();
  updateProfitOnWin();
}

function attachEvents() {
  betInput.addEventListener("input", onBetInputChange);

  betActionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      let bet = state.betAmount;

      if (btn.dataset.betAction === "half") bet /= 2;
      if (btn.dataset.betAction === "double") bet *= 2;

      bet = Math.max(CONFIG.minBet, parseFloat(bet.toFixed(2)));

      if (bet > state.balance) {
        bet = Math.min(state.balance, CONFIG.maxBet);
        showNotification(`Bet cannot exceed balance of $${formatMoney(state.balance)}`, "warning");
      }

      state.betAmount = bet;
      betInput.value = bet.toFixed(2);
      updateBetPreview();
      updateProfitOnWin();
    });
  });

  targetMultiplierInput.addEventListener("input", () => {
    state.lastEdited = "target";
    syncTargetAndChance("target");
  });

  winChanceInput.addEventListener("input", () => {
    state.lastEdited = "chance";
    syncTargetAndChance("chance");
  });

  clearTargetBtn.addEventListener("click", () => {
    targetMultiplierInput.value = "2.00";
    state.lastEdited = "target";
    syncTargetAndChance("target");
  });


  
  betBtn.addEventListener("click", () => {
    playRound();
  });

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      autoInfo.classList.toggle("hidden", btn.dataset.tab !== "auto");
      if (btn.dataset.tab === "auto") showNotification("Auto mode is visual only in this demo", "info", 3000);
    });
  });

  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    addPopup.classList.toggle("hidden");
  });

  addQuickButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const amt = parseFloat(btn.dataset.add);
      if (!isNaN(amt) && amt > 0) {
        state.balance += amt;
        updateBalanceUI();
        addPopup.classList.add("hidden");
        showNotification(`Added $${formatMoney(amt)} to balance`, "success", 2000);
      }
    });
  });

  addCustomBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const v = parseFloat(addCustomInput.value);
    if (!isNaN(v) && v > 0) {
      state.balance += v;
      updateBalanceUI();
      addCustomInput.value = "";
      addPopup.classList.add("hidden");
      showNotification(`Added $${formatMoney(v)} to balance`, "success", 2000);
    } else {
      showNotification("Please enter a valid amount", "error", 2000);
    }
  });

  document.addEventListener("click", () => {
    addPopup.classList.add("hidden");
  });

  addPopup.addEventListener("click", (e) => e.stopPropagation());

  statsClose.addEventListener("click", () => {
    statsPanel.classList.add("hidden");
    statsOpen.classList.remove("hidden");
  });

  statsOpen.addEventListener("click", () => {
    statsPanel.classList.remove("hidden");
    statsOpen.classList.add("hidden");
  });

  statsRefresh.addEventListener("click", () => {
    if (confirm("Reset all statistics? This cannot be undone.")) {
      resetStats();
      updateAdvancedStats();
      updateStatsUI();
      drawStatsChart();
      showNotification("Statistics reset", "info", 2000);
    }
  });

  window.addEventListener("resize", () => {
    setTimeout(() => drawStatsChart(), 80);
  });
}

function init() {
  state.balance = CONFIG.startingBalance;
  state.betAmount = CONFIG.defaultBet;

  betInput.value = CONFIG.defaultBet.toFixed(2);
  targetMultiplierInput.value = state.targetMultiplier.toFixed(2);
  winChanceInput.value = state.winChance.toFixed(2);

  updateBalanceUI();
  updateBetPreview();
  syncTargetAndChance("target");

  updateRecentMultipliers();
  updateAdvancedStats();
  updateStatsUI();
  drawStatsChart();

  attachEvents();
  setupMenu();
}


function animateMultiplier(from, to, duration, onUpdate, onComplete) {
  const start = performance.now();
  const diff = to - from;

  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + diff * eased;

    onUpdate(current);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      onUpdate(to);
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(frame);
}


document.addEventListener("DOMContentLoaded", init);
