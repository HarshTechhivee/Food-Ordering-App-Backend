
export const getFrontendUrl = (path: string): string => {

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
        throw new Error("FRONTEND_URL is not configured");
    }

    const baseUrl = frontendUrl.replace(/\/+$/, "");

    const cleanPath = path.replace(/^\/+/, "");

    return `${baseUrl}/${cleanPath}`;
};