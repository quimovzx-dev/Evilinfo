import json
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/collect', methods=['POST'])
def collect():
    try:
        data = request.json
        # Forward to Formspree
        import requests
        r = requests.post(
            "https://formspree.io/f/xvkpyzqg",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        return jsonify({"status": "ok"}), 200
    except:
        return jsonify({"status": "failed"}), 500

def handler(event, context):
    body = event.get("body", "{}")
    if event.get("httpMethod") == "POST":
        from flask import Flask, request
        app.config['DEBUG'] = False
        with app.test_request_context('/api/collect', method='POST', json=json.loads(body)):
            return collect()
    return {
        "statusCode": 405,
        "body": json.dumps({"error": "Method not allowed"})
    }
