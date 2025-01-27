import { throwErrorEnvionmentVar } from "../utils/azure-functions-utils";
import { SMSCallBackTO, SMSSender, SMSSendTO } from "../sms/SMSSender"
import Twilio from "twilio";

export class TwilioSMSSender implements SMSSender
{
    async sendSms(to: SMSSendTO) {
        const twilioClient = Twilio(
            process.env.TWILIO_ACCOUNT_SID || throwErrorEnvionmentVar("TWILIO_ACCOUNT_SID"),
            process.env.TWILIO_AUTH_TOKEN || throwErrorEnvionmentVar("TWILIO_AUTH_TOKEN")
        );
    
        const twilioMessage = await twilioClient.messages.create({
            body: to.messageBody,
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || throwErrorEnvionmentVar("TWILIO_MESSAGING_SERVICE_SID"),
            to: to.phoneNumber,
        });

        return twilioMessage.sid;
    }

    createCallBackTO(json: any): SMSCallBackTO {
        return { messageId: json.MessageSid, messageBody: json.Body}
    }
}