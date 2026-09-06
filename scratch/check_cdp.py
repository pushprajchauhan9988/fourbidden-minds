import socket
import json
import urllib.request
import subprocess
import time
import struct
import os

def create_ws_frame(msg):
    data = msg.encode('utf-8')
    length = len(data)
    # Masked frame for client-to-server
    frame = bytearray([0x81]) # fin + text
    mask = [0x12, 0x34, 0x56, 0x78]
    if length <= 125:
        frame.append(0x80 | length)
    elif length <= 65535:
        frame.append(0x80 | 126)
        frame.extend(struct.pack('>H', length))
    else:
        frame.append(0x80 | 127)
        frame.extend(struct.pack('>Q', length))
    frame.extend(mask)
    for i in range(length):
        frame.append(data[i] ^ mask[i % 4])
    return bytes(frame)

def read_ws_frame(s):
    b1 = s.recv(1)
    if not b1:
        return None
    b2 = s.recv(1)
    masked = bool(b2[0] & 0x80)
    payload_len = b2[0] & 0x7F
    if payload_len == 126:
        payload_len = struct.unpack('>H', s.recv(2))[0]
    elif payload_len == 127:
        payload_len = struct.unpack('>Q', s.recv(8))[0]
    if masked:
        mask = s.recv(4)
        payload = bytearray(s.recv(payload_len))
        for i in range(payload_len):
            payload[i] ^= mask[i % 4]
        return bytes(payload).decode('utf-8', errors='ignore')
    else:
        data = b''
        while len(data) < payload_len:
            chunk = s.recv(payload_len - len(data))
            if not chunk: break
            data += chunk
        return data.decode('utf-8', errors='ignore')

def main():
    cmd = [
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new',
        '--remote-debugging-port=9224',
        '--disable-gpu',
        '--user-data-dir=C:/temp/cdp-test-2',
        'http://localhost:5000'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    try:
        tabs = json.loads(urllib.request.urlopen('http://localhost:9224/json').read().decode('utf-8'))
        page_tab = [t for t in tabs if 'Rent Studs' in t.get('title', '')][0]
        ws_url = page_tab['webSocketDebuggerUrl']
        # ws://localhost:9224/devtools/page/...
        path = ws_url.split('localhost:9224')[1]

        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('localhost', 9224))
        handshake = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: localhost:9224\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        s.sendall(handshake.encode('utf-8'))
        resp = s.recv(1024).decode('utf-8', errors='ignore')
        if "101" not in resp:
            print("Handshake failed:", resp)
            return

        # Enable Console and Runtime
        s.sendall(create_ws_frame(json.dumps({"id": 1, "method": "Console.enable"})))
        s.sendall(create_ws_frame(json.dumps({"id": 2, "method": "Runtime.enable"})))
        s.sendall(create_ws_frame(json.dumps({"id": 3, "method": "Page.enable"})))

        # Evaluate window.rentStuds
        s.sendall(create_ws_frame(json.dumps({
            "id": 4,
            "method": "Runtime.evaluate",
            "params": {"expression": "typeof window.rentStuds"}
        })))

        # Evaluate document.getElementById('app').innerHTML
        s.sendall(create_ws_frame(json.dumps({
            "id": 5,
            "method": "Runtime.evaluate",
            "params": {"expression": "document.getElementById('app').innerHTML.substring(0, 300)"}
        })))

        start = time.time()
        s.settimeout(3.0)
        while time.time() - start < 5:
            try:
                frame = read_ws_frame(s)
                if frame:
                    data = json.loads(frame)
                    if "Runtime.consoleAPICalled" in frame or "Runtime.exceptionThrown" in frame:
                        print("CONSOLE/EXCEPTION:", frame)
                    elif data.get("id") in [4, 5]:
                        val = data.get("result", {}).get("result", {}).get("value")
                        print(f"EVAL RESULT {data.get('id')} : {repr(val)[:200]}")
            except socket.timeout:
                break
    finally:
        proc.kill()

if __name__ == '__main__':
    main()
