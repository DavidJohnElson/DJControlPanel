import { actions, state } from "./app-state.js";
import {
  addMonths,
  byDateDesc,
  dateToInputValue,
  escapeHtml,
  isInMonth,
  money,
  monthKey,
  monthsRemaining,
  toNumber
} from "./utils.js";

let selectedMonth = monthKey();
let categoryPie = null;
let budgetBar = null;

const bucketLabels = {
  essential: "Needs",
  discretionary: "Wants",
  savings: "Savings"
};

const bucketTargets = {
  essential: 0.5,
  discretionary: 0.3,
  savings: 0.2
};

export function initFinance() {
  document.querySelector("#monthInput").value = selectedMonth;
  document.querySelector("#transactionDate").value = dateToInputValue();

  document.querySelector("#monthInput").addEventListener("change", (event) => {
    selectedMonth = event.target.value || monthKey();
    renderFinance();
  });

  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  bindForms();
}

function bindForms() {
  document.querySelector("#incomeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await actions.saveIncome(state.user.uid, {
      fixedIncome: toNumber(document.querySelector("#fixedIncome").value),
      extraIncome: toNumber(document.querySelector("#extraIncome").value)
    });
  });

  document.querySelector("#emiForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.querySelector("#emiId").value;
    await actions.saveEmi(state.user.uid, id, {
      lender: document.querySelector("#emiLender").value.trim(),
      amount: toNumber(document.querySelector("#emiAmount").value),
      startDate: document.querySelector("#emiStart").value,
      tenureMonths: toNumber(document.querySelector("#emiTenure").value) || null
    });
    resetEmiForm();
  });

  document.querySelector("#cancelEmiEdit").addEventListener("click", resetEmiForm);

  document.querySelector("#categoryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await actions.addCategory(state.user.uid, {
      name: document.querySelector("#categoryName").value.trim(),
      bucket: document.querySelector("#categoryBucket").value,
      monthlyBudget: toNumber(document.querySelector("#categoryBudget").value),
      color: document.querySelector("#categoryColor").value
    });
    event.target.reset();
    document.querySelector("#categoryColor").value = "#0f766e";
  });

  document.querySelector("#transactionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.querySelector("#transactionId").value;
    const categoryId = document.querySelector("#transactionCategory").value;
    const category = state.categories.find((entry) => entry.id === categoryId);

    await actions.saveTransaction(state.user.uid, id, {
      date: document.querySelector("#transactionDate").value,
      description: document.querySelector("#transactionDescription").value.trim(),
      categoryId,
      categoryName: category?.name || "Uncategorized",
      bucket: category?.bucket || "discretionary",
      amount: toNumber(document.querySelector("#transactionAmount").value),
      goalId: document.querySelector("#transactionGoal").value || null
    });
    resetTransactionForm();
  });

  document.querySelector("#cancelTransactionEdit").addEventListener("click", resetTransactionForm);

  document.querySelector("#goalForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.querySelector("#goalId").value;
    await actions.saveGoal(state.user.uid, id, {
      name: document.querySelector("#goalName").value.trim(),
      targetAmount: toNumber(document.querySelector("#goalTarget").value)
    });
    resetGoalForm();
  });

  document.querySelector("#cancelGoalEdit").addEventListener("click", resetGoalForm);
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
  document.querySelector(`#${tab}Tab`).classList.add("active");
}

export function renderFinance() {
  if (!state.user) return;

  renderIncome();
  renderCategories();
  renderEmis();
  renderTransactions();
  renderTracker();
  renderCharts();
  renderCalendar();
  renderGoals();
}

function currentMonthTransactions() {
  return state.transactions.filter((transaction) => isInMonth(transaction.date, selectedMonth));
}

function currentYearSavingsByGoal() {
  const year = selectedMonth.slice(0, 4);
  return state.transactions.reduce((totals, transaction) => {
    if (transaction.date?.startsWith(year) && transaction.bucket === "savings" && transaction.goalId) {
      totals[transaction.goalId] = (totals[transaction.goalId] || 0) + toNumber(transaction.amount);
    }
    return totals;
  }, {});
}

function totalIncome() {
  return toNumber(state.income.fixedIncome) + toNumber(state.income.extraIncome);
}

function categoryFor(id) {
  return state.categories.find((category) => category.id === id);
}

function renderIncome() {
  document.querySelector("#fixedIncome").value = state.income.fixedIncome || "";
  document.querySelector("#extraIncome").value = state.income.extraIncome || "";
  document.querySelector("#incomeTotal").textContent = money.format(totalIncome());
}

function renderEmis() {
  const list = document.querySelector("#emiList");
  const total = state.emis.reduce((sum, emi) => sum + toNumber(emi.amount), 0);
  document.querySelector("#emiTotal").textContent = money.format(total);

  list.innerHTML = state.emis
    .map((emi) => {
      const remaining = monthsRemaining(emi.startDate, emi.tenureMonths);
      const endDate = emi.tenureMonths ? addMonths(emi.startDate, emi.tenureMonths).toISOString().slice(0, 10) : "Open";
      return `
        <div class="item-row">
          <div>
            <strong>${escapeHtml(emi.lender)}</strong>
            <div class="item-meta">${money.format(toNumber(emi.amount))} monthly · ${escapeHtml(emi.startDate)} to ${escapeHtml(endDate)} · ${remaining ?? "Open"} months left</div>
          </div>
          <div class="row-actions">
            <button class="icon-btn" type="button" data-edit-emi="${emi.id}" title="Edit EMI">Edit</button>
            <button class="icon-btn danger" type="button" data-delete-emi="${emi.id}" title="Delete EMI">Del</button>
          </div>
        </div>
      `;
    })
    .join("") || `<div class="item-row"><span class="item-meta">No EMIs saved yet.</span></div>`;

  list.querySelectorAll("[data-edit-emi]").forEach((button) => {
    button.addEventListener("click", () => fillEmiForm(state.emis.find((emi) => emi.id === button.dataset.editEmi)));
  });
  list.querySelectorAll("[data-delete-emi]").forEach((button) => {
    button.addEventListener("click", () => actions.deleteEmi(state.user.uid, button.dataset.deleteEmi));
  });
}

function renderCategories() {
  const categorySelect = document.querySelector("#transactionCategory");
  const goalSelect = document.querySelector("#transactionGoal");
  document.querySelector("#categoryCount").textContent = `${state.categories.length} saved`;

  categorySelect.innerHTML = state.categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)} · ${bucketLabels[category.bucket]}</option>`)
    .join("");

  goalSelect.innerHTML = `<option value="">No goal allocation</option>${state.goals
    .map((goal) => `<option value="${goal.id}">${escapeHtml(goal.name)}</option>`)
    .join("")}`;

  document.querySelector("#categoryList").innerHTML = state.categories
    .map(
      (category) => `
        <div class="category-chip">
          <span><span class="swatch" style="background:${category.color}"></span> ${escapeHtml(category.name)}</span>
          <button class="icon-btn danger" type="button" data-delete-category="${category.id}" title="Delete category">Del</button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll("[data-delete-category]").forEach((button) => {
    button.addEventListener("click", () => actions.deleteCategory(state.user.uid, button.dataset.deleteCategory));
  });
}

function renderTransactions() {
  const transactions = currentMonthTransactions().sort(byDateDesc);
  const total = transactions.reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  document.querySelector("#transactionTotal").textContent = money.format(total);

  document.querySelector("#transactionList").innerHTML = transactions
    .map((transaction) => {
      const category = categoryFor(transaction.categoryId);
      const color = category?.color || "#66736f";
      return `
        <div class="item-row">
          <div>
            <strong>${escapeHtml(transaction.description)}</strong>
            <div class="item-meta">
              ${escapeHtml(transaction.date)} · <span style="color:${color}">${escapeHtml(transaction.categoryName)}</span> · ${money.format(toNumber(transaction.amount))}
            </div>
          </div>
          <div class="row-actions">
            <button class="icon-btn" type="button" data-edit-transaction="${transaction.id}" title="Edit transaction">Edit</button>
            <button class="icon-btn danger" type="button" data-delete-transaction="${transaction.id}" title="Delete transaction">Del</button>
          </div>
        </div>
      `;
    })
    .join("") || `<div class="item-row"><span class="item-meta">No transactions for this month.</span></div>`;

  document.querySelectorAll("[data-edit-transaction]").forEach((button) => {
    button.addEventListener("click", () =>
      fillTransactionForm(state.transactions.find((transaction) => transaction.id === button.dataset.editTransaction))
    );
  });
  document.querySelectorAll("[data-delete-transaction]").forEach((button) => {
    button.addEventListener("click", () => actions.deleteTransaction(state.user.uid, button.dataset.deleteTransaction));
  });
}

function renderTracker() {
  const transactions = currentMonthTransactions();
  const emiTotal = state.emis.reduce((sum, emi) => sum + toNumber(emi.amount), 0);
  const totals = {
    essential: emiTotal,
    discretionary: 0,
    savings: 0
  };

  transactions.forEach((transaction) => {
    totals[transaction.bucket] = (totals[transaction.bucket] || 0) + toNumber(transaction.amount);
  });

  const income = totalIncome();
  document.querySelector("#trackerTotal").textContent = `Income ${money.format(income)}`;

  document.querySelector("#bucketTracker").innerHTML = Object.entries(bucketTargets)
    .map(([bucket, target]) => {
      const targetAmount = income * target;
      const actual = totals[bucket] || 0;
      const percentage = targetAmount > 0 ? Math.min((actual / targetAmount) * 100, 140) : 0;
      const over = targetAmount > 0 && actual > targetAmount;
      return `
        <div class="bucket-card ${over ? "over" : ""}">
          <strong>${bucketLabels[bucket]}</strong>
          <div class="progress-track"><div class="progress-fill" style="width:${percentage}%"></div></div>
          <div class="item-meta">${money.format(actual)} of ${money.format(targetAmount)}</div>
        </div>
      `;
    })
    .join("");
}

function renderCharts() {
  const transactions = currentMonthTransactions();
  const byCategory = new Map();

  transactions.forEach((transaction) => {
    byCategory.set(transaction.categoryId, (byCategory.get(transaction.categoryId) || 0) + toNumber(transaction.amount));
  });

  const labels = [...byCategory.keys()].map((id) => categoryFor(id)?.name || "Uncategorized");
  const values = [...byCategory.values()];
  const colors = [...byCategory.keys()].map((id) => categoryFor(id)?.color || "#66736f");

  categoryPie?.destroy();
  categoryPie = new Chart(document.querySelector("#categoryPie"), {
    type: "pie",
    data: {
      labels: labels.length ? labels : ["No spending"],
      datasets: [{ data: values.length ? values : [1], backgroundColor: colors.length ? colors : ["#dce5df"] }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  budgetBar?.destroy();
  budgetBar = new Chart(document.querySelector("#budgetBar"), {
    type: "bar",
    data: {
      labels: state.categories.map((category) => category.name),
      datasets: [
        {
          label: "Budgeted",
          data: state.categories.map((category) => toNumber(category.monthlyBudget)),
          backgroundColor: "#2563eb"
        },
        {
          label: "Actual",
          data: state.categories.map((category) => byCategory.get(category.id) || 0),
          backgroundColor: "#0f766e"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderCalendar() {
  const [year, month] = selectedMonth.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const cells = [];
  const transactions = currentMonthTransactions();

  document.querySelector("#calendarHead").innerHTML = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    .map((day) => `<div>${day}</div>`)
    .join("");

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + i);
    const value = dateToInputValue(cellDate);
    const dayTransactions = transactions.filter((transaction) => transaction.date === value);
    cells.push(`
      <div class="day-cell ${cellDate.getMonth() !== month - 1 ? "muted" : ""}">
        <div class="day-number">${cellDate.getDate()}</div>
        ${dayTransactions
          .map((transaction) => {
            const category = categoryFor(transaction.categoryId);
            return `<span class="day-transaction" style="background:${category?.color || "#66736f"}">${escapeHtml(transaction.description)} ${money.format(toNumber(transaction.amount))}</span>`;
          })
          .join("")}
      </div>
    `);
  }

  document.querySelector("#calendarGrid").innerHTML = cells.join("");
  renderMonthSummary();
}

function renderMonthSummary() {
  const transactions = currentMonthTransactions();
  const expenses = transactions
    .filter((transaction) => transaction.bucket !== "savings")
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const savings = transactions
    .filter((transaction) => transaction.bucket === "savings")
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const income = totalIncome();
  const emiTotal = state.emis.reduce((sum, emi) => sum + toNumber(emi.amount), 0);
  const needs = transactions
    .filter((transaction) => transaction.bucket === "essential")
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), emiTotal);
  const wants = transactions
    .filter((transaction) => transaction.bucket === "discretionary")
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);

  const summary = [
    ["Total income", money.format(income)],
    ["Total expenses", money.format(expenses + emiTotal)],
    ["Total savings", money.format(savings)],
    ["Needs target", `${money.format(needs)} / ${money.format(income * 0.5)}`],
    ["Wants target", `${money.format(wants)} / ${money.format(income * 0.3)}`],
    ["Savings target", `${money.format(savings)} / ${money.format(income * 0.2)}`]
  ];

  document.querySelector("#monthSummary").innerHTML = summary
    .map(([label, value]) => `<div class="summary-item"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function renderGoals() {
  const savingsByGoal = currentYearSavingsByGoal();
  document.querySelector("#goalYear").textContent = selectedMonth.slice(0, 4);

  document.querySelector("#goalsTable").innerHTML = state.goals
    .map((goal) => {
      const current = savingsByGoal[goal.id] || 0;
      const target = toNumber(goal.targetAmount);
      const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      return `
        <tr>
          <td><strong>${escapeHtml(goal.name)}</strong></td>
          <td>${money.format(target)}</td>
          <td>${money.format(current)}</td>
          <td class="goal-progress">
            <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
            <span class="item-meta">${Math.round(percent)}%</span>
          </td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" type="button" data-edit-goal="${goal.id}" title="Edit goal">Edit</button>
              <button class="icon-btn danger" type="button" data-delete-goal="${goal.id}" title="Delete goal">Del</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("") || `<tr><td colspan="5">No annual goals yet.</td></tr>`;

  document.querySelectorAll("[data-edit-goal]").forEach((button) => {
    button.addEventListener("click", () => fillGoalForm(state.goals.find((goal) => goal.id === button.dataset.editGoal)));
  });
  document.querySelectorAll("[data-delete-goal]").forEach((button) => {
    button.addEventListener("click", () => actions.deleteGoal(state.user.uid, button.dataset.deleteGoal));
  });
}

function fillEmiForm(emi) {
  document.querySelector("#emiId").value = emi.id;
  document.querySelector("#emiLender").value = emi.lender;
  document.querySelector("#emiAmount").value = emi.amount;
  document.querySelector("#emiStart").value = emi.startDate;
  document.querySelector("#emiTenure").value = emi.tenureMonths || "";
}

function resetEmiForm() {
  document.querySelector("#emiForm").reset();
  document.querySelector("#emiId").value = "";
}

function fillTransactionForm(transaction) {
  document.querySelector("#transactionMode").textContent = "Editing";
  document.querySelector("#transactionId").value = transaction.id;
  document.querySelector("#transactionDate").value = transaction.date;
  document.querySelector("#transactionDescription").value = transaction.description;
  document.querySelector("#transactionCategory").value = transaction.categoryId;
  document.querySelector("#transactionAmount").value = transaction.amount;
  document.querySelector("#transactionGoal").value = transaction.goalId || "";
}

function resetTransactionForm() {
  document.querySelector("#transactionForm").reset();
  document.querySelector("#transactionId").value = "";
  document.querySelector("#transactionDate").value = dateToInputValue();
  document.querySelector("#transactionMode").textContent = "New";
}

function fillGoalForm(goal) {
  document.querySelector("#goalId").value = goal.id;
  document.querySelector("#goalName").value = goal.name;
  document.querySelector("#goalTarget").value = goal.targetAmount;
}

function resetGoalForm() {
  document.querySelector("#goalForm").reset();
  document.querySelector("#goalId").value = "";
}
