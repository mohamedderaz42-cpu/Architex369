import { Language } from '../types';

export const translations = {
  en: {
    dashboard: "Dashboard",
    socialFi: "Social-Fi",
    vestingVault: "Vesting Vault",
    godMode: "God Mode",
    iot: "IoT Grid",
    welcome: "Welcome back",
    balance: "My Balance",
    send: "Send",
    receive: "Receive",
    trustline: "Asset Trustline",
    trustlineConnected: "Connected",
    trustlineMissing: "Missing Trustline",
    trustlineDesc: "Your wallet is configured to receive ARTX assets.",
    trustlineMissingDesc: "You must establish a trustline to the ARTX Issuer Account.",
    addTrustline: "Add Trustline",
    sponsored: "Sponsored",
    piAds: "Pi Network Ads",
    supportEco: "Support the ecosystem",
    centralCommand: "Central Command",
    systemActive: "SYSTEM ACTIVE",
    processing: "PROCESSING NEURAL REQUEST...",
    queryProto: "Query protocol parameters...",
    role: "Role",
    piMainnet: "Pi Mainnet"
  },
  ar: {
    dashboard: "لوحة القيادة",
    socialFi: "الشبكة الاجتماعية",
    vestingVault: "خزنة الاستحقاق",
    godMode: "الوضع الإلهي",
    iot: "شبكة الأشياء",
    welcome: "مرحباً بك",
    balance: "رصيدي",
    send: "إرسال",
    receive: "استقبال",
    trustline: "خط الثقة",
    trustlineConnected: "متصل",
    trustlineMissing: "خط الثقة مفقود",
    trustlineDesc: "محفظتك مهيأة لاستقبال أصول ARTX.",
    trustlineMissingDesc: "يجب عليك إنشاء خط ثقة لحساب إصدار ARTX.",
    addTrustline: "إضافة خط ثقة",
    sponsored: "ممول",
    piAds: "إعلانات شبكة Pi",
    supportEco: "ادعم النظام البيئي",
    centralCommand: "مركز القيادة",
    systemActive: "النظام نشط",
    processing: "جاري معالجة الطلب العصبي...",
    queryProto: "استعلم عن معلمات البروتوكول...",
    role: "الدور",
    piMainnet: "شبكة Pi الرئيسية"
  }
};

export const getDir = (lang: Language): 'ltr' | 'rtl' => {
  return lang === 'ar' ? 'rtl' : 'ltr';
};

export const t = (key: keyof typeof translations['en'], lang: Language): string => {
  return translations[lang][key] || key;
};