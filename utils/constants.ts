export const getBaseUrl = () => {
    const url = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    console.log(url);
    return url;
};

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5275";