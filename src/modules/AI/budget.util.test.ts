import test from "node:test";
import assert from "node:assert/strict";

import { extractBudget } from "./budget.util.js";


test("returns none when no budget is specified", () => {

    assert.deepEqual(
        extractBudget("What burgers do you have?"),
        { kind: "none" }
    );
});


test("does not mistake dish prices for a customer budget", () => {

    assert.deepEqual(
        extractBudget(
            "Compare the Classic Burger ₹199 with the Paneer Burger ₹249."
        ),
        { kind: "none" }
    );
});


test("extracts a strict maximum from under ₹300", () => {

    assert.deepEqual(
        extractBudget("Suggest food under ₹300"),
        {
            kind: "maximum",
            amount: 300,
            inclusive: false,
        }
    );
});


test("extracts a strict maximum from below 500", () => {

    assert.deepEqual(
        extractBudget("Show dishes below 500"),
        {
            kind: "maximum",
            amount: 500,
            inclusive: false,
        }
    );
});


test("extracts an inclusive maximum from up to ₹300", () => {

    assert.deepEqual(
        extractBudget("Suggest something up to ₹300"),
        {
            kind: "maximum",
            amount: 300,
            inclusive: true,
        }
    );
});


test("extracts a budget expressed as my budget is ₹500", () => {

    assert.deepEqual(
        extractBudget("My budget is ₹500"),
        {
            kind: "maximum",
            amount: 500,
            inclusive: true,
        }
    );
});


test("extracts a budget from I have ₹300 to spend", () => {

    assert.deepEqual(
        extractBudget("I have ₹300 to spend"),
        {
            kind: "maximum",
            amount: 300,
            inclusive: true,
        }
    );
});


test("extracts a budget from food for ₹300", () => {

    assert.deepEqual(
        extractBudget("Suggest food for ₹300"),
        {
            kind: "maximum",
            amount: 300,
            inclusive: true,
        }
    );
});


test("extracts amounts containing commas", () => {

    assert.deepEqual(
        extractBudget("Suggest food under ₹1,500"),
        {
            kind: "maximum",
            amount: 1500,
            inclusive: false,
        }
    );
});


test("understands don't show anything above ₹400 as a maximum", () => {

    assert.deepEqual(
        extractBudget("Don't show anything above ₹400"),
        {
            kind: "maximum",
            amount: 400,
            inclusive: true,
        }
    );
});


test("extracts a strict minimum from above ₹200", () => {

    assert.deepEqual(
        extractBudget("Show burgers above ₹200"),
        {
            kind: "minimum",
            amount: 200,
            inclusive: false,
        }
    );
});


test("extracts an inclusive minimum from at least ₹200", () => {

    assert.deepEqual(
        extractBudget("Show food costing at least ₹200"),
        {
            kind: "minimum",
            amount: 200,
            inclusive: true,
        }
    );
});


test("extracts a range between ₹200 and ₹350", () => {

    assert.deepEqual(
        extractBudget("Suggest food between ₹200 and ₹350"),
        {
            kind: "range",
            min: 200,
            max: 350,
            minInclusive: true,
            maxInclusive: true,
        }
    );
});


test("extracts a range from 200 to 350", () => {

    assert.deepEqual(
        extractBudget("Show me dishes from 200 to 350"),
        {
            kind: "range",
            min: 200,
            max: 350,
            minInclusive: true,
            maxInclusive: true,
        }
    );
});


test("combines minimum and maximum conditions", () => {

    assert.deepEqual(
        extractBudget("At least ₹200 but under ₹350"),
        {
            kind: "range",
            min: 200,
            max: 350,
            minInclusive: true,
            maxInclusive: false,
        }
    );
});


test("rejects an impossible range", () => {

    assert.deepEqual(
        extractBudget("Show food between ₹400 and ₹200"),
        { kind: "unsupported" }
    );
});


test("rejects a budget expressed without a numeric amount", () => {

    assert.deepEqual(
        extractBudget("Show me food under three hundred"),
        { kind: "unsupported" }
    );
});


test("rejects zero as a budget", () => {

    assert.deepEqual(
        extractBudget("Show food under ₹0"),
        { kind: "unsupported" }
    );
});


test("rejects incorrectly formatted comma-separated amounts", () => {

    assert.deepEqual(
        extractBudget("Suggest food under ₹12,34"),
        { kind: "unsupported" }
    );
});