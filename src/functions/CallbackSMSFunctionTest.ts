import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function CallbackSMSFunctionTest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log("Test callback received.", await request.json());

        return { status: 200, jsonBody: { message: "Callback test processed successfully." } };
    } catch (error) {
        context.log("Error processing test callback:", error);
        return { status: 500, jsonBody: { error: "Internal server error." } };

    }
}

app.http("CallbackSMSFunctionTest", {
    methods: ["POST"],
    authLevel: "function",
    handler: CallbackSMSFunctionTest
});
