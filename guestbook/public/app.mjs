const form = document.getElementById("guestbook");
const options = document.getElementById("options");
const button = document.getElementById("submit");
const label = document.getElementById("submit-label");
const result = document.getElementById("result");
const retry = document.getElementById("retry");
const selected = document.getElementById("selected");
const consent = document.getElementById("consent");
let token = "", widget, busy = false, assets = [];
const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const saveStorage = (key, value) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* Selection still works when browser storage is unavailable. */ } };
const current = () => form.querySelector('input[name="asset"]:checked')?.value;
function status(text, type = "") { result.textContent = text; result.className = type; }
function friendlyError(error) {
  if (error.name === "TimeoutError") return "응답을 확인하지 못했습니다. 선택한 소품 그대로 다시 시도해 주세요.";
  if (error instanceof TypeError || error instanceof SyntaxError) return "서버에 연결하지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.";
  return error.message || "완료하지 못했습니다. 다시 시도해 주세요.";
}
function loading(value, text = "이 소품으로 인사 남기기") {
  busy = value; button.disabled = value; button.setAttribute("aria-busy", String(value)); label.textContent = text;
  document.getElementById("choices").disabled = value; consent.disabled = value;
}
async function turnstileReady() {
  if (window.turnstile) return;
  await new Promise((resolve, reject) => {
    const script = document.getElementById("turnstile-script");
    const timer = setTimeout(() => reject(new Error("도배 방지 확인을 불러오지 못했습니다. 다시 시도해 주세요.")), 15000);
    script.addEventListener("load", () => { clearTimeout(timer); resolve(); }, { once: true });
    script.addEventListener("error", () => { clearTimeout(timer); reject(new Error("도배 방지 확인을 불러오지 못했습니다.")); }, { once: true });
  });
}
async function initialize() {
  loading(true, "등록 준비 중"); retry.hidden = true; status("");
  try {
    const response = await fetch("/api/config", { cache: "no-store", signal: AbortSignal.timeout(15000) });
    const config = await response.json();
    if (!response.ok) throw new Error(config.error || "등록 화면을 불러오지 못했습니다.");
    assets = config.objects; options.replaceChildren();
    for (const asset of assets) {
      const item = document.createElement("label"); item.className = "option";
      const radio = document.createElement("input"); radio.type = "radio"; radio.name = "asset"; radio.value = asset.id; radio.required = true;
      radio.setAttribute("aria-label", asset.label);
      const image = document.createElement("img"); image.src = `/choices/${asset.id}.png`; image.alt = ""; image.width = 560; image.height = 475;
      const name = document.createElement("span"); name.className = "option-name"; name.textContent = asset.label;
      radio.checked = readStorage("guestbook.asset") === asset.id;
      item.append(radio, image, name); options.append(item);
    }
    options.setAttribute("aria-busy", "false");
    const restored = assets.find((asset) => asset.id === current()); if (restored) selected.textContent = restored.label;
    await turnstileReady();
    if (widget !== undefined) window.turnstile.remove(widget);
    widget = window.turnstile.render("#challenge", { sitekey: config.siteKey, action: "guestbook", theme: "light", size: "flexible", callback: (value) => { token = value; }, "expired-callback": () => { token = ""; }, "error-callback": () => { token = ""; status("도배 방지 확인을 다시 진행해 주세요.", "error"); } });
    loading(false);
  } catch (error) { loading(false, "인사 남기기"); button.disabled = true; retry.hidden = false; status(friendlyError(error), "error"); }
}
form.addEventListener("change", () => {
  const asset = assets.find((asset) => asset.id === current());
  if (asset) { selected.textContent = asset.label; saveStorage("guestbook.asset", asset.id); }
});
retry.addEventListener("click", initialize);
form.addEventListener("submit", async (event) => {
  event.preventDefault(); if (busy || !form.reportValidity()) return;
  if (!token) { status("도배 방지 확인을 마친 뒤 등록해 주세요.", "error"); return; }
  const asset = current();
  let pending;
  try { pending = JSON.parse(readStorage("guestbook.pending")); } catch { pending = null; }
  if (pending?.asset !== asset || !pending?.requestId) pending = { asset, requestId: crypto.randomUUID() };
  saveStorage("guestbook.pending", JSON.stringify(pending));
  loading(true, "인사를 남기는 중"); status("");
  try {
    const response = await fetch("/api/greetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...pending, token, consent: consent.checked }), signal: AbortSignal.timeout(20000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "인사를 등록하지 못했습니다.");
    const time = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(data.greeting.expiresAt));
    const name = assets.find((item) => item.id === data.greeting.asset)?.label || "소품";
    status(`‘${name}’ 소품으로 인사를 남겼습니다.\n${time}(한국 시간)까지 표시됩니다.`, "success");
    saveStorage("guestbook.pending", null);
  } catch (error) { status(friendlyError(error), "error"); }
  finally { token = ""; window.turnstile.reset(widget); loading(false); }
});
await initialize();
