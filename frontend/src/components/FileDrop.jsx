import { FileText, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

export default function FileDrop({ file, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const selectFile = (selected) => {
    if (selected?.name.toLowerCase().endsWith(".csv")) onChange(selected);
  };

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-cyan bg-cyan/5" : "border-slate-700 bg-slate-950/20"}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }}
    >
      <input ref={inputRef} className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files[0])} />
      {file ? (
        <div className="flex items-center justify-center gap-4">
          <FileText className="h-10 w-10 text-cyan" />
          <div className="text-left">
            <p className="max-w-xs truncate font-semibold text-white">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button aria-label="Remove file" className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white" onClick={() => onChange(null)}><X className="h-5 w-5" /></button>
        </div>
      ) : (
        <>
          <UploadCloud className="mx-auto mb-4 h-10 w-10 text-cyan" />
          <p className="font-semibold text-white">Drop your CSV here</p>
          <p className="mt-1 text-sm text-slate-500">or select a file from your computer</p>
          <button className="button-secondary mt-5" onClick={() => inputRef.current?.click()} type="button">Browse files</button>
        </>
      )}
    </div>
  );
}
