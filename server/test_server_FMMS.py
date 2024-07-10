from sanic import Sanic
from sanic.response import json

app = Sanic("SimpleServer")

@app.route("/", methods=["POST"])
async def receive_data(request):
    data = request.json
    print(f"Received data: {data}")
    return json({"status": "success", "received_data": data})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7777)

# at+LRW 31 aa316808186dec20feff1d5788ad06697e486b80104300f01ab6248c62c7fe uncnf 1
