import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createSmsSender, SMSSendTO } from "../sms/SMSSender";
import { WebHookRepository } from "../sms/WebHookRepository";



export async function SendMessageFunction(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json()

        context.log("Message received by POST:", body);

        await SendMessage(body as SMSSendTO, context)

        return { status: 200, jsonBody: { message: "SMS sent successfully." } };
    } catch (error) {
        context.log("Error sending SMS:", error);
        return { status: 500, jsonBody: { error: "Internal server error." } };
    }
}


export async function SendMessageFunctionByBusQueue(message: SMSSendTO, context: InvocationContext): Promise<void> {
    try {
        context.log("Message received by Bus Queue:", message);

        await SendMessage(message, context)
    }
    catch (error) {
        context.log('Erro ao enviar mensagem by bus queue:', error);
    }
}


export async function SendMessage(message: SMSSendTO, context: InvocationContext): Promise<void> {
    const { phoneNumber, messageBody, callbackUrl } = message;

    if (!phoneNumber || !messageBody) {
        context.log(`Required parameters are missing - phoneNumber: ${phoneNumber}, messageBody: ${messageBody}`);

        return;
    }

    const messageId = await createSmsSender().sendSms(message)

    if (callbackUrl) {
        await new WebHookRepository().save(messageId, message)
    }

    context.log(`Message sent successfully. SID: ${messageId}`);
}



app.http("SendMessageFunction", {
    methods: ["POST"],
    authLevel: "function",
    handler: SendMessageFunction
});


app.serviceBusQueue('SendMessageFunctionByBusQueue', {
    connection: 'ServiceBusConnection',
    queueName: 'local.router.sms.message',
    handler: SendMessageFunctionByBusQueue
});
