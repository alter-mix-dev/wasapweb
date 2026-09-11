const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// CONFIGURACIÓN DE IA GRATUITA (Igual que en tu tarea)
const HUGGINGFACE_API_KEY = process.env.HF_TOKEN;

// Inicializamos el cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(), // Guarda la sesión para que no escanees el QR cada vez que reinicie
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Obligatorio para servidores en la nube como Render
    }
});

// Generar el código QR en la consola de Render
client.on('qr', (qr) => {
    console.log('⚠️ ESCANEA ESTE CÓDIGO QR EN TU WHATSAPP (Dispositivos Vinculados):');
    qrcode.generate(qr, { small: true });
});

// Confirmación de conexión exitosa
client.on('ready', () => {
    console.log('🚀 ¡Bot con escaneo QR conectado y listo!');
});

// Escuchar todos los mensajes entrantes de tu WhatsApp real
client.on('message', async (msg) => {
    try {
        // Evitamos responder a grupos o a estados, solo chats individuales directos
        if (msg.from.includes('@g.us') || msg.from.includes('status')) return;

        console.log(`💬 Mensaje de [${msg.from}]: ${msg.body}`);

        // Llamar a Llama 3.1 en Hugging Face
        const respuestaBot = await consultarLlamaIA(msg.body);
        
        // Responder directamente al usuario usando tu propio número
        await msg.reply(respuestaBot);

    } catch (error) {
        console.error('❌ Error procesando el mensaje:', error.message);
    }
});

/**
 * Conexión con el modelo Llama en la nube
 */
async function consultarLlamaIA(promptUsuario) {
    try {
        const urlIA = "https://huggingface.co";
        
        const payload = {
            inputs: `<|system|>\nEres un chatbot de WhatsApp inteligente, conciso y amable. Responde siempre en Español de manera breve.<|user|>\n${promptUsuario}<|assistant|>\n`,
            parameters: { max_new_tokens: 250, temperature: 0.7 }
        };

        const headers = { 'Authorization': `Bearer ${HUGGINGFACE_API_KEY}` };
        const response = await axios.post(urlIA, payload, { headers });
        
        return response.data?.generated_text?.trim() || "¡Hola! ¿En qué más te colaboro?";
    } catch (error) {
        console.error("⚠️ Error en Llama:", error.message);
        return "Lo siento, tuve un pestañeo técnico. ¿Me repites eso?";
    }
}

client.initialize();
