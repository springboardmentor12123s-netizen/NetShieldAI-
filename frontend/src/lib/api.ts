import axios from "axios";

const API_BASE =
  (typeof window !== "undefined" && (window as any).__API_BASE__) ||
  "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("auth_token");

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export interface Packet {
  id: number | string;
  source_ip?: string;
  src_ip?: string;
  destination_ip?: string;
  dst_ip?: string;
  protocol?: string;
  packet_size?: number;
  size?: number;
  status?: string;
  timestamp?: string;
  created_at?: string;
}

export interface Anomaly {
  id: number | string;

  anomaly_type?: string;

  type?: string;

  detection_type?: string;

  prediction?: string;

  confidence_score?: number;

  confidence?: number;

  source_ip?: string;

  destination_ip?: string;

  protocol?: string;

  severity?: string;

  status?: string;

  created_at?: string;

  timestamp?: string;
}

export interface AppUser {
  id: number | string;
  email?: string;
  username?: string;
  role?: string;
  full_name?: string;
}

export interface AnalyticsData {
  total_predictions: number;
  high_confidence: number;
  average_confidence: number;
  attack_distribution: {
    attack: string;
    count: number;
  }[];
}

export const AuthAPI = {
  async login(email: string, password: string) {
    const form = new URLSearchParams();

    form.append("username", email);
    form.append("password", password);

    const res = await api.post("/login", form, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return res.data as {
      access_token?: string;
      token_type?: string;
      user?: AppUser;
    };
  },

  logout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("auth_user");
    }
  },

  isAuthed() {
    if (typeof window === "undefined") return false;
    return !!window.localStorage.getItem("auth_token");
  },
};

export const PacketsAPI = {
  list: () =>
    api.get<Packet[]>("/live-packets").then((r) => r.data),

  create: (packet: Partial<Packet>) =>
    api.post<Packet>("/packets", packet).then((r) => r.data),

  remove: (id: Packet["id"]) =>
    api.delete(`/packets/${id}`).then((r) => r.data),
};

export const AnomaliesAPI = {
  list: async () => {
    const res = await api.get<any[]>("/anomalies");

    return res.data.map((a) => ({
      ...a,

      type: a.anomaly_type,

      detection_type: a.anomaly_type,

      prediction: a.anomaly_type,

      confidence: a.confidence_score,

      timestamp: a.created_at,
    })) as Anomaly[];
  },

  create: (anomaly: Partial<Anomaly>) =>
    api.post<Anomaly>("/anomalies", anomaly).then((r) => r.data),

  remove: (id: Anomaly["id"]) =>
    api.delete(`/anomalies/${id}`).then((r) => r.data),
};


export const AnalyticsAPI = {
  get: () =>
    api.get<AnalyticsData>("/analytics").then((r) => r.data),
};

export const UsersAPI = {
  list: () =>
    api.get<AppUser[]>("/users").then((r) => r.data),
};

export function getSrc(packet: Packet) {
  return packet.source_ip ?? packet.src_ip ?? "—";
}

export function getDst(packet: Packet) {
  return packet.destination_ip ?? packet.dst_ip ?? "—";
}

export function getSize(packet: Packet) {
  return packet.packet_size ?? packet.size ?? 0;
}

export function getStatus(packet: Packet): string {
  return (packet.status ?? "unknown").toString().toLowerCase();
}

export function getTime(item: Packet | Anomaly) {
  return item.timestamp ?? item.created_at ?? "";
}