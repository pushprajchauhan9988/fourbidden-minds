import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import time

PORT = 5000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class DualStackServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Cache control for fresh assets in development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js') or path.endswith('.mjs'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[{time.strftime('%H:%M:%S')}] {args[0]} {args[1]}\n")

def find_available_port(start_port=5000):
    port = start_port
    while port < start_port + 100:
        try:
            with socketserver.TCPServer(("127.0.0.1", port), None) as s:
                return port
        except OSError:
            port += 1
    return start_port

def run_server():
    port = find_available_port(PORT)
    url = f"http://localhost:{port}"

    server_address = ("127.0.0.1", port)
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(server_address, DualStackServer) as httpd:
        print("=" * 60)
        print("  RENT STUDS - Local Development Server")
        print("=" * 60)
        print(f"  Server started at: {url}")
        print(f"  Serving files from: {DIRECTORY}")
        print("  Opening browser automatically...")
        print("  Press Ctrl+C to stop the server.")
        print("=" * 60)

        # Open default browser after 1 second
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
