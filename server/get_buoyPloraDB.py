from datetime import datetime
from sanic import Sanic, response
import aiomysql
import json

# Sanic 앱 생성
app = Sanic("BUOY_PLORA_API")

# 데이터베이스 연결 설정
db_config = {
    "host": "14.50.159.2",
    "user": "rcn",
    "password": "rcn01!0301",
    "db": "BUOY_PLORA",
    "charset": 'utf8mb4',
}

# 비동기 데이터베이스 연결 함수
async def get_db_connection():
    conn = await aiomysql.connect(**db_config)
    return conn

# /get_user_devices 경로에 대한 GET 요청 처리
@app.route("/get_user_devices", methods=["GET"])
async def handle_get_user_devices(request):
    owner_uid = request.args.get("owner_uid", default="")

    # 데이터베이스 연결
    conn = await get_db_connection()
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        # owner_uid에 해당하는 모든 dev_eui를 조회
        sql = """
        SELECT dev_eui FROM device_owner 
        WHERE owner_uid = %s;
        """
        await cursor.execute(sql, (owner_uid,))
        devices = await cursor.fetchall()

    conn.close()

    return response.json(devices)

# /get_device_data 경로에 대한 GET 요청 처리
@app.route("/get_device_data", methods=["GET"])
async def handle_get_device_data(request):
    # 쿼리 파라미터 추출
    owner_uid = request.args.get("owner_uid", default="")
    device_eui = request.args.get("device_eui", default="")
    start_datetime = request.args.get("start_datetime", default="")
    end_datetime = request.args.get("end_datetime", default="")

    # 날짜 형식 확인 및 변환
    try:
        start_datetime = datetime.fromisoformat(start_datetime.replace("Z", "+00:00"))
        end_datetime = datetime.fromisoformat(end_datetime.replace("Z", "+00:00"))
    except ValueError:
        return response.json({"error": "Invalid datetime format. Use ISO 8601 format."}, status=400)

    # 데이터베이스 연결
    conn = await get_db_connection()
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        # owner_uid에 해당하는 device_eui가 있는지 확인
        sql = """
        SELECT dev_eui FROM device_owner 
        WHERE owner_uid = %s AND dev_eui = %s;
        """
        await cursor.execute(sql, (owner_uid, device_eui))
        dev_eui_record = await cursor.fetchone()

        if not dev_eui_record:
            print("error: Device not found for the given owner_uid.")
            return response.json({"error": "Device not found for the given owner_uid."}, status=404)
        
        # uplink_data 테이블에서 dev_eui에 해당하는 기록 중 지정된 날짜 시간 범위 사이의 parsed_string을 조회
        sql = """
        SELECT parsed_string, created_at, dev_eui FROM uplink_data 
        WHERE dev_eui = %s AND created_at BETWEEN %s AND %s
        ORDER BY created_at DESC;
        """
        await cursor.execute(sql, (device_eui, start_datetime.strftime('%Y-%m-%d %H:%M:%S'), end_datetime.strftime('%Y-%m-%d %H:%M:%S')))
        records = await cursor.fetchall()

    conn.close()

    # parsed_string을 JSON으로 변환
    for record in records:
        record['parsed_string'] = json.loads(record['parsed_string'])
        record['created_at'] = record['created_at'].isoformat()

    return response.json(records)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9987)
