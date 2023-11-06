// DOM Selector Variables
const searchFormInput1El = $('form#search-form-1');
// search bar input 
const searchBarInput = function (event) {
    event.preventDefault();  
    const cityName = searchFormInput1El.find('input[type="search"]').val().trim();
    localStorage.setItem("Main Search" , cityName);
    window.location.href = "search-page.html";
  };

// event lister to pass city name to page two 
searchFormInput1El.on('submit', function (event) {
    searchBarInput(event);
});


