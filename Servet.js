// Yapay zekaya tam olarak ne istediğimizi şema ile anlatıyoruz
const { Type } = require('@google/genai');

app.post('/api/generate-flashcards', async (req, res) => {
    try {
        const pdfText = req.body.pdfText; // Ön yüzden ayıkladığın PDF metni

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { text: `Aşağıdaki çalışma notlarından önemli kavramları çıkar ve flashcard'lar oluştur:\n\n${pdfText}` }
            ],
            // Gemini'ın sadece JSON üretmesini zorunlu kılıyoruz:
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            front: { type: Type.STRING, description: "Kartın ön yüzü, soru veya kavram" },
                            back: { type: Type.STRING, description: "Kartın arka yüzü, cevap veya açıklama" }
                        },
                        required: ["front", "back"],
                    },
                },
            }
        });

        // Gemini sana doğrudan temiz bir Array döndürür: [{front: "...", back: "..."}, ...]
        const flashcards = JSON.parse(response.text);
        res.json({ success: true, flashcards });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Flashcardlar üretilirken bir hata oluştu." });
    }
});
