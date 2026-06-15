#!/usr/bin/env python3
"""Local dev server for the Ник Меньшов landing site.

Plain `python3 -m http.server` is wrong for previewing the mixes:
  * it serves .m4a as `audio/mp4a-latm` (Chromium may refuse to play it), and
  * it does not honour Range requests, so seeking in the player is impossible.

This server fixes both (correct `audio/mp4` MIME + Range 206), matching how
GitHub Pages serves the files in production. NOT deployed (lives outside site/).

Usage:  python3 tools/devserver.py [port]   (default 8262)
"""
import http.server
import os
import re
import socketserver
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8262


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def guess_type(self, path):
        p = str(path)
        if p.endswith(".m4a"):
            return "audio/mp4"
        if p.endswith(".vtt"):
            return "text/vtt"
        return super().guess_type(path)

    def end_headers(self):
        # dev: never cache, so a reload always reflects the latest edits
        self.send_header("Cache-Control", "no-store, must-revalidate")
        if not self.headers.get("Range"):
            self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def do_GET(self):
        path = self.translate_path(self.path)
        rng = self.headers.get("Range")
        if rng and os.path.isfile(path):
            size = os.path.getsize(path)
            m = re.match(r"bytes=(\d+)-(\d*)", rng)
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else size - 1
            end = min(end, size - 1)
            length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(length))
            self.end_headers()
            with open(path, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(65536, remaining))
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                    except (BrokenPipeError, ConnectionResetError):
                        return
                    remaining -= len(chunk)
            return
        return super().do_GET()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
        print(f"Serving {os.path.realpath(ROOT)} at http://localhost:{PORT}  (correct .m4a MIME + Range)")
        httpd.serve_forever()
