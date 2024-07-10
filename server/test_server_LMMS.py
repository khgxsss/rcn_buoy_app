from sanic import Sanic
from sanic.response import json

app = Sanic("SimpleServer")

@app.route("/", methods=["POST"])
async def receive_data(request):
    data = request.json
    print(f"Received data: {data}")
    return json({"status": "success", "received_data": data})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9988)
