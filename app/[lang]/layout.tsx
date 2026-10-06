import { notFound } from "next/navigation";
import { fontVariables } from "@/design-system/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageSwitch } from "@/design-system/components/language-switch";
import { LocaleProvider } from "@/design-system/i18n/context";
import { isLocale } from "@/design-system/i18n/locale";
import "../globals.css";
import type { Metadata } from "next";
import { STORY } from "@/lib/experience/story";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{const {lang}=await params;if(!isLocale(lang))return {};const s=STORY[lang];return {title:s.name,description:s.oneLiner};}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{lang:string}>}){const {lang}=await params;if(!isLocale(lang))notFound();return <html lang={lang} className={`${fontVariables} h-full antialiased`} suppressHydrationWarning><body className="min-h-full flex flex-col"><ThemeProvider defaultTheme="dark" enableSystem={false} attribute="class"><LocaleProvider locale={lang}><div className="fixed right-4 top-4 z-50"><LanguageSwitch locale={lang}/></div>{children}</LocaleProvider></ThemeProvider></body></html>}
