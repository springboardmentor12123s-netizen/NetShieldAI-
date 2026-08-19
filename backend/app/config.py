"""
Central configuration. Reads values from environment variables / .env file.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "netshield_ai"

    # NOTE: env var is SECRET_KEY (not JWT_SECRET) — matches your .env
    secret_key: str = "change_this_to_a_long_random_string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120
    remember_me_expire_minutes: int = 60 * 24 * 14  # 14 days
    reset_token_expire_minutes: int = 30

    dataset_path: str = "app/data/processed/netshield_combined.csv"
    model_path: str = "app/ml/model.pkl"
    model_metrics_path: str = "app/ml/model_metrics.json"

    # ---- PostgreSQL (optional secondary DB) ----
    # Left blank by default. The app works fully on MongoDB alone; if this is
    # set, the Postgres connection layer in app/postgres_db.py will attempt
    # to connect (used for future relational/reporting features). Never
    # required for the app to start.
    postgres_uri: str = ""  # e.g. postgresql+asyncpg://user:password@localhost:5432/netshield_ai

    # ---- Comma-separated list in .env, e.g. http://localhost:5173,http://localhost:3000
    frontend_origins: str = "http://localhost:5173"

    # ---- SMTP (Feature 2 / Feature 3 — password reset + critical alert emails) ----
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_email: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    email_from_name: str = "NetShield AI"

    # Public base URL of the frontend, used to build the password reset link
    # that gets emailed to the user, e.g. https://netshield.example.com
    frontend_base_url: str = "http://localhost:5173"

    # ---- Critical alert email threshold (Feature 3) ----
    # An email is sent automatically whenever a prediction's risk_score is
    # greater than or equal to this value, OR its severity is "critical".
    critical_alert_risk_threshold: float = 90.0
    critical_alerts_enabled: bool = True
    security_team_email: str = ""  # if blank, falls back to the first admin user's email

    # ---- Live packet capture (Feature 1) ----
    # Network interface to sniff on. Leave blank to let Scapy pick the
    # default interface. On Windows this is usually something like
    # "Ethernet" or a Npcap device name; on Linux/macOS e.g. "eth0" / "en0".
    capture_interface: str = ""
    # Seconds a flow is allowed to stay open (no new packets) before it is
    # flushed to the prediction pipeline.
    capture_flow_timeout_seconds: float = 3.0
    # Optional BPF filter to reduce noise, e.g. "ip" or "tcp or udp".
    capture_bpf_filter: str = "ip"

    # ---- Uploaded dataset storage (Feature 5) ----
    upload_dir: str = "app/data/uploads"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_server and self.smtp_email and self.smtp_password)

    model_config = {"env_file": ".env", "protected_namespaces": ("settings_",)}


settings = Settings()
