import os
import shutil
import sys
from pathlib import Path
import time

ROOT_DIR = Path(__file__).resolve().parent.parent
PROJECTS_DIR = ROOT_DIR / "python-projects"
FIXTURES_DIR = ROOT_DIR / "tests" / "fixtures"
BACKUP_DIR = ROOT_DIR / "python-projects-backup"

CHECKLIST = """
========================================================================
Vedanshi Showcase: Manual Browser Regression Checklist
========================================================================

Please verify the following in both Chrome and Edge (and Firefox if available):

1. Application Loading & Routing
[ ] Service-worker installs and first reload succeeds without infinite loop.
[ ] Production build serves correctly under the /vedanshi/ subpath.
[ ] Direct navigation to a hash route (e.g., /vedanshi/#/project/1_greeting) works.
[ ] Refreshing on a hash route restores the same project page.
[ ] Navigating to an unknown project ID shows the "Project Not Found" state.

2. Isolation & Degraded Browsing Modes
[ ] With COI enabled: Execution runs normally.
[ ] With COI artificially disabled (e.g. block coi-serviceworker.js):
    - A degraded mode notice banner appears.
    - Gallery and project source code remain accessible.
    - Run controls are entirely disabled.
    - The page does not crash or show a blank screen.

3. Execution Rules & Validation Recovery
[ ] Project with `cannot-run` compatibility (e.g. 3_turtle_test.py) has Run disabled.
[ ] Create a syntax error locally. Verify the dev banner appears.
[ ] Fix the syntax error. Verify the dev banner disappears and execution resumes.
[ ] Temporary edits trigger a warning notice.
[ ] Navigating away with unsaved temporary edits prompts a confirmation dialog.
[ ] Restoring original code discards edits and removes dirty state.

4. Terminal Output
[ ] Terminal accurately limits massive output (e.g. a while True loop) to the configured line limit.
[ ] Terminal correctly displays the truncation warning injected in the presentation layer.

5. Accessibility & UX
[ ] Keyboard-only navigation works across the gallery and run controls.
[ ] Input dialog (Python input) automatically focuses when appearing.
[ ] Focus correctly restores to the previous element (Run button) when input is submitted.
[ ] Toggle OS Reduced Motion. Verify animations/transitions stop.

When finished, run this script with --restore to return the original project files.
========================================================================
"""

def backup_and_stage():
    print("Backing up existing projects...")
    if BACKUP_DIR.exists():
        shutil.rmtree(BACKUP_DIR)
    
    if PROJECTS_DIR.exists():
        shutil.copytree(PROJECTS_DIR, BACKUP_DIR)
        shutil.rmtree(PROJECTS_DIR)
        
    print("Staging fixtures...")
    PROJECTS_DIR.mkdir()
    
    if FIXTURES_DIR.exists():
        shutil.copytree(FIXTURES_DIR, PROJECTS_DIR, dirs_exist_ok=True)
    else:
        print("Warning: tests/fixtures does not exist. Created empty projects directory.")

    print("\nStaging complete. Run `npm run build` and `npm run preview` to test.")
    print(CHECKLIST)

def restore():
    print("Restoring original projects...")
    if not BACKUP_DIR.exists():
        print("Error: Backup directory not found. Cannot restore.")
        sys.exit(1)
        
    if PROJECTS_DIR.exists():
        shutil.rmtree(PROJECTS_DIR)
        
    shutil.copytree(BACKUP_DIR, PROJECTS_DIR)
    shutil.rmtree(BACKUP_DIR)
    print("Restore complete.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--restore":
        restore()
    else:
        backup_and_stage()
