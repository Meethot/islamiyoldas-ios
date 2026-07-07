import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Search, X, Sparkles, ChevronDown, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { ESMA_UL_HUSNA } from '../data/esmaUlHusna';
import { useTranslation } from 'react-i18next';

const CATEGORIES = ['dhikr', 'esma'];

// Helper to normalize Turkish letters, diacritics, strip leading "ya / yâ" prefixes, and punctuation
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/^[yY][aAâÂ]\s+/, '') // Strip leading "ya " or "yâ "
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip diacritics (â -> a, etc)
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]/g, ''); // Strip non-alphanumeric chars (like hyphens)
};

const DhikrItem = React.memo(({ item, isActive, onSelect, meaning, isEsma }) => {
  const touchStartPos = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartPos.current) return;
    const touch = e.changedTouches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx < 10 && dy < 10) {
      e.preventDefault();
      onSelect(item);
    }
    touchStartPos.current = null;
  };

  return (
    <button
      onClick={() => onSelect(item)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "w-full text-left px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] border",
        isActive
          ? "bg-islamic-green/10 border-islamic-green/30 dark:bg-islamic-gold/15 dark:border-islamic-gold/40 dark:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
          : "bg-white dark:bg-white/[0.03] border-stone-200/80 dark:border-white/5 hover:bg-stone-50 dark:hover:bg-white/[0.06] hover:border-stone-300 dark:hover:border-white/10"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Number badge for Esma */}
        {isEsma && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0",
            isActive ? "bg-islamic-green/15 text-islamic-green dark:bg-islamic-gold/20 dark:text-islamic-gold" : "bg-stone-100 text-stone-400 dark:bg-white/5 dark:text-white/30"
          )}>
            {item.number}
          </div>
        )}

        {/* Arabic text */}
        <p className={cn(
          "font-serif text-xl flex-shrink-0",
          isActive ? "text-islamic-green dark:text-islamic-gold" : "text-stone-700 dark:text-white/80"
        )} dir="rtl">
          {item.arabic}
        </p>

        {/* Name and meaning */}
        <div className="flex-1 min-w-0 ml-1">
          <p className={cn(
            "text-sm font-semibold truncate",
            isActive ? "text-islamic-green dark:text-islamic-gold" : "text-stone-600 dark:text-white/70"
          )}>
            {item.transliteration || item.name}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-white/30 truncate leading-tight mt-0.5">
            {meaning}
          </p>
        </div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-islamic-green/15 dark:bg-islamic-gold/20 flex items-center justify-center flex-shrink-0"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-islamic-green dark:bg-islamic-gold" />
          </motion.div>
        )}
      </div>
    </button>
  );
});

DhikrItem.displayName = 'DhikrItem';

export default function DhikrPickerSheet({ isOpen, onClose, activePreset, dhikrPresets, onSelect }) {
  const { t } = useTranslation('dhikr');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('dhikr');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const listRef = useRef(null);
  const sheetRef = useRef(null);
  const inputRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  // Reset search when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      // Auto-select the right category based on active preset
      const isEsma = ESMA_UL_HUSNA.some(e => e.id === activePreset?.id);
      setActiveCategory(isEsma ? 'esma' : 'dhikr');
    }
  }, [isOpen, activePreset]);

  // Build esma items with consistent shape
  const esmaItems = useMemo(() =>
    ESMA_UL_HUSNA.map(e => ({
      ...e,
      name: e.transliteration,
      meaning: t(`esma.${e.id}.meaning`, { defaultValue: '' }),
      isEsma: true,
    })),
    [t]
  );

  // Build dhikr items with consistent shape
  const dhikrItems = useMemo(() =>
    dhikrPresets.map(p => ({
      ...p,
      transliteration: p.name,
      meaning: t(`presets.${p.id}.meaning`),
      isEsma: false,
    })),
    [dhikrPresets, t]
  );

  // Filtered list based on search (searches both categories globally if query exists)
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) {
      return activeCategory === 'esma' ? esmaItems : dhikrItems;
    }

    const normQ = normalizeString(q);
    const allItems = [...dhikrItems, ...esmaItems];
    const results = allItems.filter(item =>
      normalizeString(item.name).includes(normQ) ||
      normalizeString(item.transliteration).includes(normQ) ||
      (item.arabic || '').includes(q) ||
      normalizeString(item.meaning).includes(normQ)
    );

    // If query doesn't match any preset/Esma exactly, add an option to create a custom zikir
    const hasExactMatch = results.some(item => normalizeString(item.name) === normQ);
    if (!hasExactMatch && q.length >= 1) {
      results.unshift({
        id: 'custom',
        name: q,
        transliteration: q,
        arabic: '✨',
        meaning: t('customDhikrDesc', { defaultValue: 'Özel zikir olarak başlat' }),
        defaultTarget: 100,
        isEsma: false
      });
    }

    return results;
  }, [activeCategory, searchQuery, esmaItems, dhikrItems, t]);

  const handleSelect = useCallback((item) => {
    inputRef.current?.blur();
    onSelect(item);
    onClose();
  }, [onSelect, onClose]);

  // Handle backdrop tap
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // Drag to dismiss
  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={handleBackdropClick}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[201] flex flex-col bg-[#FAF8F3] dark:bg-[#061f14] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_-20px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-[max-height,border-radius,border-color] duration-300 ease-out",
              isInputFocused
                ? "max-h-[100vh] h-full rounded-t-none border-t-0"
                : "max-h-[85vh] rounded-t-[2rem] border-t border-stone-200 dark:border-white/10"
            )}
          >
            {/* Drag Handle or iOS Safe Area Top Margin */}
            {isInputFocused ? (
              <div className="h-[env(safe-area-inset-top,20px)] flex-shrink-0" />
            ) : (
              <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20" />
              </div>
            )}

            {/* Header */}
            <div className="px-5 pb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-islamic-green/10 dark:bg-islamic-gold/10 flex items-center justify-center border border-islamic-green/20 dark:border-islamic-gold/20">
                    <Sparkles size={18} className="text-islamic-green dark:text-islamic-gold" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
                    {t('changeDhikr', { defaultValue: 'Zikir Değiştir' })}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:text-white/40 dark:hover:text-white transition-all border border-stone-200 dark:border-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-white/25" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                    setIsInputFocused(true);
                  }}
                  onBlur={() => {
                    // Delay setting focused to false to allow click events on lists to fire on mobile before layout transitions/shifts
                    blurTimeoutRef.current = setTimeout(() => {
                      setIsInputFocused(false);
                    }, 250);
                  }}
                  placeholder={t('searchPlaceholder', { defaultValue: 'Zikir veya esma ara...' })}
                  className="w-full bg-white dark:bg-white/[0.04] border border-stone-200 dark:border-white/8 rounded-xl py-2.5 pl-10 pr-4 text-sm text-stone-800 dark:text-white placeholder:text-stone-400 dark:placeholder:text-white/20 focus:outline-none focus:border-islamic-green/40 dark:focus:border-islamic-gold/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-white/30 dark:hover:text-white/60"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category Tabs or Search Results Header */}
              {!searchQuery.trim() ? (
                <div className="flex gap-1.5 bg-stone-100 dark:bg-white/[0.03] p-1 rounded-xl border border-stone-200/80 dark:border-white/5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setSearchQuery(''); }}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-all",
                        activeCategory === cat
                          ? "bg-white text-islamic-green border border-islamic-green/20 shadow-sm dark:bg-islamic-gold/15 dark:text-islamic-gold dark:border-islamic-gold/20 dark:shadow-lg dark:shadow-islamic-gold/5"
                          : "text-stone-400 hover:text-stone-600 dark:text-white/35 dark:hover:text-white/50"
                      )}
                    >
                      {cat === 'dhikr'
                        ? t('categoryDhikr', { defaultValue: 'Zikirler' })
                        : t('categoryEsma', { defaultValue: 'Esma-ül Hüsna' })
                      }
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] font-bold text-stone-400 dark:text-white/35 uppercase tracking-[0.2em] px-1 py-1.5">
                  {t('searchResults', { defaultValue: 'Arama Sonuçları' })} ({filteredItems.length})
                </div>
              )}
            </div>

            {/* Scrollable List */}
            <div
              ref={listRef}
              className={cn(
                "flex-1 overflow-y-auto px-5 space-y-1.5 overscroll-contain transition-[padding-bottom] duration-300",
                isInputFocused ? "pb-[320px]" : "pb-8"
              )}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Search size={32} className="text-stone-300 dark:text-white/10 mx-auto mb-3" />
                  <p className="text-stone-400 dark:text-white/25 text-sm">
                    {t('noResults', { defaultValue: 'Sonuç bulunamadı' })}
                  </p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <DhikrItem
                    key={item.id}
                    item={item}
                    isActive={activePreset?.id === item.id}
                    onSelect={handleSelect}
                    meaning={item.meaning}
                    isEsma={item.isEsma}
                  />
                ))
              )}
            </div>

            {/* Bottom safe area */}
            <div className="h-[env(safe-area-inset-bottom,0px)] flex-shrink-0" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
