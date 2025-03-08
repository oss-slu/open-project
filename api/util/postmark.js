import postmark from "postmark"
export const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY); 
export default client;