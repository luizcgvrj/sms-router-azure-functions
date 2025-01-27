import { MongoClient, ObjectId, Db } from "mongodb";
import { SMSSendTO } from "./SMSSender";

const COLLECTION_NAME = "webhook";


export class WebHookRepository
{
    async save(messageId: string, message: SMSSendTO) {
        return await this.inConnection(async (database: Db) => {
            const collection = database.collection(COLLECTION_NAME)
    
            const document: WebhookEntity = {
                messageId: messageId,
                callbackUrl: message.callbackUrl,
                timestamp: new Date(),
                trackId: message.trackId
            };
    
            await collection.insertOne(document)
        })
    }

    async getByMessageId(messageId: String): Promise<WebhookEntity> {
        return await this.inConnection(async (database: Db) => {
            const collection = database.collection(COLLECTION_NAME);
    
            return (await collection.findOne({ messageId: messageId })) as any;
        })
    }

    async delete(document: WebhookEntity): Promise<void> {
        return await this.inConnection(async (database: Db) => {
            const collection = database.collection(COLLECTION_NAME);

            await collection.deleteOne({ _id: document._id });
        })
    }

    async clearOld(): Promise<void> {
        await this.inConnection(async (database: Db) => {
            const collection = database.collection(COLLECTION_NAME);

            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2); //2 days agora

            const result = await collection.deleteMany({
                timestamp: { $lt: twoDaysAgo },
            });

            console.log(`${result.deletedCount} ${COLLECTION_NAME} foram deletados.`);
        });
    }

    async inConnection(executor: (database: Db) => Promise<void>): Promise<any> {

        const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false");
    
        await client.connect();
    
        try {
            const database = client.db(process.env.MONGODB_DB_NAME || "sms-router");

            await executor(database);
        } finally {
            await client.close();
        }
    }
}

export interface WebhookEntity
{
    _id?: ObjectId;
    messageId: string;
    callbackUrl: string;
    timestamp: Date;
    trackId: string;
}