// Function to get currently playing track from Spotify
async function getCurrentlyPlaying() {
  // Request the access token from the background script
  chrome.runtime.sendMessage({ action: "getAccessToken" }, (response) => {
    const accessToken = response.accessToken;

    fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (response.status === 204) {
          // No Content: No active device or playback
          console.log("No active device or playback (204 No Content)");
          document.getElementById("song-title").textContent =
            "Not playing any song";
          document.getElementById("song-artist").textContent = "";
          document.getElementById("song-artwork").src = "";
        } else if (response.ok) {
          return response.json();
        } else {
          console.error(
            "Failed to get Spotify playback state:",
            response.statusText
          );
          document.getElementById("song-title").textContent =
            "Error fetching data";
          document.getElementById("song-artist").textContent = "";
          document.getElementById("song-artwork").src = "";
        }
      })
      .then((data) => {
        if (data && data.item) {
          document.getElementById("is-playing").textContent = data.is_playing
            ? "Playing"
            : "Paused";
          document.getElementById("song-title").textContent = data.item.name;
          document.getElementById("song-artist").textContent = data.item.artists
            .map((artist) => artist.name)
            .join(", ");
          document.getElementById("song-artwork").src =
            data.item.album.images[0].url;
        } else {
          document.getElementById("song-title").textContent =
            "Not playing any song";
          document.getElementById("song-artist").textContent = "";
          document.getElementById("song-artwork").src = "";
        }
      })
      .catch((error) => {
        console.error("Failed to get currently playing track:", error);
        document.getElementById("song-title").textContent = "Error";
        document.getElementById("song-artist").textContent = "";
        document.getElementById("song-artwork").src = "";
      });
  });
}

// Call the function when the popup is opened
document.addEventListener("DOMContentLoaded", getCurrentlyPlaying);
