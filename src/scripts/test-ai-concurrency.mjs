const apiUrl =
    process.env.AI_API_URL ??
    "http://localhost:5001/api/ai/chat";

const token = process.env.AI_TEST_TOKEN;

const conversationId = Number(
    process.env.AI_TEST_CONVERSATION_ID
);

if (!token) {
    throw new Error("AI_TEST_TOKEN is missing.");
}

if (
    !Number.isInteger(conversationId) ||
    conversationId <= 0
) {
    throw new Error("Invalid AI_TEST_CONVERSATION_ID.");
}


const sendMessage = async (message) => {
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, message }),
    });

    const responseText = await response.text();

    let data;

    try {
        data = JSON.parse(responseText);
    } catch {
        data = {
            message: "Backend returned a non-JSON response",
            rawResponse: responseText.slice(0, 500),
        };
    }

    return {
        message,
        status: response.status,
        data,
    };
};


const main = async () => {

    console.log("Starting concurrent requests...");
    console.log("Conversation ID:", conversationId);


    const results = await Promise.all([
        sendMessage("What burgers are currently available?"),
        sendMessage("Suggest something under ₹300."),
    ]);

    console.log("\nConcurrency Test Results:");

    for (const result of results) {
        console.log("\n------------------------------");
        console.log("Message:", result.message);
        console.log("HTTP Status:", result.status);
        console.log("Response:", JSON.stringify(result.data, null, 2));
    }

    const successCount = results.filter(
        (result) => result.status === 200
    ).length;

    const conflictCount = results.filter(
        (result) => result.status === 409
    ).length;

    console.log("\nSummary:");
    console.log("Successful requests:", successCount);
    console.log("Conflict requests:", conflictCount);

    if (successCount === 1 && conflictCount === 1) {
        console.log("Concurrency protection is working as expected.");
    } else {
        console.log("Unexpected concurrency result. Inspect the responses.");
    }
};


main().catch((error) => {

    console.error("Concurrency test failed:", error);

    process.exitCode = 1;
});