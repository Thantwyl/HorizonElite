const axios = require("axios");

const supportedLanguages = [
    {
        language_code: "en",
        language_name: "English",
        native_name: "English",
        is_default: true
    },
    {
        language_code: "th",
        language_name: "Thai",
        native_name: "ไทย",
        is_default: false
    },
    {
        language_code: "zh",
        language_name: "Chinese",
        native_name: "中文",
        is_default: false
    },
    {
        language_code: "ja",
        language_name: "Japanese",
        native_name: "日本語",
        is_default: false
    },
    {
        language_code: "ko",
        language_name: "Korean",
        native_name: "한국어",
        is_default: false
    },
    {
        language_code: "es",
        language_name: "Spanish",
        native_name: "Español",
        is_default: false
    },
    {
        language_code: "fr",
        language_name: "French",
        native_name: "Français",
        is_default: false
    },
    {
        language_code: "de",
        language_name: "German",
        native_name: "German",
        is_default: false
    },
    {
        language_code: "vi",
        language_name: "Vietnamese",
        native_name: "Tiếng Việt",
        is_default: false
    },
    {
        language_code: "id",
        language_name: "Indonesian",
        native_name: "Bahasa Indonesia",
        is_default: false
    },
    {
        language_code: "hi",
        language_name: "Hindi",
        native_name: "हिन्दी",
        is_default: false
    },
    {
        language_code: "ar",
        language_name: "Arabic",
        native_name: "العربية",
        is_default: false
    },
    {
        language_code: "my",
        language_name: "Burmese",
        native_name: "မြန်မာ",
        is_default: false
    }
];

const getSupportedLanguages = () => {

    return supportedLanguages;

};

const isSupportedLanguage = (languageCode) => {

    return supportedLanguages.some(
        (language) => language.language_code === languageCode
    );

};

const flightContentByLanguage = {
    en: {
        common_terms: {
            flight: "flight",
            departure: "departure",
            arrival: "arrival",
            passenger: "passenger",
            cabin_class: "cabin class",
            round_trip: "round trip",
            one_way: "one way",
            multi_city: "multi city"
        },
        cabin_classes: {
            economy: "economy",
            premium_economy: "premium economy",
            business: "business",
            first_class: "first class"
        },
        passenger_types: {
            adult: "adult",
            child: "child",
            infant: "infant"
        },
        booking_terms: {
            booking: "booking",
            payment: "payment",
            total: "total",
            tax: "tax",
            confirmed: "confirmed",
            cancelled: "cancelled"
        }
    },
    th: {
        common_terms: {
            flight: "เที่ยวบิน",
            departure: "ออกเดินทาง",
            arrival: "มาถึง",
            passenger: "ผู้โดยสาร",
            cabin_class: "ชั้นโดยสาร",
            round_trip: "ไปกลับ",
            one_way: "เที่ยวเดียว",
            multi_city: "หลายเมือง"
        },
        cabin_classes: {
            economy: "ชั้นประหยัด",
            premium_economy: "ชั้นประหยัดพรีเมียม",
            business: "ชั้นธุรกิจ",
            first_class: "ชั้นหนึ่ง"
        },
        passenger_types: {
            adult: "ผู้ใหญ่",
            child: "เด็ก",
            infant: "ทารก"
        },
        booking_terms: {
            booking: "การจอง",
            payment: "การชำระเงิน",
            total: "ยอดรวม",
            tax: "ภาษี",
            confirmed: "ยืนยันแล้ว",
            cancelled: "ยกเลิกแล้ว"
        }
    },
    my: {
        common_terms: {
            flight: "လေယာဉ်ခရီးစဉ်",
            departure: "ထွက်ခွာချိန်",
            arrival: "ရောက်ရှိချိန်",
            passenger: "ခရီးသည်",
            cabin_class: "ခုံတန်းအမျိုးအစား",
            round_trip: "အသွားအပြန်",
            one_way: "တစ်ကြောင်းသွား",
            multi_city: "မြို့များစွာ"
        },
        cabin_classes: {
            economy: "အီကွန်မီတန်း",
            premium_economy: "ပရီမီယံ အီကွန်မီတန်း",
            business: "ဘစ်ဇနက်တန်း",
            first_class: "ပထမတန်း"
        },
        passenger_types: {
            adult: "လူကြီး",
            child: "ကလေး",
            infant: "နို့စို့ကလေး"
        },
        booking_terms: {
            booking: "ကြိုတင်မှာယူမှု",
            payment: "ငွေပေးချေမှု",
            total: "စုစုပေါင်း",
            tax: "အခွန်",
            confirmed: "အတည်ပြုပြီး",
            cancelled: "ပယ်ဖျက်ပြီး"
        }
    }
};

const translateSingleText = async ({
    text,
    source_language = "en",
    target_language
}) => {

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is missing in .env");
    }

    const url =
    `https://www.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;

    const response =
    await axios.post(
        url,
        {
            q: text,
            source: source_language,
            target: target_language,
            format: "text"
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    return response.data.data.translations[0];

};

const translateBulkTexts = async ({
    texts,
    source_language = "en",
    target_language
}) => {

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is missing in .env");
    }

    const keys =
    Object.keys(texts);

    const values =
    keys.map((key) => texts[key]);

    const url =
    `https://www.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;

    const response =
    await axios.post(
        url,
        {
            q: values,
            source: source_language,
            target: target_language,
            format: "text"
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    const translatedItems =
    response.data.data.translations;

    return keys.reduce((result, key, index) => {

        result[key] =
        translatedItems[index].translatedText;

        return result;

    }, {});

};

const getFlightContent = (lang) => {

    if (!isSupportedLanguage(lang)) {
        return null;
    }

    return flightContentByLanguage[lang] || flightContentByLanguage.en;

};

const getLanguageName = (languageCode) => {

    const language =
    supportedLanguages.find(
        (item) => item.language_code === languageCode
    );

    return language ? language.language_name : null;

};

module.exports = {
    getSupportedLanguages,
    getLanguageName,
    getFlightContent,
    isSupportedLanguage,
    translateSingleText,
    translateBulkTexts
};
