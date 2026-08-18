import pypdf

reader = pypdf.PdfReader(r"C:\Users\Victus\Videos\NetShieldAI-clean\AI_Network Anomaly Detection & Threat Monitoring System.pdf")
text = ""
for i, page in enumerate(reader.pages):
    text += f"--- Page {i+1} ---\n"
    text += page.extract_text() + "\n"

with open(r"C:\Users\Victus\Videos\NetShieldAI-clean\extracted_pdf_text.txt", "w", encoding="utf-8") as f:
    f.write(text)
print("PDF text extracted successfully!")
