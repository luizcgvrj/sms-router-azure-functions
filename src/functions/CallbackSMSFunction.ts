import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";
import { WebHookRepository } from "../sms/WebHookRepository";
import { createSmsSender } from "../sms/SMSSender";

export async function CallbackSMSFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const requestBody = await request.json();

        context.log("Callback received.", requestBody);

        const { messageId, messageBody } = createSmsSender().createCallBackTO(requestBody);

        if (!messageId) {
            context.log("Callback Error: 'MessageSid' not provided in the request body.");
            return { status: 400, jsonBody: { error: "'messageId' is required." } };
        }

        const repository = new WebHookRepository();

        const document = await repository.getByMessageId(messageId);

        if (!document) {
            context.log(`No document found in MongoDB for messageId: ${messageId}`);
            return { status: 404, jsonBody: { error: "Document not found." } };
        }

        const { callbackUrl, trackId } = document;

        if (!callbackUrl || !trackId) {
            context.log(`Error: 'callbackUrl' or 'trackId' missing in the document for messageId: ${messageId}`);
            return { status: 500, jsonBody: { error: "Insufficient data in the document." } };
        }

        context.log(`Making REST call to callbackUrl: ${callbackUrl}`);

        const response = await axios.post(callbackUrl, { trackId, messageBody });

        if (!(response.status >= 200 && response.status < 300)) {
            context.log(`Error sending callback to URL ${callbackUrl}: Status ${response.status}`);
            return { status: 500, jsonBody: { error: "Error processing the callback." } };
        }

        context.log(`Callback to URL ${callbackUrl} sent successfully.`);

        await repository.delete(document);

        context.log(`Document with messageId: ${messageId} deleted from MongoDB.`);

        return { status: 200, jsonBody: { message: "Callback processed successfully." } };
    } catch (error) {
        context.log("Error processing the callback:", error);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}

app.http("CallbackSMSFunction", {
    methods: ["POST"],
    authLevel: "function",
    handler: CallbackSMSFunction
});
