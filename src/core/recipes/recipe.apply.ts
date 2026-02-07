import { getRecipeById } from './recipe.builtin';

export interface AppliedRecipe {
  id: string;
  promptLine: string;
  checklistLine: string;
}

export function applyRecipe(recipeId: string): AppliedRecipe {
  const found = getRecipeById(recipeId);
  if (!found) {
    return {
      id: recipeId,
      promptLine: `Unknown recipe: ${recipeId}`,
      checklistLine: `确认并补全未知 recipe: ${recipeId}`,
    };
  }

  return {
    id: recipeId,
    promptLine: found.promptText,
    checklistLine: found.checklistText,
  };
}
