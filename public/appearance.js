const KEY = "appearance";
const root = document.documentElement;

function stored() {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function remember(choice) {
  try {
    if (choice === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {}
}

function apply(choice) {
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
}

apply(stored());

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("[data-appearance]");
  const mark = (choice) =>
    buttons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.appearance === choice));
  mark(stored());
  buttons.forEach((button) =>
    button.addEventListener("click", ({ currentTarget }) => {
      const choice = currentTarget.dataset.appearance;
      remember(choice);
      apply(choice);
      mark(choice);
    }),
  );
});
