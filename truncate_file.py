
filename = r"c:\Users\jyoti mulimani\Desktop\JetKing\FINAL TECH-PRO AI\A8AssignmentAdmin.html"
with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep only the first 840 lines
new_lines = lines[:840]

with open(filename, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print(f"Truncated {filename} to {len(new_lines)} lines.")
