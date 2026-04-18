document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("yr");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  document.body.classList.add("is-ready");
});
