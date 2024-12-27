/* ############################################################################## */
//                           Search Suggestion Start
/* ############################################################################## */

const API_SEARCH_URL = "https://openlibrary.org/search.json?q=";
const API_FIELDS = "&limit=10&fields=isbn,title,author_name";
const API_IMAGE_URL = "https://covers.openlibrary.org/b/isbn/";
let searchBox = document.querySelector("#book-search");
let searchSuggestion = document.querySelector("#search-suggestion");

//Make API To fetch Suggestion
async function bookSuggestion() {
  try {
    const searchQuery = searchBox.value.trim();
    if (!searchQuery) return;
    const response = await fetch(API_SEARCH_URL + searchQuery + API_FIELDS);
    const result = await response.json();
    const books = result.docs;

    console.log("called");
    console.log(books);

    let html =
      "<div class='empty p-3 text-center'><h4>Book Not Found</h4></div>";

    if (books.length > 0) {
      html = books.reduce((acc, book) => {
        if (!book.isbn) {
          return acc;
        }

        let code = `<a href="/add/${book.isbn[0]}/${book.title.replace(
          /#/g,
          ""
        )}/${
          book.author_name[0]
        }" class="book-details p-2 w-100 d-flex text-reset text-decoration-none">
        <div class="book-img">
            <img src="${API_IMAGE_URL + book.isbn[0]}-M.jpg" alt="${
          book.title
        }'s Image" class="w-100 h-100">
        </div>
        <div class="book-body flex-grow-1 text-start ps-2">
          <h5>${book.title}</h5>
          <h6 class="text-muted">By ${book.author_name[0]}</h6>
        </div>
      </a>`;

        acc += code;
        return acc;
      }, "");
    }

    searchSuggestion.innerHTML = html;
  } catch (error) {
    console.log("Error: ", error);
  }
}

//Debounce To Reduce API Calls
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

const displaySuggestion = () => {
  let length = searchBox.value.length;
  if (length === 0) {
    searchSuggestion.style.display = "none";
    searchSuggestion.innerHTML =
      '<div class="h-100 d-flex justify-content-center align-items-center"><div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  } else {
    searchSuggestion.style.display = "block";
  }
};

//Triggering Suggestion On Input
searchBox?.addEventListener("input", debounce(bookSuggestion, 300));
searchBox?.addEventListener("input", displaySuggestion);

/* ############################################################################## */
//                           Search Suggestion End
/* ############################################################################## */

/* ############### Miscellaneous ############### */

//Book-Search AutoFoucs
document.querySelector("nav>a")?.addEventListener("click", () => {
  document.querySelector("#book-search").focus();
});

//Move Back a Page
document.querySelector("button#back-to-home")?.addEventListener("click", () => {
  window.history.back();
});

//Redirect To Home
document.querySelector("#back-to-home")?.addEventListener("click", () => {
  window.location.href = "/";
});

//Sorting Books
document.querySelector("#sort-books")?.addEventListener("input", function () {
  window.location.href = `/sort/${this.value}`;
});
