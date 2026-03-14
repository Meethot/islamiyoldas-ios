import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
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

        const streakText = streak > 0 ? t('progress_streak', { count: streak }) : '';
        const progressFileName = t('progress_filename') || 'ilerleme.png';
        const shareText = t('progress_text', { streak: streakText }) || 'İslami Yoldaş ile ilerliyorum!';
        const shareTitle = t('progress_title') || 'İlerleme Paylaşımı';

        // Native platform: Capacitor Filesystem + Share
        if (Capacitor.isNativePlatform()) {
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];

            const savedFile = await Filesystem.writeFile({
                path: progressFileName,
                data: base64Data,
                directory: Directory.Cache
            });

            await Share.share({
                title: shareTitle,
                text: shareText,
                url: savedFile.uri,
                dialogTitle: shareTitle
            });

            try {
                await Filesystem.deleteFile({ path: progressFileName, directory: Directory.Cache });
            } catch { /* ignore */ }

            return true;
        }

        // Web fallback
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        const file = new File([blob], progressFileName, { type: 'image/png' });

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
            link.download = progressFileName;
            link.href = url;
            link.click();
            return true;
        }
    } catch (error) {
        if (error.name === 'AbortError' || error.message?.includes('cancel') || error.message?.includes('dismiss')) return false;
        console.error('Share failed:', error);
        return false;
    }
}

/**
 * Generates a referral link for inviting friends
 */
export function generateReferralLink() {
    return 'https://apps.apple.com/app/id6759666173';
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

        const fileName = isFriday ? (t('friday_filename') || 'cuma_mesaji.png') : (t('verse_filename') || 'gunun_ayeti.png');
        const shareTitle = isFriday ? (t('verse_friday') || 'Hayırlı Cumalar') : (t('verse_daily') || 'Günün Ayeti');
        const shareText = t('verse_text', { text, source }) || `${text}\n— ${source}`;

        // Native platform: Capacitor Filesystem + Share
        if (Capacitor.isNativePlatform()) {
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];

            // Save to temp file
            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache
            });

            // Share via native share sheet
            await Share.share({
                title: shareTitle,
                text: shareText,
                url: savedFile.uri,
                dialogTitle: shareTitle
            });

            // Clean up temp file
            try {
                await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });
            } catch { /* ignore cleanup errors */ }

            return true;
        }

        // Web fallback: navigator.share or download
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        const file = new File([blob], fileName, { type: 'image/png' });

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
        if (error.name === 'AbortError' || error.message?.includes('cancel') || error.message?.includes('dismiss')) return false;
        console.error('Verse share failed:', error);
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

        const hiddenFileName = t('hidden_filename') || 'paylasim.png';

        // Native platform: Capacitor Filesystem + Share
        if (Capacitor.isNativePlatform()) {
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];

            const savedFile = await Filesystem.writeFile({
                path: hiddenFileName,
                data: base64Data,
                directory: Directory.Cache
            });

            await Share.share({
                title: shareTitle,
                text: shareText,
                url: savedFile.uri,
                dialogTitle: shareTitle
            });

            try {
                await Filesystem.deleteFile({ path: hiddenFileName, directory: Directory.Cache });
            } catch { /* ignore */ }

            return true;
        }

        // Web fallback
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        const file = new File([blob], hiddenFileName, { type: 'image/png' });

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
            link.download = hiddenFileName;
            link.href = url;
            link.click();
            return true;
        }
    } catch (e) {
        if (e.name === 'AbortError' || e.message?.includes('cancel') || e.message?.includes('dismiss')) return false;
        console.error('Hidden share failed', e);
        return false;
    }
}
