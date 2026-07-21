import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000"
});

export const predictAttack = (data) =>
    API.post("/ai/predict", { data });

export const getIntrusionReport = () =>
    API.get("/ai/intrusion-report");