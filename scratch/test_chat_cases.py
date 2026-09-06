import socket
import json
import urllib.request
import subprocess
import time
import struct
import sys

def create_ws_frame(msg):
    data = msg.encode('utf-8')
    length = len(data)
    frame = bytearray([0x81])
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
    if not b1: return None
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
        for i in range(payload_len): payload[i] ^= mask[i % 4]
        return bytes(payload).decode('utf-8', errors='ignore')
    else:
        data = b''
        while len(data) < payload_len:
            chunk = s.recv(payload_len - len(data))
            if not chunk: break
            data += chunk
        return data.decode('utf-8', errors='ignore')

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    cmd = [
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new',
        '--remote-debugging-port=9229',
        '--disable-gpu',
        '--user-data-dir=C:/temp/cdp-test-chat-cases',
        'http://localhost:5000'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    try:
        tabs = json.loads(urllib.request.urlopen('http://localhost:9229/json').read().decode('utf-8'))
        page_tab = [t for t in tabs if 'Rent Studs' in t.get('title', '')][0]
        path = page_tab['webSocketDebuggerUrl'].split('localhost:9229')[1]

        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('localhost', 9229))
        handshake = (
            f'GET {path} HTTP/1.1\r\n'
            f'Host: localhost:9229\r\n'
            f'Upgrade: websocket\r\n'
            f'Connection: Upgrade\r\n'
            f'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n'
            f'Sec-WebSocket-Version: 13\r\n\r\n'
        )
        s.sendall(handshake.encode('utf-8'))
        s.recv(1024)

        s.sendall(create_ws_frame(json.dumps({"id": 1, "method": "Runtime.enable"})))
        time.sleep(0.5)

        def eval_js(expr, req_id):
            s.sendall(create_ws_frame(json.dumps({
                'id': req_id,
                'method': 'Runtime.evaluate',
                'params': {'expression': expr, 'returnByValue': True}
            })))
            s.settimeout(3.0)
            start = time.time()
            while time.time() - start < 4:
                try:
                    frame = read_ws_frame(s)
                    if frame:
                        data = json.loads(frame)
                        if data.get('id') == req_id:
                            res = data.get('result', {})
                            if 'exceptionDetails' in res:
                                return 'EXCEPTION: ' + str(res['exceptionDetails'])
                            return res.get('result', {}).get('value')
                except socket.timeout:
                    break
            return 'TIMEOUT'

        print("--- TEST CASE A: Demo Login as Student and open listing then chat ---")
        eval_js("window.rentStuds.demoLogin('student')", 10)
        time.sleep(0.5)

        # Open listing
        first_listing_id = eval_js("window.rentStuds ? (document.querySelector('.listing-card')?.dataset?.id || 'mits-seed-1') : 'none'", 11)
        print("First listing ID:", first_listing_id)
        eval_js(f"window.rentStuds.openStudent('{first_listing_id}')", 12)
        time.sleep(0.5)

        # Now click Chat With Provider
        print("Click Chat With Provider:")
        eval_js(f"window.rentStuds.startChat('{first_listing_id}')", 13)
        time.sleep(0.5)

        # Check chat UI state
        page_html = eval_js("document.getElementById('app').innerHTML", 14)
        print("Chat page in DOM?", "chat-layout" in str(page_html))
        print("Messages container in DOM?", 'id="messages"' in str(page_html))
        print("Input in DOM?", 'id="chat-input"' in str(page_html))

        # Check messages rendered
        msgs = eval_js("document.getElementById('messages')?.innerText", 15)
        print("Rendered messages in chat:", repr(msgs))

        # Send a message
        print("Sending message 'Is food included?'...")
        eval_js("document.getElementById('chat-input').value = 'Is food included?'; window.rentStuds.sendMessage(document.querySelector('.chat-item.active')?.dataset?.id);", 16)
        time.sleep(0.5)
        print("Messages after sending:", repr(eval_js("document.getElementById('messages')?.innerText", 17)))

        # Wait for auto-reply
        time.sleep(1.5)
        print("Messages after auto reply:", repr(eval_js("document.getElementById('messages')?.innerText", 18)))

        print("\n--- TEST CASE B: Direct Bottom Nav Chat ---")
        eval_js("window.rentStuds.go('studentHome')", 20)
        time.sleep(0.5)
        eval_js("window.rentStuds.go('chat')", 21)
        time.sleep(0.5)
        print("Chat page from nav active item:", eval_js("document.querySelector('.chat-item.active strong')?.innerText", 22))
        print("Chat messages from nav:", repr(eval_js("document.getElementById('messages')?.innerText", 23)))

        print("\n--- TEST CASE C: Owner Perspective ---")
        eval_js("window.rentStuds.demoLogin('owner')", 30)
        time.sleep(0.5)
        print("Owner home title:", eval_js("document.querySelector('h1')?.innerText", 31))
        eval_js("window.rentStuds.go('chat')", 32)
        time.sleep(0.5)
        print("Owner chat list count:", eval_js("document.querySelectorAll('.chat-item').length", 33))
        print("Owner chat messages:", repr(eval_js("document.getElementById('messages')?.innerText", 34)))

    finally:
        proc.kill()

if __name__ == '__main__':
    main()
