import axios from "axios";

// Base axios instance
const apiInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_ENDPOINT,
});

// Monitoing all the request from the front-end, and add the Bearer token into header
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle request error, if not auth then return to related error page
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentUrl = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/login?nextUrl=${currentUrl}`;
    } else if (error.response && error.response.status === 403) {
      window.location.href = `/unauthorized`;
    }
    return Promise.reject(error);
  }
);

const api = {
  instance: apiInstance,

  // GET
  get: async (url, params = {}, customConfig = {}) => {
    return await apiInstance.get(url, {
      params,
      ...customConfig,
    });
  },

  // POST
  post: async (url, data = {}, customConfig = {}) => {
    return await apiInstance.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        ...customConfig.headers,
      },
      ...customConfig,
    });
  },

  // PUT
  put: async (url, data = {}, customConfig = {}) => {
    return await apiInstance.put(url, data, {
      headers: {
        "Content-Type": "application/json",
        ...customConfig.headers,
      },
      ...customConfig,
    });
  },

  // DELETE
  delete: async (url, customConfig = {}) => {
    return await apiInstance.delete(url, customConfig);
  },

  // PATCH
  patch: async (url, data = {}, customConfig = {}) => {
    return await apiInstance.patch(url, data, {
      headers: {
        "Content-Type": "application/json",
        ...customConfig.headers,
      },
      ...customConfig,
    });
  },
};

export default api;
