const express = require('express');
const cors = require('cors'); // <-- BU ÇOK KRİTİK
const { GoogleGenAI } = require('@google/genai'); // En güncel Gemini SDK'sı

const app = express();

// Tarayıcının güvenle bağlanabilmesi için CORS'u aktif edin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));

app.use(express.json({ limit: '50mb' })); // Büyük metinler ve görseller için limit yükseltme

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Metin ve PDF işleme ortak endpoint'i
app.post('/generate/text', async (req, res) => {
  try {
    const { text, count, lang } = req.body;
    
    // Gemini'a kesin bir çıktı formatı dikte ediyoruz (Structured Outputs)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Aşağıdaki metni analiz et ve en önemli yerlerinden ${count} adet flashcard üret. Çıktı dili: ${lang}.
      Metin: ${text}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            cards: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  front: { type: 'STRING', description: 'Soru, kavram veya ön yüz metni' },
                  back: { type: 'STRING', description: 'Cevap, formül veya arka yüz metni' },
                  hint: { type: 'STRING', description: 'İpucu veya ek detay' }
                },
                required: ['front', 'back']
              }
            }
          }
        }
      }
    });

    // Gemini'dan gelen JSON'ı direkt tarayıcıya pasla
    const result = JSON.parse(response.text);
    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Fotoğraf / OCR endpoint'i
app.post('/generate/image', async (req, res) => {
  try {
    const { image, count, lang } = req.body;
    // Base64 formatını Gemini'ın anlayacağı temiz binary yapıya çeviriyoruz
    const base64Data = image.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        },
        `Bu görseldeki yazıları/notları oku ve en önemli yerlerinden ${count} adet flashcard üret. Çıktı dili: ${lang}.`
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            cards: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  front: { type: 'STRING' },
                  back: { type: 'STRING' },
                  hint: { type: 'STRING' }
                },
                required: ['front', 'back']
              }
            }
          }
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
