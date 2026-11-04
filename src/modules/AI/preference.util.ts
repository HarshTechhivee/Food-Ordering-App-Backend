import type { AIAvailableMenuItem } from "../../types/ai.types.js";

// These terms indicate that the customer wants a dietary
// classification or an ingredient/allergen safety confirmation.

const DIETARY_PATTERN =
    /\b(vegetarian|vegan|plant[- ]based|eggless|egg[- ]free|dairy[- ]free|lactose[- ]free|gluten[- ]free|jain|halal|kosher|keto|low[- ]carb|non[\s-]?veg(?:etarian)?)\b/i;

const ALLERGEN_PATTERN =
    /\b(peanuts?|tree nuts?|milk|dairy|eggs?|gluten|wheat|soy|soya|sesame|fish|shellfish)\b/i;

const ALLERGEN_SAFETY_PATTERN =
    /\b(allerg(?:y|ies|ic)|allergen|intoleran(?:ce|t)|celiac|coeliac|anaphylaxis|safe|contains?|free from|without|avoid)\b/i;

// Ingredient exclusions also need verified ingredient data.
// For example: "I don't want onions in my burger."

const INGREDIENT_PATTERN =
    /\b(onions?|garlic|tomatoes?|potatoes?|cheese|butter|cream|chicken|mutton|beef|pork|fish|eggs?|milk|dairy|peanuts?|nuts?|soy|soya|sesame|wheat|gluten)\b/i;

const EXCLUSION_PATTERN =
    /\b(without|no|avoid|excluding|free from|doesn't contain|does not contain)\b/i;


// True when we cannot safely verify the requested dietary information.

export const requiresVerifiedDietaryInfo = (message: string): boolean => {

    if (DIETARY_PATTERN.test(message)) {
        return true;
    }

    if (ALLERGEN_PATTERN.test(message) && ALLERGEN_SAFETY_PATTERN.test(message)) {
        return true;
    }

    if (INGREDIENT_PATTERN.test(message) && EXCLUSION_PATTERN.test(message)) {
        return true;
    }

    return false;
};


// Detect a spicy-food recommendation request.
// We do not filter candidates when the customer is comparing
// dishes, because both dishes may need to be considered.

export const requestsSpicyPreference = (message: string): boolean => {

    const isComparison =
        /\b(?:compare|comparison|versus|vs\.?|difference between)\b/i
            .test(message) ||

        /\bwhich(?:\s+\w+){0,5}\s+(?:is|has)\s+(?:spicier|more\s+spicy)\b/i
            .test(message) ||

        /\b(?:spicier|more spicy)\s+than\b/i
            .test(message);

    if (isComparison) {
        return false;
    }

    return /\b(spicy|spicier|chilli|chili|peri[- ]?peri)\b/i.test(message);
};

// Only match explicit clues in the actual FoodHub menu data.
// This does not establish an exact spice level or guarantee.

export const matchesExplicitSpicyDescription = (item: Pick<AIAvailableMenuItem, "name" | "description">): boolean => {

    const itemText = `${item.name} ${item.description}`;

    return /\b(spicy|spicier|chilli|chili|peri[- ]?peri)\b/i.test(itemText);
};