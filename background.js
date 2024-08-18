let accessToken = "";
let tokenExpiresAt = 0;

chrome.runtime.onInstalled.addListener(async () => {
  console.log("SyncPlay Extension Installed");
  await authenticateSpotify();
  await isSpotifyPlaying();
  console.log("Spotify authenticated");
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // When the active tab changes
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      console.log("Switched to a YouTube tab");
      await isSpotifyPlaying();
    }
  });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // When the tab is updated (e.g., user navigates to YouTube)
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("youtube.com/watch")
  ) {
    console.log("Navigated to a YouTube tab");
    await isSpotifyPlaying();
  }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "youtube-state-change") {
    const spotifyPlaying = await isSpotifyPlaying();

    if (message.state === "pause" && !spotifyPlaying) {
      controlSpotifyPlayback("play");
    } else if (message.state === "play" && spotifyPlaying) {
      controlSpotifyPlayback("pause");
    }
  }
});

async function authenticateSpotify() {
  const clientId = "187feba282c644a3a78741de1049e6c1";
  const redirectUri = chrome.identity.getRedirectURL("spotify");

  const scopes = "user-read-playback-state user-modify-playback-state";
  const encodedScopes = encodeURIComponent(scopes);
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${encodedScopes}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      (redirectUrl) => {
        if (redirectUrl) {
          const urlParams = new URLSearchParams(redirectUrl.split("#")[1]);
          accessToken = urlParams.get("access_token");
          const expiresIn = parseInt(urlParams.get("expires_in"), 10);
          console.log("Access token expires in", expiresIn, "seconds");
          tokenExpiresAt = Date.now() + expiresIn * 1000;
          console.log("Access token obtained: ", accessToken);
          resolve();
        } else {
          reject("Failed to authenticate with Spotify");
        }
      }
    );
  });
}

async function ensureValidToken() {
  if (Date.now() >= tokenExpiresAt) {
    console.log("Access token has expired, re-authenticating...");
    await authenticateSpotify();
  }
}

async function isSpotifyPlaying() {
  await ensureValidToken();

  return fetch("https://api.spotify.com/v1/me/player", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      if (response.status === 204) {
        // No Content: No active device or playback
        console.log("No active device or playback (204 No Content)");
        return false;
      } else if (response.ok) {
        return response.json();
      } else {
        console.error(
          "Failed to get Spotify playback state:",
          response.statusText
        );
        return false;
      }
    })
    .then((data) => {
      if (data && data.device && data.device.is_active) {
        if (data.is_playing) {
          console.log("Spotify is playing on an active device");
          return true;
        } else {
          console.log("Spotify is not playing, but there is an active device");
          return false;
        }
      } else {
        return false;
      }
    })
    .catch((error) => {
      console.error("Failed to get Spotify playback state:", error);
      return false;
    });
}

async function controlSpotifyPlayback(action) {
  ensureValidToken().then(() => {
    fetch(`https://api.spotify.com/v1/me/player/${action}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((response) => {
      console.log("Control Spotify playback response: ", response);
      if (!response.ok) {
        console.error("Failed to control Spotify playback:", response);
      }
    });
  });
}
