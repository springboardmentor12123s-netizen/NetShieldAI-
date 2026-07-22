// Deterministic-ish realistic cyber mock data (client-only).

const PROTOCOLS = ["TCP", "UDP", "HTTPS", "HTTP", "DNS", "ICMP", "SSH", "SMB"] as const;
const THREAT_TYPES = [
  "Port Scan",
  "Brute Force SSH",
  "SQL Injection",
  "DDoS Volumetric",
  "Ransomware Beacon",
  "DNS Tunneling",
  "Credential Stuffing",
  "Lateral Movement",
  "Data Exfiltration",
  "Command & Control",
  "Botnet Callback",
  "Zero-Day Exploit",
] as const;
const COUNTRIES = ["RU", "CN", "US", "BR", "IR", "KP", "IN", "DE", "NL", "VN"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Severity = (typeof SEVERITIES)[number];

let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
export function resetSeed(s = 42) { seed = s; }

function pick<T>(a: readonly T[]): T { return a[Math.floor(rand() * a.length)]; }

export function randomIP() {
  return `${Math.floor(rand() * 223) + 1}.${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}.${Math.floor(rand() * 254) + 1}`;
}
export function randomMAC() {
  const h = () => Math.floor(rand() * 256).toString(16).padStart(2, "0");
  return `${h()}:${h()}:${h()}:${h()}:${h()}:${h()}`.toUpperCase();
}

export interface Alert {
  id: string;
  time: string;
  srcIp: string;
  dstIp: string;
  protocol: string;
  threat: string;
  severity: Severity;
  confidence: number;
  status: "Open" | "Investigating" | "Resolved" | "False Positive";
  analyst: string;
  country: string;
}

const ANALYSTS = ["A. Chen", "M. Ruiz", "S. Kaur", "J. Okafor", "L. Nakamura", "Unassigned"];

export function generateAlerts(n: number): Alert[] {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const sev = pick(SEVERITIES);
    const t = new Date(now - i * (60_000 + Math.floor(rand() * 300_000)));
    return {
      id: `ALT-${(10234 + i).toString()}`,
      time: t.toISOString(),
      srcIp: randomIP(),
      dstIp: randomIP(),
      protocol: pick(PROTOCOLS),
      threat: pick(THREAT_TYPES),
      severity: sev,
      confidence: Math.floor(70 + rand() * 30),
      status: pick(["Open", "Open", "Investigating", "Resolved", "False Positive"] as const),
      analyst: pick(ANALYSTS),
      country: pick(COUNTRIES),
    };
  });
}

export function trafficSeries(points = 24) {
  return Array.from({ length: points }, (_, i) => {
    const base = 800 + Math.sin(i / 3) * 250 + rand() * 300;
    return {
      t: `${String(i).padStart(2, "0")}:00`,
      inbound: Math.round(base + rand() * 200),
      outbound: Math.round(base * 0.7 + rand() * 180),
      anomalies: Math.round(Math.max(0, Math.sin(i / 2) * 8 + rand() * 6)),
    };
  });
}

export function protocolDistribution() {
  return [
    { name: "HTTPS", value: 42 },
    { name: "TCP", value: 21 },
    { name: "DNS", value: 12 },
    { name: "UDP", value: 10 },
    { name: "HTTP", value: 8 },
    { name: "ICMP", value: 4 },
    { name: "SSH", value: 3 },
  ];
}

export function threatTimeline() {
  return Array.from({ length: 12 }, (_, i) => ({
    t: `${i * 2}:00`,
    critical: Math.floor(rand() * 6),
    high: Math.floor(rand() * 12),
    medium: Math.floor(rand() * 18),
    low: Math.floor(rand() * 22),
  }));
}

export function attackTypesData() {
  return THREAT_TYPES.slice(0, 6).map((t) => ({
    name: t,
    count: Math.floor(20 + rand() * 200),
  }));
}

export interface Interface {
  name: string;
  mac: string;
  ip: string;
  status: "Up" | "Down";
  rx: number;
  tx: number;
}
export function interfaces(): Interface[] {
  return [
    { name: "eth0", mac: randomMAC(), ip: randomIP(), status: "Up", rx: 842, tx: 621 },
    { name: "eth1", mac: randomMAC(), ip: randomIP(), status: "Up", rx: 412, tx: 388 },
    { name: "wlan0", mac: randomMAC(), ip: randomIP(), status: "Up", rx: 128, tx: 92 },
    { name: "vpn0", mac: randomMAC(), ip: randomIP(), status: "Up", rx: 56, tx: 61 },
    { name: "mgmt0", mac: randomMAC(), ip: randomIP(), status: "Down", rx: 0, tx: 0 },
  ];
}

export interface Packet {
  id: string;
  time: string;
  src: string;
  dst: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  length: number;
  flag: "OK" | "SUSP" | "MAL";
}
export function generatePackets(n: number): Packet[] {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const r = rand();
    return {
      id: `PKT-${Date.now().toString(36)}-${i}-${Math.floor(rand() * 1e6)}`,
      time: new Date(now - i * 320).toISOString(),
      src: randomIP(),
      dst: randomIP(),
      srcPort: Math.floor(1024 + rand() * 60000),
      dstPort: pick([80, 443, 22, 53, 3389, 8080, 445, 25, 3306]),
      protocol: pick(PROTOCOLS),
      length: Math.floor(60 + rand() * 1400),
      flag: r > 0.92 ? "MAL" : r > 0.8 ? "SUSP" : "OK",
    };
  });
}

export const SEVERITY_TOKEN: Record<Severity, string> = {
  Critical: "critical",
  High: "suspicious",
  Medium: "warning",
  Low: "safe",
};
