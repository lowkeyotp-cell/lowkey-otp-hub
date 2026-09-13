from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "lib/whatsapp/lowkey-project-knowledge.txt"

include_dirs = [
    ROOT / "app",
    ROOT / "lib",
]

skip_parts = {
    "admin-dashboard",
    "admin-finance",
    "admin-login",
    "admin-market",
    "admin-marketplace",
    "admin-notifications",
    "admin-orders",
    "admin-reports",
    "admin-security",
    "admin-settings",
    "admin-smspool",
    "admin-users",
    "admin-withdraw",
    "admin",
}

keywords = re.compile(
    r"otp|sms|number|marketplace|product|order|transaction|"
    r"wallet|balance|fund|deposit|paystack|referral|refer|"
    r"reward|profile|notification|login|password|support|"
    r"country|service|price|credential|purchase|cancel|"
    r"expire|withdraw",
    re.I,
)

files = []

for base in include_dirs:
    if not base.exists():
        continue

    for path in base.rglob("*"):
        if not path.is_file():
            continue

        if path.suffix not in {".ts", ".tsx"}:
            continue

        rel = path.relative_to(ROOT)

        if any(part in skip_parts for part in rel.parts):
            continue

        files.append(path)

files.sort()

sections = [
    "LOWKEY CUSTOMER-FACING PROJECT KNOWLEDGE",
    "",
    "This file is generated from the LOWKEY customer-facing application code.",
    "Admin implementation files are intentionally excluded.",
    "",
]

seen = set()

for path in files:
    text = path.read_text(errors="ignore")

    relevant = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        if keywords.search(line):
            normalized = re.sub(r"\s+", " ", line)

            if normalized not in seen:
                seen.add(normalized)
                relevant.append(line)

    if relevant:
        rel = path.relative_to(ROOT)

        sections.append(f"=== {rel} ===")
        sections.extend(relevant)
        sections.append("")

# Always include authoritative support information.
sections.extend([
    "=== OFFICIAL LOWKEY SUPPORT ===",
    "LOWKEY support email: lowkeyotpmarketplace@gmail.com",
    "",
    "=== REFERRAL RULES ===",
    "Referral reward: ₦100.",
    "A referred user must make their first successful deposit of ₦500 or more.",
    "Deposits below ₦500 do not qualify for a referral reward.",
    "Users can access their referral code and referral center from the LOWKEY account.",
    "",
])

OUT.write_text("\n".join(sections))

print(f"Knowledge updated: {OUT}")
print(f"Source files scanned: {len(files)}")
print(f"Knowledge size: {OUT.stat().st_size} bytes")
