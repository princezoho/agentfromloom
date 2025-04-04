import React from 'react';
import { useSearchParams } from 'react-router-dom';

// Helper function to extract Loom video ID from various URL formats
const getLoomVideoId = (url: string): string | null => {
    try {
        const parsedUrl = new URL(url);
        // Handle share URLs like https://www.loom.com/share/...
        if (parsedUrl.pathname.startsWith('/share/')) {
            return parsedUrl.pathname.split('/')[2];
        }
        // Handle embed URLs like https://www.loom.com/embed/...
        if (parsedUrl.pathname.startsWith('/embed/')) {
            return parsedUrl.pathname.split('/')[2];
        }
        // Handle direct video URLs like https://www.loom.com/v/...
        if (parsedUrl.pathname.startsWith('/v/')) {
            return parsedUrl.pathname.split('/')[2];
        }
    } catch (error) {
        console.error("Error parsing Loom URL:", error);
        // Fallback for potentially simpler formats or non-URL strings
        const parts = url.split('/');
        const potentialId = parts[parts.length - 1];
        // Basic check if it looks like a Loom ID (alphanumeric)
        if (potentialId && /^[a-zA-Z0-9]+$/.test(potentialId) && potentialId.length > 10) {
            return potentialId;
        }
    }
    return null;
};

function DisplayPage() {
    const [searchParams] = useSearchParams();
    const loomUrl = searchParams.get('url');
    const videoId = loomUrl ? getLoomVideoId(loomUrl) : null;
    const embedUrl = videoId ? `https://www.loom.com/embed/${videoId}` : null;

    if (!loomUrl) {
        return <div>Error: No Loom URL provided.</div>;
    }

    if (!videoId || !embedUrl) {
        return <div>Error: Could not extract Loom video ID from the provided URL. Please check the URL.</div>;
    }

    return (
        <div>
            <h2>Displaying Loom Video</h2>
            <p>Original URL: {loomUrl}</p>
            <div style={{ position: 'relative', paddingBottom: '62.5%', height: 0 }}>
                <iframe
                    src={embedUrl}
                    frameBorder="0"
                    allowFullScreen
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }}
                    title="Loom Video"
                ></iframe>
            </div>
            {/* We will add the chunk management UI here later */}
        </div>
    );
}

export default DisplayPage; 