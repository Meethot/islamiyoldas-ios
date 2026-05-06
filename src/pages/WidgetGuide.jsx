import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Smartphone, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '@/hooks/useMobile';
import { useUser } from '@/context/UserContext';

/* ─── STEP DATA ─── */
const HOME_STEPS = [
    { emoji: '👆', title: 'Ana ekrana uzun bas', desc: 'Boş bir alana parmağınla uzun basılı tut', color: '#34d399' },
    { emoji: '✚', title: '"+" butonuna bas', desc: 'Sol üst köşedeki "+" butonuna dokun', color: '#fbbf24' },
    { emoji: '🔎', title: '"İslami Yoldaş" ara', desc: 'Arama çubuğuna yaz ve uygulamayı seç', color: '#60a5fa' },
    { emoji: '🔍', title: 'Boyutunu seç', desc: 'Küçük veya orta boy arasından seçim yap', color: '#a78bfa' },
    { emoji: '✓', title: '"Widget Ekle" bas', desc: 'Beğendiğin widget\'ı seçip ekle. Tamam!', color: '#34d399' },
];

const LOCK_STEPS = [
    { emoji: '👆', title: 'Kilit ekranına uzun bas', desc: 'Kilit ekranındayken ekrana uzun basılı tut', color: '#fbbf24' },
    { emoji: '✨', title: '"Özelleştir" bas', desc: '"Özelleştir" → "Kilit Ekranı"nı seç', color: '#f472b6' },
    { emoji: '✚', title: 'Widget alanına dokun', desc: 'Saatin altındaki widget bölümüne dokun', color: '#60a5fa' },
    { emoji: '🔎', title: '"İslami Yoldaş" seç', desc: 'Listeden uygulamayı bul ve widget\'ı seç', color: '#34d399' },
    { emoji: '✓', title: '"Bitti" ile kaydet', desc: 'Sağ üstteki "Bitti" butonuna bas', color: '#fbbf24' },
];

const WIDGETS = [
    { emoji: '🕌', name: 'Namaz Vakitleri', desc: 'Küçük · Orta · Kilit' },
    { emoji: '📖', name: 'Günün Ayeti', desc: 'Küçük · Orta · Kilit' },
    { emoji: '📿', name: 'Zikirmatik', desc: 'Küçük · Orta' },
    { emoji: '🤲', name: 'Esma-ül Hüsna', desc: 'Küçük · Orta' },
];

/* ─── CSS-only step indicator ─── */
function StepIndicator({ total, current, onSelect }) {
    return (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(i)}
                    style={{
                        height: 6,
                        borderRadius: 3,
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        width: i === current ? 24 : 8,
                        background: i === current ? '#d4a053' : 'rgba(255,255,255,0.12)',
                        transition: 'width 0.2s ease, background 0.2s ease',
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Pure CSS Transform Carousel ─── */
function StepCarousel({ steps, stepsKey }) {
    const [current, setCurrent] = useState(0);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    useEffect(() => { setCurrent(0); }, [stepsKey]);

    const goTo = useCallback((i) => {
        if (i < 0 || i >= steps.length) return;
        setCurrent(i);
    }, [steps.length]);

    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback((e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            goTo(dx < 0 ? current + 1 : current - 1);
        }
    }, [current, goTo]);

    return (
        <div style={{ marginTop: 16 }}>
            {/* Carousel track */}
            <div
                style={{
                    height: 200,
                    overflow: 'hidden',
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    style={{
                        display: 'flex',
                        height: '100%',
                        transform: `translate3d(-${current * 100}%, 0, 0)`,
                        transition: 'transform 0.28s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    }}
                >
                    {steps.map((step, i) => (
                        <div
                            key={`${stepsKey}-${i}`}
                            style={{
                                flexShrink: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 24px',
                                textAlign: 'center',
                            }}
                        >
                            {/* Emoji ring + badge */}
                            <div style={{
                                width: 76,
                                height: 76,
                                borderRadius: '50%',
                                background: `${step.color}15`,
                                border: `2px solid ${step.color}30`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 18,
                                position: 'relative',
                            }}>
                                <span style={{ fontSize: 30 }}>{step.emoji}</span>
                                <div style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    background: step.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 900,
                                    color: '#fff',
                                }}>
                                    {i + 1}
                                </div>
                            </div>
                            <h3 style={{
                                fontSize: 21,
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: 6,
                                fontFamily: 'serif',
                            }}>{step.title}</h3>
                            <p style={{
                                fontSize: 14,
                                color: 'rgba(209,250,229,0.7)',
                                lineHeight: 1.5,
                                maxWidth: 280,
                            }}>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '0 8px' }}>
                <button
                    onClick={() => goTo(current - 1)}
                    disabled={current === 0}
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: current === 0 ? 0.2 : 1,
                        cursor: 'pointer',
                        transition: 'opacity 0.15s',
                    }}
                >
                    <ChevronLeft style={{ width: 16, height: 16, color: '#fff' }} />
                </button>

                <StepIndicator total={steps.length} current={current} onSelect={goTo} />

                <button
                    onClick={() => goTo(current + 1)}
                    disabled={current === steps.length - 1}
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: current === steps.length - 1 ? 0.2 : 1,
                        cursor: 'pointer',
                        transform: 'rotate(180deg)',
                        transition: 'opacity 0.15s',
                    }}
                >
                    <ChevronLeft style={{ width: 16, height: 16, color: '#fff' }} />
                </button>
            </div>
        </div>
    );
}

/* ─── MAIN PAGE (Zero Framer Motion — pure CSS) ─── */
export default function WidgetGuide() {
    const navigate = useNavigate();
    const { t } = useTranslation('home');
    const { selection } = useHaptics();
    const { isPremium } = useUser();
    const [activeTab, setActiveTab] = useState('home');

    const switchTab = (tab) => {
        if (tab === activeTab) return;
        selection();
        setActiveTab(tab);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#032e18',
            position: 'relative',
            overflowX: 'hidden',
        }}>
            {/* Ambient glow — small, cheap */}
            <div style={{
                position: 'absolute',
                top: -60,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'rgba(212,160,83,0.04)',
                filter: 'blur(60px)',
                pointerEvents: 'none',
            }} />

            {/* ── Hero (compact, CSS animation) ── */}
            <div className="wg-fadein" style={{
                position: 'relative',
                zIndex: 1,
                padding: '12px 24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
            }}>
                {/* Phone icon — CSS float animation */}
                <div className="wg-float" style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: 'linear-gradient(135deg, rgba(212,160,83,0.2), rgba(52,211,153,0.12), rgba(20,184,166,0.15))',
                    border: '1px solid rgba(212,160,83,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    boxShadow: '0 8px 24px rgba(212,160,83,0.08)',
                }}>
                    <span style={{ fontSize: 32 }}>📲</span>
                </div>

                <h1 style={{
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: 'serif',
                    color: '#fff',
                    letterSpacing: '-0.02em',
                    marginBottom: 4,
                }}>
                    {t('widget_guide.title', 'Widget / Kilit Ekranı Rehberi')}
                </h1>
                <p style={{
                    fontSize: 13,
                    color: 'rgba(209,250,229,0.5)',
                    maxWidth: 300,
                    lineHeight: 1.5,
                }}>
                    {t('widget_guide.subtitle', 'İbadetlerini ana ekranından ve kilit ekranından takip et')}
                </p>

                {/* 24-Hour Free Trial Badge — shimmering gold */}
                {!isPremium && (
                    <div className="wg-trial-shimmer" style={{
                        marginTop: 16,
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, rgba(212,160,83,0.18), rgba(251,191,36,0.12), rgba(212,160,83,0.18))',
                        border: '1px solid rgba(251,191,36,0.35)',
                        borderRadius: 24,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        boxShadow: '0 4px 20px rgba(212,160,83,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Shimmer sweep overlay */}
                        <div className="wg-shimmer-sweep" style={{
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)',
                            pointerEvents: 'none',
                        }} />
                        <span style={{ fontSize: 18, zIndex: 1 }}>✨</span>
                        <span style={{
                            fontSize: 14,
                            fontWeight: 800,
                            zIndex: 1,
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d4a053)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.01em',
                        }}>
                            {t('widget_guide.trial_badge', '24 Saat Ücretsiz Dene — Hemen Başla!')}
                        </span>
                        <span style={{ fontSize: 14, zIndex: 1 }}>→</span>
                    </div>
                )}
            </div>

            {/* ── Content ── */}
            <div style={{ position: 'relative', zIndex: 1, padding: '0 16px 140px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Widget showcase */}
                <div>
                    <h3 style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(209,250,229,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        marginBottom: 10,
                        paddingLeft: 4,
                        fontFamily: 'serif',
                    }}>
                        {t('widget_guide.available_widgets', 'Mevcut Widget\'lar')}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                        {WIDGETS.map((w) => (
                            <div key={w.name} style={{
                                borderRadius: 16,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                padding: '14px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}>
                                <span style={{ fontSize: 28, marginBottom: 8, display: 'block' }}>{w.emoji}</span>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{w.name}</p>
                                <p style={{ fontSize: 12, color: 'rgba(209,250,229,0.6)', fontWeight: 500 }}>{w.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tab switcher */}
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: 6,
                    display: 'flex',
                    gap: 6,
                }}>
                    {[
                        { key: 'home', icon: Smartphone, label: t('widget_guide.tab_home', 'Ana Ekran'), color: '#34d399' },
                        { key: 'lock', icon: Lock, label: t('widget_guide.tab_lock', 'Kilit Ekranı'), color: '#fbbf24' },
                    ].map(({ key, icon: Icon, label, color }) => (
                        <button
                            key={key}
                            onClick={() => switchTab(key)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '12px 0',
                                borderRadius: 14,
                                border: 'none',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background 0.15s, color 0.15s',
                                background: activeTab === key ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: activeTab === key ? '#fff' : 'rgba(209,250,229,0.4)',
                            }}
                        >
                            <Icon style={{ width: 18, height: 18, color: activeTab === key ? color : 'currentColor' }} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Stepper section */}
                <div style={{
                    borderRadius: 28,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        {activeTab === 'home'
                            ? <Smartphone style={{ width: 20, height: 20, color: '#34d399' }} />
                            : <Lock style={{ width: 20, height: 20, color: '#d4a053' }} />
                        }
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'serif' }}>
                            {activeTab === 'home'
                                ? t('widget_guide.how_home', 'Ana Ekrana Nasıl Eklenir?')
                                : t('widget_guide.how_lock', 'Kilit Ekranına Nasıl Eklenir?')
                            }
                        </h3>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(209,250,229,0.6)', marginBottom: 4, marginLeft: 30 }}>
                        {t('widget_guide.swipe_hint', 'Adımlar arasında kaydır veya dokun')}
                    </p>

                    <StepCarousel
                        steps={activeTab === 'home' ? HOME_STEPS : LOCK_STEPS}
                        stepsKey={activeTab}
                    />
                </div>

                {/* Info card */}
                <div style={{
                    borderRadius: 28,
                    background: 'linear-gradient(135deg, rgba(212,160,83,0.06), transparent)',
                    border: '1px solid rgba(212,160,83,0.1)',
                    padding: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'rgba(212,160,83,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 18 }}>💡</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#d4a053', marginBottom: 6, fontFamily: 'serif' }}>
                                {t('widget_guide.tip_title', 'Bilgi')}
                            </h4>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 8 }}>
                                {t('widget_guide.tip_desc', 'Widget\'lar her saat başı otomatik güncellenir. Günün ayeti ve Esma-ül Hüsna widget\'ları her saat farklı içerik gösterir.')}
                            </p>
                            {/* Premium / Free note */}
                            <div style={{
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: isPremium ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
                                border: `1px solid ${isPremium ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)'}`,
                            }}>
                                <p style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: isPremium ? '#34d399' : '#fbbf24',
                                    lineHeight: 1.5,
                                }}>
                                    {isPremium
                                        ? t('widget_guide.premium_note', '👑 Premium aboneliğiniz süresince tüm widget\'lar aktiftir.')
                                        : t('widget_guide.free_note', '⏳ Ücretsiz kullanıcılar için widget\'lar 1 gün aktif olarak çalışır. Premium ile süresiz kullanabilirsiniz.')
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* iOS note */}
                <div style={{
                    borderRadius: 28,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    padding: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'rgba(59,130,246,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 18 }}>📱</span>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: 'serif' }}>
                                {t('widget_guide.ios_note_title', 'iOS 16+')}
                            </h4>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                                {t('widget_guide.ios_note_desc', 'Kilit ekranı widget\'ları iOS 16 ve üzeri sürümlerde kullanılabilir. Ana ekran widget\'ları iOS 14+ destekler.')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes wg-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes wg-fadein {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes wg-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
                @keyframes wg-shimmer-sweep {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                @keyframes wg-golden-glow {
                    0%, 100% { box-shadow: 0 4px 20px rgba(212,160,83,0.15), inset 0 1px 0 rgba(255,255,255,0.08); }
                    50% { box-shadow: 0 4px 28px rgba(251,191,36,0.3), inset 0 1px 0 rgba(255,255,255,0.12); }
                }
                .wg-float { animation: wg-float 3s ease-in-out infinite; }
                .wg-fadein { animation: wg-fadein 0.4s ease-out both; }
                .wg-shimmer-sweep { animation: wg-shimmer-sweep 3s ease-in-out infinite; }
                .wg-trial-shimmer { animation: wg-golden-glow 2.5s ease-in-out infinite; }
            `}</style>
        </div>
    );
}
