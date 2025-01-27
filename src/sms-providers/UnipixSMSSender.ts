import axios from 'axios';
import { SELF_PUBLIC_BASE_URL, throwErrorEnvionmentVar } from '../utils/azure-functions-utils';
import { SMSSender, SMSSendTO } from '../sms/SMSSender';

export class UnipixSMSSender implements SMSSender {
    private apiUrl: string;
    private authUrl: string;
    private username: string;
    private password: string;
    private nomeEmpresa: string;
    private centroDeCustoId: string;

    constructor() {
        this.apiUrl = process.env.UNIPIX_API_URL || 'https://api-sms-cliente.unipix.com.br';
        this.authUrl = process.env.UNIPIX_AUTH_URL || 'https://api-sms-cliente-autenticacao.unipix.com.br';
        this.username = process.env.UNIPIX_USERNAME || throwErrorEnvionmentVar("UNIPIX_USERNAME");
        this.password = process.env.UNIPIX_PASSWORD || throwErrorEnvionmentVar("UNIPIX_PASSWORD");
        this.nomeEmpresa = process.env.UNIPIX_NOME_EMPRESA?.trim() || throwErrorEnvionmentVar("UNIPIX_NOME_EMPRESA");
        this.centroDeCustoId = process.env.UNIPIX_CENTRO_DE_CUSTO?.trim() || throwErrorEnvionmentVar("UNIPIX_CENTRO_DE_CUSTO");
    }

    async sendSms(to: SMSSendTO): Promise<string> {
        if (!to.phoneNumber || !to.messageBody) {
            throw new Error('Phone number or message body is missing.');
        }

        if (!this.isValidPhoneNumber(to.phoneNumber)) {
            throw new Error('Invalid phone number.');
        }

        const token = await this.authenticate();

        if (!token) {
            throw new Error('Authentication failed.');
        }

        const centroCusto = await this.getCentroCusto(token);

        if (!centroCusto) {
            throw new Error('Centro de custo retrieval failed.');
        }

        const payload = {
            nome: this.nomeEmpresa,
            centroCustoId: centroCusto.centroCustoId,
            produtoId: centroCusto.produtoId,
            telefones: this.formatPhoneNumber(to.phoneNumber),
            mensagemCampanha: to.messageBody.trim(),
            urlCallbackResposta: to.callbackUrl ? `${SELF_PUBLIC_BASE_URL}/api/CallbackSMSFunction` : undefined
        };

        return this.sendCampaign(token, payload);
    }

    createCallBackTO(json: any) {
        return {
            messageId: json.smsId,
            messageBody: json.resposta,
        };
    }

    private async authenticate(): Promise<string> {
        try {
            const response = await axios.post(`${this.authUrl}/login`, {
                email: this.username,
                password: this.password,
            });
            return response.data.access_token;
        } catch (error) {
            console.error('Error during authentication:', error);
            return null;
        }
    }

    private async getCentroCusto(token: string): Promise<{ centroCustoId: string; produtoId: string }> {
        try {
            const response = await axios.get(`${this.apiUrl}/api/centrocusto`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            const list = response.data;

            if (!list || list.length === 0) {
                return null;
            }
    
            for (const item of list) {
                const centroDeCustoResponse = item.id;
    
                if (!centroDeCustoResponse || centroDeCustoResponse.toString().trim() !== this.centroDeCustoId) {
                    continue;
                }
    
                const produto = item.produto?.[0];
    
                return {
                    centroCustoId: centroDeCustoResponse.toString(),
                    produtoId: produto?.id?.toString() || null,
                };
            }
    
            return null;
        } catch (error) {
            console.error('Error retrieving centro de custo:', error);
            return null;
        }
    }

    private async sendCampaign(token: string, payload: any): Promise<string> {
        try {
            const response = await axios.post(`${this.apiUrl}/api/campanha/simples`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data.id;
        } catch (error) {
            console.error('Error sending campaign:', error);
            throw new Error('Campaign sending failed.');
        }
    }

    private isValidPhoneNumber(phone: string): boolean {
        const regex = /^\d{2}\d{4,5}\d{4}$/; // Matches Brazilian phone numbers
        return regex.test(phone);
    }

    private formatPhoneNumber(phone: string): string {
        return phone.replace(/\D/g, ''); // Remove non-numeric characters
    }
}
