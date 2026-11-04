import test from "node:test";
import assert from "node:assert/strict";

import {
    requiresVerifiedDietaryInfo,
    requestsSpicyPreference,
    matchesExplicitSpicyDescription,
} from "./preference.util.js";


test("detects vegetarian requests", () => {

    assert.equal(
        requiresVerifiedDietaryInfo("Suggest vegetarian food"),
        true
    );
});


test("detects vegan requests", () => {

    assert.equal(
        requiresVerifiedDietaryInfo("Do you have vegan burgers?"),
        true
    );
});


test("detects Jain food requests", () => {

    assert.equal(
        requiresVerifiedDietaryInfo("Suggest Jain food"),
        true
    );
});


test("detects gluten-free requests", () => {

    assert.equal(
        requiresVerifiedDietaryInfo("Suggest gluten-free food"),
        true
    );
});


test("detects peanut allergy questions", () => {

    assert.equal(
        requiresVerifiedDietaryInfo("I have a peanut allergy"),
        true
    );
});


test("detects allergen ingredient questions", () => {

    assert.equal(
        requiresVerifiedDietaryInfo(
            "Does this burger contain milk?"
        ),
        true
    );
});


test("detects ingredient exclusion requests", () => {

    assert.equal(
        requiresVerifiedDietaryInfo(
            "Suggest a burger without onions"
        ),
        true
    );
});


test("does not reject an ordinary food preference", () => {

    assert.equal(
        requiresVerifiedDietaryInfo(
            "I prefer spicy food"
        ),
        false
    );
});


test("detects a spicy food preference", () => {

    assert.equal(
        requestsSpicyPreference(
            "Suggest something spicy under ₹300"
        ),
        true
    );
});


test("detects chilli preference", () => {

    assert.equal(
        requestsSpicyPreference(
            "I like chilli-flavoured food"
        ),
        true
    );
});


test("detects peri peri preference", () => {

    assert.equal(
        requestsSpicyPreference(
            "Suggest peri peri dishes"
        ),
        true
    );
});


test("does not filter candidates for dish comparisons", () => {

    assert.equal(
        requestsSpicyPreference(
            "Which burger is spicier?"
        ),
        false
    );
});


test("matches a menu description containing spicy", () => {

    assert.equal(
        matchesExplicitSpicyDescription({
            name: "Paneer Burger",
            description: "Grilled paneer patty with spicy sauce.",
        }),
        true
    );
});


test("matches a peri peri menu item", () => {

    assert.equal(
        matchesExplicitSpicyDescription({
            name: "Peri Peri Chicken Burger",
            description: "Crispy chicken patty with sauce.",
        }),
        true
    );
});


test("does not assume a classic burger is spicy", () => {

    assert.equal(
        matchesExplicitSpicyDescription({
            name: "Classic Burger",
            description: "Juicy burger with cheese and fresh vegetables.",
        }),
        false
    );
});