document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => anchor.addEventListener("click", event => { const target = document.querySelector(anchor.hash); if (target) { event.preventDefault(); target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); } }));

const downloadUrl = import.meta.env.VITE_POQIT_STORE_URL;
const downloadLink = document.querySelector<HTMLAnchorElement>("#download-link");
const downloadStatus = document.querySelector<HTMLElement>("#download-status");
if (downloadLink && downloadStatus && downloadUrl) {
  const url = new URL(downloadUrl);
  if (url.protocol !== "https:" || url.hostname !== "apps.microsoft.com") throw new Error("POQIT Store URL must use apps.microsoft.com over HTTPS.");
  downloadLink.href = url.href;
  downloadLink.style.display = "inline-flex";
  downloadStatus.textContent = "Install POQIT for Windows from Microsoft Store.";
}
