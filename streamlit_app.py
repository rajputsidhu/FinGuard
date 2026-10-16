import os
import sys

# Ensure repository root is on sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Run the FinGuard AI Streamlit entrypoint
import runpy
app_path = os.path.join(root_dir, "app", "06_app.py")
runpy.run_path(app_path, run_name="__main__")
