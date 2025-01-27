const isLocal = !process.env.WEBSITE_HOSTNAME || process.env.WEBSITE_HOSTNAME.startsWith("localhost");

console.log("process.env.WEBSITE_HOSTNAME:", process.env.WEBSITE_HOSTNAME)

const protocol = !isLocal ? "https" : "http";
const host = isLocal ? process.env.SELF_PUBLIC_IP : process.env.FUNCTIONS_CUSTOMHANDLER_HOST;
const port = isLocal ? ":7071" : "";

export const SELF_PUBLIC_BASE_URL: string = `${protocol}://${host}${port}`;



console.log("SELF_PUBLIC_BASE_URL:", SELF_PUBLIC_BASE_URL)




export const throwErrorEnvionmentVar = (variable: string): never => {
    throw new Error(`A variável de ambiente '${variable}' é obrigatória e não foi definida.`);
}