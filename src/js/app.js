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

// Keep each initializer focused so future modules can be added without rewiring the app.
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initFinanceTabs();
  initQuoteSlider();
});

function initNavigation() {
  document.querySelectorAll("[data-view-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      showView(trigger.dataset.viewTrigger);
    });
  });
}

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
