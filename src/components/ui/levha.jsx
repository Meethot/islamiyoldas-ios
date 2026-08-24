import { cn } from '@/lib/utils';

/**
 * Arapça hat levhası ve altın ayraç — kartların ortak görsel dili.
 *
 * Levha duvara asılan hat levhası gibi: dış çerçeve kalın altın, iç çerçeve
 * ince, dört köşede 45° döndürülmüş elmas. Dua tabakası ve ezber ekranında
 * kullanılan biçimin aynısı; abdest sihirbazı da buraya bağlandı ki üç ekran
 * aynı Arapça sunumunu göstersin.
 *
 * NOT: `DuaSheet`, `EzberSheet` ve `DuaLibrary` hâlâ kendi kopyalarını
 * taşıyor (biri `py-7`, biri `py-6`). Onları buraya bağlamak ayrı bir iş —
 * çalışan ve cihazda doğrulanmış ekranlar, aynı turda taşınmadı.
 */
const CORNERS = ['-top-1 -start-1', '-top-1 -end-1', '-bottom-1 -start-1', '-bottom-1 -end-1'];

export const Levha = ({ children, className, innerClassName }) => (
    <div className={cn('rounded-md border border-[#B45309]/50 p-[0.5625rem] dark:border-islamic-gold/55', className)}>
        <div
            className={cn(
                'relative rounded-[0.1875rem] border border-[#B45309]/30 bg-black/[0.03] px-4 py-6 dark:border-islamic-gold/30 dark:bg-black/20',
                innerClassName
            )}
        >
            {CORNERS.map(pos => (
                <span
                    key={pos}
                    aria-hidden="true"
                    className={cn(
                        'absolute h-[0.4375rem] w-[0.4375rem] rotate-45 border border-[#B45309]/70 dark:border-islamic-gold/70',
                        pos
                    )}
                />
            ))}
            {children}
        </div>
    </div>
);

/**
 * Altından soluğa giden ince ayraç. Kullanıcı kararı (2026-08-18): hazır ikon
 * setinden gelen simgeler her uygulamada aynı görünüyor; bölüm ayrımı bu
 * çizgiyle yapılıyor.
 */
export const GoldRule = ({ className }) => (
    <span
        aria-hidden="true"
        className={cn(
            'h-px flex-1 bg-gradient-to-r from-[#B45309]/35 to-transparent rtl:bg-gradient-to-l dark:from-islamic-gold/35',
            className
        )}
    />
);
