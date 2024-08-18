const video = document.querySelector("video");

if (video) {
  video.addEventListener("play", () => {
    chrome.runtime.sendMessage({ type: "youtube-state-change", state: "play" });
  });

  video.addEventListener("pause", () => {
    chrome.runtime.sendMessage({ type: "youtube-state-change", state: "pause" });
  });
}
