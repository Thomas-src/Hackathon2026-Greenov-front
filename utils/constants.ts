export const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
};

export const BACKEND_URL = "http://localhost:5275" // "https://jeuxrenov-back.redyd.dev";