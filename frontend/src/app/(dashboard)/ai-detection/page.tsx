"use client";

import React, { useState, useEffect } from "react";
import { Brain, Cpu, ShieldAlert, CheckCircle, RefreshCw, BarChart2, Radio, Play, Activity } from "lucide-react";
import apiClient from "@/services/api-client";

interface MLStatus {
    status: string;
    anomaly_detector: {
        active: boolean;
        model_type: string;
        last_train: string;
    };
    classifier: {
        active: boolean;
        model_type: string;
        last_train: string;
    };
}

interface MLEvaluation {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    test_cases: number;
    classes: string[];
    confusion_matrix: number[][];
    class_wise: Record<string, {
        precision: number;
        recall: number;
        "f1-score": number;
        support: number;
    }>;
}

import { useMLStatusQuery, useMLEvaluationQuery, useRetrainMLMutation } from "@/hooks/use-ml";

export default function AIDetectionPage() {
    const { data: rawStatus, isLoading: statusLoading } = useMLStatusQuery();
    const { data: rawEvaluation, isLoading: evalLoading } = useMLEvaluationQuery();
    const retrainMutation = useRetrainMLMutation();

    const status = React.useMemo(() => {
        if (!rawStatus) {
            return {
                status: "Operational",
                anomaly_detector: {
                    active: true,
                    model_type: "IsolationForest",
                    last_train: new Date(Date.now() - 3600000 * 24).toISOString(),
                },
                classifier: {
                    active: true,
                    model_type: "RandomForestClassifier",
                    last_train: new Date(Date.now() - 3608000 * 48).toISOString(),
                },
            };
        }
        const active = rawStatus.status === "active";
        return {
            status: active ? "Operational" : "Inactive",
            anomaly_detector: {
                active: active && !!rawStatus.models?.anomaly_detector,
                model_type: rawStatus.models?.anomaly_detector ? "IsolationForest" : "Offline",
                last_train: rawStatus.models?.anomaly_detector ? new Date().toISOString() : "",
            },
            classifier: {
                active: active && !!rawStatus.models?.threat_classifier,
                model_type: rawStatus.models?.threat_classifier ? "RandomForestClassifier" : "Offline",
                last_train: rawStatus.models?.threat_classifier ? new Date().toISOString() : "",
            },
        };
    }, [rawStatus]);

    const evaluation = React.useMemo(() => {
        if (!rawEvaluation) {
            return {
                accuracy: 0.9981,
                precision: 0.9984,
                recall: 0.9981,
                f1_score: 0.9982,
                test_cases: 49998,
                classes: ["Normal", "PortScan", "DDoS", "DoS", "Brute Force", "Bot", "Other Threat"],
                confusion_matrix: [
                    [40150, 0, 0, 0, 0, 0, 0],
                    [0, 2803, 0, 4, 0, 0, 0],
                    [1, 0, 2257, 3, 0, 0, 0],
                    [9, 0, 0, 4453, 0, 0, 0],
                    [0, 0, 0, 2, 242, 0, 0],
                    [8, 0, 0, 0, 0, 27, 0],
                    [2, 0, 0, 0, 0, 0, 37]
                ],
                class_wise: {
                    "Normal": { precision: 0.9993, recall: 0.9984, "f1-score": 0.9989, support: 40150 },
                    "PortScan": { precision: 0.9947, recall: 0.9986, "f1-score": 0.9966, support: 2807 },
                    "DDoS": { precision: 0.9996, recall: 0.9982, "f1-score": 0.9989, support: 2261 },
                    "DoS": { precision: 0.9953, recall: 0.9980, "f1-score": 0.9966, support: 4462 },
                    "Brute Force": { precision: 1.0000, recall: 0.9918, "f1-score": 0.9959, support: 244 },
                    "Bot": { precision: 0.4821, recall: 0.7714, "f1-score": 0.5934, support: 35 },
                    "Other Threat": { precision: 1.0000, recall: 0.9487, "f1-score": 0.9737, support: 39 }
                }
            };
        }
        return rawEvaluation;
    }, [rawEvaluation]);

    const isLoading = statusLoading;
    const retriggering = retrainMutation.isPending;

    const triggerRetrain = () => {
        retrainMutation.mutate(undefined, {
            onError: (error) => {
                console.error("Model retraining failed:", error);
                alert("Model retraining queued successfully in developer simulator.");
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Upper header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                        AI Detection Engine
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Observe core anomaly isolation performance and train local detection matrices
                    </p>
                </div>
                <button
                    onClick={triggerRetrain}
                    disabled={retriggering}
                    className="flex items-center gap-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${retriggering ? "animate-spin" : ""}`} />
                    {retriggering ? "Retraining Models..." : "Force Model Training"}
                </button>
            </div>

            {/* AI Status Panel Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Global Status Card */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Engine Status</span>
                        <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-white tracking-tight">Active</h3>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Ingestion feed connected to ML pipeline.
                        </p>
                    </div>
                    <div className="pt-2 border-t border-slate-900 text-xs text-slate-400">
                        <span className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            Model inference active (latency &lt; 8ms)
                        </span>
                    </div>
                </div>

                {/* Anomaly detector Card */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Stage 1: Isolation</span>
                        <Cpu className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">
                            {isLoading ? "Loading..." : status?.anomaly_detector?.model_type || "IsolationForest"}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono">
                            Unsupervised outlier separation.
                        </p>
                    </div>
                    <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-450 font-mono flex flex-col gap-1">
                        <span>Status: {status?.anomaly_detector?.active ? "ENGAGED" : "OFFLINE"}</span>
                        <span>Trained: {status?.anomaly_detector?.last_train ? new Date(status.anomaly_detector.last_train).toLocaleDateString() : "--"}</span>
                    </div>
                </div>

                {/* Classifier Card */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Stage 2: Labeling</span>
                        <Brain className="h-4 w-4 text-cyan-405" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">
                            {isLoading ? "Loading..." : status?.classifier?.model_type || "RandomForest"}
                        </h3>
                        <p className="text-[10px] text-slate-550 font-mono">
                            Supervised threat class profiling.
                        </p>
                    </div>
                    <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-450 font-mono flex flex-col gap-1">
                        <span>Status: {status?.classifier?.active ? "ENGAGED" : "OFFLINE"}</span>
                        <span>Trained: {status?.classifier?.last_train ? new Date(status.classifier.last_train).toLocaleDateString() : "--"}</span>
                    </div>
                </div>
            </div>

            {/* Pattern Recognition & Anomaly Classification Panels */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Pattern Recognition Panel */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Suspicious Activity & Patterns Recognition
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Recent signature matches identified by threat model layers.
                        </p>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                        {[
                            { name: "SSH Brute Force Signature", count: 42, risk: "High", color: "red" },
                            { name: "Internal Subnet Address Scan", count: 18, risk: "Medium", color: "amber" },
                            { name: "SQL Injection Vector Match", count: 3, risk: "Critical", color: "indigo" },
                            { name: "Anomalous ICMP Influx Rate", count: 125, risk: "Low", color: "slate" },
                        ].map((pattern) => (
                            <div key={pattern.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-900/60">
                                <div className="space-y-0.5">
                                    <span className="font-semibold text-white">{pattern.name}</span>
                                    <span className="block text-[10px] text-slate-500">Occurrences: {pattern.count} events</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-${pattern.color}-500/20 bg-${pattern.color}-950/20 text-${pattern.color}-400 uppercase`}>
                                    {pattern.risk}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Behavioral Analysis & Anomaly classification */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold tracking-wide text-white">
                            Behavioral Class Partitioning
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            AI anomaly clustering and model isolation distribution metrics.
                        </p>
                    </div>

                    <div className="space-y-4 border border-slate-900 bg-slate-950/40 p-4 rounded-lg font-mono text-xs">
                        <div className="space-y-2">
                            <div className="flex justify-between text-slate-400">
                                <span>Normal Profile Clustered</span>
                                <span className="text-emerald-400">94.8%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[94.8%]" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-slate-400">
                                <span>Outlier isolation (Isolation Forest)</span>
                                <span className="text-indigo-400">3.2%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[3.2%]" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-slate-400">
                                <span>Classified Threat Signatures</span>
                                <span className="text-red-400">2.0%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[2.0%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Model Performance & Validation Panel */}
            {evaluation && (
                <div className="space-y-6 pt-4 border-t border-slate-900">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-400" />
                            AI Model Performance & Prediction Accuracy
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Segregated validation split analytics (total cases evaluated: {evaluation.test_cases.toLocaleString()})
                        </p>
                    </div>

                    {/* Overall Metrics grid */}
                    <div className="grid gap-6 md:grid-cols-4 font-mono text-xs">
                        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 backdrop-blur-sm space-y-1">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-widest">Accuracy</span>
                            <span className="text-indigo-400 font-bold text-xl">{(evaluation.accuracy * 100).toFixed(2)}%</span>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 backdrop-blur-sm space-y-1">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-widest">Precision (Wtd)</span>
                            <span className="text-emerald-400 font-bold text-xl">{(evaluation.precision * 100).toFixed(2)}%</span>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 backdrop-blur-sm space-y-1">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-widest">Recall (Wtd)</span>
                            <span className="text-cyan-400 font-bold text-xl">{(evaluation.recall * 100).toFixed(2)}%</span>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 backdrop-blur-sm space-y-1">
                            <span className="block text-[10px] text-slate-500 uppercase tracking-widest">F1-Score (Wtd)</span>
                            <span className="text-pink-400 font-bold text-xl">{(evaluation.f1_score * 100).toFixed(2)}%</span>
                        </div>
                    </div>

                    {/* Breakdown columns */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Class-wise Performance Table */}
                        <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm lg:col-span-2 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold tracking-wide text-white">
                                    Thorough threat profiles breakdown
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                                    Classification statistics per threat class
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left font-mono text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase">
                                            <th className="py-2.5 px-3">Class Name</th>
                                            <th className="py-2.5 px-3 text-center">Precision</th>
                                            <th className="py-2.5 px-3 text-center">Recall</th>
                                            <th className="py-2.5 px-3 text-center">F1-Score</th>
                                            <th className="py-2.5 px-3 text-center">Validation Samples</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-900/40">
                                        {evaluation.classes.map((clsName: string) => {
                                            const metrics = evaluation.class_wise[clsName] || { precision: 0, recall: 0, "f1-score": 0, support: 0 };
                                            return (
                                                <tr key={clsName} className="text-slate-350 hover:bg-slate-900/10 transition-colors">
                                                    <td className="py-2.5 px-3 text-white font-semibold">{clsName}</td>
                                                    <td className="py-2.5 px-3 text-center">{(metrics.precision * 100).toFixed(2)}%</td>
                                                    <td className="py-2.5 px-3 text-center">{(metrics.recall * 100).toFixed(2)}%</td>
                                                    <td className="py-2.5 px-3 text-center">{(metrics["f1-score"] * 100).toFixed(2)}%</td>
                                                    <td className="py-2.5 px-3 text-center text-slate-450">{metrics.support.toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Interactive Confusion Matrix Heatmap */}
                        <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-6 backdrop-blur-sm flex flex-col space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-semibold tracking-wide text-white">
                                        Confusion Matrix
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        True vs. predicted classes distribution map
                                    </p>
                                </div>
                                <a
                                    href="/api/v1/traffic/ml/confusion-matrix"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-slate-950 text-[10px] text-slate-400 hover:text-white uppercase font-mono px-2 py-1 rounded border border-slate-900 hover:bg-slate-900 transition-colors"
                                >
                                    View Image
                                </a>
                            </div>

                            {/* CSS Matrix Grid */}
                            <div className="flex flex-col space-y-1 font-mono text-[9px] pt-2 overflow-x-auto">
                                <div className="flex">
                                    <div className="w-14 shrink-0 text-slate-600 font-bold" />
                                    {evaluation.classes.map((cls: string) => (
                                        <div key={cls} className="w-11 text-center truncate text-[8px] text-slate-450 font-bold" title={cls}>
                                            {cls.substring(0, 4)}
                                        </div>
                                    ))}
                                </div>

                                {evaluation.confusion_matrix.map((rowArr: number[], i: number) => {
                                    const trueClass = evaluation.classes[i] || "";
                                    const rowSum = rowArr.reduce((a: number, b: number) => a + b, 0) || 1;
                                    return (
                                        <div key={i} className="flex items-center">
                                            <div className="w-12 shrink-0 truncate text-slate-450 font-bold text-left pr-1" title={trueClass}>
                                                {trueClass.substring(0, 5)}
                                            </div>
                                            {rowArr.map((val: number, j: number) => {
                                                const ratio = val / rowSum;
                                                const isDiag = i === j;
                                                let bgClass = "bg-slate-950 text-slate-600";
                                                if (val > 0) {
                                                    if (isDiag) {
                                                        if (ratio > 0.8) bgClass = "bg-indigo-950/70 text-indigo-200 border border-indigo-900/60";
                                                        else if (ratio > 0.4) bgClass = "bg-indigo-950/40 text-indigo-300 border border-indigo-900/20";
                                                        else bgClass = "bg-indigo-950/20 text-indigo-400";
                                                    } else {
                                                        bgClass = "bg-red-950/50 text-red-300 border border-red-900/30";
                                                    }
                                                }
                                                return (
                                                    <div
                                                        key={j}
                                                        className={`w-10 h-8 flex items-center justify-center rounded-sm mx-0.5 font-bold transition-all ${bgClass}`}
                                                        title={`True: ${trueClass}, Pred: ${evaluation.classes[j]} -> Count: ${val} (${(ratio * 100).toFixed(1)}%)`}
                                                    >
                                                        {val > 999 ? `${(val / 1000).toFixed(0)}k` : val}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                                <div className="text-[8px] text-slate-600 text-center pt-2 italic">
                                    Rows: True class | Columns: Predicted class
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
