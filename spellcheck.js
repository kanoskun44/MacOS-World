// spellcheck.js
const axios = require("axios");

/**
 * Corrige un texto usando la API pública de LanguageTool
 * @param {string} texto - El texto a corregir
 * @returns {Promise<string>} - El texto corregido
 */
async function corregirTexto(texto) {
    try {
        const response = await axios.post("https://api.languagetool.org/v2/check", null, {
            params: {
                text: texto,
                language: "es"
            }
        });

        let correcciones = texto;

        response.data.matches.forEach(match => {
            if (match.replacements.length > 0) {
                // Usamos el primer reemplazo sugerido
                const replacement = match.replacements[0].value;

                // Reemplazamos en el texto original
                correcciones = correcciones.replace(match.context.text, replacement);
            }
        });

        return correcciones;
    } catch (error) {
        console.error("❌ Error con LanguageTool:", error.message);
        return texto; // Si hay error, devolvemos el texto original
    }
}

// Exportamos la función para usarla en main.js
module.exports = { corregirTexto };
