#!/usr/bin/env python3
import subprocess
import signal
import sys
import os
import time

# List to keep track of running processes
processes = []

def signal_handler(sig, frame):
    print("\nReceived termination signal. Shutting down services...")
    
    # Terminate all started processes
    for p in processes:
        if p.poll() is None:  # If process is still running
            print(f"Terminating process {p.pid}...")
            p.terminate()
    
    # Wait for them to exit
    for p in processes:
        p.wait()
        
    print("Shutdown complete.")
    sys.exit(0)

def run():
    # Register signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    base_dir = os.getcwd()
    
    # 1. Start Backend
    backend_dir = os.path.join(base_dir, "backend")
    venv_python = os.path.join(backend_dir, "venv", "bin", "python")
    
    print(f"Starting Backend in {backend_dir}...")
    backend_cmd = [venv_python, "-m", "uvicorn", "app.main:app", "--reload"]
    
    try:
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=backend_dir,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        processes.append(backend_proc)
    except FileNotFoundError:
        print("Error: Could not find backend virtual environment or python executable.")
        print(f"Expected at: {venv_python}")
        sys.exit(1)

    # 2. Start Frontend
    frontend_dir = os.path.join(base_dir, "frontend")
    print(f"Starting Frontend in {frontend_dir}...")
    
    frontend_cmd = ["npm", "run", "dev"]
    
    try:
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=frontend_dir,
            stdout=sys.stdout,
            stderr=sys.stderr
        )
        processes.append(frontend_proc)
    except FileNotFoundError:
        print("Error: Could not find 'npm'. Ensure nodejs/npm is installed.")
        sys.exit(1)

    print("Services are running. Press Ctrl+C to stop.")
    
    # Monitor processes
    try:
        while True:
            # Check if any process has exited unexpectedly
            for p in processes:
                if p.poll() is not None:
                    print(f"Process {p.pid} exited unexpectedly with code {p.returncode}.")
                    # Cancel the other process and exit
                    signal_handler(signal.SIGINT, None)
            time.sleep(1)
            
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    run()
