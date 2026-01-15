
import { GoogleGenAI, Type } from "@google/genai";
import { Product, ProjectTask } from "../types";

export const geminiService = {
  parseQuoteToTasks: async (text: string): Promise<Partial<ProjectTask>[]> => {
    // On vérifie la présence de la clé injectée par l'environnement
    if (!process.env.API_KEY) {
      throw new Error("KEY_NOT_FOUND");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyse ce texte de devis de paysagisme et extrais-le sous forme de liste structurée.
        Texte: "${text}"
        
        Pour chaque article, identifie :
        1. Reference: Code technique (ex: P2AA11489)
        2. Name: Titre court du produit (ex: Panneau Bois Arifi)
        3. Location: Où il est posé (ex: Mur mitoyen gauche)
        4. Description: Détails comme quantités, dimensions.
        
        Retourne un JSON array d'objets avec les clés: reference, name, location, description.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    reference: { type: Type.STRING },
                    name: { type: Type.STRING },
                    location: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["tasks"]
          }
        }
      });

      const data = JSON.parse(response.text);
      return data.tasks || [];
    } catch (error: any) {
      console.error("Gemini Parsing Error:", error);
      // "Requested entity was not found" ou erreur 403/401 indiquent un problème de clé
      if (error.message?.includes("entity was not found") || error.message?.includes("API key")) {
        throw new Error("KEY_NOT_FOUND");
      }
      return [];
    }
  },

  generateVisualization: async (base64SitePhoto: string, matchedProducts: Product[], tasks: ProjectTask[]): Promise<string | null> => {
    if (!process.env.API_KEY) {
      throw new Error("KEY_NOT_FOUND");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const taskSummary = tasks.map(t => `- LIEU: ${t.location} | PRODUIT: ${t.name} (Ref: ${t.reference}) | DETAILS: ${t.description}`).join('\n');
    const cleanBase64 = base64SitePhoto.split(',')[1] || base64SitePhoto;

    const limitedProducts = matchedProducts.slice(0, 3);

    const contents: any = {
      parts: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        },
        ...limitedProducts.map(p => ({
          inlineData: {
            data: p.image_display.split(',')[1] || p.image_display,
            mimeType: 'image/jpeg',
          },
        })),
        {
          text: `Tu es un moteur de rendu architectural de haute précision pour "Dessine moi un jardin".
          
          PHOTO SOURCE : La première image fournie représente l'état actuel.
          TEXTURES RÉELLES : Les images suivantes sont les textures réelles des matériaux sélectionnés.
          
          MISSION : Génère un nouveau visuel HD en incrustant les TEXTURES RÉELLES sur la PHOTO SOURCE aux emplacements suivants :
          ${taskSummary}
          
          RÈGLES DE RENDU :
          1. FIDÉLITÉ PHOTORÉALISTE : Le rendu doit ressembler à une photo réelle terminée.
          2. ÉCLAIRAGE : Adapte la luminosité des textures à l'éclairage de la photo source.
          3. PERSPECTIVE : Aligne parfaitement les matériaux sur les lignes de fuite existantes.
          4. PROPRETÉ : Supprime visuellement les éléments de chantier ou les zones dégradées remplacées par les nouveaux matériaux.`,
        },
      ],
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error: any) {
      console.error("Visualization Generation Error:", error);
      if (error.message?.includes("entity was not found") || error.message?.includes("API key")) {
        throw new Error("KEY_NOT_FOUND");
      }
      return null;
    }
  }
};
