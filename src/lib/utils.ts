import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Resolves standard user-provided image URLs to correct formats.
 * Specifically converts Google Drive sharing URLs (which display web UI) 
 * into direct-download endpoints suitable for <img> tags.
 */
export function resolveImageUrl(url: string | null | undefined): string {
    if (!url) return "";

    // If it's already a base64 string or blob, return directly
    if (url.startsWith("data:") || url.startsWith("blob:")) {
        return url;
    }

    const trimmedUrl = url.trim();

    // Check if the URL points to Google Drive
    if (trimmedUrl.includes("drive.google.com") || trimmedUrl.includes("docs.google.com")) {
        let fileId = "";

        // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        const fileDMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileDMatch && fileDMatch[1]) {
            fileId = fileDMatch[1];
        } else {
            // Format 2: https://drive.google.com/open?id=FILE_ID
            const idMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) {
                fileId = idMatch[1];
            }
        }

        if (fileId) {
            // Return direct image stream endpoint
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
    }

    return trimmedUrl;
}

