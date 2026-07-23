import unittest
import json
import shutil
from pathlib import Path
import sys

# Add scripts directory to path to import validate_projects
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR / "scripts"))
import validate_projects

class TestValidationPipeline(unittest.TestCase):
    def setUp(self):
        # Setup temporary directories for testing
        self.test_dir = ROOT_DIR / "tests" / "temp_workspace"
        self.projects_dir = self.test_dir / "python-projects"
        self.generated_dir = self.test_dir / "src" / "generated"
        self.docs_dir = self.test_dir / "docs"
        self.json_out = self.generated_dir / "projects.json"
        self.status_out = self.generated_dir / "validation-status.json"
        
        # Override paths in the validate_projects module
        validate_projects.PROJECTS_DIR = self.projects_dir
        validate_projects.GENERATED_DIR = self.generated_dir
        validate_projects.DOCS_DIR = self.docs_dir
        validate_projects.JSON_OUT = self.json_out
        validate_projects.STATUS_OUT = self.status_out
        validate_projects.REPORT_OUT = self.docs_dir / "PYTHON_COMPATIBILITY_REPORT.md"
        
        # Create fresh directories
        self.test_dir.mkdir(parents=True, exist_ok=True)
        self.projects_dir.mkdir(parents=True, exist_ok=True)

    def tearDown(self):
        # Clean up
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)

    def _run_validation(self, mode="production"):
        # Save original sys.argv
        original_argv = sys.argv
        sys.argv = ["validate_projects.py", "--mode", mode]
        try:
            validate_projects.main()
        except SystemExit as e:
            sys.argv = original_argv
            return e.code
        sys.argv = original_argv
        return 0

    def _read_json(self, path):
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def test_pipeline_crud(self):
        # 1. Empty state
        code = self._run_validation()
        self.assertEqual(code, 0)
        data = self._read_json(self.json_out)
        self.assertEqual(len(data), 0)

        # 2. Add a file
        file_a = self.projects_dir / "hello.py"
        file_a.write_text('"""Hello World\nOrder: 2\n"""\nprint("Hello")')
        self._run_validation()
        data = self._read_json(self.json_out)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['filename'], "hello.py")
        self.assertEqual(data[0]['title'], "Hello World")
        self.assertEqual(data[0]['order'], 2)

        # 3. Add another file
        file_b = self.projects_dir / "calc.py"
        file_b.write_text('"""Calculator\nOrder: 1\n"""\nimport tkinter')
        self._run_validation()
        data = self._read_json(self.json_out)
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]['filename'], "calc.py")
        self.assertEqual(data[0]['compatibility'], "cannot-run")
        self.assertEqual(data[1]['filename'], "hello.py")

        # 4. Modify a file
        file_a.write_text('"""Modified Hello\nOrder: 2\n"""\nprint("Hi")')
        self._run_validation()
        data = self._read_json(self.json_out)
        self.assertEqual(data[1]['title'], "Modified Hello")
        self.assertEqual(data[1]['source'], '"""Modified Hello\nOrder: 2\n"""\nprint("Hi")')

        # 5. Rename a file
        file_c = self.projects_dir / "calculator.py"
        file_b.rename(file_c)
        self._run_validation()
        data = self._read_json(self.json_out)
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]['filename'], "calculator.py")
        self.assertEqual(data[0]['id'], "calculator")

        # 6. Delete a file
        file_a.unlink()
        self._run_validation()
        data = self._read_json(self.json_out)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['filename'], "calculator.py")

    def test_syntax_error_production(self):
        file_valid = self.projects_dir / "valid.py"
        file_valid.write_text('print("Valid")')
        self._run_validation()
        
        file_bad = self.projects_dir / "bad.py"
        file_bad.write_text('print("Missing bracket')
        
        # Production should exit 1
        code = self._run_validation(mode="production")
        self.assertEqual(code, 1)
        
        data_after = self._read_json(self.json_out)
        self.assertEqual(len(data_after), 1)
        self.assertEqual(data_after[0]['filename'], "valid.py")

    def test_syntax_error_development(self):
        file_valid = self.projects_dir / "valid.py"
        file_valid.write_text('print("Valid")')
        self._run_validation()
        
        file_bad = self.projects_dir / "bad.py"
        file_bad.write_text('print("Missing bracket')
        
        # Development should exit 0 but update status file
        code = self._run_validation(mode="development")
        self.assertEqual(code, 0)
        
        # Status file should show valid=False
        status = self._read_json(self.status_out)
        self.assertFalse(status['valid'])
        self.assertTrue(status['catalogueIsStale'])
        self.assertEqual(len(status['errors']), 1)
        self.assertIn("bad.py", status['errors'][0]['relativePath'])
        
        # Catalogue remains untouched
        data_after = self._read_json(self.json_out)
        self.assertEqual(len(data_after), 1)
        self.assertEqual(data_after[0]['filename'], "valid.py")

    def test_demo_metadata(self):
        file_demo = self.projects_dir / "demo.py"
        file_demo.write_text('"""Demo App\nDemo: true\n"""\nprint("Demo")')
        self._run_validation()
        data = self._read_json(self.json_out)
        self.assertTrue(data[0]['isDemo'])

    def test_nested_directories_and_duplicates(self):
        subdir = self.projects_dir / "games"
        subdir.mkdir()
        file_nested = subdir / "hello.py"
        file_nested.write_text('print("Nested")')
        file_root = self.projects_dir / "hello.py"
        file_root.write_text('print("Root")')
        
        self._run_validation()
        data = self._read_json(self.json_out)
        self.assertEqual(len(data), 2)
        ids = [p['id'] for p in data]
        self.assertIn("games-hello", ids)
        self.assertIn("hello", ids)

    def test_unicode_escaping(self):
        file_unicode = self.projects_dir / "unicode.py"
        file_unicode.write_text('print("Hello 🌍")\n# Hindi: नमस्ते', encoding='utf-8')
        self._run_validation()
        data = self._read_json(self.json_out)
        self.assertEqual(data[0]['source'], 'print("Hello 🌍")\n# Hindi: नमस्ते')

if __name__ == '__main__':
    unittest.main()
