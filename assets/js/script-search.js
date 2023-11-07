
// DOM variables
const searchFormInput2El = $('form[id="search-form-2"]');
const oysterBarShowEl = $('.card .box.custom-box p');
const oysterRatingShowEl = $('.card .box.custom-box span');

// global variables
let oysterBars = [];
let barGeoMarkers = [];
let mapCenter = [];
let currentMarkers = [];

// helper function to convert meters to miles
function meterToMiles(meters) {
  return meters / 1609.344;
}

// helper function to encode for API url
function parameterize(inputString) {
    return encodeURIComponent(inputString);
} 

// read local storage to see what was searched in main page
function init() {
    const mainSearchInput = localStorage.getItem("Main Search");
    if(mainSearchInput){
      search(mainSearchInput);
    }
}

// helper function to create stars 
function starOutput(rating) {
  let stars = ""
  const wholeStars = Math.floor(rating);
  const halfStars = rating % 1;
  for(let i = 0; i < wholeStars; i++){
    stars +='⭐'
  }
  if(halfStars){
    stars+= '½'
  }
  return stars
}

//helper function to sort array of returned business by rating
function sortRatingsDec(businessObjArr) {
  return businessObjArr.sort((a, b) => {
      return b.rating - a.rating
  });
}

// search bar input on search page
const searchBarInput = function (event) {
  if(oysterBars) {
    oysterBars = [];
  }  
  const cityName = searchFormInput2El.find('input[type="search"]').val().trim();
  search(cityName);
};

// performs the calls to the API's and waits for responses before next call
function search(cityName) {
  if (cityName) {
    $('#current-city').text(cityName);
    $('#results-card').removeClass('hidden');
    $('#no-results').addClass('hidden');
    getOysterBars(cityName)
      .then(() =>{
        localStorage.setItem("Latest Search" , JSON.stringify(oysterBars));
        localStorage.setItem("Map Center" , mapCenter);
        removeMarkers();
        display5Recs(oysterBars, oysterBarShowEl, oysterRatingShowEl);
        setMapMarkers();
      })
      .catch(function (error) {
        console.log("Error fetching geolocation data:", error);
      });
  } else {
    console.log("Could not find city");
  }
}

// shows message to user if no city was found
function noOysterBars() {
  $('#results-card').addClass('hidden');
  $('#no-results').removeClass('hidden');
}

function getOysterBars(cityName) {
  // API pulls
  const term = parameterize("Oyster Bar");
  const radius = parameterize(16000);
  const city = parameterize(cityName);

  const apiKey = "z-u7s7xmANf0NpaN98rtue892AqWXdBleTvs82zeLMBKWa7jeaRodzw-QwYCrMFM8iVpiLK_SXimPySTPaRtFna9Kb9kLGWZL4OO4u_gnQiF5dFJ5UtxFeFweN9IZXYx"

 
  const searchUrl = `https://api.yelp.com/v3/businesses/search?location=${city}&term=${term}&radius=${radius}&limit=20`;
  
  // reset center of map
  mapCenter = [];  

  // api header and method
  const options = {
    method: 'GET',
    headers: {
        accept: '*/*',
        Authorization: `Bearer ${apiKey}`,
        'Access-Control-Allow-Origin': '*'
    }
  };

  // api call to business search API  
  return fetch(searchUrl, options)
    .then(response => response.json())
    .then(data => {
        buildResults(data);
        mapCenter = [data.region.center.longitude, data.region.center.latitude];
        updateMap();
        display5Recs(oysterBars, oysterBarShowEl, oysterRatingShowEl);
    })
    .catch(err => {
      noOysterBars();
      console.error(err);
    });
}

function buildResults(results) {
    barGeoMarkers = [];
    const highlyRated = sortRatingsDec(results.businesses);
    let displayRating;
    // take top 5
    if(highlyRated.length >= 5) {
      displayRating = highlyRated.slice(0, 5);
    } else {
      displayRating = highlyRated;
    }
    // build objects for each
    displayRating.forEach(business => {
        const oystarRec =  {
            name: business.name,
            rating: starOutput(business.rating),
            latitude: business.coordinates.latitude,
            longitude: business.coordinates.longitude,
            distance: meterToMiles(Math.round(business.distance))
        }
        oysterBars.push(oystarRec);
    }); 
}

// set map markers for display
function setMapMarkers() {
  const storedGeoData = JSON.parse(localStorage.getItem("Latest Search"));
  storedGeoData.forEach(bar =>{
    const lat = bar.latitude;
    const lon = bar.longitude;
    barGeoMarkers.push([lon, lat]);
  })
  makeMarkers(barGeoMarkers);
}

// display OyStar's recommendations
function display5Recs(oysterBarsArr, names, ratings) {
    names.each(function(index) {
        const oysterBarEl = $(this);
        const name = oysterBarsArr[index].name;
        oysterBarEl.text(name);
    });
    ratings.each(function(index) {
        const oysterRatingEl = $(this);
        const rating = oysterBarsArr[index].rating;
        oysterRatingEl.text(rating);
    });
}

// secondary search page
$(document).ready(function () {
  searchFormInput2El.on('submit', function (event) {
    event.preventDefault();
    searchBarInput(event);
  });
});

init();

// ---------------- map box API implementation --------------------------//

// Wait for the Mapbox GL library to load
  mapboxgl.accessToken = 'pk.eyJ1Ijoic3BlbmNveCIsImEiOiJjbG9oN3lrZ2cxNTQwMmtvMXhobzNjNGtkIn0.EJ4_kGTLF2H6xpOh2jV9TA';
  
  // Initialize the map once the library is loaded
    let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-97.7431, 30.2672], // Default center (Austin, TX coordinates)
    zoom: 10 // Adjust the zoom level as needed
  });

// Function to create markers
function makeMarkers(markerArr) {
  // Create new markers based on updatedMarkerArr
  markerArr.forEach(marker => {
    const m = new mapboxgl.Marker()
      .setLngLat(marker)
      .addTo(map);
      currentMarkers.push(m);
  });
}

// re-centers map
function updateMap(){
  if (map) {
    map.setCenter(mapCenter);
    removeMarkers();
  } else {
    console.error('Map is not yet initialized.');
  }
}

// removes existing markers
function removeMarkers() {
  if (currentMarkers.length > 0) {
    currentMarkers.forEach(marker => {
      marker.remove();
    });
    currentMarkers = []; // Clear the currentMarkers array
  }
}
