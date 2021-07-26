// KEYS
const NETFLIX_DATA_API_KEY = "c60e12e22fmsh35462b12fa5c85cp19996ajsn96e349f583a0";

const getNetflixData = async(id) => {
  // limited to 100 calls per day
  console.log("called");
  try {
    const response = await fetch(`https://unogsng.p.rapidapi.com/title?netflixid=${id}`, {
      	"method": "GET",
      	"headers": {
      		"x-rapidapi-host": "unogsng.p.rapidapi.com",
      		"x-rapidapi-key": NETFLIX_DATA_API_KEY
      	}
      }).catch(error => console.log(error));
    var data;
    if (response.status === 200) {
      data = await response.json();
    }
    console.log(data.results[0]);
    var { title, vtype, year, imdbrating } = await data.results[0];
    // needed information -- title, type: vtype, year,
    return { title, type: vtype, year, imbd: imdbrating };
  } catch(err) {
    console.log(err);
  }
};

const getRTResponse = async(url) => {
  // https://allorigins.win/ <-- proxy server api
  console.log(url);
  const response = await fetch(`https://api.allorigins.win/get?url=${url}`).then(response => response.json()).then(data => data.contents).catch(err => false);
  if (response.includes("404 - Not Found") || response === false) {
    return false;
  } else {
    // Convert the HTML string into a document object
    const parser = new DOMParser();
    var doc = parser.parseFromString(response, 'text/html');
    return doc;
  }
};

const pullListItem = async(data, list) => {
  var ratings, response, yearChecked = false;
  if (list.length === 1) {
    ratings = await getRTScores(list[0].url, data, data.year);
    console.log(ratings);
    return ratings;
  } else {
    var modifiedTitle = data.title.includes("and") ? data.title.replace("and", "&") : data.title;
    modifiedTitle = modifiedTitle.includes("&#39;") ? modifiedTitle.replace("&#39;", "'") : modifiedTitle;
    for (var i = 0; i < list.length; i++) {
      var year = data.type === "movie" ? list[i].releaseYear : list[i].startYear;
      if ((list[i].name === data.title || list[i].name === modifiedTitle) && Math.abs(+year - data.year) <= 1) {
        ratings = await getRTScores(list[i].url, data, data.year);
        console.log(ratings);
        return ratings;
      }
    }
  }
  return false;
}

const searchRT = async(data) => {
  var title = data.title.includes("&#39;") ? data.title.replace("&#39;", "'") : data.title;
  title = title.includes(" ") ? title.replace(/\s/g, "%20") : title;
  var search_url = `https://www.rottentomatoes.com/search?search=${title}`;
  console.log("search url: ");
  console.log(search_url);
  const response = await getRTResponse(search_url);
  if (response !== false) {
    var data_type = data.type === "movie" ? "movie" : "tv";
    console.log(`${data_type}s-json`);
    var list = JSON.parse(response.getElementById(`${data_type}s-json`).innerHTML).items;
    var ratings = await pullListItem(data, list);
    return ratings;
  }
  return false;
};

const getYearReleased = (response, data) => {
  var year;
  if (data.type === "series") {
    console.log("series year: ");
    var container = response.getElementsByClassName("fgm")[1].nextElementSibling !== undefined ? response.getElementsByClassName("fgm")[1].nextElementSibling : 0;
    year = container ? +container.innerText.split(" ")[2] : 0;
    console.log(year);
  } else {
    console.log("film year: ");
    var year1, year2;
    year1 = response.querySelectorAll("time")[0] ? +response.querySelectorAll("time")[0].getAttribute("datetime").split(" ")[2] : 3300;
    year2 = response.querySelectorAll("time")[1] ? +response.querySelectorAll("time")[1].getAttribute("datetime").split(" ")[2] : 3300;
    year = year1 <= year2 ? year1 : year2;
    console.log(year);
  }
  return year;
};

// Uses proxy server to scrape RT for TV shows
const getRTScores = async(url, data, year = null) => {
  const response = await getRTResponse(url);
  var ratings;
  console.log(`response: ${response !== false}`);
  if (response !== false) {
    if (year === null) year = getYearReleased(response, data);
    if (Math.abs(year - data.year) > 1) return false;
    console.log("response");
    // console.log(response);
    // console.log(+response.getElementsByClassName("mop-ratings-wrap__percentage")[0].innerText.split("%")[0]);
    var ratingsElement = response.getElementsByClassName("scoreboard")[0];
    var critic = await ratingsElement ? +ratingsElement.attributes.tomatometerscore.value : "N/A";
    var audience = await ratingsElement? +ratingsElement.attributes.audiencescore.value : "N/A";
    if (ratingsElement === undefined) {
      ratingsElement = response.getElementsByClassName("mop-ratings-wrap__percentage");
      critic = ratingsElement[0] ? +ratingsElement[0].innerText.split("%")[0] : "N/A";
      audience = ratingsElement[1] ? +ratingsElement[1].innerText.split("%")[0] : "N/A";
      console.log(`critic: ${critic}, audience: ${audience}`);
    }
    if (critic === "N/A" && audience === "N/A") return false;
      ratings =  {
        "title" : data.title,
        "year" : data.year,
        "critic" : `${critic}%`,
        "audience" : `${audience}%`,
        "imbd": data.imbd
      }
      console.log("ratings: ");
      console.log(ratings);
      return ratings === undefined ? false : ratings;
  }
  return false;
};

const formatTitle = (data) => {
  console.log(data.title);
  var title = data.title.toLowerCase().split(/[?!(]/)[0].trim();
  title = title.includes("/") ? title.replace(" / ", "_") : title;
  title = title.includes(",") ? title.replace(", ", "_") : title;
  title = title.includes("&") ? title.replace(" & ", "_") : title;
  title = title.includes("%") ? title.replace("%", "_") : title;
  title = title.includes("-") ? title.replace(/-/g, "_") : title;
  title = title.includes("'") ? title.replace(/'/g, "_") : title;
  title = title.includes("&#39;") ? title.replace("&#39;", "") : title;
  title = title.includes("marvel") ? title.substring(8) : title;
  title = title.includes(":") ? title.replace(":", "") : title;
  title = title.includes(".") ? title.replace(/\./g, "") : title;
  title = title.includes(" ") ? title.split(" ").join("_") : title;
  // some "extended-version" of movies are listed as series in unogsng
  title = title.includes("_extended_version") ? title.replace("_extended_version", "") : title;
  console.log(title);
  return title;
};


const getRTData = async(data) => {
  console.log("loading...");
  var specificURL = data.type === "movie" ? "https://www.rottentomatoes.com/m/" : "https://www.rottentomatoes.com/tv/";
  var unmodifiedTitle = data.title, title = formatTitle(data), url = specificURL + title;
  var rTData = await getRTScores(url, data);
  console.log(rTData);
  console.log(`1st check: ${rTData}`);
  console.log(url);
  if (rTData === false) {
      url = specificURL + title + "_" + data.year;
      rTData = await getRTScores(url, data);
      console.log(`2nd check: ${rTData}`);
      console.log(url);
      if (rTData === false && (title.startsWith("the_") || title.includes("_and_"))) {
        title = title.startsWith("the_") ? title.substring(4) : title;
        title = title.includes("_and_") ? title.replace("_and_", "_") : title;
        console.log(title);
        url = specificURL + title;
        rTData = await getRTScores(url, data);
        console.log(`3rd check: ${rTData}`);
        console.log(url);
        if (rTData === false) {
          // search for content with a RT id
          rTData = await searchRT(data);
          console.log(`4th check: ${rTData}`);
          return rTData === false || rTData === undefined ? { "title": data.title, "imdb": data.imbd } : rTData;
        } else {
          return rTData;
        }
      } else {
        if (rTData === false) {
          rTData = await searchRT(data);
          console.log(`4th check: ${rTData}`);
          return rTData === false || rTData === undefined ? { "title": data.title, "imdb": data.imbd } : rTData;
        } else {
          return rTData;
        }
      }
    } else {
      if (rTData === false) {
        rTData = await searchRT(data);
        console.log(`4th check: ${rTData}`);
        return rTData === false || rTData === undefined ? { "title": data.title, "imdb": data.imbd } : rTData;
      } else {
        return rTData;
      }
    }
};

const displayRTData = async(anchorTag, rTData, buttonPosition) => {
  anchorTag.innerHTML = "";
  // anchorTag.classList.remove("ltr-pjs1vp");
  anchorTag.style.cssText = "border-radius: 2px !important; padding: 0 0.8rem 0 0.8rem !important;"; // "display: flex; width: 100% !important; flex-wrap: wrap !important; border: 1px solid rgba(255, 255, 255, 0.7); color: white; border-radius: 2px; padding: 0 0.8rem 0 0.8rem;"
  var div = document.createElement("div");
  div.style.cssText = "display: flex; flex-direction: row; justifyContent: flex-end; align-items: center; height: inherit;";
  var criticImg = document.createElement("img"), audienceImg = document.createElement("img");
  criticImg.src = +rTData.critic.substring(0, rTData.critic.length - 1) >= 60 ? "https://vignette.wikia.nocookie.net/logopedia/images/2/20/New_Fresh.svg/revision/latest/scale-to-width-down/139?cb=20190317211435" : "https://vignette.wikia.nocookie.net/logopedia/images/5/52/Rotten_Tomatoes_rotten.svg/revision/latest/scale-to-width-down/145?cb=20190317223047";
  // criticImg.className = "small ltr-dguo2f";
  criticImg.style.cssText = "margin: 0 0.5rem 0 0.25rem; max-width: 15px; max-height: 15px; min-width: 15px; min-height: 15px;"; // "padding: 2px;
  audienceImg.src = +rTData.audience.substring(0, rTData.audience.length - 1) >= 60 ? "https://vignette.wikia.nocookie.net/logopedia/images/d/da/Rotten_Tomatoes_positive_audience.svg/revision/latest/scale-to-width-down/106?cb=20190317223058" : "https://vignette.wikia.nocookie.net/logopedia/images/6/63/Rotten_Tomatoes_negative_audience.svg/revision/latest/scale-to-width-down/144?cb=20190317223112";
  // audienceImg.className = "small ltr-dguo2f";
  audienceImg.style.cssText = "margin: 0 0.5rem 0 0.25rem; max-width: 15px; max-height: 15px; min-width: 15px; min-height: 15px;"; // "padding: 2px; // 1 rem/em === 16px, 0.15 rem/em === 2px
  var criticRating = document.createElement("p"), audienceRating = document.createElement("p");
  criticRating.innerHTML = rTData.critic;
  criticRating.style.cssText = "fontSize: 0.6rem; margin: 0 1rem 0 0;" // "padding: 2px; fontSize: 10px";
  audienceRating.innerHTML = rTData.audience;
  audienceRating.style.cssText = "fontSize: 0.6rem"; // "padding: 2px; fontSize: 10px";
  div.append(criticImg, criticRating, audienceImg, audienceRating);
  anchorTag.append(div);
  // anchorTag.style.cssText = `border-radius: 15px; width: fit-content; position: absolute; top: -${buttonPositionY}px; right: ${buttonPositionX};`; // 0 , -4.95em
};

const appendRTButton = async(id, buttons) => {
  var outerDiv = document.createElement("div");
  outerDiv.className = "ltr-79elbk"; // "color-supplementary hasIcon ltr-pjs1vp";
  // if (buttons !== null) {
    buttons.append(outerDiv);
    // var innerDiv = document.createElement("div");
    // outerDiv.append(innerDiv);
    var anchorTag = document.createElement("a");
    anchorTag.className = "color-supplementary hasIcon ltr-pjs1vp";
    anchorTag.style.cssText = "display: flex; flex-direction: row; justify-content: center; align-items: center;"// order: 5 !important; flex-wrap: wrap !important;"// width: 100 !important; flex-basis: 100% !important; flex-wrap: wrap !important;"
    outerDiv.append(anchorTag);
    var imgTag = document.createElement("img");
    imgTag.src = "https://vignette.wikia.nocookie.net/logopedia/images/2/20/New_Fresh.svg/revision/latest/scale-to-width-down/139?cb=20190317211435";
    imgTag.style.cssText = "max-width: 18px; max-height: 18px; min-width: 14px; min-height: 14px;"
    anchorTag.append(imgTag);
    // var buttonPositionY = outerDiv.getBoundingClientRect().height;
    // var buttonPositionX = outerDiv.getBoundingClientRect().width;
    anchorTag.addEventListener("click", async function(event) {
      event.stopPropagation();
      // loading...
      this.innerHTML = ". . .";
      // console.log(id);
      // get Netflix Data
      const netflixData = await getNetflixData(id);
      console.log(netflixData);
      // get Rotten Tomatoes Data
      // var rTData;
      if (netflixData !== undefined) rTData = await getRTData(netflixData);
      // var rTData = { "critic": "97%", "audience": "45%" };
      if (rTData !== undefined && rTData.hasOwnProperty("critic")) {
        console.log(rTData);
        displayRTData(this, rTData); // , buttonPositionY, buttonPositionX);
      } else {
        // ? == can't find data
        this.innerHTML = "-?-";
      }
      console.log("finished loading");
    });
  // }
};

// addEventListener
window.addEventListener("click", function(event) {
  var arr = window.location.href.split("=")
  var id, buttons;
  try {
    console.log("...");
    var id = arr[arr.length - 1];
    var buttons = document.querySelector(".buttonControls--container");  // || document.querySelector(".bob-buttons-wrapper");
    // console.log(id, buttons);
    if (id && buttons) appendRTButton(id, buttons);
  } catch(err) {
    console.log(err);
  }
});
