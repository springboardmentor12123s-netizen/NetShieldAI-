import axios from "axios";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to append authorization token
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const isAuthRoute = config.url?.includes("/auth/login") || config.url?.includes("/auth/refresh");
            if (!isAuthRoute) {
                const token = localStorage.getItem("netshield_access_token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and unauthorized access
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (token) {
            prom.resolve(token);
        } else {
            prom.reject(error);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip refreshing if it is auth endpoint or has already been retried
        if (
            !error.response ||
            error.response.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url?.includes("/auth")
        ) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const oldRefreshToken = localStorage.getItem("netshield_refresh_token");
            if (!oldRefreshToken) {
                throw new Error("No refresh token available");
            }

            // Call refresh API
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refresh_token: oldRefreshToken,
            });

            const { access_token, refresh_token } = response.data.data || response.data;

            localStorage.setItem("netshield_access_token", access_token);
            if (refresh_token) {
                localStorage.setItem("netshield_refresh_token", refresh_token);
            }

            processQueue(null, access_token);
            isRefreshing = false;

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;

            // Clear tokens and redirect to login
            localStorage.removeItem("netshield_access_token");
            localStorage.removeItem("netshield_refresh_token");
            localStorage.removeItem("netshield_user");

            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }

            return Promise.reject(refreshError);
        }
    }
);
export default apiClient;
