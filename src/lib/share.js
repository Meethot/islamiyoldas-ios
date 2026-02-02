import html2canvas from 'html2canvas';

/**
 * Captures a screenshot of the ShareCard component and shares it
 * @param {string} elementId - DOM element ID to capture (default: 'share-card')
 * @param {number} streak - Current streak count
 * @param {function} navigate - React Router navigate function (optional)
 * @returns {Promise<boolean>} - Success status
 */
export async function shareProgress(elementId = 'share-card', streak = 0, navigate = null) {
    try {
        // The share-card should always be present in the DOM (hidden)
        const element = document.getElementById(elementId);

        if (!element) {
            console.error(`Element with ID "${elementId}" not found`);
            alert('Paylaşım kartı bulunamadı. Lütfen sayfayı yenileyin.');
            return false;
        }

        // Temporarily make visible for capture (off-screen position is fine)
        const originalStyle = element.style.cssText;
        element.style.left = '0';
        element.style.top = '0';
        element.style.position = 'fixed';
        element.style.zIndex = '-1';

        // Capture screenshot with high quality
        // Element is natively 1080x1920, so scale: 1 is standard, but 1.5 gives crisp text
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

        // Restore original position
        element.style.cssText = originalStyle;

        // Convert to Blob
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });

        // Prepare share data
        const file = new File([blob], 'manevi-yolculuk.png', { type: 'image/png' });
        const shareText = `İslami Yoldaş ile ibadetlerimi takip ediyorum! ${streak > 0 ? `🔥 ${streak} gün seri!` : ''} Sen de katıl! 🤲\n\n📲 islamiyoldas.app/download`;

        const shareData = {
            files: [file],
            title: 'Manevi Yolculuğum',
            text: shareText
        };

        // Check if Web Share API is supported
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return true;
        } else {
            // Fallback: Download image
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'manevi-yolculuk.png';
            link.href = url;
            link.click();
            return true;
        }
    } catch (error) {
        console.error('Share failed:', error);
        // Don't show alert for user cancellation
        if (error.name !== 'AbortError') {
            alert('Paylaşım başarısız oldu. Lütfen tekrar deneyin.');
        }
        return false;
    }
}

/**
 * Generates a referral link for inviting friends
 * @param {string} userId - User's unique ID (can be generated or from auth)
 * @returns {string} - Deep link URL
 */
export function generateReferralLink(userId = 'default') {
    // This will be a deep link that opens the app if installed
    // Format: islami-yoldas://invite?ref=USER_ID
    const baseUrl = 'https://islamiyoldas.com'; // Replace with your actual domain
    const referralCode = btoa(userId).substring(0, 8); // Simple encoding

    return `${baseUrl}/invite?ref=${referralCode}`;
}

/**
 * Shares invitation link
 * @param {string} userId - User ID for tracking
 */
export async function shareInvite(userId = 'default') {
    const link = generateReferralLink(userId);

    const shareData = {
        title: 'Seninle paylaşmak istedim',
        text: `İslami Yoldaş uygulamasını keşfettim! Ruhani gelişim için harika bir arkadaş. 🤲`,
        url: link
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return true;
        } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(`${shareData.text}\n\n${link}`);
            alert('Link panoya kopyalandı!');
            return true;
        }
    } catch (error) {
        console.error('Invite share failed:', error);
        return false;
    }
}
