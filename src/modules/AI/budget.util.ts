export type BudgetConstraint =
    | {
        kind: "none";
    }
    | {
        kind: "maximum";
        amount: number;
        inclusive: boolean;
    }
    | {
        kind: "minimum";
        amount: number;
        inclusive: boolean;
    }
    | {
        kind: "range";
        min: number;
        max: number;
        minInclusive: boolean;
        maxInclusive: boolean;
    }
    | {
        kind: "unsupported";
    };

const CURRENCY_AMOUNT =
    String.raw`(?:₹\s*|rs\.?\s*|inr\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?:\s*(?:rupees?|rs\.?|inr))?(?![\d,.])`;

interface AmountPattern {
    pattern: RegExp;
    inclusive: boolean;
}

type AmountMatch =
    | {
        amount: number;
        inclusive: boolean;
    }
    | {
        invalid: true;
    };

const NEGATED_ABOVE_PATTERN = new RegExp(
    `\\b(?:don't|dont|do not)\\b.*?\\b(?:show|recommend|include|suggest)\\b.*?\\b(?:above|over|more than)\\s*${CURRENCY_AMOUNT}`,
    "i"
);

const MAXIMUM_PATTERNS: AmountPattern[] = [

    // "Don't show anything above ₹400"
    {
        pattern: NEGATED_ABOVE_PATTERN,
        inclusive: true,
    },

    // Strict maximum: "under ₹300", "below ₹500"
    {
        pattern: new RegExp(
            `\\b(?:under|below|less than)\\s*${CURRENCY_AMOUNT}`,
            "i"
        ),
        inclusive: false,
    },

    // Inclusive maximum: "up to ₹300", "at most ₹500"
    {
        pattern: new RegExp(
            `\\b(?:up to|upto|within|at most|no more than|not more than)\\s*${CURRENCY_AMOUNT}`,
            "i"
        ),
        inclusive: true,
    },

    // "Maximum budget of ₹500", "max 500"
    {
        pattern: new RegExp(
            `\\b(?:maximum|max)(?:\\s+budget)?\\s*(?:of|is|:)?\\s*${CURRENCY_AMOUNT}`,
            "i"
        ),
        inclusive: true,
    },

    // "My budget is ₹500", "budget of ₹300"
    {
        pattern: new RegExp(
            `\\b(?:my\\s+)?budget\\s*(?:of|is|:)?\\s*${CURRENCY_AMOUNT}`,
            "i"
        ),
        inclusive: true,
    },

    // "Show me food for ₹300", "I can spend ₹300"
    {
        pattern: new RegExp(
            `\\b(?:for|spend(?:\\s+(?:up to|of))?|i can spend)\\s*${CURRENCY_AMOUNT}`,
            "i"
        ),
        inclusive: true,
    },

    // "I have ₹300 to spend"
    {
        pattern: new RegExp(
            `\\b(?:i have|i've got|ive got)\\s*${CURRENCY_AMOUNT}\\s*to spend\\b`,
            "i"
        ),
        inclusive: true,
    },

    // "₹300 to spend"
    {
        pattern: new RegExp(
            `${CURRENCY_AMOUNT}\\s*to spend\\b`,
            "i"
        ),
        inclusive: true,
    },
];

const MINIMUM_PATTERNS: AmountPattern[] = [
    // Strict minimum: "above ₹200", "over ₹250"
    {
        pattern: new RegExp(
            `\\b(?:above|over|(?<!no )(?<!not )more than)\\s*${CURRENCY_AMOUNT}`,
            "i"
        ),
        inclusive: false,
    },

    // Inclusive minimum: "at least ₹200"
    {
        pattern: new RegExp(
            `\\b(?:at least|no less than|not less than)\\s*${CURRENCY_AMOUNT}`,
            "i"
        ),
        inclusive: true,
    },

    // "Minimum budget of ₹200", "min 200"
    {
        pattern: new RegExp(
            `\\b(?:minimum|min)(?:\\s+budget)?\\s*(?:of|is|:)?\\s*${CURRENCY_AMOUNT}`,
            "i"
        ),
        inclusive: true,
    },
];

const BUDGET_SIGNAL_PATTERN =
    /\b(?:budget|spend|under|below|less than|up to|upto|within|at most|no more than|not more than|maximum|max|above|over|more than|at least|minimum|min|between)\b/i;

const parseAmount = (rawAmount: string, inclusive: boolean): AmountMatch => {

    const amount = Number(rawAmount.replaceAll(",", ""));

    if (!Number.isFinite(amount) || amount <= 0) {
        return {
            invalid: true,
        };
    }

    return {
        amount,
        inclusive,
    };
};

const findAmount = (message: string, patterns: AmountPattern[]): AmountMatch | undefined => {

    for (const { pattern, inclusive } of patterns) {

        const match = message.match(pattern);

        if (!match?.[1]) {
            continue;
        }

        return parseAmount(match[1], inclusive);
    }

    return undefined;
};

export const extractBudget = (message: string): BudgetConstraint => {
    const normalizedMessage = message.trim();

    // 1. Check for an explicit price range first.
    const rangePattern = new RegExp(
        `\\b(?:between|from)\\s+${CURRENCY_AMOUNT}\\s+(?:and|to|-)\\s+${CURRENCY_AMOUNT}\\b`,
        "i"
    );

    const rangeMatch = normalizedMessage.match(rangePattern);

    if (rangeMatch?.[1] && rangeMatch[2]) {

        const min = parseAmount(rangeMatch[1], true);
        const max = parseAmount(rangeMatch[2], true);

        if ("invalid" in min || "invalid" in max) {
            return { kind: "unsupported" };
        }

        if (min.amount > max.amount) {
            return { kind: "unsupported" };
        }

        return {
            kind: "range",
            min: min.amount,
            max: max.amount,
            minInclusive: true,
            maxInclusive: true,
        };
    }

    // 2. Extract an explicitly stated maximum.
    const maximum = findAmount(normalizedMessage, MAXIMUM_PATTERNS);

    // 3. Extract an explicitly stated minimum.
    const minimumMessage = normalizedMessage.replace(NEGATED_ABOVE_PATTERN, "");

    const minimum = findAmount(minimumMessage, MINIMUM_PATTERNS);

    if (maximum && "invalid" in maximum) {
        return { kind: "unsupported" };
    }

    if (minimum && "invalid" in minimum) {
        return { kind: "unsupported" };
    }

    // 4. Both minimum and maximum were provided.
    if (maximum && minimum) {

        if (minimum.amount > maximum.amount || (minimum.amount === maximum.amount && (!minimum.inclusive || !maximum.inclusive))) {
            return { kind: "unsupported" };
        }

        return {
            kind: "range",
            min: minimum.amount,
            max: maximum.amount,
            minInclusive: minimum.inclusive,
            maxInclusive: maximum.inclusive,
        };
    }

    // 5. Only maximum was provided.
    if (maximum) {

        return {
            kind: "maximum",
            amount: maximum.amount,
            inclusive: maximum.inclusive,
        };
    }

    // 6. Only minimum was provided.
    if (minimum) {

        return {
            kind: "minimum",
            amount: minimum.amount,
            inclusive: minimum.inclusive,
        };
    }

    // 7. A budget was mentioned, but we couldn't understand it.
    const hasBudgetSignal =
        BUDGET_SIGNAL_PATTERN.test(normalizedMessage) ||
        /\bfrom\s+(?:₹|rs\.?|inr)?\s*\d/i.test(normalizedMessage);

    if (hasBudgetSignal) {
        return { kind: "unsupported" };
    }

    // 8. No budget was specified.
    return { kind: "none" };
};