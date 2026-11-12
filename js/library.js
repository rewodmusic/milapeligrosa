/* ==========================================================
   MILA'S LIBRARY
   Interactive 3D Vinyl Archive

   Database:
   database/releases.json

   Covers:
   database/album_cover/YYYY_MM_DD.jpg / png / etc.
   ========================================================== */

(() => {
  "use strict";

  const CONFIG = {
    database: "database/releases.json",
    coverFolder: "database/album_cover/",

    albumsPerShelf: 3,

    animationDuration: 850,
    vinylDuration: 1000,

    coverExtensions: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "avif",
      "gif"
    ]
  };

  const root = document.getElementById("library");
  const shelvesContainer =
    document.getElementById("library-shelves");

  if (!root || !shelvesContainer) return;

let albums = [];
let activeId = null;
let busy = false;

/* LOAD MORE SETTINGS */

const INITIAL_SHELVES = 3;
const SHELVES_PER_LOAD = 3;

let visibleShelves = INITIAL_SHELVES;

const loadMoreButton =
  document.getElementById("library-load-more");

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  /* ========================================================
     HELPERS
     ======================================================== */

  const wait = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  function el(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    if (text !== undefined) {
      node.textContent = text;
    }

    return node;
  }

  function normalizeDate(date) {
    return String(date || "").replace(/_/g, "-");
  }

  function validUrl(value) {
    if (typeof value !== "string") return null;

    try {
      const url = new URL(value, window.location.href);

      if (url.protocol === "https:" ||
          url.protocol === "http:") {
        return url.href;
      }
    } catch {
      // Invalid URL
    }

    return null;
  }

  function chunks(items, size) {
    const result = [];

    for (let i = 0; i < items.length; i += size) {
      result.push(items.slice(i, i + size));
    }

    return result;
  }

  /* ========================================================
     IMAGE LOADER
     Tries multiple image extensions automatically.
     ======================================================== */

  function findCover(date) {
    return new Promise((resolve) => {
      const safeDate = encodeURIComponent(date);
      let index = 0;

      function tryNext() {
        if (index >= CONFIG.coverExtensions.length) {
          resolve(null);
          return;
        }

        const extension = CONFIG.coverExtensions[index++];

        const url =
          CONFIG.coverFolder +
          safeDate +
          "." +
          extension;

        const image = new Image();

        image.onload = () => resolve(url);
        image.onerror = tryNext;

        image.src = url;
      }

      tryNext();
    });
  }

  /* ========================================================
     LOAD RELEASES
     Includes collaborations and featured releases.
     ======================================================== */

  async function loadAlbums() {
    const response = await fetch(CONFIG.database, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(
        `Could not load releases: ${response.status}`
      );
    }

    const data = await response.json();

    const releases = Array.isArray(data)
      ? data
      : Array.isArray(data.releases)
        ? data.releases
        : Object.values(data).filter(
            (item) =>
              item &&
              typeof item === "object" &&
              item.date
          );

    const sorted = releases
      .filter((item) => item && item.date && item.title)
      .sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );

    // Newest first. Features are NOT excluded.
    // feat_but_main is intentionally ignored here.

    return Promise.all(
      sorted.map(async (release, index) => {
        const date = String(release.date);

        return {
          ...release,

          id: `${date}-${index}`,
          date,
          title: String(release.title),
          cover: await findCover(date)
        };
      })
    );
  }

  /* ========================================================
     SHELF LAYOUT

     CLOSED:
       [A B C]
       [D E F]
       [G H I]

     OPEN E:
       [A B C]
       [   E   ]
       [D F G]
       [H I ...]

     Close => returns to the original order.
     ======================================================== */

  function getLayout() {
    if (!activeId) {
      return chunks(albums, CONFIG.albumsPerShelf)
        .map((items) => ({
          items,
          selected: false
        }));
    }

    const selectedIndex = albums.findIndex(
      (album) => album.id === activeId
    );

    if (selectedIndex < 0) {
      return chunks(albums, CONFIG.albumsPerShelf)
        .map((items) => ({
          items,
          selected: false
        }));
    }

    const shelfIndex = Math.floor(
      selectedIndex / CONFIG.albumsPerShelf
    );

    const shelfStart =
      shelfIndex * CONFIG.albumsPerShelf;

    const before = albums.slice(0, shelfStart);

    const selected = albums[selectedIndex];

    const remaining = albums
      .slice(shelfStart)
      .filter((album) => album.id !== activeId);

    const layout = [];

    for (
      const group of chunks(before, CONFIG.albumsPerShelf)
    ) {
      layout.push({
        items: group,
        selected: false
      });
    }

    layout.push({
      items: [selected],
      selected: true
    });

    for (
      const group of chunks(
        remaining,
        CONFIG.albumsPerShelf
      )
    ) {
      layout.push({
        items: group,
        selected: false
      });
    }

    return layout;
  }

  /* ========================================================
     3D VINYL CARD
     ======================================================== */

  function createAlbum(album, position, selected) {
    const item = el("div", "library__item");

    item.dataset.albumId = album.id;
    item.dataset.angle = String(position);

    if (selected) {
      item.classList.add("library__item--active");
    }

    const button = el(
      "button",
      "library__album-button"
    );

    button.type = "button";

    button.setAttribute(
      "aria-label",
      selected
        ? `Close ${album.title}`
        : `Open ${album.title}`
    );

    button.setAttribute(
      "aria-expanded",
      String(selected)
    );

    button.addEventListener("click", () => {
      toggleAlbum(album.id);
    });

    const album3d = el("div", "library__album3d");

    // Record behind the sleeve
    const record = el("div", "library__record");

    record.setAttribute("aria-hidden", "true");

if (album.cover) {
  record.style.backgroundImage = `url("${album.cover}")`;
  record.style.backgroundSize = "cover";
  record.style.backgroundPosition = "center";
  record.style.backgroundRepeat = "no-repeat";
}

    // Sleeve
    const sleeve = el("div", "library__sleeve");

    if (album.cover) {
      const image = el("img", "library__cover");

      image.src = album.cover;
      image.alt = `${album.title} album cover`;
      image.loading = "lazy";
      image.decoding = "async";

      sleeve.appendChild(image);
    } else {
      const fallback = el(
        "div",
        "library__cover library__cover--missing",
        album.title
      );

      fallback.style.cssText = `
        display:grid;
        place-items:center;
        padding:8px;
        background:linear-gradient(
          135deg,#60DDE1,#F16AC7
        );
        color:#111;
        font:900 15px/1 var(--type);
        text-align:center;
        overflow-wrap:anywhere;
      `;

      sleeve.appendChild(fallback);
    }

    album3d.append(record, sleeve);

   button.appendChild(album3d);
    item.appendChild(button);

    return item;
  }

  /* ========================================================
     LINKTREE
     ======================================================== */

  function createLink(label, url, index) {
    const link = el("a", "library__service");

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    link.append(
      el(
        "span",
        "library__service-number",
        String(index).padStart(2, "0")
      ),
      el(
        "span",
        "library__service-label",
        label
      ),
      el(
        "span",
        "library__service-arrow",
        "↗"
      )
    );

    return link;
  }

  function createDetails(album) {
    const details = el(
      "div",
      "library__details"
    );

    const inner = el(
      "div",
      "library__details-inner"
    );

    const heading = el(
      "div",
      "library__details-heading"
    );

    heading.append(
      el("span", "", "NOW PLAYING"),
      el("span", "", normalizeDate(album.date))
    );

    inner.appendChild(heading);

   /* EP megjelölés a cím után */

const isEP =
  String(album.ep || "").trim().toLowerCase() === "x";

const displayTitle = isEP
  ? `${album.title} EP`
  : album.title;

inner.appendChild(
  el(
    "h3",
    "library__details-title",
    displayTitle
  )
);

    if (album.feat && String(album.feat).trim()) {
      inner.appendChild(
        el(
          "p",
          "library__details-feature",
          `X ${album.feat}`
        )
      );
    }

    const links = el(
      "div",
      "library__details-links"
    );

    const platforms = [
      ["SPOTIFY", album.spotifyurl],
      ["DEEZER", album.deezerurl],
      ["YOUTUBE", album.youtubeurl],
      ["APPLE MUSIC", album.appleurl]
    ];

    let linkIndex = 1;

    for (const [label, rawUrl] of platforms) {
      const url = validUrl(rawUrl);

      if (!url) continue;

      links.appendChild(
        createLink(label, url, linkIndex++)
      );
    }

    if (!links.children.length) {
      links.appendChild(
        el(
          "p",
          "library__loading",
          "NO LISTENING LINKS YET ♡"
        )
      );
    }

    inner.appendChild(links);

    const close = el(
      "button",
      "library__close",
      "CLOSE RECORD ×"
    );

    close.type = "button";

    close.addEventListener("click", () => {
      toggleAlbum(album.id);
    });

    inner.appendChild(close);
    details.appendChild(inner);

    return details;
  }

  /* ========================================================
     BUILD ONE SHELF
     ======================================================== */

  function createShelf(group, shelfNumber) {
    const shelf = el(
      "div",
      "library__shelf"
    );

    shelf.dataset.shelf = shelfNumber;

    if (group.selected) {
      shelf.classList.add("is-selected");
    }

    const items = el(
      "div",
      "library__shelf-items"
    );

    group.items.forEach((album, position) => {
      items.appendChild(
        createAlbum(
          album,
          position,
          group.selected
        )
      );
    });

    shelf.appendChild(items);

    shelf.appendChild(
      el("div", "library__shelf-metal")
    );

    if (group.selected) {
      shelf.appendChild(
        createDetails(group.items[0])
      );
    }

    return shelf;
  }

  /* ========================================================
     FLIP ANIMATION

     Records smoothly move between shelf positions
     instead of abruptly jumping.
     ======================================================== */

  function capturePositions() {
    const positions = new Map();

    shelvesContainer
      .querySelectorAll("[data-album-id]")
      .forEach((element) => {
        positions.set(
          element.dataset.albumId,
          element.getBoundingClientRect()
        );
      });

    return positions;
  }

  function animateReflow(previous) {
    if (reducedMotion.matches) return;

    shelvesContainer
      .querySelectorAll("[data-album-id]")
      .forEach((element) => {
        const old = previous.get(
          element.dataset.albumId
        );

        if (!old) return;

        const next = element.getBoundingClientRect();

        const dx = old.left - next.left;
        const dy = old.top - next.top;

        if (Math.abs(dx) < 1 &&
            Math.abs(dy) < 1) {
          return;
        }

        element.animate(
          [
            {
              transform:
                `translate(${dx}px, ${dy}px)`
            },
            {
              transform: "translate(0, 0)"
            }
          ],
          {
            duration: CONFIG.animationDuration,
            easing: "cubic-bezier(.22,1,.36,1)"
          }
        );
      });
  }


  /* ========================================================
     RENDER
     ======================================================== */

/* ==========================================
   LIBRARY — LOAD MORE VISIBILITY
   ========================================== */

function updateLoadMore(totalShelves) {
  if (!loadMoreButton) return;

  const remaining = totalShelves - visibleShelves;

  loadMoreButton.hidden = remaining <= 0;

  if (remaining > 0) {
    loadMoreButton.setAttribute(
      "aria-label",
      `Load more albums (${remaining} shelves remaining)`
    );
  } else {
    loadMoreButton.removeAttribute("aria-label");
  }
}

/* ==========================================
   LIBRARY — RENDER
   ========================================== */


function render(animate = true) {
  const previous = animate
    ? capturePositions()
    : new Map();

  // Csak a LOAD MORE által feloldott albumokat kezeljük.
  const visibleAlbums = albums.slice(
    0,
    visibleShelves * CONFIG.albumsPerShelf
  );

  let layout = [];

  if (activeId === null) {
    layout = chunks(
      visibleAlbums,
      CONFIG.albumsPerShelf
    ).map(items => ({
      items,
      selected: false
    }));
  } else {
    const selectedIndex = visibleAlbums.findIndex(
      album => album.id === activeId
    );

    if (selectedIndex < 0) {
      layout = chunks(
        visibleAlbums,
        CONFIG.albumsPerShelf
      ).map(items => ({
        items,
        selected: false
      }));
    } else {
      const shelfStart =
        Math.floor(selectedIndex / CONFIG.albumsPerShelf)
        * CONFIG.albumsPerShelf;

      const before = visibleAlbums.slice(0, shelfStart);
      const selected = visibleAlbums[selectedIndex];

      const remaining = visibleAlbums
        .slice(shelfStart)
        .filter(album => album.id !== activeId);

      layout = [
        ...chunks(before, CONFIG.albumsPerShelf).map(
          items => ({ items, selected: false })
        ),
        {
          items: [selected],
          selected: true
        },
        ...chunks(remaining, CONFIG.albumsPerShelf).map(
          items => ({ items, selected: false })
        )
      ];
    }
  }

  const fragment = document.createDocumentFragment();

  layout.forEach((group, index) => {
    fragment.appendChild(
      createShelf(group, index + 1)
    );
  });

  shelvesContainer.replaceChildren(fragment);

  // A korábbi 3D albumméret-javítás megtartása.
  shelvesContainer
    .querySelectorAll(".library__shelf-items")
    .forEach(shelfItems => {
      const styles = getComputedStyle(shelfItems);

      const paddingLeft =
        parseFloat(styles.paddingLeft) || 0;

      const paddingRight =
        parseFloat(styles.paddingRight) || 0;

      const gap =
        parseFloat(styles.columnGap) || 0;

      const availableWidth =
        shelfItems.clientWidth -
        paddingLeft -
        paddingRight;

      const coverSize =
        (availableWidth - gap * 2) / 3;

      shelfItems.style.setProperty(
        "--library-cover-size",
        `${Math.max(1, coverSize)}px`
      );
    });

  // A teljes gyűjtemény alapján állítjuk a gombot.
  updateLoadMore(
    Math.ceil(albums.length / CONFIG.albumsPerShelf)
  );

  if (animate) {
    animateReflow(previous);
  }

  return shelvesContainer.querySelector(
    ".library__shelf.is-selected"
  );
}




  /* ========================================================
     OPEN / CLOSE

     Close plays the vinyl animation in reverse,
     then restores the original shelves.
     ======================================================== */

  async function openAlbum(id) {
    activeId = id;

    const shelf = render(true);

    if (!shelf) return;

    // Initial closed state is painted first.
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    shelf.classList.add("is-open");

    const item = shelf.querySelector(
      ".library__item--active"
    );

    if (item) {
      item.classList.add("is-open");
    }

    await wait(
      reducedMotion.matches
        ? 0
        : CONFIG.vinylDuration
    );
  }

  async function closeAlbum() {
    const shelf = shelvesContainer.querySelector(
      ".library__shelf.is-selected"
    );

    if (shelf) {
      shelf.classList.remove("is-open");

      const item = shelf.querySelector(
        ".library__item--active"
      );

      if (item) {
        item.classList.remove("is-open");
      }

      // Wait for the record to roll back.
      await wait(
        reducedMotion.matches
          ? 0
          : CONFIG.vinylDuration
      );
    }

    activeId = null;

    // Restore the original 3-per-shelf arrangement.
    render(true);

    await wait(
      reducedMotion.matches
        ? 0
        : CONFIG.animationDuration
    );
  }

  async function toggleAlbum(id) {
    if (busy) return;

    busy = true;

    try {
      if (activeId === id) {
        await closeAlbum();
      } else {
        if (activeId !== null) {
          await closeAlbum();
        }

        await openAlbum(id);
      }
    } finally {
      busy = false;
    }
  }

  /* ========================================================
     INITIALIZE
     ======================================================== */

  async function init() {
    try {
      albums = await loadAlbums();

      if (!albums.length) {
        shelvesContainer.replaceChildren(
          el(
            "p",
            "library__empty",
            "THE LIBRARY IS EMPTY... FOR NOW ♡"
          )
        );

        return;
      }

      render(false);

    } catch (error) {
      console.error(
        "Mila's Library could not load:",
        error
      );

      shelvesContainer.replaceChildren(
        el(
          "p",
          "library__empty",
          "COULDN'T OPEN THE LIBRARY ♡"
        )
      );
    }
  }



/* ==========================================
   LIBRARY — LOAD MORE BUTTON
   ========================================== */

if (loadMoreButton) {
  loadMoreButton.addEventListener("click", () => {
    if (busy) return;

    visibleShelves += SHELVES_PER_LOAD;

    render(true);
  });
}

init();
})();