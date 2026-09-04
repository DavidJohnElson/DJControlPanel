const quotes = [
  {
    text: "A budget is not a restriction. It is a decision made before the noise arrives.",
    author: "Nexa"
  },
  {
    text: "Small daily choices become the annual story.",
    author: "Nexa"
  },
  {
    text: "Track what matters, then let the system carry the remembering.",
    author: "Nexa"
  },
  {
    text: "Financial calm is built one clear habit at a time.",
    author: "Nexa"
  }
];

const comingSoonCopy = {
  health: "Health tracking will live here when that module is added.",
  routines: "Routine planning will live here when that module is added.",
  tasks: "Task management will live here when that module is added."
};

let activeQuoteIndex = 0;
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const budgetState = {
  incomes: [],
  emis: [{ id: 1, name: "Mortgage", amount: 0 }],
  categories: ["Housing", "Groceries", "Transport", "Utilities", "Dining", "Entertainment"],
  transactions: []
};

// Keep each initializer focused so future modules can be added without rewiring the app.
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initFinanceTabs();
  initQuoteSlider();
  initFinance();
});

function initNavigation() {
  document.querySelectorAll("[data-view-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      showView(trigger.dataset.viewTrigger);
    });
  });
}

function initFinance() {
  const today = new Date();
  document.querySelector("#monthInput").value = today.toISOString().slice(0, 7);
  document.querySelector("#transactionDate").value = today.toISOString().slice(0, 10);
  document.querySelector("#monthInput").addEventListener("change", renderFinance);
  document.querySelectorAll(".amount-input").forEach((input) => {
    input.addEventListener("input", () => formatAmountInput(input));
    input.addEventListener("blur", () => normalizeAmountInput(input));
  });
  document.querySelector("#incomeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    budgetState.incomes.push({ id: Date.now(), source: value("incomeSource"), amount: number("incomeAmount") });
    event.target.reset();
    renderFinance();
  });
  document.querySelector("#emiForm").addEventListener("submit", (event) => {
    event.preventDefault();
    budgetState.emis.push({ id: Date.now(), name: value("emiName"), amount: number("emiAmount") });
    event.target.reset();
    renderFinance();
  });
  document.querySelector("#categoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = value("categoryName");
    if (name && !budgetState.categories.includes(name)) budgetState.categories.push(name);
    event.target.reset();
    renderFinance();
  });
  document.querySelector("#transactionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    budgetState.transactions.push({ id: Date.now(), date: value("transactionDate"), description: value("transactionDescription"), amount: number("transactionAmount"), category: value("transactionCategory"), mode: value("transactionMode"), account: value("transactionAccount") || "-", remarks: value("transactionRemarks") || "-" });
    event.target.reset();
    document.querySelector("#transactionDate").value = todayValue();
    renderFinance();
  });
  renderFinance();
}

function value(id) { return document.querySelector(`#${id}`).value.trim(); }
function number(id) { return Number(document.querySelector(`#${id}`).value.replace(/,/g, "")) || 0; }
function formatAmountInput(input) {
  const digits = input.value.replace(/[^\d.]/g, "");
  const [whole = "", decimal = ""] = digits.split(".");
  const formattedWhole = (whole || "0").replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  input.value = decimal.length ? `${formattedWhole}.${decimal.slice(0, 2)}` : formattedWhole;
}
function normalizeAmountInput(input) {
  if (!input.value) return;
  const amount = Number(input.value.replace(/,/g, ""));
  input.value = Number.isFinite(amount) ? amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
}
function todayValue() { return new Date().toISOString().slice(0, 10); }
function currentMonth() { return document.querySelector("#monthInput").value; }
function monthTransactions() { return budgetState.transactions.filter((transaction) => transaction.date.startsWith(currentMonth())); }

function renderFinance() {
  const transactions = monthTransactions();
  const income = budgetState.incomes.reduce((total, entry) => total + entry.amount, 0);
  const emiTotal = budgetState.emis.reduce((total, entry) => total + entry.amount, 0);
  const expenses = transactions.reduce((total, entry) => total + entry.amount, 0) + emiTotal;
  const remaining = income - expenses;
  document.querySelector("#incomeList").innerHTML = budgetState.incomes.map((entry) => `<div class="compact-row"><span>${escapeText(entry.source)}</span><strong>${money.format(entry.amount)}</strong></div>`).join("") || `<span class="empty-note">No income sources yet.</span>`;
  document.querySelector("#emiList").innerHTML = budgetState.emis.map((entry) => `<div class="compact-row"><span>${escapeText(entry.name)}</span><strong>${money.format(entry.amount)}</strong></div>`).join("");
  document.querySelector("#emiTotal").textContent = `${money.format(emiTotal)} / month`;
  document.querySelector("#categoryCount").textContent = `${budgetState.categories.length} saved`;
  document.querySelector("#categoryList").innerHTML = budgetState.categories.map((category) => `<span class="category-chip">${escapeText(category)}</span>`).join("");
  document.querySelector("#transactionCategory").innerHTML = budgetState.categories.map((category) => `<option>${escapeText(category)}</option>`).join("");
  document.querySelector("#transactionTotal").textContent = `${money.format(expenses)} expenses`;
  document.querySelector("#budgetStats").innerHTML = [["Monthly income", income], ["Expenses + EMIs", expenses], ["Remaining", remaining]].map(([label, amount]) => `<div class="stat-row"><span>${label}</span><strong class="${amount < 0 ? "negative" : ""}">${money.format(amount)}</strong></div>`).join("");
  renderPie(income, expenses);
  renderCalendar(transactions);
  renderTransactions(transactions);
}

function renderPie(income, expenses) {
  const total = income + expenses;
  const expensePercent = total ? Math.round((expenses / total) * 100) : 0;
  document.querySelector("#budgetPie").style.background = total ? `conic-gradient(#d8b650 0 ${100 - expensePercent}%, #0f766e ${100 - expensePercent}% 100%)` : "#dce5df";
  document.querySelector("#pieLegend").innerHTML = `<span><i class="legend-income"></i>Income ${money.format(income)}</span><span><i class="legend-expense"></i>Expenses ${money.format(expenses)}</span>`;
}

function renderCalendar(transactions) {
  const [year, month] = currentMonth().split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  document.querySelector("#calendarHead").innerHTML = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("");
  document.querySelector("#calendarGrid").innerHTML = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const total = transactions.filter((transaction) => transaction.date === key).reduce((sum, transaction) => sum + transaction.amount, 0);
    return `<span class="day-cell ${date.getMonth() === month - 1 ? "" : "muted"}"><b>${date.getDate()}</b>${total ? `<small>${money.format(total)}</small>` : ""}</span>`;
  }).join("");
}

function renderTransactions(transactions) {
  document.querySelector("#transactionTable").innerHTML = transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).map((transaction) => `<tr><td>${transaction.date}</td><td>${escapeText(transaction.description)}</td><td>${money.format(transaction.amount)}</td><td>${escapeText(transaction.category)}</td><td>${escapeText(transaction.mode)}</td><td>${escapeText(transaction.account)}</td><td>${escapeText(transaction.remarks)}</td><td><button class="table-delete" data-delete-transaction="${transaction.id}" type="button">Delete</button></td></tr>`).join("") || `<tr><td colspan="8" class="empty-note">No transactions for this month.</td></tr>`;
  document.querySelectorAll("[data-delete-transaction]").forEach((button) => button.addEventListener("click", () => { budgetState.transactions = budgetState.transactions.filter((transaction) => transaction.id !== Number(button.dataset.deleteTransaction)); renderFinance(); }));
}

function escapeText(text) { return String(text).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]); }

function showView(viewName) {
  const targetView = viewName === "finance" ? "financeView" : viewName === "home" ? "homeView" : "comingSoonView";

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === targetView);
  });

  document.querySelectorAll(".nav-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.viewTrigger === viewName);
  });

  if (targetView === "comingSoonView") {
    const sectionName = titleCase(viewName);
    document.querySelector("#comingSoonTitle").textContent = `${sectionName} is coming soon.`;
    document.querySelector("#comingSoonCopy").textContent = comingSoonCopy[viewName] || "This section is planned for a future update.";
  }
}

// Finance tabs are local UI state only. No page reloads or data calls are needed here.
function initFinanceTabs() {
  document.querySelectorAll("[data-tab-trigger]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const selectedTab = tab.dataset.tabTrigger;

      document.querySelectorAll("[data-tab-trigger]").forEach((button) => {
        const isActive = button.dataset.tabTrigger === selectedTab;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });

      document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.tabPanel === selectedTab);
      });
    });
  });
}

// The landing page quote slider uses hardcoded local content for now.
function initQuoteSlider() {
  renderQuote();
  window.setInterval(() => {
    activeQuoteIndex = (activeQuoteIndex + 1) % quotes.length;
    renderQuote();
  }, 4500);
}

function renderQuote() {
  const quote = quotes[activeQuoteIndex];
  document.querySelector("#quoteText").textContent = quote.text;
  document.querySelector("#quoteAuthor").textContent = `- ${quote.author}`;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
