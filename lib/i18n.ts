export const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'as', name: 'অসমীয়া', dir: 'ltr' },
  { code: 'bn', name: 'বাংলা', dir: 'ltr' },
  { code: 'brx', name: 'बड़ो', dir: 'ltr' },
  { code: 'doi', name: 'डोगरी', dir: 'ltr' },
  { code: 'gu', name: 'ગુજરાતી', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { code: 'kn', name: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'ks', name: 'کٲشُر', dir: 'rtl' },
  { code: 'kok', name: 'कोंकणी', dir: 'ltr' },
  { code: 'mai', name: 'मैथिली', dir: 'ltr' },
  { code: 'ml', name: 'മലയാളം', dir: 'ltr' },
  { code: 'mni', name: 'মৈতৈলোন্', dir: 'ltr' },
  { code: 'mr', name: 'मराठी', dir: 'ltr' },
  { code: 'ne', name: 'नेपाली', dir: 'ltr' },
  { code: 'or', name: 'ଓଡ଼ିଆ', dir: 'ltr' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', dir: 'ltr' },
  { code: 'sa', name: 'संस्कृतम्', dir: 'ltr' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', dir: 'ltr' },
  { code: 'sd', name: 'سنڌي', dir: 'rtl' },
  { code: 'ta', name: 'தமிழ்', dir: 'ltr' },
  { code: 'te', name: 'తెలుగు', dir: 'ltr' },
  { code: 'ur', name: 'اردو', dir: 'rtl' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export type TranslationKey = keyof typeof en;

const en = {
  'nav.dashboard': 'Dashboard', 'nav.pos': 'POS', 'nav.tables': 'Tables', 'nav.orders': 'Orders',
  'nav.kitchen': 'Kitchen', 'nav.menu': 'Menu', 'nav.modifiers': 'Modifiers', 'nav.inventory': 'Inventory',
  'nav.recipes': 'Recipes', 'nav.customers': 'Customers', 'nav.staff': 'Staff', 'nav.reports': 'Reports',
  'nav.billing': 'Plan & billing', 'nav.settings': 'Settings', 'nav.superAdmin': 'Super admin',
  'action.signOut': 'Sign out', 'action.choosePlan': 'Choose a plan', 'action.renewNow': 'Renew now',
  'settings.language': 'Language', 'settings.languageDescription': 'Choose the language for your account. This setting applies only to your login.',
  'settings.languageSaved': 'Language saved', 'settings.languageError': 'Could not save language. Please try again.',
} as const;

const translated: Partial<Record<LanguageCode, Partial<Record<TranslationKey, string>>>> = {
  as: { 'nav.dashboard': 'ডেশ্বব’ৰ্ড', 'nav.pos': 'বিক্ৰী', 'nav.tables': 'মেজ', 'nav.orders': 'অৰ্ডাৰ', 'nav.kitchen': 'পাকঘৰ', 'nav.menu': 'মেনু', 'nav.inventory': 'মজুত', 'nav.customers': 'গ্ৰাহক', 'nav.staff': 'কৰ্মচাৰী', 'nav.reports': 'প্ৰতিবেদন', 'nav.billing': 'প্লেন আৰু বিলিং', 'nav.settings': 'ছেটিংছ', 'action.signOut': 'ছাইন আউট', 'settings.language': 'ভাষা', 'settings.languageSaved': 'ভাষা সংৰক্ষিত হ’ল' },
  bn: { 'nav.dashboard': 'ড্যাশবোর্ড', 'nav.pos': 'বিক্রয়', 'nav.tables': 'টেবিল', 'nav.orders': 'অর্ডার', 'nav.kitchen': 'রান্নাঘর', 'nav.menu': 'মেনু', 'nav.inventory': 'মজুত', 'nav.customers': 'গ্রাহক', 'nav.staff': 'কর্মী', 'nav.reports': 'রিপোর্ট', 'nav.billing': 'প্ল্যান ও বিলিং', 'nav.settings': 'সেটিংস', 'action.signOut': 'সাইন আউট', 'settings.language': 'ভাষা', 'settings.languageSaved': 'ভাষা সংরক্ষিত হয়েছে' },
  brx: { 'nav.dashboard': 'डैशबर्ड', 'nav.pos': 'बिक्री', 'nav.tables': 'टेबल', 'nav.orders': 'अर्डर', 'nav.kitchen': 'रानसालि', 'nav.menu': 'मेनु', 'nav.inventory': 'मजुत', 'nav.customers': 'ग्राहक', 'nav.staff': 'कर्मचारी', 'nav.reports': 'रिपोर्ट', 'nav.settings': 'सेटिंग्स', 'action.signOut': 'साइन आउट', 'settings.language': 'राव' },
  doi: { 'nav.dashboard': 'डैशबोर्ड', 'nav.pos': 'बिक्री', 'nav.tables': 'मेज', 'nav.orders': 'आर्डर', 'nav.kitchen': 'रसोई', 'nav.menu': 'मेन्यू', 'nav.inventory': 'भंडार', 'nav.customers': 'ग्राहक', 'nav.staff': 'कर्मचारी', 'nav.reports': 'रिपोर्ट', 'nav.settings': 'सेटिंग', 'action.signOut': 'साइन आउट', 'settings.language': 'भाशा' },
  gu: { 'nav.dashboard': 'ડેશબોર્ડ', 'nav.pos': 'વેચાણ', 'nav.tables': 'ટેબલ', 'nav.orders': 'ઓર્ડર', 'nav.kitchen': 'રસોડું', 'nav.menu': 'મેનુ', 'nav.inventory': 'જથ્થો', 'nav.customers': 'ગ્રાહકો', 'nav.staff': 'સ્ટાફ', 'nav.reports': 'અહેવાલો', 'nav.settings': 'સેટિંગ્સ', 'action.signOut': 'સાઇન આઉટ', 'settings.language': 'ભાષા', 'settings.languageSaved': 'ભાષા સાચવાઈ' },
  hi: { 'nav.dashboard': 'डैशबोर्ड', 'nav.pos': 'बिक्री', 'nav.tables': 'टेबल', 'nav.orders': 'ऑर्डर', 'nav.kitchen': 'रसोई', 'nav.menu': 'मेनू', 'nav.modifiers': 'विकल्प', 'nav.inventory': 'स्टॉक', 'nav.recipes': 'रेसिपी', 'nav.customers': 'ग्राहक', 'nav.staff': 'स्टाफ', 'nav.reports': 'रिपोर्ट', 'nav.billing': 'प्लान और बिलिंग', 'nav.settings': 'सेटिंग', 'nav.superAdmin': 'सुपर एडमिन', 'action.signOut': 'साइन आउट', 'action.choosePlan': 'प्लान चुनें', 'action.renewNow': 'अभी नवीनीकृत करें', 'settings.language': 'भाषा', 'settings.languageDescription': 'अपने खाते की भाषा चुनें। यह सेटिंग केवल आपके लॉगिन पर लागू होगी।', 'settings.languageSaved': 'भाषा सहेजी गई', 'settings.languageError': 'भाषा सहेजी नहीं जा सकी। कृपया फिर से प्रयास करें।' },
  kn: { 'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'nav.pos': 'ಮಾರಾಟ', 'nav.tables': 'ಟೇಬಲ್‌ಗಳು', 'nav.orders': 'ಆರ್ಡರ್‌ಗಳು', 'nav.kitchen': 'ಅಡುಗೆಮನೆ', 'nav.menu': 'ಮೆನು', 'nav.inventory': 'ದಾಸ್ತಾನು', 'nav.customers': 'ಗ್ರಾಹಕರು', 'nav.staff': 'ಸಿಬ್ಬಂದಿ', 'nav.reports': 'ವರದಿಗಳು', 'nav.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', 'action.signOut': 'ಸೈನ್ ಔಟ್', 'settings.language': 'ಭಾಷೆ', 'settings.languageSaved': 'ಭಾಷೆ ಉಳಿಸಲಾಗಿದೆ' },
  ks: { 'nav.dashboard': 'ڈیش بورڈ', 'nav.pos': 'فروخت', 'nav.tables': 'میز', 'nav.orders': 'آرڈر', 'nav.kitchen': 'باورچی خانہ', 'nav.menu': 'مینو', 'nav.inventory': 'اسٹاک', 'nav.customers': 'صارفین', 'nav.staff': 'عملہ', 'nav.reports': 'رپورٹس', 'nav.settings': 'ترتیبات', 'action.signOut': 'سائن آؤٹ', 'settings.language': 'زبان' },
  kok: { 'nav.dashboard': 'डॅशबोर्ड', 'nav.pos': 'विक्री', 'nav.tables': 'टेबलां', 'nav.orders': 'ऑर्डरी', 'nav.kitchen': 'रसोय', 'nav.menu': 'मेनू', 'nav.inventory': 'साठो', 'nav.customers': 'गिरायक', 'nav.staff': 'कर्मचारी', 'nav.reports': 'अहवाल', 'nav.settings': 'सेटिंग्स', 'action.signOut': 'साइन आउट', 'settings.language': 'भास' },
  mai: { 'nav.dashboard': 'डैशबोर्ड', 'nav.pos': 'बिक्री', 'nav.tables': 'मेज', 'nav.orders': 'ऑर्डर', 'nav.kitchen': 'रसोई', 'nav.menu': 'मेनू', 'nav.inventory': 'भंडार', 'nav.customers': 'ग्राहक', 'nav.staff': 'कर्मचारी', 'nav.reports': 'रिपोर्ट', 'nav.settings': 'सेटिंग', 'action.signOut': 'साइन आउट', 'settings.language': 'भाषा' },
  ml: { 'nav.dashboard': 'ഡാഷ്ബോർഡ്', 'nav.pos': 'വിൽപ്പന', 'nav.tables': 'മേശകൾ', 'nav.orders': 'ഓർഡറുകൾ', 'nav.kitchen': 'അടുക്കള', 'nav.menu': 'മെനു', 'nav.inventory': 'ശേഖരം', 'nav.customers': 'ഉപഭോക്താക്കൾ', 'nav.staff': 'ജീവനക്കാർ', 'nav.reports': 'റിപ്പോർട്ടുകൾ', 'nav.settings': 'ക്രമീകരണങ്ങൾ', 'action.signOut': 'സൈൻ ഔട്ട്', 'settings.language': 'ഭാഷ', 'settings.languageSaved': 'ഭാഷ സംരക്ഷിച്ചു' },
  mni: { 'nav.dashboard': 'ꯗꯦꯁꯕꯣꯔꯗ', 'nav.pos': 'ꯊꯥꯕꯥ', 'nav.tables': 'ꯃꯦꯖ', 'nav.orders': 'ꯑꯥꯔꯗꯔ', 'nav.kitchen': 'ꯆꯥꯛꯆꯥꯛ ꯃꯌꯥꯝ', 'nav.menu': 'ꯃꯦꯅꯨ', 'nav.inventory': 'ꯃꯆꯥꯛ', 'nav.customers': 'ꯃꯤꯁꯤꯡ', 'nav.staff': 'ꯊꯕꯛ ꯃꯤꯁꯤꯡ', 'nav.reports': 'ꯔꯤꯄꯣꯔꯠ', 'nav.settings': 'ꯁꯦꯇꯤꯡ', 'settings.language': 'ꯂꯣꯟ' },
  mr: { 'nav.dashboard': 'डॅशबोर्ड', 'nav.pos': 'विक्री', 'nav.tables': 'टेबल', 'nav.orders': 'ऑर्डर', 'nav.kitchen': 'स्वयंपाकघर', 'nav.menu': 'मेनू', 'nav.inventory': 'साठा', 'nav.customers': 'ग्राहक', 'nav.staff': 'कर्मचारी', 'nav.reports': 'अहवाल', 'nav.settings': 'सेटिंग्ज', 'action.signOut': 'साइन आउट', 'settings.language': 'भाषा', 'settings.languageSaved': 'भाषा जतन केली' },
  ne: { 'nav.dashboard': 'ड्यासबोर्ड', 'nav.pos': 'बिक्री', 'nav.tables': 'टेबल', 'nav.orders': 'अर्डर', 'nav.kitchen': 'भान्सा', 'nav.menu': 'मेनु', 'nav.inventory': 'मौज्दात', 'nav.customers': 'ग्राहक', 'nav.staff': 'कर्मचारी', 'nav.reports': 'प्रतिवेदन', 'nav.settings': 'सेटिङ', 'action.signOut': 'साइन आउट', 'settings.language': 'भाषा' },
  or: { 'nav.dashboard': 'ଡ୍ୟାସବୋର୍ଡ', 'nav.pos': 'ବିକ୍ରୟ', 'nav.tables': 'ଟେବୁଲ', 'nav.orders': 'ଅର୍ଡର', 'nav.kitchen': 'ରୋଷେଇଘର', 'nav.menu': 'ମେନୁ', 'nav.inventory': 'ଭଣ୍ଡାର', 'nav.customers': 'ଗ୍ରାହକ', 'nav.staff': 'କର୍ମଚାରୀ', 'nav.reports': 'ରିପୋର୍ଟ', 'nav.settings': 'ସେଟିଂସ୍', 'action.signOut': 'ସାଇନ୍ ଆଉଟ୍', 'settings.language': 'ଭାଷା', 'settings.languageSaved': 'ଭାଷା ସଞ୍ଚୟ ହେଲା' },
  pa: { 'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ', 'nav.pos': 'ਵਿਕਰੀ', 'nav.tables': 'ਮੇਜ਼', 'nav.orders': 'ਆਰਡਰ', 'nav.kitchen': 'ਰਸੋਈ', 'nav.menu': 'ਮੀਨੂ', 'nav.inventory': 'ਸਟਾਕ', 'nav.customers': 'ਗਾਹਕ', 'nav.staff': 'ਸਟਾਫ਼', 'nav.reports': 'ਰਿਪੋਰਟਾਂ', 'nav.settings': 'ਸੈਟਿੰਗਾਂ', 'action.signOut': 'ਸਾਈਨ ਆਉਟ', 'settings.language': 'ਭਾਸ਼ਾ', 'settings.languageSaved': 'ਭਾਸ਼ਾ ਸੁਰੱਖਿਅਤ ਕੀਤੀ' },
  sa: { 'nav.dashboard': 'नियन्त्रणफलकम्', 'nav.pos': 'विक्रयः', 'nav.tables': 'उपवेशनानि', 'nav.orders': 'आदेशाः', 'nav.kitchen': 'पाकशाला', 'nav.menu': 'सूची', 'nav.inventory': 'भाण्डारम्', 'nav.customers': 'ग्राहकाः', 'nav.staff': 'कर्मचारिणः', 'nav.reports': 'प्रतिवेदनानि', 'nav.settings': 'विन्यासाः', 'action.signOut': 'निर्गच्छतु', 'settings.language': 'भाषा' },
  sat: { 'nav.dashboard': 'ᱰᱮᱥᱵᱳᱨᱰ', 'nav.pos': 'ᱵᱤᱠᱨᱤ', 'nav.tables': 'ᱴᱮᱵᱩᱞ', 'nav.orders': 'ᱚᱰᱟᱨ', 'nav.kitchen': 'ᱨᱟᱸᱫᱷᱟ ᱚᱲᱟᱜ', 'nav.menu': 'ᱢᱮᱱᱩ', 'nav.inventory': 'ᱢᱟᱞ', 'nav.customers': 'ᱜᱟᱦᱟᱠ', 'nav.staff': 'ᱠᱟᱹᱢᱤᱭᱟᱹ', 'nav.reports': 'ᱨᱤᱯᱳᱨᱴ', 'nav.settings': 'ᱥᱮᱴᱤᱝ', 'settings.language': 'ᱯᱟᱹᱨᱥᱤ' },
  sd: { 'nav.dashboard': 'ڊيش بورڊ', 'nav.pos': 'وڪرو', 'nav.tables': 'ٽيبل', 'nav.orders': 'آرڊر', 'nav.kitchen': 'رڌڻو', 'nav.menu': 'مينيو', 'nav.inventory': 'ذخيرو', 'nav.customers': 'گراهڪ', 'nav.staff': 'عملو', 'nav.reports': 'رپورٽون', 'nav.settings': 'سيٽنگون', 'action.signOut': 'سائن آئوٽ', 'settings.language': 'ٻولي' },
  ta: { 'nav.dashboard': 'டாஷ்போர்டு', 'nav.pos': 'விற்பனை', 'nav.tables': 'மேசைகள்', 'nav.orders': 'ஆர்டர்கள்', 'nav.kitchen': 'சமையலறை', 'nav.menu': 'பட்டியல்', 'nav.inventory': 'சரக்கு', 'nav.customers': 'வாடிக்கையாளர்கள்', 'nav.staff': 'ஊழியர்கள்', 'nav.reports': 'அறிக்கைகள்', 'nav.settings': 'அமைப்புகள்', 'action.signOut': 'வெளியேறு', 'settings.language': 'மொழி', 'settings.languageSaved': 'மொழி சேமிக்கப்பட்டது' },
  te: { 'nav.dashboard': 'డ్యాష్‌బోర్డ్', 'nav.pos': 'అమ్మకాలు', 'nav.tables': 'టేబుళ్లు', 'nav.orders': 'ఆర్డర్లు', 'nav.kitchen': 'వంటగది', 'nav.menu': 'మెనూ', 'nav.inventory': 'నిల్వ', 'nav.customers': 'కస్టమర్లు', 'nav.staff': 'సిబ్బంది', 'nav.reports': 'నివేదికలు', 'nav.settings': 'సెట్టింగ్‌లు', 'action.signOut': 'సైన్ అవుట్', 'settings.language': 'భాష', 'settings.languageSaved': 'భాష సేవ్ చేయబడింది' },
  ur: { 'nav.dashboard': 'ڈیش بورڈ', 'nav.pos': 'فروخت', 'nav.tables': 'میزیں', 'nav.orders': 'آرڈرز', 'nav.kitchen': 'باورچی خانہ', 'nav.menu': 'مینو', 'nav.inventory': 'ذخیرہ', 'nav.customers': 'گاہک', 'nav.staff': 'عملہ', 'nav.reports': 'رپورٹس', 'nav.settings': 'ترتیبات', 'action.signOut': 'سائن آؤٹ', 'settings.language': 'زبان', 'settings.languageSaved': 'زبان محفوظ ہوگئی' },
};

const navigationKeys: Record<string, TranslationKey> = {
  '/app': 'nav.dashboard', '/app/pos': 'nav.pos', '/app/tables': 'nav.tables', '/app/orders': 'nav.orders',
  '/app/kds': 'nav.kitchen', '/app/menu': 'nav.menu', '/app/modifiers': 'nav.modifiers', '/app/inventory': 'nav.inventory',
  '/app/recipes': 'nav.recipes', '/app/customers': 'nav.customers', '/app/staff': 'nav.staff', '/app/reports': 'nav.reports',
  '/app/billing': 'nav.billing', '/app/settings': 'nav.settings',
};

export function translate(language: LanguageCode, key: TranslationKey) {
  return translated[language]?.[key] ?? en[key];
}

export function translateNavigation(language: LanguageCode, href: string, fallback: string) {
  const key = navigationKeys[href];
  return key ? translate(language, key) : fallback;
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGES.some((language) => language.code === value);
}
