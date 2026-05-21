import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, { refresh_token: refreshToken });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  login: (username: string, password: string) => api.post("/auth/login", { username, password }),
};

export const adminApi = {
  dashboard:           () => api.get("/admin/dashboard"),
  listOwners:          () => api.get("/admin/owners"),
  createOwner:         (data: unknown) => api.post("/admin/owners", data),
  renewOwner:          (id: number, plan_type: string) => api.post(`/admin/owners/${id}/renew`, { plan_type }),
  deleteOwner:         (id: number) => api.delete(`/admin/owners/${id}`),
  expiringGyms:        () => api.get("/admin/expiring-gyms"),
  expiredMembersToday: () => api.get("/admin/expired-members-today"),
  updateWhatsapp:      (id: number, data: unknown) => api.put(`/admin/owners/${id}/whatsapp`, data),
};

export const ownerApi = {
  dashboard:    () => api.get("/owner/dashboard"),
  listMembers:  (params?: { status?: string; search?: string }) => api.get("/owner/members", { params }),
  createMember: (data: unknown) => api.post("/owner/members", data),
  renewMember:  (id: number, plan_type: string) => api.post(`/owner/members/${id}/renew`, { plan_type }),
  deleteMember: (id: number) => api.delete(`/owner/members/${id}`),
  runReminders: () => api.post("/owner/reminders/run"),
  bulkMessage:  (template_id: string) => api.post("/owner/bulk-message", { template_id }),
  testWhatsapp: (test_number: string) => api.post("/owner/whatsapp/test", { test_number }),
  getSheet:     () => api.get("/owner/sheet"),
  setSheet:     (sheet_url: string) => api.put("/owner/sheet", { sheet_url }),
  syncSheet:    () => api.post("/owner/sheet/sync"),
  getTemplates: () => api.get("/owner/bulk-message/templates"),
};
