const quotes = [
  {
    text: "A budget is telling your money where to go instead of wondering where it went.",
    author: "John C. Maxwell"
  },
  {
    text: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett"
  },
  {
    text: "Small daily decisions compound into a very visible future.",
    author: "Dashboard note"
  },
  {
    text: "Financial peace is built in ordinary months.",
    author: "Dashboard note"
  }
];

let quoteIndex = 0;

export function initDashboardNavigation() {
  const landingView = document.querySelector("#landingView");
  const financeView = document.querySelector("#financeView");
  const placeholderView = document.querySelector("#placeholderView");
  const placeholderEyebrow = document.querySelector("#placeholderEyebrow");
  const placeholderTitle = document.querySelector("#placeholderTitle");

  document.querySelectorAll(".nav-card").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-card").forEach((entry) => entry.classList.remove("active"));
      button.classList.add("active");

      const section = button.dataset.section;
      const title = button.querySelector("span").textContent;
      landingView.classList.toggle("hidden", section !== "finance");
      financeView.classList.toggle("hidden", section !== "finance");
      placeholderView.classList.toggle("hidden", section === "finance");

      if (section !== "finance") {
        placeholderEyebrow.textContent = "Personal Dashboard";
        placeholderTitle.textContent = title;
      }
    });
  });
}

export function initQuoteSlider() {
  const quoteText = document.querySelector("#quoteText");
  const quoteAuthor = document.querySelector("#quoteAuthor");

  const renderQuote = () => {
    const quote = quotes[quoteIndex % quotes.length];
    quoteText.textContent = quote.text;
    quoteAuthor.textContent = quote.author;
    quoteIndex += 1;
  };

  renderQuote();
  setInterval(renderQuote, 4500);
}
