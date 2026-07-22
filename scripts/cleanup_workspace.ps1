$root = 'C:\Users\navee\OneDrive\Desktop\gowtham4201'

New-Item -Path "$root\logs" -ItemType Directory -Force | Out-Null

if (Test-Path "$root\backend.log") { Move-Item -Path "$root\backend.log" -Destination "$root\logs" -Force }
if (Test-Path "$root\frontend.log") { Move-Item -Path "$root\frontend.log" -Destination "$root\logs" -Force }

if (Test-Path "$root\propagate.ps1") { Move-Item -Path "$root\propagate.ps1" -Destination "$root\scripts" -Force }
if (Test-Path "$root\verify_imports.py") { Move-Item -Path "$root\verify_imports.py" -Destination "$root\scripts" -Force }
if (Test-Path "$root\undo.py") { Move-Item -Path "$root\undo.py" -Destination "$root\scripts" -Force }

if (Test-Path "$root\BUILD_INSTRUCTIONS.md") { Move-Item -Path "$root\BUILD_INSTRUCTIONS.md" -Destination "$root\docs" -Force }
if (Test-Path "$root\PROJECT_EXPLANATION.md") { Move-Item -Path "$root\PROJECT_EXPLANATION.md" -Destination "$root\docs" -Force }

Write-Host "Cleanup complete."
