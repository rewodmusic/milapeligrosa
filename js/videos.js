
/* ==========================================================
   MILA PELIGROSA — LATEST VIDEOS
   Data: database/releases.json
   ========================================================== */

(() => {
  "use strict";

  const CONFIG = {
    database: "database/releases.json",
    maxVideos: 3
  };

  const root = document.getElementById("latest-videos");
  const list = document.getElementById("videos-list");
  const count = root?.querySelector(".videos__count");

  if (!root || !list) return;

  /* ------------------------------------------
     YOUTUBE URL PARSER
     ------------------------------------------ */

  function youtubeEmbed(rawUrl) {
    if (!rawUrl) return null;

    try {
      const url = new URL(rawUrl);

      const host = url.hostname.toLowerCase();

      const isYoutube =
        host === "youtube.com" ||
        host === "www.youtube.com" ||
        host === "m.youtube.com" ||
        host === "music.youtube.com" ||
        host === "youtu.be" ||
        host === "www.youtube-nocookie.com";

      if (!isYoutube) return null;

      let videoId = null;

      if (host === "youtu.be") {
        videoId = url.pathname.split("/")[1];
      } else if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else if (
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/live/")
      ) {
        videoId = url.pathname.split("/")[2];
      }

      const playlistId = url.searchParams.get("list");

      const validVideo =
        /^[a-zA-Z0-9_-]{11}$/.test(videoId || "");

      const validPlaylist =
        /^[a-zA-Z0-9_-]+$/.test(playlistId || "");

      if (validVideo) {
        const embed = new URL(
          `https://www.youtube.com/embed/${videoId}`
        );

        if (validPlaylist) {
          embed.searchParams.set("list", playlistId);
        }

        embed.searchParams.set("rel", "0");

        return embed.toString();
      }

      if (validPlaylist) {
        return (
          "https://www.youtube.com/embed/videoseries" +
          "?list=" +
          encodeURIComponent(playlistId)
        );
      }

      return null;
    } catch {
      return null;
    }
  }

  /* ------------------------------------------
     RELEASE FORMATTING
     ------------------------------------------ */

  function displayTitle(release) {
    const ep =
      String(release.ep || "")
        .trim()
        .toLowerCase() === "x";

    return ep
      ? `${release.title} EP`
      : String(release.title);
  }

  function formatDate(date) {
    return String(date || "").replace(/_/g, ".");
  }

  function getVideoUrl(release) {
    const ep =
      String(release.ep || "")
        .trim()
        .toLowerCase() === "x";

    if (ep) {
      return (
        youtubeEmbed(release.youtube_ep_prew_url) ||
        youtubeEmbed(release.youtubeurl)
      );
    }

    return youtubeEmbed(release.youtubeurl);
  }

  /* ------------------------------------------
     CREATE VIDEO
     ------------------------------------------ */

  function createVideo(release, index) {
    const article = document.createElement("article");
    article.className = "videos__item";

    const number = String(index + 1).padStart(2, "0");

    const header = document.createElement("div");
    header.className = "videos__item-header";

    const titleGroup = document.createElement("div");
    titleGroup.className = "videos__title-group";

    const numberElement = document.createElement("span");
    numberElement.className = "videos__number";
    numberElement.textContent = number;

    const title = document.createElement("h3");
    title.className = "videos__title";
    title.textContent = displayTitle(release);

    titleGroup.append(numberElement, title);

    const date = document.createElement("span");
    date.className = "videos__date";
    date.textContent = formatDate(release.date);

    header.append(titleGroup, date);

    const playerFrame = document.createElement("div");
    playerFrame.className = "videos__player-frame";

    const iframe = document.createElement("iframe");
    iframe.className = "videos__player";

    iframe.src = release.embedUrl;
    iframe.title = `${displayTitle(release)} — YouTube video`;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
  

    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; " +
      "encrypted-media; gyroscope; picture-in-picture; " +
      "web-share"
    );

    iframe.setAttribute("allowfullscreen", "");

    playerFrame.appendChild(iframe);

    const meta = document.createElement("div");
    meta.className = "videos__meta";

    const metaLeft = document.createElement("span");
    metaLeft.textContent = "MILA PELIGROSA / OFFICIAL VIDEO";

    const metaRight = document.createElement("span");
    metaRight.textContent = "WATCH ME ↗";

    meta.append(metaLeft, metaRight);

    article.append(header, playerFrame, meta);

    return article;
  }

  /* ------------------------------------------
     LOAD VIDEOS
     ------------------------------------------ */

  async function init() {
    try {
      const response = await fetch(CONFIG.database, {
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const releases = Array.isArray(data)
        ? data
        : Array.isArray(data.releases)
          ? data.releases
          : Object.values(data).filter(
              item => item && typeof item === "object"
            );

      const videos = releases
        .filter(release =>
          release &&
          release.date &&
          String(release.title || "").trim()
        )
        .map(release => ({
          ...release,
          embedUrl: getVideoUrl(release)
        }))
        .filter(release => release.embedUrl)
        .sort((a, b) =>
          String(b.date).localeCompare(String(a.date))
        )
        .slice(0, CONFIG.maxVideos);

      list.replaceChildren();

      if (!videos.length) {
        const empty = document.createElement("p");
        empty.className = "videos__loading";
        empty.textContent = "NO VIDEOS YET ♡";

        list.appendChild(empty);

        if (count) count.textContent = "00 / VIDEOS";

        return;
      }

      const fragment = document.createDocumentFragment();

      videos.forEach((release, index) => {
        fragment.appendChild(
          createVideo(release, index)
        );
      });

      list.appendChild(fragment);

      if (count) {
        count.textContent =
          `${String(videos.length).padStart(2, "0")} / SELECTED VIDEOS`;
      }

    } catch (error) {
      console.error("Latest Videos:", error);

      list.textContent = "COULDN'T LOAD VIDEOS ♡";
    }
  }

  init();
})();
