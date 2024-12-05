async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

let thetab;

//Firefox doesnt listen to .html in the css so this is required
window.addEventListener('load', function() {
  document.body.style.width = '300px';
  document.body.style.height = '300px';
});


//this function is generated by chatgpt cause I didnt know how to update the image
function changeBackgroundImage(url) {
  const mainElement = document.querySelector(".main");

  // Change the background of the `.main` element
  mainElement.style.backgroundImage = `url('${url}')`;

  // Update the `::before` pseudo-element background using a CSS rule
  const styleSheet = document.styleSheets[0]; // Use the first stylesheet in the document
  const beforeRuleIndex = Array.from(styleSheet.cssRules).findIndex(
    (rule) => rule.selectorText === ".main::before"
  );

  // If the rule exists, update it; otherwise, add it
  if (beforeRuleIndex !== -1) {
    styleSheet.cssRules[
      beforeRuleIndex
    ].style.backgroundImage = `url('${url}')`;
  } else {
    styleSheet.insertRule(
      `.main::before { background-image: url('${url}'); }`,
      styleSheet.cssRules.length
    );
  }
}

async function getLinks(id) {
  let data;
  try {
    const query = `https://vocadb.net/api/songs/${id}?fields=PVs`;
    const response = await fetch(query);
    data = await response.json();
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
  } catch (error) {
    console.error(error.message);
    throw error;
  }
  const platforms = document.querySelector(".links");
  const linkstext = document.querySelector(".linkstext");

  linkstext.innerHTML = "<h2>Links</h2";
  let links = [];
  data.pvs.forEach((platform) => {
    const allowed = [
      "billibilli",
      "niconicodouga",
      "youtube",
      "spotify",
      "soundcloud",
    ];
    if (!allowed.includes(platform.service.toLowerCase())) {
      return;
    }
    links.push(platform.service + "-" + platform.url);
  });

  links.forEach((platform) => {
    link = platform.split("-");
    platforms.innerHTML += `
    <a href="${link[1]}" target="_blank">
    <img class="svg" src="assets/logos/${link[0].toLowerCase()}.svg" alt="${
      link[1]
    }">
    </a>
    `;
  });
}

async function getVocalists(id) {
  let data;
  try {
    const query = `https://vocadb.net/api/songs/${id}?fields=Artists&lang=English`;
    const response = await fetch(query);
    data = await response.json();
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
  } catch (error) {
    console.error(error.message);
    throw error;
  }
  const artisttext = document.querySelector(".loading");
  artisttext.textContent = "Artists";
  const vocalistsContainer = document.querySelector(".vocalists");
  data.artists.forEach((artist) => {
    let artisttypeclass = artist.artist.artistType;
    let artisttype = artist.artist.artistType.toUpperCase();
    if (artist.categories !== "Vocalist" && artist.categories !== "Producer") {
      return;
    }
    if (artist.categories !== "Vocalist") {
      artisttypeclass = artist.categories;
    }
    //Gets rid of the "unkown producer" user
    if (artist.id == 23966) {
      return;
    }

    const vocalistRow = document.createElement("div");
    vocalistRow.classList.add("vocalist-row");

    vocalistRow.innerHTML = `
      <img src="https://vocadb.net/Artist/PictureThumb/${artist.artist.id}" class="vocalist-image">
      <div class="vocalistinfo">
        <h3><a class="vocalist" target="_blank" href="https://vocadb.net/Ar/${artist.artist.id}">${artist.name}</a></h3>
      </div>
      <a class="vocaltype ${artisttypeclass}">${artisttype}</a>
    `;
    vocalistsContainer.appendChild(vocalistRow);
    artisttype.toUpperCase();
  });
}

async function callVoca(url) {
  const loadingimage = document.querySelector(".loadingmiku");
  const loadingtext = document.querySelector(".loading");
  try {
    const query = `https://vocadb.net/api/songs?query=${url}&childTags=false&unifyTypesAndTags=false&childVoicebanks=false&includeMembers=false&onlyWithPvs=false&start=0&maxResults=10&getTotalCount=false&preferAccurateMatches=false&fields=ThumbUrl&lang=english`;
    const response = await fetch(query);
    if (!response.ok) {      
      loadingimage.src = "";
      loadingtext.textContent = "Something went wrong Check console for more info!"
      throw new Error(`Response status: ${response.status}`);
    }

    const data = await response.json();

    loadingimage.src = "";
    if (data.items.length == 0) {
      return (loadingtext.textContent = "No results found!");
    }
    const song = data.items[0];
    const id = song.id;

    loadingtext.textContent = "Results found!";
    const currentlylistening = document.querySelector(".currentlylistening");
    currentlylistening.textContent = `${song.name} (${song.defaultName})`;
    currentlylistening.href = "https://vocadb.net/S/" + id;
    changeBackgroundImage(song.thumbUrl);
    getVocalists(id);
    getLinks(id);
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

const regex = new RegExp("^(?!https?://)([a-zA-Z0-9+.-]+://).*"); //checks if a tab is a valid tab (not chrome://newtab etc etc) Generated by chatgpt
const regexfirefox = new RegExp("^about:.*$") //cause firefox has different naming thing

getCurrentTab().then(async (tab) => {
  thetab = tab;
  if (regex.test(thetab.url) || regexfirefox.test(thetab.url)) {
    const loadingtext = document.querySelector(".loading");
    loadingtext.textContent = "This tab isn't supported!";
    const loadingimage = document.querySelector(".loadingmiku");
    loadingimage.src = "";
    return;
  }
  await callVoca(thetab.url);
});
