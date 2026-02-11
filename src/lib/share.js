import html2canvas from 'html2canvas';
import i18n from '../i18n';

const t = (key, options) => i18n.t(`share.${key}`, { ns: 'common', ...options });

/**
 * Captures a screenshot of the ShareCard component and shares it
 */
export async function shareProgress(elementId = 'share-card', streak = 0, navigate = null) {
    try {
        const element = document.getElementById(elementId);

        if (!element) {
            console.error(`Element with ID "${elementId}" not found`);
            alert(t('card_not_found'));
            return false;
        }

        const originalStyle = element.style.cssText;
        element.style.left = '0';
        element.style.top = '0';
        element.style.position = 'fixed';
        element.style.zIndex = '-1';

        const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: 1.5,
            width: 1080,
            height: 1920,
            windowWidth: 1080,
            windowHeight: 1920,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        element.style.cssText = originalStyle;

        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        const streakText = streak > 0 ? t('progress_streak', { count: streak }) : '';
        const file = new File([blob], t('progress_filename'), { type: 'image/png' });
        const shareText = t('progress_text', { streak: streakText });

        const shareData = {
            files: [file],
            title: t('progress_title'),
            text: shareText
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return true;
        } else {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = t('progress_filename');
            link.href = url;
            link.click();
            return true;
        }
    } catch (error) {
        console.error('Share failed:', error);
        if (error.name !== 'AbortError') {
            alert(t('share_failed'));
        }
        return false;
    }
}

/**
 * Generates a referral link for inviting friends
 */
export function generateReferralLink(userId = 'default') {
    const baseUrl = 'https://islamiyoldas.com';
    const referralCode = btoa(userId).substring(0, 8);
    return `${baseUrl}/invite?ref=${referralCode}`;
}

/**
 * Shares invitation link
 */
export async function shareInvite(userId = 'default') {
    const link = generateReferralLink(userId);

    const shareData = {
        title: t('invite_title'),
        text: t('invite_text'),
        url: link
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return true;
        } else {
            await navigator.clipboard.writeText(`${shareData.text}\n\n${link}`);
            alert(t('link_copied'));
            return true;
        }
    } catch (error) {
        console.error('Invite share failed:', error);
        return false;
    }
}

/**
 * Captures a screenshot of a verse card and shares it
 */
export async function shareVerse(elementId, text, source, isFriday = false) {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with ID "${elementId}" not found`);
            return false;
        }

        const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        const fileName = isFriday ? 'friday-message.png' : 'verse-of-the-day.png';
        const file = new File([blob], fileName, { type: 'image/png' });

        const shareTitle = isFriday ? t('verse_friday') : t('verse_daily');
        const shareText = t('verse_text', { text, source });

        const shareData = {
            files: [file],
            title: shareTitle,
            text: shareText
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return true;
        } else {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
            return true;
        }
    } catch (error) {
        console.error('Verse share failed:', error);
        if (error.name !== 'AbortError') {
            alert(t('verse_share_error'));
        }
        return false;
    }
}

/**
 * Captures a specific hidden element, temporarily moving it to viewport
 */
export async function shareHiddenElement(elementId, shareText, title) {
    try {
        const element = document.getElementById(elementId);
        if (!element) return false;

        const shareTitle = title || t('hidden_title');

        const originalStyle = element.style.cssText;
        element.style.left = '0';
        element.style.top = '0';
        element.style.position = 'fixed';
        element.style.zIndex = '-1';

        const canvas = await html2canvas(element, {
            backgroundColor: null,
            scale: 1.5,
            width: 1080,
            height: 1920,
            useCORS: true,
            logging: false
        });

        element.style.cssText = originalStyle;

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        const file = new File([blob], t('hidden_filename'), { type: 'image/png' });

        const shareData = {
            files: [file],
            title: shareTitle,
            text: shareText
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return true;
        } else {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = t('hidden_filename');
            link.href = url;
            link.click();
            return true;
        }
    } catch (e) {
        console.error('Hidden share failed', e);
        return false;
    }
}
