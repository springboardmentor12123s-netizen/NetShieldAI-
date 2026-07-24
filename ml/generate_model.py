import os
import re
import joblib

features = joblib.load("models/feature_names.pkl")

output = []

output.append("from sqlalchemy import Column, Integer, Float")
output.append("from app.database import Base")
output.append("")
output.append("")
output.append("class AIDataset(Base):")
output.append('    __tablename__ = "ai_dataset"')
output.append("")
output.append("    id = Column(Integer, primary_key=True, index=True)")
output.append("")

for f in features:

    name = f.lower()

    name = name.replace(" ", "_")
    name = name.replace("/", "_per_")
    name = name.replace(".", "_")
    name = name.replace("-", "_")

    name = re.sub(r"[^a-zA-Z0-9_]", "", name)

    output.append(f"    {name} = Column(Float)")

output.append("")
output.append("    label = Column(Float)")

with open(
    "../backend/app/models/ai_dataset.py",
    "w",
    encoding="utf-8"
) as file:

    file.write("\n".join(output))

print("=" * 50)
print("AI Dataset Model Generated Successfully")
print("=" * 50)

print("\nFile Created :")
print("../backend/app/models/ai_dataset.py")