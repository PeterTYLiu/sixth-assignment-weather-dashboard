let inputBar = document.getElementById("search-input");
let searchButton = document.getElementById("search-button");
let forecastTitle = document.getElementById("forecast-title");
let mainCard = document.getElementById("main-card");
let forecast = document.getElementById("forecast");
let sidebar = document.getElementById("sidebar");
let searchForm = document.getElementById("search-form");
let errorMessage = document.getElementById("error-message");
let searchHistory = document.getElementById("search-history");

//Function that turns UNIX time into a date
let UNIXTimeIntoDate = UNIXTime => {
  let date = new Date(UNIXTime * 1000);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

//Function that turns Kelvin into celcius
let kelvinToCelcius = kelvin => {
  return `${(kelvin - 273.15).toFixed(1)} °C`;
};

// Function that fills a city's info into the main section
let putInMain = cityKey => {
  mainCard.innerHTML = null;

  let cityData = JSON.parse(localStorage.myCities)[cityKey];

  let title = document.createElement("h4");
  title.innerHTML = `${cityKey} (${cityData.current.date})`;
  mainCard.appendChild(title);

  let icon = document.createElement("img");
  icon.setAttribute(
    "src",
    `https://openweathermap.org/img/wn/${cityData.current.icon}.png`
  );
  mainCard.appendChild(icon);

  let temp = document.createElement("p");
  temp.innerHTML = `Temperature: ${cityData.current.temp}`;
  mainCard.appendChild(temp);

  let humidity = document.createElement("p");
  humidity.innerHTML = `Humidity: ${cityData.current.humidity}`;
  mainCard.appendChild(humidity);

  let windSpeed = document.createElement("p");
  windSpeed.innerHTML = `Wind speed: ${cityData.current.windSpeed} km/h`;
  mainCard.appendChild(windSpeed);

  let UVIndex = document.createElement("p");
  let UVIndexValue = cityData.current.UVIndex;
  let UVSeverity;
  if (UVIndexValue <= 2) {
    UVSeverity = "low";
  } else if (UVIndexValue <= 5) {
    UVSeverity = "medium";
  } else if (UVIndexValue <= 7) {
    UVSeverity = "high";
  } else if (UVIndexValue <= 10) {
    UVSeverity = "very-high";
  } else {
    UVSeverity = "extreme";
  }
  UVIndex.innerHTML = `UV index: <span id="uv-${UVSeverity}" class="uv-index-tag">${UVIndexValue}</span>`;
  mainCard.appendChild(UVIndex);

  forecastTitle.innerText = "Five-day forecast";

  // Creates the 5-day forecast section
  forecast.innerHTML = null;
  for (const day of cityData.forecast) {
    let card = document.createElement("div");
    card.classList.add("forecast-card");

    let cardDate = document.createElement("h6");
    cardDate.innerText = day.date;
    card.appendChild(cardDate);

    let cardIcon = document.createElement("img");
    cardIcon.setAttribute(
      "src",
      `https://openweathermap.org/img/wn/${day.icon}.png`
    );
    card.appendChild(cardIcon);

    let cardTemp = document.createElement("p");
    cardTemp.innerText = `Temp: ${day.temp}`;
    card.appendChild(cardTemp);

    let cardHumidity = document.createElement("p");
    cardHumidity.innerText = `Humidity: ${day.humidity}`;
    card.appendChild(cardHumidity);

    forecast.appendChild(card);
  }
};

// Function that adds an item to the history section
let putInHistory = cityName => {
  let historyItem = document.createElement("div");
  historyItem.setAttribute("name", cityName);
  historyItem.classList.add("history-item");
  historyItem.innerHTML = cityName;
  searchHistory.prepend(historyItem);
  // Clicking a history item puts that item into the main section
  historyItem.addEventListener("click", event => {
    let myCities = JSON.parse(localStorage.myCities);
    putInMain(event.target.getAttribute("name"));
  });
};

// Function that generates the search history section
let createHistory = () => {
  let myCities = JSON.parse(localStorage.myCities);
  let keys = Object.keys(myCities);
  if (keys.length !== 0) searchHistory.innerHTML = null;
  for (const key of keys) {
    putInHistory(key);
  }
};

// Function that searches for the input
let search = () => {
  let APIKey = "88535c289d8c6150589efb37d3172d2f";
  let searchTerm = inputBar.value;
  errorMessage.innerHTML = null;

  let cityName;
  let coords;
  let cityData = {
    current: {
      date: "",
      icon: "",
      temp: "",
      humidity: "",
      windSpeed: "",
      UVIndex: ""
    },
    forecast: []
  };

  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${searchTerm}&appid=${APIKey}`
  )
    .then(response => response.json())
    .then(data => {
      if (data.cod == "404") {
        errorMessage.innerText = "City not found!";
        return Promise.reject("City not found!");
      } else if (data.cod == "200") {
        cityName = data.name;
        coords = data.coord;

        cityData.current.date = UNIXTimeIntoDate(data.dt);
        cityData.current.icon = data.weather[0].icon;
        cityData.current.temp = kelvinToCelcius(data.main.temp);
        cityData.current.humidity = `${data.main.humidity}%`;
        cityData.current.windSpeed = data.wind.speed;
      }
    })
    .then(() => {
      fetch(
        `https://api.openweathermap.org/data/2.5/uvi?appid=${APIKey}&lat=${coords.lat}&lon=${coords.lon}`
      )
        .then(response => response.json())
        .then(data => {
          cityData.current.UVIndex = data.value;
        })
        .then(() => {
          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${APIKey}`
          )
            .then(response => response.json())
            .then(data => {
              for (let i = 0; i < data.list.length; i++) {
                console.log(data.list[i].dt_txt.slice(11, 13));
                if (data.list[i].dt_txt.slice(11, 13) == "15") {
                  cityData.forecast.push({
                    date: UNIXTimeIntoDate(data.list[i].dt),
                    temp: kelvinToCelcius(data.list[i].main.temp),
                    humidity: `${data.list[i].main.humidity}%`,
                    icon: data.list[i].weather[0].icon
                  });
                }
              }
              console.log(cityData);
            })
            .then(() => {
              if (!localStorage.myCities) localStorage.myCities = "{}";
              let myCities = JSON.parse(localStorage.myCities);
              myCities[cityName] = cityData;
              localStorage.myCities = JSON.stringify(myCities);
              putInMain(cityName);
              createHistory();
            });
        });
    });

  inputBar.value = null;
};

searchButton.addEventListener("click", search);

inputBar.addEventListener("keyup", event => {
  if (event.keyCode === 13) search();
});

// Create the history section upon page load
createHistory();

// If previous seraches exist, display the last-searched city when page loads
if (localStorage.myCities) {
  let myCities = JSON.parse(localStorage.myCities);
  let keys = Object.keys(myCities);
  let lastKey = keys[keys.length - 1];
  putInMain(lastKey);
}
