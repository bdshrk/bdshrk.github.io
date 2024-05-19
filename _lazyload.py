import os
import re

def process_markdown_files(directory):
    for filename in os.listdir(directory):
        if filename.endswith('.md'):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r') as file:
                content = file.readlines()

            updated_content = []
            for line in content:
                if re.match(r'^\s*!\[.*\]\(.*\)\s*$', line):
                    if not re.search(r'{:loading="lazy"}\s*$', line):
                        line = line.strip() + '{:loading="lazy"}\n'
                updated_content.append(line)

            with open(filepath, 'w') as file:
                file.writelines(updated_content)

process_markdown_files("./portfolio")
