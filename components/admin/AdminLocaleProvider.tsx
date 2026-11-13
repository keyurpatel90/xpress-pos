'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isLanguageCode, LANGUAGES, type LanguageCode } from '@/lib/i18n';
import { LocaleScope } from '@/components/app/AppProvider';

export function AdminLocaleProvider({ initialLanguage, children }: { initialLanguage: LanguageCode; children: ReactNode }) {
  const [language, setLanguageValue] = useState(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = LANGUAGES.find((item) => item.code === language)?.dir ?? 'ltr';
  }, [language]);

  const setLanguage = useCallback(async (nextLanguage: LanguageCode) => {
    if (!isLanguageCode(nextLanguage)) return false;
    const sb = createClient();
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) return false;
    const { error: updateError } = await sb.auth.updateUser({
      data: { ...data.user.user_metadata, app_language: nextLanguage },
    });
    if (updateError) return false;
    setLanguageValue(nextLanguage);
    return true;
  }, []);

  return <LocaleScope value={{ language, setLanguage }}>{children}</LocaleScope>;
}
