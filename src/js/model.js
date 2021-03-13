import { API_URL, RESULTS_PER_PAGE, KEY } from './config';
import { AJAX } from './helpers';
import { async } from 'regenerator-runtime';

export const state = {
  recipe: {},
  search: {
    results: [],
    query: '',
    page: 1,
    resultsPerPage: RESULTS_PER_PAGE,
  },
  bookmarks: [],
};

// Create recipe from api data
const createRecipeObject = function (data) {
  let { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    sourceUrl: recipe.source_url,
    servings: recipe.servings,
    publisher: recipe.publisher,
    ingredients: recipe.ingredients,
    image: recipe.image_url,
    cookingTime: recipe.cooking_time,
    ...(recipe.key && { key: recipe.key }),
  };
};

//Upload created recipe to api
export const uploadRecipe = async function (newRecipe) {
  const ingredients = Object.entries(newRecipe)
    .filter(el => el[0].startsWith('ingredient') && el[1] !== '')
    .map(ing => {
      const ingredient = ing[1].split(',').map(el => el.trim());
      const [quantity, unit, description] = ingredient;

      if (ingredient.length !== 3) throw new Error('Please use correct format');

      return { quantity: +quantity || null, unit, description };
    });

  const recipe = {
    title: newRecipe.title,
    source_url: newRecipe.sourceUrl,
    image_url: newRecipe.image,
    publisher: newRecipe.publisher,
    cooking_time: +newRecipe.cookingTime,
    servings: +newRecipe.servings,
    ingredients: ingredients,
  };
  const data = await AJAX(`${API_URL}/?key=${KEY}`, recipe);
  state.recipe = createRecipeObject(data);
  addBookmark(state.recipe);
};

// Fetch data from api
export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}/${id}`);
    state.recipe = createRecipeObject(data);
    if (state.bookmarks.some(b => b.id === state.recipe.id))
      state.recipe.bookmarked = true;
  } catch (err) {
    throw err;
  }
};

// Fetch search data from api
export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;

    const data = await AJAX(`${API_URL}/?search=${query}`);

    state.search.results = data.data.recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      publisher: recipe.publisher,
      image: recipe.image_url,
      ...(recipe.key && { key: recipe.key }),
    }));

    state.search.page = 1;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Divide search results into pages
export const getSearchResultPage = function (page = state.search.page) {
  state.search.page = page;

  let start = (page - 1) * state.search.resultsPerPage;
  let end = page * state.search.resultsPerPage;

  return state.search.results.slice(start, end);
};

// Update ingredients quantity appropriate to servings count
export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(
    ing => (ing.quantity = (ing.quantity * newServings) / state.recipe.servings)
  );

  state.recipe.servings = newServings;
};

// Store bookmarks in local storage
const persisitBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

export const addBookmark = function (recipe) {
  state.bookmarks.push(recipe);

  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
  persisitBookmarks();
};

export const deleteBookmark = function (id) {
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  if (id === state.recipe.id) state.recipe.bookmarked = false;

  persisitBookmarks();
};

const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
};

init();
