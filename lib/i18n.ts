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

const COMMON_ENGLISH = ['Add', 'Save', 'Cancel', 'Delete', 'Edit', 'Search', 'Refresh', 'Close', 'Name', 'Status', 'Email', 'Notes'] as const;
const COMMON_TRANSLATIONS: Record<LanguageCode, readonly string[]> = {
  en: COMMON_ENGLISH,
  as: ['যোগ কৰক', 'সংৰক্ষণ কৰক', 'বাতিল', 'মচি পেলাওক', 'সম্পাদনা', 'সন্ধান', 'সতেজ কৰক', 'বন্ধ কৰক', 'নাম', 'অৱস্থা', 'ইমেইল', 'টোকা'],
  bn: ['যোগ করুন', 'সংরক্ষণ করুন', 'বাতিল', 'মুছুন', 'সম্পাদনা', 'খুঁজুন', 'রিফ্রেশ', 'বন্ধ করুন', 'নাম', 'অবস্থা', 'ইমেল', 'নোট'],
  brx: ['जादेर', 'थाखो', 'बातिल', 'गायखो', 'सुधार', 'नागिर', 'फिन जाय', 'बन्द खालाम', 'मुं', 'आवस्था', 'इमेल', 'लिरनाय'],
  doi: ['जोड़ो', 'जमा करो', 'रद्द', 'म्हेसो', 'सुधारो', 'खोजो', 'ताज़ा करो', 'बंद करो', 'नांऽ', 'स्थिति', 'ईमेल', 'नोट'],
  gu: ['ઉમેરો', 'સાચવો', 'રદ કરો', 'કાઢી નાખો', 'ફેરફાર કરો', 'શોધો', 'રીફ્રેશ કરો', 'બંધ કરો', 'નામ', 'સ્થિતિ', 'ઈમેલ', 'નોંધ'],
  hi: ['जोड़ें', 'सहेजें', 'रद्द करें', 'हटाएँ', 'संपादित करें', 'खोजें', 'रीफ़्रेश करें', 'बंद करें', 'नाम', 'स्थिति', 'ईमेल', 'नोट्स'],
  kn: ['ಸೇರಿಸಿ', 'ಉಳಿಸಿ', 'ರದ್ದುಮಾಡಿ', 'ಅಳಿಸಿ', 'ತಿದ್ದುಪಡಿ', 'ಹುಡುಕಿ', 'ರಿಫ್ರೆಶ್', 'ಮುಚ್ಚಿ', 'ಹೆಸರು', 'ಸ್ಥಿತಿ', 'ಇಮೇಲ್', 'ಟಿಪ್ಪಣಿಗಳು'],
  ks: ['شامل کٔرِو', 'محفوظ کٔرِو', 'منسوخ', 'مٹٲو', 'ترمیم', 'تلاش', 'ریفریش', 'بند کٔرِو', 'ناو', 'حالت', 'ای میل', 'نوٹ'],
  kok: ['जोडात', 'जतन करात', 'रद्द करात', 'काडून उडयात', 'सुदारात', 'सोदात', 'परत ताजें करात', 'बंद करात', 'नांव', 'स्थिती', 'ईमेल', 'नोंदी'],
  mai: ['जोड़ू', 'सहेजू', 'रद्द करू', 'हटाउ', 'संपादन करू', 'खोजू', 'ताज़ा करू', 'बंद करू', 'नाम', 'स्थिति', 'ईमेल', 'टिप्पणी'],
  ml: ['ചേർക്കുക', 'സംരക്ഷിക്കുക', 'റദ്ദാക്കുക', 'നീക്കം ചെയ്യുക', 'തിരുത്തുക', 'തിരയുക', 'പുതുക്കുക', 'അടയ്ക്കുക', 'പേര്', 'നില', 'ഇമെയിൽ', 'കുറിപ്പുകൾ'],
  mni: ['ꯍꯥꯄꯆꯤꯟꯕ', 'ꯊꯝꯕ', 'ꯀꯣꯔꯖꯦꯜ', 'ꯃꯨꯠꯊꯠꯄ', 'ꯁꯦꯝꯗꯣꯛꯄ', 'ꯊꯤꯕ', 'ꯑꯅꯧꯕꯥ ꯑꯣꯠꯄ', 'ꯂꯣꯠꯄ', 'ꯃꯤꯡ', 'ꯃꯑꯣꯡ', 'ꯏꯃꯦꯜ', 'ꯋꯥꯔꯣꯜ'],
  mr: ['जोडा', 'जतन करा', 'रद्द करा', 'काढून टाका', 'संपादित करा', 'शोधा', 'रीफ्रेश करा', 'बंद करा', 'नाव', 'स्थिती', 'ईमेल', 'नोंदी'],
  ne: ['थप्नुहोस्', 'सुरक्षित गर्नुहोस्', 'रद्द गर्नुहोस्', 'हटाउनुहोस्', 'सम्पादन गर्नुहोस्', 'खोज्नुहोस्', 'रिफ्रेस गर्नुहोस्', 'बन्द गर्नुहोस्', 'नाम', 'स्थिति', 'इमेल', 'टिप्पणी'],
  or: ['ଯୋଡ଼ନ୍ତୁ', 'ସଂରକ୍ଷଣ କରନ୍ତୁ', 'ବାତିଲ କରନ୍ତୁ', 'ବିଲୋପ କରନ୍ତୁ', 'ସମ୍ପାଦନ କରନ୍ତୁ', 'ଖୋଜନ୍ତୁ', 'ସତେଜ କରନ୍ତୁ', 'ବନ୍ଦ କରନ୍ତୁ', 'ନାମ', 'ସ୍ଥିତି', 'ଇମେଲ୍', 'ଟିପ୍ପଣୀ'],
  pa: ['ਸ਼ਾਮਲ ਕਰੋ', 'ਸੰਭਾਲੋ', 'ਰੱਦ ਕਰੋ', 'ਮਿਟਾਓ', 'ਸੋਧੋ', 'ਖੋਜੋ', 'ਤਾਜ਼ਾ ਕਰੋ', 'ਬੰਦ ਕਰੋ', 'ਨਾਮ', 'ਸਥਿਤੀ', 'ਈਮੇਲ', 'ਨੋਟਸ'],
  sa: ['योजयतु', 'रक्षतु', 'निरस्यतु', 'अपनयतु', 'सम्पादयतु', 'अन्वेषयतु', 'नवीकरोतु', 'पिदधातु', 'नाम', 'स्थितिः', 'ईमेल', 'टिप्पण्यः'],
  sat: ['ᱥᱮᱞᱮᱫ', 'ᱵᱟᱹᱭᱥᱟᱹᱣ', 'ᱵᱟᱹᱛᱤᱞ', 'ᱢᱮᱴᱟᱣ', 'ᱥᱚᱫᱚᱨ', 'ᱥᱮᱸᱫᱽᱨᱟ', 'ᱱᱟᱶᱟ', 'ᱵᱚᱸᱫ', 'ᱧᱩᱛᱩᱢ', 'ᱫᱚᱥᱟ', 'ᱤᱢᱮᱞ', 'ᱴᱷᱮᱱ'],
  sd: ['شامل ڪريو', 'محفوظ ڪريو', 'رد ڪريو', 'ڊاهيو', 'ترميم ڪريو', 'ڳوليو', 'ريفريش ڪريو', 'بند ڪريو', 'نالو', 'حالت', 'اي ميل', 'نوٽ'],
  ta: ['சேர்', 'சேமி', 'ரத்து செய்', 'நீக்கு', 'திருத்து', 'தேடு', 'புதுப்பி', 'மூடு', 'பெயர்', 'நிலை', 'மின்னஞ்சல்', 'குறிப்புகள்'],
  te: ['జోడించు', 'సేవ్ చేయి', 'రద్దు చేయి', 'తొలగించు', 'సవరించు', 'వెతుకు', 'రిఫ్రెష్ చేయి', 'మూసివేయి', 'పేరు', 'స్థితి', 'ఇమెయిల్', 'గమనికలు'],
  ur: ['شامل کریں', 'محفوظ کریں', 'منسوخ کریں', 'حذف کریں', 'ترمیم کریں', 'تلاش کریں', 'تازہ کریں', 'بند کریں', 'نام', 'حالت', 'ای میل', 'نوٹس'],
};

const STATUS_ENGLISH = ['All', 'Open', 'Paid', 'Active', 'Hidden', 'Free', 'Reserved', 'Occupied'] as const;
const STATUS_TRANSLATIONS: Record<LanguageCode, readonly string[]> = {
  en: STATUS_ENGLISH,
  as: ['সকলো', 'খোলা', 'পৰিশোধ কৰা', 'সক্ৰিয়', 'লুকুৱা', 'খালী', 'সংৰক্ষিত', 'ব্যস্ত'],
  bn: ['সব', 'খোলা', 'পরিশোধিত', 'সক্রিয়', 'লুকানো', 'খালি', 'সংরক্ষিত', 'ব্যস্ত'],
  brx: ['गासै', 'खुला', 'बिलखौ सुफुंनाय', 'मावथि', 'दोनखांनाय', 'फांसे', 'दोनथुमनाय', 'बिजाब'],
  doi: ['सब', 'खुल्ला', 'भुगतान कीता', 'सक्रिय', 'छिपे दा', 'खाली', 'आरक्षित', 'व्यस्त'],
  gu: ['બધા', 'ખુલ્લું', 'ચૂકવેલ', 'સક્રિય', 'છુપાયેલ', 'ખાલી', 'અનામત', 'વ્યસ્ત'],
  hi: ['सभी', 'खुला', 'भुगतान किया', 'सक्रिय', 'छिपा हुआ', 'खाली', 'आरक्षित', 'व्यस्त'],
  kn: ['ಎಲ್ಲಾ', 'ತೆರೆದಿದೆ', 'ಪಾವತಿಸಲಾಗಿದೆ', 'ಸಕ್ರಿಯ', 'ಮರೆಮಾಡಲಾಗಿದೆ', 'ಖಾಲಿ', 'ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ', 'ವ್ಯಸ್ತ'],
  ks: ['سٲری', 'کُھلِتھ', 'ادا کٔرمُت', 'فعال', 'لُکٲوِتھ', 'خٲلی', 'محفوظ', 'مصروف'],
  kok: ['सगळे', 'उकते', 'भरपाय केल्ले', 'सक्रिय', 'लिपयल्ले', 'रिकामें', 'राखून दवरिल्लें', 'व्यस्त'],
  mai: ['सभ', 'खुलल', 'भुगतान कएल', 'सक्रिय', 'नुकायल', 'खाली', 'आरक्षित', 'व्यस्त'],
  ml: ['എല്ലാം', 'തുറന്നത്', 'അടച്ചു', 'സജീവം', 'മറച്ചത്', 'ഒഴിഞ്ഞത്', 'മുൻകൂട്ടി മാറ്റിവെച്ചത്', 'തിരക്കുള്ളത്'],
  mni: ['ꯄꯨꯝꯅꯃꯛ', 'ꯍꯥꯡꯗꯣꯛꯂꯕ', 'ꯄꯦꯃꯦꯟ ꯇꯧꯔꯕ', 'ꯊꯧꯗꯥꯡ ꯂꯩꯕ', 'ꯂꯣꯠꯄ', 'ꯑꯈꯟꯅꯕ', 'ꯊꯝꯂꯕ', 'ꯊꯕꯛ ꯂꯩꯕ'],
  mr: ['सर्व', 'उघडे', 'पैसे दिले', 'सक्रिय', 'लपवलेले', 'रिकामे', 'आरक्षित', 'व्यस्त'],
  ne: ['सबै', 'खुला', 'भुक्तानी भयो', 'सक्रिय', 'लुकाइएको', 'खाली', 'आरक्षित', 'व्यस्त'],
  or: ['ସମସ୍ତ', 'ଖୋଲା', 'ପଇଠ ହୋଇଛି', 'ସକ୍ରିୟ', 'ଲୁଚାଯାଇଛି', 'ଖାଲି', 'ସଂରକ୍ଷିତ', 'ବ୍ୟସ୍ତ'],
  pa: ['ਸਾਰੇ', 'ਖੁੱਲ੍ਹਾ', 'ਭੁਗਤਾਨ ਕੀਤਾ', 'ਸਰਗਰਮ', 'ਲੁਕਾਇਆ', 'ਖਾਲੀ', 'ਰਾਖਵਾਂ', 'ਵਿਅਸਤ'],
  sa: ['सर्वे', 'उद्घाटितम्', 'दत्तमूल्यम्', 'सक्रियम्', 'गोपितम्', 'रिक्तम्', 'आरक्षितम्', 'व्यस्तम्'],
  sat: ['ᱡᱷᱚᱛᱚ', 'ᱡᱷᱤᱡ', 'ᱯᱟᱹᱭᱥᱟᱹ ᱦᱩᱭ', 'ᱠᱟᱹᱢᱤ', 'ᱩᱠᱩ', 'ᱠᱷᱟᱹᱞᱤ', 'ᱨᱟᱠᱷᱟ', 'ᱵᱮᱥᱛᱟ'],
  sd: ['سڀ', 'کليل', 'ادا ٿيل', 'فعال', 'لڪايل', 'خالي', 'محفوظ', 'مصروف'],
  ta: ['அனைத்தும்', 'திறந்தது', 'செலுத்தப்பட்டது', 'செயலில்', 'மறைக்கப்பட்டது', 'காலி', 'முன்பதிவு', 'பிஸி'],
  te: ['అన్నీ', 'తెరిచి ఉంది', 'చెల్లించబడింది', 'క్రియాశీలం', 'దాచబడింది', 'ఖాళీ', 'రిజర్వ్ చేయబడింది', 'బిజీ'],
  ur: ['سب', 'کھلا', 'ادا شدہ', 'فعال', 'چھپا ہوا', 'خالی', 'محفوظ', 'مصروف'],
};

export function translateText(language: LanguageCode, text: string) {
  if (language === 'en') return text;
  const commonIndex = COMMON_ENGLISH.indexOf(text as (typeof COMMON_ENGLISH)[number]);
  if (commonIndex >= 0) return COMMON_TRANSLATIONS[language][commonIndex] ?? text;
  const statusIndex = STATUS_ENGLISH.indexOf(text as (typeof STATUS_ENGLISH)[number]);
  if (statusIndex >= 0) return STATUS_TRANSLATIONS[language][statusIndex] ?? text;
  const catalogEntry = Object.entries(en).find(([, english]) => english === text)?.[0] as TranslationKey | undefined;
  return catalogEntry ? translate(language, catalogEntry) : text;
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGES.some((language) => language.code === value);
}
