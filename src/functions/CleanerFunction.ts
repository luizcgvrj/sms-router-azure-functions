import { app, InvocationContext, Timer } from "@azure/functions";
import { WebHookRepository } from "../sms/WebHookRepository";

export async function CleanerFunction(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('CleanerFunction start.');

    await new WebHookRepository().clearOld()

    context.log('CleanerFunction finished.');
}

app.timer('CleanerFunction', {
    schedule: "0 0 2 * * *",
    handler: CleanerFunction
});
