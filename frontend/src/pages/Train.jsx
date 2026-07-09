import { BrainCircuit, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

export default function Train() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const train = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/train");
      setMetrics(data);
      toast.success("Isolation Forest trained successfully.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Train anomaly model" description="Train an Isolation Forest on the latest uploaded training dataset." action={<button className="button-primary" disabled={loading} onClick={train}><BrainCircuit className={`h-5 w-5 ${loading ? "animate-pulse" : ""}`} />{loading ? "Training model..." : "Start training"}</button>} />
      <section className="grid gap-6 lg:grid-cols-5">
        <article className="panel p-6 lg:col-span-2">
          <h2 className="font-semibold text-white">Training pipeline</h2>
          <div className="mt-6 space-y-5">
            {["Load latest CSV", "Clean missing & infinite values", "Select numeric features", "Scale with StandardScaler", "Train & persist Isolation Forest"].map((step, index) => (
              <div className="flex gap-4" key={step}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-xs font-bold text-cyan">{index + 1}</span><div><p className="text-sm font-medium text-slate-200">{step}</p>{index < 4 && <div className="ml-[-33px] mt-3 h-3 border-l border-slate-700" />}</div></div>
            ))}
          </div>
        </article>
        <article className="panel min-h-96 p-6 lg:col-span-3">
          {!metrics ? (
            <div className="flex h-full min-h-80 flex-col items-center justify-center text-center"><BrainCircuit className="mb-4 h-12 w-12 text-slate-700" /><h2 className="font-semibold text-slate-300">No training metrics yet</h2><p className="mt-2 max-w-sm text-sm text-slate-500">Upload a dataset, then start training to see model performance.</p></div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-cyan" /><div><h2 className="font-semibold text-white">Training complete</h2><p className="text-xs text-slate-500">{metrics.dataset_name} • {metrics.feature_count} features • evaluated using {metrics.evaluation}</p></div></div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[["Accuracy", metrics.accuracy], ["Precision", metrics.precision], ["Recall", metrics.recall], ["F1 score", metrics.f1_score]].map(([label, value]) => <div className="rounded-xl bg-slate-950/50 p-4" key={label}><p className="text-2xl font-bold text-cyan">{value}%</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}
              </div>
              <h3 className="mb-3 mt-7 text-sm font-semibold text-white">Confusion matrix</h3>
              <div className="grid max-w-sm grid-cols-2 gap-2 text-center text-sm">
                <div className="rounded-lg bg-cyan/10 p-4"><b className="block text-xl text-cyan">{metrics.confusion_matrix[0][0]}</b><span className="text-xs text-slate-500">True normal</span></div>
                <div className="rounded-lg bg-red-500/10 p-4"><b className="block text-xl text-red-300">{metrics.confusion_matrix[0][1]}</b><span className="text-xs text-slate-500">False anomaly</span></div>
                <div className="rounded-lg bg-amber-500/10 p-4"><b className="block text-xl text-amber-300">{metrics.confusion_matrix[1][0]}</b><span className="text-xs text-slate-500">Missed anomaly</span></div>
                <div className="rounded-lg bg-cyan/10 p-4"><b className="block text-xl text-cyan">{metrics.confusion_matrix[1][1]}</b><span className="text-xs text-slate-500">True anomaly</span></div>
              </div>
            </>
          )}
        </article>
      </section>
    </>
  );
}
