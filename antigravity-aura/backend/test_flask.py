from flask import Flask
import sys

print("Python version:", sys.version)
print("Flask test starting...")

app = Flask(__name__)

@app.route('/')
def home():
    return "Flask is working!"

if __name__ == '__main__':
    print("About to start Flask...")
    app.run(host='127.0.0.1', port=5001, debug=False)
    print("Flask stopped")
