import os
import re

APP_DIR = "/Users/macbook/realestate/realadmin/app"
COMPONENT_DIR = "/Users/macbook/realestate/realadmin/components"

loader_pattern1 = re.compile(r'<div[^>]*className="[^"]*animate-spin[^"]*(?:w-8 h-8|h-8 w-8|w-10 h-10|w-12 h-12)[^"]*"[^>]*>\s*</div>')
loader_pattern2 = re.compile(r'<ArrowPathIcon[^>]*className="[^"]*animate-spin[^"]*(?:w-8 h-8|h-8 w-8|w-10 h-10|w-12 h-12)[^"]*"[^>]*/>')

for root_dir in [APP_DIR, COMPONENT_DIR]:
    for dirpath, _, filenames in os.walk(root_dir):
        for file in filenames:
            if not file.endswith(".tsx"):
                continue
            filepath = os.path.join(dirpath, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = loader_pattern1.sub('<DwellyOrbitingLoader size={32} />', content)
            new_content = loader_pattern2.sub('<DwellyOrbitingLoader size={32} />', new_content)
            
            if new_content != content:
                # Need to add import if not present
                if 'DwellyOrbitingLoader' not in content:
                    # Find last import
                    import_idx = new_content.rfind('import ')
                    if import_idx != -1:
                        end_of_line = new_content.find('\n', import_idx)
                        new_content = new_content[:end_of_line+1] + 'import DwellyOrbitingLoader from "@/components/DwellyOrbitingLoader";\n' + new_content[end_of_line+1:]
                    else:
                        new_content = 'import DwellyOrbitingLoader from "@/components/DwellyOrbitingLoader";\n' + new_content
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
print("Done")
