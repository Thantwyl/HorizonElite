const translationService =
require("../services/translationService");

const getSupportedLanguages = (req, res) => {

    try {

        const languages =
        translationService.getSupportedLanguages();

        return res.status(200).json({
            message:
            "Supported languages retrieved successfully",

            total_languages:
            languages.length,

            languages
        });

    }
    catch(error) {

        return res.status(500).json({
            error:
            error.message
        });

    }

};

const translate = async (req, res) => {

    try {

        const {
            text,
            source_language,
            target_language
        } = req.body;

        if (!text) {

            return res.status(400).json({
                error:
                "Text is required"
            });

        }

        if (text.length > 5000) {

            return res.status(400).json({
                error:
                "Text exceeds maximum length of 5000 characters"
            });

        }

        if (!target_language) {

            return res.status(400).json({
                error:
                "Target language is required"
            });

        }

        if (!translationService.isSupportedLanguage(target_language)) {

            return res.status(400).json({
                error:
                "Unsupported target language"
            });

        }

        const sourceLanguage =
        source_language || "en";

        const translation =
        await translationService.translateSingleText({
            text,
            source_language: sourceLanguage,
            target_language
        });

        return res.status(200).json({
            message:
            "Translation successful",

            original_text:
            text,

            translated_text:
            translation.translatedText,

            source_language:
            sourceLanguage,

            target_language,

            character_count:
            text.length,

            translation_timestamp:
            new Date().toISOString()
        });

    }
    catch(error) {

        if (error.response) {

            return res.status(error.response.status).json({
                error:
                "Google API Error",

                details:
                error.response.data
            });

        }

        return res.status(500).json({
            error:
            "Internal Server Error",

            details:
            error.message
        });

    }

};

const bulkTranslate = async (req, res) => {

    try {

        const {
            texts,
            source_language,
            target_language
        } = req.body;

        if (!texts || Array.isArray(texts) || typeof texts !== "object") {

            return res.status(400).json({
                error:
                "Texts object is required"
            });

        }

        const textKeys =
        Object.keys(texts);

        if (textKeys.length === 0) {

            return res.status(400).json({
                error:
                "Texts object cannot be empty"
            });

        }

        const hasInvalidText =
        textKeys.some((key) => typeof texts[key] !== "string" || !texts[key]);

        if (hasInvalidText) {

            return res.status(400).json({
                error:
                "Each text value must be a non-empty string"
            });

        }

        const totalCharacterCount =
        textKeys.reduce((total, key) => total + texts[key].length, 0);

        if (totalCharacterCount > 5000) {

            return res.status(400).json({
                error:
                "Bulk text exceeds maximum length of 5000 characters"
            });

        }

        if (!target_language) {

            return res.status(400).json({
                error:
                "Target language is required"
            });

        }

        if (!translationService.isSupportedLanguage(target_language)) {

            return res.status(400).json({
                error:
                "Unsupported target language"
            });

        }

        const sourceLanguage =
        source_language || "en";

        const translations =
        await translationService.translateBulkTexts({
            texts,
            source_language: sourceLanguage,
            target_language
        });

        return res.status(200).json({
            message:
            "Bulk translation successful",

            source_language:
            sourceLanguage,

            target_language,

            total_items:
            textKeys.length,

            character_count:
            totalCharacterCount,

            translations,

            translation_timestamp:
            new Date().toISOString()
        });

    }
    catch(error) {

        if (error.response) {

            return res.status(error.response.status).json({
                error:
                "Google API Error",

                details:
                error.response.data
            });

        }

        return res.status(500).json({
            error:
            "Internal Server Error",

            details:
            error.message
        });

    }

};

const getFlightContent = (req, res) => {

    try {

        const {
            lang
        } = req.params;

        const content =
        translationService.getFlightContent(lang);

        if (!content) {

            return res.status(400).json({
                error:
                "Unsupported language"
            });

        }

        return res.status(200).json({
            message:
            "Flight content retrieved successfully",

            language:
            lang,

            language_name:
            translationService.getLanguageName(lang),

            content
        });

    }
    catch(error) {

        return res.status(500).json({
            error:
            error.message
        });

    }

};

module.exports = {
    getSupportedLanguages,
    translate,
    bulkTranslate,
    getFlightContent
};
