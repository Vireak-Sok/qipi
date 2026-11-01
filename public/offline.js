const status = document.getElementById("offline-status");
const retry = document.getElementById("offline-retry");

window.addEventListener("online", () => {
  if (status) status.textContent = "Connection restored. Reload Qipi to continue.";
  if (retry) retry.textContent = "Reload Qipi";
});

window.addEventListener("offline", () => {
  if (status) status.textContent = "Qipi needs an internet connection to load posts, messages, and map updates. Reconnect and try again.";
  if (retry) retry.textContent = "Try again";
});
