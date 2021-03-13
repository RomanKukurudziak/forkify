import * as model from './model';
import recipeView from './views/recipeView';
import searchView from './views/searchView';
import resultsView from './views/resultsView';
import paginationView from './views/paginationView';
import bookmarksView from './views/bookmarksView';
import addRecipeView from './views/addRecipeView';
import { MODAL_CLOSE_SEC } from './config';

import { async } from 'regenerator-runtime';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

/**
 *
 * @returns undefined
 */
const controlRecipes = async function () {
  try {
    const id = window.location.hash.slice(1);

    if (!id) return;
    recipeView.showSpinner();

    //0. Update results to mark selected one
    resultsView.update(model.getSearchResultPage());

    //1. Load recipe
    await model.loadRecipe(id);

    //2. Render the recipe
    recipeView.render(model.state.recipe);

    //3. Update bookmarks to check/uncheck current recipe
    bookmarksView.update(model.state.bookmarks);
  } catch (err) {
    recipeView.renderError(err);
    console.error(err);
  }
};

const controlSearchResults = async function () {
  try {
    resultsView.showSpinner();

    //1.Get query
    const query = searchView.getQuery();
    if (!query) return;

    //2. Load search results from search field
    await model.loadSearchResults(query);

    //3. Render results
    resultsView.render(model.getSearchResultPage());

    //4. Render initial pagination buttons
    paginationView.render(model.state.search);
  } catch (err) {
    console.error(err);
  }
};

const controlPagination = function (goToPage) {
  // 1. Render results from current page
  resultsView.render(model.getSearchResultPage(goToPage));

  // 2. Render pagination new buttons
  paginationView.render(model.state.search);
};

const controlServings = function (servings) {
  // 1. Update servings and ingredients quantity in state
  model.updateServings(servings);

  // 2. Rerender recipe view altered elements
  recipeView.update(model.state.recipe);
};

const controlAddBookmarks = function () {
  //1. Add/remove bookmark
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);

  //2. Update recipe altered fields(bookmark icon)
  recipeView.update(model.state.recipe);

  //3. Render mookmarks droplist
  bookmarksView.render(model.state.bookmarks);
};

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (data) {
  try {
    addRecipeView.showSpinner();

    //1. Uploading created recipe and adding it to bookmarks
    await model.uploadRecipe(data);

    //2. Rendering recipe in recipe view and updating bookmarks
    recipeView.render(model.state.recipe);
    bookmarksView.render(model.state.bookmarks);

    //3. Displating success message after timeout
    setTimeout(() => addRecipeView.toggleWindow(), MODAL_CLOSE_SEC * 1000);
    addRecipeView.renderMessage('You created new recipe!');

    //4. Changing hash in adress to current recipe
    window.history.pushState(null, '', `#${model.state.recipe.id}`);
  } catch (err) {
    addRecipeView.renderError(err.message);
  }
};

const init = () => {
  bookmarksView.addHandlerBookmarks(controlBookmarks);
  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerServings(controlServings);
  recipeView.addHandlerBookmark(controlAddBookmarks);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerSubmit(controlAddRecipe);
};
init();
