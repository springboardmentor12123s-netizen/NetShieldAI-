import jsPDF from "jspdf";
import "jspdf-autotable";

export const exportCSV = (predictions) => {
  if (!predictions || predictions.length === 0) return false;

  const headers = [
    "Timestamp",
    "Flow ID",
    "Threat Category",
    "Prediction",
    "Severity",
    "Risk Score",
    "Confidence",
  ];

  const csvRows = [headers.join(",")];

  predictions.forEach((p) => {
    const timestamp = new Date(p.prediction_timestamp).toLocaleString().replace(/,/g, '');
    const flowId = p.flow_id;
    const category = p.predicted_class || "—";
    const prediction = p.prediction_label || "—";
    const severity = p.severity || "—";
    const riskScore = p.risk_score || "0";
    const confidence = p.confidence ? (p.confidence * 100).toFixed(1) + "%" : "—";
    
    // wrap values in quotes in case they contain commas
    const row = [timestamp, flowId, category, prediction, severity, riskScore, confidence].map(val => `"${val}"`);
    csvRows.push(row.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `netshield_predictions_${new Date().getTime()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return true;
};

export const exportPDF = async (predictions) => {
  if (!predictions || predictions.length === 0) return false;

  const doc = new jsPDF("landscape");
  
  const total = predictions.length;
  const normal = predictions.filter(p => p.prediction_label === "Normal").length;
  const attack = total - normal;
  const critical = predictions.filter(p => p.severity === "Critical").length;
  const avgRisk = total > 0 ? Math.round(predictions.reduce((acc, p) => acc + (p.risk_score || 0), 0) / total) : 0;
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text("NetShield AI", 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(71, 85, 105);
  doc.text("Live Threat Detection Report", 14, 28);
  
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

  // Fetch Incident Stats
  let incidentStats = null;

  // Summary Cards
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  
  const startY = 45;
  const cardWidth = 50;
  
  // Card 1: Total
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, cardWidth, 20, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Total Predictions", 18, startY + 7);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(total.toString(), 18, startY + 15);

  // Card 2: Normal
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14 + cardWidth + 5, startY, cardWidth, 20, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Normal", 18 + cardWidth + 5, startY + 7);
  doc.setFontSize(14);
  doc.setTextColor(22, 163, 74);
  doc.text(normal.toString(), 18 + cardWidth + 5, startY + 15);

  // Card 3: Attack
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14 + (cardWidth + 5) * 2, startY, cardWidth, 20, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Attack", 18 + (cardWidth + 5) * 2, startY + 7);
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.text(attack.toString(), 18 + (cardWidth + 5) * 2, startY + 15);
  
  // Card 4: Critical
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14 + (cardWidth + 5) * 3, startY, cardWidth, 20, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Critical", 18 + (cardWidth + 5) * 3, startY + 7);
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.text(critical.toString(), 18 + (cardWidth + 5) * 3, startY + 15);
  
  // Card 5: Avg Risk
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(14 + (cardWidth + 5) * 4, startY, cardWidth, 20, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Average Risk", 18 + (cardWidth + 5) * 4, startY + 7);
  doc.setFontSize(14);
  doc.setTextColor(217, 119, 6);
  doc.text(avgRisk.toString(), 18 + (cardWidth + 5) * 4, startY + 15);

  // Table
  const tableData = predictions.map(p => [
    new Date(p.prediction_timestamp).toLocaleString(),
    p.flow_id,
    p.predicted_class || "—",
    p.prediction_label || "—",
    p.severity || "—",
    p.risk_score || "0",
    p.confidence ? (p.confidence * 100).toFixed(1) + "%" : "—"
  ]);

  doc.autoTable({
    startY: startY + 30,
    head: [["Timestamp", "Flow ID", "Threat Category", "Prediction", "Severity", "Risk Score", "Confidence"]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  // Incident Summary Section
  if (incidentStats) {
    const finalY = doc.lastAutoTable.finalY || startY + 50;
    
    // Check if we need a new page for incident summary
    if (finalY > doc.internal.pageSize.height - 40) {
      doc.addPage();
    }
    
    let currentY = finalY > doc.internal.pageSize.height - 40 ? 20 : finalY + 15;
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Incident Summary", 14, currentY);
    
    currentY += 10;
    
    const incidentData = [
      ["Open Incidents", incidentStats.open_incidents || 0],
      ["Resolved Incidents", incidentStats.resolved_incidents || 0],
      ["Critical Incidents", incidentStats.critical_incidents || 0],
      ["Average Resolution Time", incidentStats.average_resolution_time || "N/A"]
    ];
    
    doc.autoTable({
      startY: currentY,
      head: [["Metric", "Value"]],
      body: incidentData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold' } },
      margin: { left: 14 },
      tableWidth: 100
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Generated by NetShield AI",
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 25,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`netshield_report_${new Date().getTime()}.pdf`);
  return true;
};
