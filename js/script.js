//  TMDB API
const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "ce4fcf306553d84bdcb72d1f24fca2a9";

// DOM elements
const moviesContainer = document.getElementById("movies-container");
const favoritesContainer = document.getElementById("favorites-container");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const modal = document.getElementById("movie-modal");
const modalContent = document.getElementById("modal-content");
const closeModal = document.querySelector(".close-modal");
const navLinks = document.querySelectorAll(".nav-links a");
const pages = document.querySelectorAll(".page");
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-links");
const noFavorites = document.getElementById("no-favorites");
const favoritesCount = document.getElementById("favorites-count");
const clearFavoritesBtn = document.getElementById("clear-favorites");
const loadingSpinner = document.getElementById("loading");

// State: list of favorite movies
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  fetchPopularMovies();    // Load popular movies by default
  updateFavoritesCount();  // Update favorite count in the profile
  setupEventListeners();   // Set up all event listeners
});

// Fetch popular movies
function fetchPopularMovies() {
  showLoading();
  fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`)
    .then(response => response.json())
    .then(data => {
      displayMovies(data.results);
      hideLoading();
    })
    .catch(error => {
      console.error("Error fetching popular movies:", error);
      hideLoading();
    });
}

// Display movies in the home page container
function displayMovies(movies) {
  moviesContainer.innerHTML = "";
  movies.forEach(movie => {
    const card = createMovieCard(movie);
    moviesContainer.appendChild(card);
  });
}

// Create a movie card element
function createMovieCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card";

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Poster";

  card.innerHTML = `
    <img src="${posterUrl}" alt="${movie.title}" class="movie-poster">
    <div class="movie-info">
      <h3 class="movie-title">${movie.title}</h3>
      <p class="movie-year">${
        movie.release_date ? movie.release_date.substring(0, 4) : "N/A"
      }</p>
      <button class="favorite-btn">
        <i class="${isFavorite(movie.id) ? "fas" : "far"} fa-heart"></i>
      </button>
    </div>
  `;

  // Favorite button click
  const favBtn = card.querySelector(".favorite-btn");
  favBtn.addEventListener("click", e => {
    e.stopPropagation();
    toggleFavorite(movie);
    const icon = favBtn.querySelector("i");
    icon.classList.toggle("fas");
    icon.classList.toggle("far");
  });

  // Card click => open modal
  card.addEventListener("click", () => openModal(movie.id));

  return card;
}

// Check if movie is already in favorites
function isFavorite(movieId) {
  return favorites.some(fav => fav.id === movieId);
}

// Toggle favorite status
function toggleFavorite(movie) {
  const index = favorites.findIndex(fav => fav.id === movie.id);
  if (index === -1) {
    favorites.push(movie);
  } else {
    favorites.splice(index, 1);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  updateFavoritesCount();

  // If we're on the favorites page, re-render favorites
  if (document.getElementById("favorites-page").classList.contains("active")) {
    displayFavorites();
  }
}

// Update the favorites count in the profile
function updateFavoritesCount() {
  favoritesCount.textContent = favorites.length;
}

// Display favorites on the favorites page
function displayFavorites() {
  favoritesContainer.innerHTML = "";
  if (favorites.length === 0) {
    noFavorites.style.display = "block";
    return;
  }
  noFavorites.style.display = "none";

  favorites.forEach(movie => {
    const card = createMovieCard(movie);
    favoritesContainer.appendChild(card);
  });
}

// Search movies
function searchMovies() {
  const query = searchInput.value.trim();
  if (!query) return;

  showLoading();
  fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&include_adult=false&query=${encodeURIComponent(
      query
    )}&page=1`
  )
    .then(response => response.json())
    .then(data => {
      moviesContainer.innerHTML = "";
      displayMovies(data.results);
      hideLoading();
    })
    .catch(error => {
      console.error("Error searching movies:", error);
      hideLoading();
    });
}

// Open modal to show movie details
function openModal(movieId) {
  showLoading();
  fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`)
    .then(response => response.json())
    .then(movie => {
      renderModal(movie);
      modal.style.display = "block";
      hideLoading();
    })
    .catch(error => {
      console.error("Error fetching movie details:", error);
      hideLoading();
    });
}

// Render modal content with movie details
function renderModal(movie) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Poster";

  modalContent.innerHTML = `
    <h2>${movie.title}</h2>
    <img src="${posterUrl}" alt="${movie.title}" style="width:200px;">
    <p>Release Year: ${
      movie.release_date ? movie.release_date.substring(0, 4) : "N/A"
    }</p>
    <p>Runtime: ${movie.runtime ? movie.runtime + " min" : "N/A"}</p>
    <p>Rating: ${
      movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"
    }/10</p>
    <p>${movie.overview || "No overview available."}</p>
  `;
}

// Setup all event listeners
function setupEventListeners() {
  // Search button
  searchButton.addEventListener("click", searchMovies);

  // Close modal (X button)
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close modal if clicking outside the content
  window.addEventListener("click", event => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Clear favorites button
  clearFavoritesBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all favorites?")) {
      favorites = [];
      localStorage.setItem("favorites", JSON.stringify(favorites));
      updateFavoritesCount();
      if (document.getElementById("favorites-page").classList.contains("active")) {
        displayFavorites();
      }
    }
  });

  // Navigation links
  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const pageName = link.getAttribute("data-page");
      changePage(pageName);
    });
  });

  // Hamburger menu toggle
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  });
}

// Change active page (home, favorites, profile)
function changePage(pageName) {
  // Toggle active link
  navLinks.forEach(link => {
    link.classList.toggle("active", link.getAttribute("data-page") === pageName);
  });
  // Toggle active section
  pages.forEach(page => {
    page.classList.toggle("active", page.id === `${pageName}-page`);
  });

  // If favorites page, display favorites
  if (pageName === "favorites") {
    displayFavorites();
  }
  // If profile page, just show the profile (favorites count is auto-updated)
}

// Show loading spinner
function showLoading() {
  loadingSpinner.style.display = "flex";
}

// Hide loading spinner
function hideLoading() {
  loadingSpinner.style.display = "none";
}
