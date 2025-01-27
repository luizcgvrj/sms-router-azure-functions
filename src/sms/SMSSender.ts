import { TwilioSMSSender } from "../sms-providers/TwilioSMSSender";
import { UnipixSMSSender } from "../sms-providers/UnipixSMSSender";


export const createSmsSender = () => {
    if (process.env.SMS_PROVIDER == "unipix") {
        return new UnipixSMSSender();
    }

    return new TwilioSMSSender()
} 


export interface SMSSender
{
    sendSms(to: SMSSendTO): Promise<string>;

    createCallBackTO(jsonBody: any): SMSCallBackTO;
}


export interface SMSSendTO
{
    phoneNumber: string;
    messageBody: string;
    callbackUrl: string;
    trackId: string;
}
export interface SMSCallBackTO
{
    messageId: string;
    messageBody: string;
}