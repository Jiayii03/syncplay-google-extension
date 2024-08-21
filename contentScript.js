// Function to add event listeners to a video element
function addVideoEventListeners(video, platform) {
  console.log("video", video);
  if (video) {
    video.addEventListener("play", () => {
      chrome.runtime.sendMessage({
        type: `${platform}-state-change`,
        state: "play",
      });
      console.log(`${platform} play`);
    });

    video.addEventListener("pause", () => {
      chrome.runtime.sendMessage({
        type: `${platform}-state-change`,
        state: "pause",
      });
      console.log(`${platform} pause`);
    });

  }
}

// Function to observe and attach listeners when video element is added to DOM
function observeVideo(platform) {
  console.log("Observing for", platform);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'VIDEO') {
          addVideoEventListeners(node, platform);
          observer.disconnect(); // Stop observing once the video is found and listeners are added
        } else if (node.querySelector && node.querySelector('video')) {
          addVideoEventListeners(node.querySelector('video'), platform);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Check if video element is already present
  const existingVideo = document.querySelector("video");
  if (existingVideo) {
    addVideoEventListeners(existingVideo, platform);
  }
}


// Check the URL and observe accordingly
if (window.location.hostname.includes("youtube.com")) {
  observeVideo("youtube");
} else if (window.location.hostname.includes("udemy.com")) {
  observeVideo("udemy");
}
