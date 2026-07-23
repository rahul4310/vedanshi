import os
import ast
import json
import sys
import argparse
from pathlib import Path
import tempfile
import re
from datetime import datetime, timezone

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECTS_DIR = ROOT_DIR / "python-projects"
GENERATED_DIR = ROOT_DIR / "src" / "generated"
DOCS_DIR = ROOT_DIR / "docs"
JSON_OUT = GENERATED_DIR / "projects.json"
STATUS_OUT = GENERATED_DIR / "validation-status.json"
REPORT_OUT = DOCS_DIR / "PYTHON_COMPATIBILITY_REPORT.md"

# Compatibility rules
UNSUPPORTED_IMPORTS = {
    "tkinter": ("cannot-run", "Desktop GUI libraries are not supported in the browser."),
    "pygame": ("cannot-run", "Pygame requires a desktop environment."),
    "turtle": ("cannot-run", "Turtle graphics require a desktop environment."),
    "subprocess": ("cannot-run", "Cannot spawn processes in the browser sandbox."),
    "multiprocessing": ("cannot-run", "Multiprocessing is not supported in the browser."),
    "requests": ("needs-adaptation", "Use 'pyodide.http.pyfetch' instead of 'requests' in the browser."),
    "urllib": ("needs-adaptation", "Network requests must be asynchronous in Pyodide."),
    "socket": ("cannot-run", "Raw sockets are not available in the browser sandbox."),
    "sqlite3": ("needs-adaptation", "Filesystem is ephemeral. Use browser storage or fetch initial DB state.")
}

class ProjectValidator:
    def __init__(self, filepath: Path, existing_ids: set):
        self.filepath = filepath
        self.relative_path = filepath.relative_to(PROJECTS_DIR).as_posix()
        
        base_id = re.sub(r'[^a-zA-Z0-9_\-]', '-', self.relative_path.replace(".py", ""))
        self.id = base_id
        counter = 1
        while self.id in existing_ids:
            self.id = f"{base_id}-{counter}"
            counter += 1
        existing_ids.add(self.id)
            
        self.filename = filepath.name
        
        with open(filepath, "r", encoding="utf-8") as f:
            self.source = f.read()

        self.title = self.filename
        self.description = ""
        self.order = 999999
        self.concepts = set()
        self.imports = set()
        self.compatibility = "runs-unchanged"
        self.unsupported_imports = []
        self.compatibility_reason = "No unsupported imports detected."
        self.syntax_error = None
        self.is_demo = False

    def validate(self):
        try:
            tree = ast.parse(self.source, filename=self.filename)
            self._extract_metadata(tree)
            self._analyze_ast(tree)
            self._check_compatibility()
        except SyntaxError as e:
            self.syntax_error = f"Syntax error at line {e.lineno}: {e.msg}"
            self.compatibility = "cannot-run"
            self.compatibility_reason = self.syntax_error

    def _extract_metadata(self, tree):
        docstring = ast.get_docstring(tree)
        if docstring:
            lines = [line.strip() for line in docstring.split("\n")]
            if lines:
                self.title = lines[0]
                
            desc_lines = []
            for line in lines[1:]:
                if line.lower().startswith("order:"):
                    try:
                        self.order = int(line.split(":")[1].strip())
                    except ValueError:
                        pass
                elif line.lower().startswith("demo:"):
                    val = line.split(":")[1].strip().lower()
                    if val == "true":
                        self.is_demo = True
                else:
                    if line or desc_lines:
                        desc_lines.append(line)
            
            self.description = "\n".join(desc_lines).strip()

    def _analyze_ast(self, tree):
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    self.imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    self.imports.add(node.module.split('.')[0])
            elif isinstance(node, (ast.For, ast.While)):
                self.concepts.add("loops")
            elif isinstance(node, ast.If):
                self.concepts.add("conditionals")
            elif isinstance(node, ast.FunctionDef):
                self.concepts.add("functions")
            elif isinstance(node, ast.ClassDef):
                self.concepts.add("classes")
            elif isinstance(node, ast.List):
                self.concepts.add("lists")
            elif isinstance(node, ast.Dict):
                self.concepts.add("dictionaries")
            elif isinstance(node, ast.Try):
                self.concepts.add("exceptions")

    def _check_compatibility(self):
        for imp in self.imports:
            if imp in UNSUPPORTED_IMPORTS:
                status, reason = UNSUPPORTED_IMPORTS[imp]
                self.unsupported_imports.append(imp)
                if status == "cannot-run" or self.compatibility == "runs-unchanged":
                    self.compatibility = status
                    self.compatibility_reason = reason
                    
        if len(self.unsupported_imports) > 1:
            self.compatibility_reason = f"Unsupported imports: {', '.join(self.unsupported_imports)}."

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "relativePath": self.relative_path,
            "title": self.title,
            "description": self.description,
            "concepts": sorted(list(self.concepts)),
            "order": self.order,
            "source": self.source,
            "compatibility": self.compatibility,
            "unsupportedImports": sorted(self.unsupported_imports),
            "compatibilityReason": self.compatibility_reason,
            "syntaxError": self.syntax_error,
            "isDemo": self.is_demo
        }

def prepare_atomic_file(filepath: Path, content: str) -> Path:
    """Write string to a temporary file, returning its path."""
    fd, tmp_path = tempfile.mkstemp(dir=filepath.parent, prefix=".", suffix=".tmp", text=True)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(content)
    return Path(tmp_path)

def safe_replace(src: Path, dst: Path, retries: int = 5, delay: float = 0.1):
    import time
    for i in range(retries):
        try:
            os.replace(src, dst)
            return
        except PermissionError:
            if i == retries - 1:
                raise
            time.sleep(delay)

def write_safe_empty_catalog():
    if not JSON_OUT.exists():
        tmp_json = prepare_atomic_file(JSON_OUT, "[]")
        safe_replace(tmp_json, JSON_OUT)

def write_status(valid: bool, generation_id: str, errors: list):
    status_data = {
        "valid": valid,
        "generationId": generation_id,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "catalogueIsStale": not valid,
        "errors": errors
    }
    tmp_status = prepare_atomic_file(STATUS_OUT, json.dumps(status_data, indent=2))
    safe_replace(tmp_status, STATUS_OUT)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["development", "production"], default="production")
    args = parser.parse_args()
    
    generation_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    if not PROJECTS_DIR.exists() or not any(PROJECTS_DIR.iterdir()):
        print(f"WARNING: No Python projects found in {PROJECTS_DIR}", file=sys.stderr)
        tmp_json = prepare_atomic_file(JSON_OUT, "[]")
        tmp_report = prepare_atomic_file(REPORT_OUT, "# Python Compatibility Report\n\nNo projects found.\n")
        
        safe_replace(tmp_report, REPORT_OUT)
        safe_replace(tmp_json, JSON_OUT)
        write_status(True, generation_id, [])
        sys.exit(0)

    projects = []
    existing_ids = set()
    errors_for_status = []
    has_syntax_error = False

    py_files = sorted(list(PROJECTS_DIR.rglob("*.py")))

    for py_file in py_files:
        validator = ProjectValidator(py_file, existing_ids)
        validator.validate()
        
        if validator.syntax_error:
            has_syntax_error = True
            errors_for_status.append({
                "relativePath": validator.relative_path,
                "message": validator.syntax_error,
                "friendlyMessage": f"There's a Python syntax error in {validator.filename}."
            })
        else:
            projects.append(validator.to_dict())

    if has_syntax_error:
        print("CRITICAL: Syntax errors detected in Python files:", file=sys.stderr)
        for err in errors_for_status:
            print(f"  - {err['relativePath']}: {err['message']}", file=sys.stderr)
            
        if args.mode == "development":
            print("Development mode: writing validation status and marking catalogue as stale.", file=sys.stderr)
            write_safe_empty_catalog()
            write_status(False, generation_id, errors_for_status)
            sys.exit(0)
        else:
            print("Build failed. No files were updated.", file=sys.stderr)
            sys.exit(1)

    projects.sort(key=lambda p: (p['order'], p['relativePath']))
    json_data = json.dumps(projects, indent=2, ensure_ascii=False)
    
    report_lines = [
        "# Python Compatibility Report\n",
        f"Generated: {datetime.now(timezone.utc).isoformat()}\n\n",
        "This report is automatically generated by `scripts/validate_projects.py`.\n",
        "It classifies the compatibility of each Python project with the browser-based Pyodide environment.\n\n",
        "## Summary\n"
    ]
    counts = {"runs-unchanged": 0, "needs-adaptation": 0, "cannot-run": 0}
    for p in projects:
        counts[p['compatibility']] += 1
    for status, count in counts.items():
        report_lines.append(f"- **{status}**: {count}")
    report_lines.append("\n## Details\n")
    for p in projects:
        report_lines.append(f"### {p['filename']} (`{p['relativePath']}`)\n")
        report_lines.append(f"- **Status**: `{p['compatibility']}`")
        if p['unsupportedImports']:
            report_lines.append(f"- **Unsupported Imports**: {', '.join(p['unsupportedImports'])}")
        report_lines.append(f"- **Reason**: {p['compatibilityReason']}\n")

    # Generate all temporary files first
    tmp_json = prepare_atomic_file(JSON_OUT, json_data)
    tmp_report = prepare_atomic_file(REPORT_OUT, "\n".join(report_lines))

    # Replace sequentially
    safe_replace(tmp_report, REPORT_OUT)
    safe_replace(tmp_json, JSON_OUT)
    
    # Finally update status
    write_status(True, generation_id, [])

    print(f"Successfully generated {len(projects)} projects.")

if __name__ == "__main__":
    main()
