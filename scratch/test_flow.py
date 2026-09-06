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
        '--remote-debugging-port=9226',
        '--disable-gpu',
        '--user-data-dir=C:/temp/cdp-test-flow',
        'http://localhost:5000'
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)

    try:
        tabs = json.loads(urllib.request.urlopen('http://localhost:9226/json').read().decode('utf-8'))
        page_tab = [t for t in tabs if 'Rent Studs' in t.get('title', '')][0]
        path = page_tab['webSocketDebuggerUrl'].split('localhost:9226')[1]

        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('localhost', 9226))
        handshake = (
            f'GET {path} HTTP/1.1\r\n'
            f'Host: localhost:9226\r\n'
            f'Upgrade: websocket\r\n'
            f'Connection: Upgrade\r\n'
            f'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n'
            f'Sec-WebSocket-Version: 13\r\n\r\n'
        )
        s.sendall(handshake.encode('utf-8'))
        s.recv(1024)

        s.sendall(create_ws_frame(json.dumps({"id": 1, "method": "Runtime.enable"})))
        time.sleep(0.2)

        def eval_js(expr, req_id):
            s.sendall(create_ws_frame(json.dumps({
                'id': req_id,
                'method': 'Runtime.evaluate',
                'params': {'expression': expr, 'returnByValue': True}
            })))
            s.settimeout(2.0)
            start = time.time()
            while time.time() - start < 3:
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

        print("1. Navigate to student login:")
        print(eval_js("window.rentStuds.chooseRole('student')", 10))
        time.sleep(0.5)

        print("2. Login card text:")
        print(eval_js("document.querySelector('.login-card')?.innerText", 11))

        print("3. Click Demo as Student:")
        print(eval_js("window.rentStuds.demoLogin('student')", 12))
        time.sleep(0.5)

        print("4. Check main page after demo login:")
        print(eval_js("document.querySelector('main')?.className", 13))

        print("5. Try navigating to Chat:")
        print(eval_js("window.rentStuds.go('chat')", 14))
        time.sleep(0.5)

        print("6. Check chat container:")
        print(eval_js("document.querySelector('.chat-layout')?.innerHTML?.substring(0, 300)", 15))

        print("7. Try starting a chat on listing:")
        print(eval_js("window.rentStuds.startChat('sample-1')", 16))
        time.sleep(0.5)

        print("8. Check chat page after startChat:")
        print(eval_js("document.querySelector('.chat-messages')?.innerHTML", 17))
        print("Input exists?", eval_js("!!document.getElementById('chat-input')", 18))

        print("9. Try sending a message:")
        print(eval_js("document.getElementById('chat-input').value = 'Hello from student'; window.rentStuds.sendMessage(document.getElementById('chat-input').closest('.chat-window')?.dataset?.chatId || document.querySelector('.chat-item')?.dataset?.id);", 19))
        time.sleep(1.5)

        print("10. Messages in DOM:")
        print(eval_js("document.querySelector('.chat-messages')?.innerText", 20))

    finally:
        proc.kill()

if __name__ == '__main__':
    main()
