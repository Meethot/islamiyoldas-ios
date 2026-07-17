import React from 'react';
import { Cake } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { arabicFontPx, translationFontPx } from '@/lib/birthdayVerse';

/**
 * Birthday verse share graphic — the single visual identity used BOTH as the
 * in-chat preview (scaled down) and the shared 1080x1920 image (html2canvas).
 * Presentational only — receives already-fetched verseData.
 * No emoji inside (html2canvas mangles them) — SVG icon instead.
 */

const GOLD = '#D4AF37';
const GOLD_SOFT = '#EBD9A3';
const CREAM = '#F5EFE0';
const ARCH = 'rgba(212,175,55,0.40)';

// The true 1080x1920 card content (no positioning wrapper).
export function StoryCardInner({ day, month, verseData }) {
    const { t, i18n } = useTranslation('misc');
    const lang = i18n.language;

    const isAr = !!lang && lang.startsWith('ar');
    const monthLong = new Date(2000, month - 1, 1).toLocaleDateString(lang, { month: 'long' });
    const monthCaps = monthLong.toLocaleUpperCase(lang);
    const transDir = isAr ? 'rtl' : 'ltr';
    // Arabic script must not be letter-spaced (breaks joining) or uppercased (no-op).
    const appName = t('birthdayCard.appName');
    const wordmark = isAr ? appName : appName.toLocaleUpperCase(lang);

    const arabic = verseData?.arabic || '';
    const translation = verseData?.translation || '';
    const source = isAr ? (verseData?.source || '') : (verseData?.source || '').toLocaleUpperCase(lang);

    const arabicPx = arabicFontPx(arabic, 100);
    const transPx = translationFontPx(translation, 42);

    return (
        <div
            style={{
                width: 1080, height: 1920, position: 'relative', overflow: 'hidden',
                boxSizing: 'border-box', padding: '120px 96px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(160deg, #04140c 0%, #0a3f26 52%, #04140c 100%)'
            }}
        >
            {/* Ambient gold glow */}
            <div style={{
                position: 'absolute', top: 340, left: '50%', width: 900, height: 900,
                transform: 'translateX(-50%)', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0) 68%)'
            }} />

            {/* TOP — wordmark + date medallion */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div style={{ color: GOLD, fontSize: 28, fontWeight: 700, letterSpacing: isAr ? 0 : 10 }}>
                    {wordmark}
                </div>
                <div style={{
                    marginTop: 56, width: 250, height: 250, borderRadius: '50%',
                    border: `3px solid ${GOLD}`, boxSizing: 'border-box',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'radial-gradient(circle, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0) 75%)'
                }}>
                    <Cake size={40} color={GOLD} strokeWidth={1.6} />
                    <div className="font-serif" style={{ color: GOLD_SOFT, fontSize: 96, fontWeight: 700, lineHeight: 1, marginTop: 6 }}>
                        {day}
                    </div>
                    <div style={{ color: CREAM, fontSize: 26, fontWeight: 600, letterSpacing: isAr ? 0 : 4, marginTop: 6 }}>
                        {monthCaps}
                    </div>
                </div>
            </div>

            {/* MIDDLE — verse framed by a mihrab arch */}
            <div style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '40px 0', zIndex: 2 }}>
                <div style={{
                    position: 'absolute', top: 8, left: 24, right: 24, bottom: 8,
                    border: `2px solid ${ARCH}`,
                    borderRadius: '46% 46% 20px 20px', pointerEvents: 'none'
                }} />

                <div style={{ width: '100%', padding: '0 70px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <p className="font-arabic" dir="rtl" style={{
                        color: GOLD_SOFT, fontSize: arabicPx, lineHeight: 1.95,
                        textAlign: 'center', margin: 0
                    }}>
                        {arabic}
                    </p>

                    {/* Divider ornament */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, margin: '56px 0' }}>
                        <div style={{ width: 90, height: 1, background: GOLD, opacity: 0.55 }} />
                        <div style={{ width: 12, height: 12, background: GOLD, transform: 'rotate(45deg)' }} />
                        <div style={{ width: 90, height: 1, background: GOLD, opacity: 0.55 }} />
                    </div>

                    <p className="font-serif" dir={transDir} style={{
                        color: CREAM, fontSize: transPx, lineHeight: 1.55, fontStyle: 'italic',
                        textAlign: 'center', margin: 0, maxWidth: 820
                    }}>
                        “{translation}”
                    </p>
                </div>
            </div>

            {/* BOTTOM — source + CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', zIndex: 2 }}>
                <div style={{ color: GOLD, fontSize: 28, fontWeight: 700, letterSpacing: isAr ? 0 : 5, textAlign: 'center' }}>
                    {source}
                </div>
                <div style={{ width: 160, height: 1, background: ARCH, margin: '44px 0 36px' }} />
                <div style={{ color: CREAM, fontSize: 32, lineHeight: 1.5, textAlign: 'center', whiteSpace: 'pre-line', fontWeight: 500 }}>
                    {t('birthdayCard.cta')}
                </div>
            </div>
        </div>
    );
}

/**
 * Hidden off-screen 1080x1920 element captured by shareHiddenElement.
 */
export default function BirthdayStoryCard({ id, day, month, verseData }) {
    return (
        <div id={id} style={{ position: 'fixed', left: -9999, top: 0, width: 1080, height: 1920, overflow: 'hidden' }}>
            <StoryCardInner day={day} month={month} verseData={verseData} />
        </div>
    );
}
