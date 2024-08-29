import json
import asyncio
import aiomysql
from datetime import datetime
from paho.mqtt.client import Client
import socket

# MariaDB 설정
DB_HOST = '14.50.159.2'
DB_PORT = 3306
DB_USER = 'rcn'
DB_PASSWORD = 'rcn01!0301'
DB_NAME = 'BUOY_PLORA'

# MQTT 설정
MQTT_BROKER = 'au1.cloud.thethings.network'
MQTT_PORT = 1883
MQTT_TOPIC = 'v3/rcnapp11@ttn/devices/+/up'

# rcndev 계정
MQTT_USER = 'rcnapp11@ttn'
MQTT_PASSWORD = 'NNSXS.KKSXXD5PR2TX7ZBHO7GRUGNHJC3JDFPEUQKSGTQ.ZVY6MASYDO7G46X44AZRH24CSVDG73X4FPEPBEPDSLNYO4VR7FFQ'

# 다른 서버의 MQTT 설정 (Publish 전용)
OTHER_MQTT_BROKER = '14.50.159.2'
OTHER_MQTT_PORT = 1883
# OTHER_MQTT_USER = 'other_user'
# OTHER_MQTT_PASSWORD = 'other_password'

# 대상 socket IP와 포트 설정
TARGET_IP = '115.71.11.205'
TARGET_PORT = 9988

device_data = {}

async def init_db():
    global db_pool
    db_pool = await aiomysql.create_pool(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME,
        autocommit=True
    )
    print("Database pool created")

async def get_owner_uid(dev_eui):
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            sql = "SELECT owner_uid FROM device_owner WHERE dev_eui = %s"
            await cur.execute(sql, (dev_eui,))
            result = await cur.fetchone()
            return result[0] if result else None

async def save_to_db(data):
    async with db_pool.acquire() as conn:
        async with conn.cursor() as cur:
            sql = """
            INSERT INTO uplink_data (received_at, frequency, hexString, dev_eui, dev_addr, application_id, parsed_string)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            try:
                await cur.execute(sql, (data['received_at'], data['frequency'], data['hexString'], data['dev_eui'], data['dev_addr'], data['application_id'], json.dumps(data['parsed_string'])))
            except Exception as e:
                print(f"Error executing query: {e}")

def hex_to_binary(hex_str,bit_length):
    """Convert hex string to binary string."""
    return str(bin(int(hex_str, 16))[2:].zfill(bit_length)) if bit_length else str(bin(int(hex_str, 16))[2:])

def binary_to_int(binary_str):
    return str(int(binary_str, 2))

def hex_to_decimal(hex_str):
    original_length = len(hex_str)
    decimal_number = str(int(hex_str, 16))
    decimal_length = len(decimal_number)
    if decimal_length < original_length:
        decimal_number = decimal_number.zfill(original_length)
    return decimal_number

def convert_lat(number_str):
    """
    8자리 숫자 문자열을 받아, ab를 정수 자리로, 
    cd.efgh를 소수로 변환하여 새로운 문자열로 된 숫자를 반환합니다.
    """
    if len(number_str) != 8 or not number_str.isdigit():
        raise ValueError("입력은 8자리 숫자 문자열이어야 합니다.")
    
    # ab를 정수 부분으로 추출
    integer_part = number_str[:2]
    
    # cd.efgh를 소수 부분으로 변환
    decimal_str = number_str[2:]
    decimal_part = int(decimal_str[:2]) + int(decimal_str[2:]) / 10000  # cd.efgh 형식으로 만듦
    decimal_part = decimal_part / 60  # 소수 부분을 60으로 나눔
    
    # 소수 부분을 문자열로 변환하고, "0."을 제거하여 결과 생성
    decimal_part_str = f"{decimal_part:.8f}".split('.')[1]
    
    # 최종 GPS 좌표 문자열 생성
    result = f"{integer_part}.{decimal_part_str}"
    
    return result

def convert_long(number_str):
    """
    9자리 숫자 문자열을 받아, abc를 정수 자리로,
    de.fghi를 소수로 변환하여 새로운 문자열로 된 숫자를 반환합니다.
    """
    if len(number_str) != 9 or not number_str.isdigit():
        raise ValueError("입력은 9자리 숫자 문자열이어야 합니다.")
    
    # abc를 정수 부분으로 추출
    integer_part = number_str[:3]
    
    # de.fghi를 소수 부분으로 변환
    decimal_de = int(number_str[3:5])
    decimal_fghi = int(number_str[5:]) / 10000  # fghi 부분을 소수로 변환
    decimal_part = (decimal_de + decimal_fghi) / 60  # 소수 부분을 60으로 나눔
    
    # 소수 부분을 문자열로 변환하고, "0."을 제거하여 결과 생성
    decimal_part_str = f"{decimal_part:.8f}".split('.')[1]
    
    # 최종 GPS 좌표 문자열 생성
    result = f"{integer_part}.{decimal_part_str}"
    
    return result

def insert_dot_at_second_position(s):
    return s[:-6] + '.' + s[-6:]

def parse_hexstring(hexstring):
    data = {}
    data['DATA_LENGTH'] = len(hexstring)
    data['SOF'] = hexstring[0:2]
    # data['MSG_ID'] = hexstring[2:4]
    data['MSG_ID'] = 82
    data['Sequence'] = hexstring[6:8] + hexstring[4:6]
    data['PAYLOAD_LENGTH'] = hexstring[8:10]
    data['BUOY_ID'] = hexstring[24:26] + hexstring[22:24] + hexstring[20:22] + hexstring[18:20] + hexstring[16:18] + hexstring[14:16] + hexstring[12:14] + hexstring[10:12]
    data['BUOY_STATUS_HEX'] = hexstring[28:30] + hexstring[26:28]
    data['BUOY_STATUS_BINARY'] = hex_to_binary(hexstring[28:30],8)  + hex_to_binary(hexstring[26:28], 8)
    data['WIRELESS_STATUS'] = data['BUOY_STATUS_BINARY'][0:1]
    data['MAIN_MODULE_STATUS'] = data['BUOY_STATUS_BINARY'][1:2]
    data['PLORA_MODULE_STATUS'] = data['BUOY_STATUS_BINARY'][2:3]
    data['GNSS_STATUS1'] = data['BUOY_STATUS_BINARY'][3:4]
    data['POWER'] = binary_to_int(data['BUOY_STATUS_BINARY'][4:7])
    data['LORA_STATUS'] = binary_to_int(data['BUOY_STATUS_BINARY'][7:10])
    data['PLORA_STATUS'] = binary_to_int(data['BUOY_STATUS_BINARY'][10:13])
    data['FISHINGBOAT_GW_STATUS'] = binary_to_int(data['BUOY_STATUS_BINARY'][13:16])
    data['YEAR'] = hex_to_decimal(hexstring[32:34] + hexstring[30])
    data['MONTH'] = hex_to_decimal(hexstring[31])
    data['DHM'] = hex_to_binary(hexstring[36:38],8) + hex_to_binary(hexstring[34:36],8)
    data['DAY'] = binary_to_int(data['DHM'][0:5])
    data['HOUR'] = int(binary_to_int(data['DHM'][5:10])) + int(binary_to_int('1001'))
    data['MIN'] = binary_to_int(data['DHM'][10:16])
    data['SECOND'] = binary_to_int(hex_to_binary(hexstring[38:40],0)[0:6])
    data['GPS_STATUS'] = hex_to_binary(hexstring[40:42],8)
    data['GNSS_STATUS2'] = data['GPS_STATUS'][0]
    data['LATITUDE_CONDITION'] = data['GPS_STATUS'][1]
    data['LONGITUDE_CONDITION'] = data['GPS_STATUS'][2]
    data['GPS_MANUFACTURER'] = data['GPS_STATUS'][3:6]
    data['PRELIMINARY_VALUE'] = data['GPS_STATUS'][6:8]
    if hexstring[0:2] == '99':
        data['LATITUDE'] = insert_dot_at_second_position(str(int(hex_to_decimal(hexstring[48:50] + hexstring[46:48]))//2) + hex_to_decimal(hexstring[44:46] + hexstring[42:44]))
        data['LONGITUDE'] = insert_dot_at_second_position(str(int(hex_to_decimal(hexstring[56:58] + hexstring[54:56]))//2) + hex_to_decimal(hexstring[52:54] + hexstring[50:52]))
    else:
        data['LATITUDE'] = convert_lat(str(int(hex_to_decimal(hexstring[48:50] + hexstring[46:48]))//2) + hex_to_decimal(hexstring[44:46] + hexstring[42:44]))
        data['LONGITUDE'] = convert_long(str(int(hex_to_decimal(hexstring[56:58] + hexstring[54:56]))//2) + hex_to_decimal(hexstring[52:54] + hexstring[50:52]))
    return data

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT Broker")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        uplink_message = payload.get("uplink_message", {})
        received_at = uplink_message.get("received_at")
        # 'Z' 문자를 제거하고 밀리초 부분을 잘라내기
        received_at = received_at.split('.')[0]
        received_at = datetime.strptime(received_at, '%Y-%m-%dT%H:%M:%S').strftime('%Y-%m-%d %H:%M:%S')
        # 기존 hexString 값을 가져옵니다.
        hex_string = uplink_message.get("decoded_payload", {}).get("hexString", "")
        new_hex = hex_string  # hex_string이 너무 짧으면 그대로 사용
        # hexString의 [2:4] 부분을 '82'로 대체합니다.
        if len(hex_string) >= 4:
            new_hex = hex_string[:2] + '82' + hex_string[4:]
            
        data = {
            "received_at": received_at,
            "frequency": uplink_message.get("settings", {}).get("frequency"),
            "hexString": new_hex,
            "dev_eui": payload.get("end_device_ids", {}).get("dev_eui"),
            "dev_addr": payload.get("end_device_ids", {}).get("dev_addr"),
            "application_id": payload.get("end_device_ids", {}).get("application_ids", {}).get("application_id"),
            "parsed_string": parse_hexstring(uplink_message.get("decoded_payload", {}).get("hexString"))
        }
        asyncio.run_coroutine_threadsafe(save_to_db(data), loop)
        
        # device_data dict에 데이터 저장
        dev_eui = payload.get("end_device_ids", {}).get("dev_eui")
        asyncio.run_coroutine_threadsafe(update_device_data(dev_eui, data), loop)

    except Exception as e:
        print(f"Error processing message: {e}")

async def update_device_data(dev_eui, data):
    owner_uid = await get_owner_uid(dev_eui)
    if owner_uid:
        try:
            device_data[owner_uid] = data
            topic = f"v3/rcnapp1@ttn/devices/{owner_uid}/up"
            other_mqtt_client.publish(topic, json.dumps(data))
            # print('published')
            send_data(data["hexString"])
        except Exception as err:
            print(err)

def send_data(data):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            # 서버에 연결
            s.connect((TARGET_IP, TARGET_PORT))
            # 데이터를 바이너리로 인코딩 후 전송
            s.sendall(bytes.fromhex(data))
            # print(f"Fishingear Sent: {data}")
    except Exception as e:
        print(f"Failed to send data: {e}")

async def main():
    global loop
    loop = asyncio.get_event_loop()

    await init_db()

    mqtt_client = Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    
    # 다른 서버의 MQTT 클라이언트 설정
    global other_mqtt_client
    other_mqtt_client = Client()
    # other_mqtt_client.username_pw_set(OTHER_MQTT_USER, OTHER_MQTT_PASSWORD)
    other_mqtt_client.connect(OTHER_MQTT_BROKER, OTHER_MQTT_PORT, 60)
    other_mqtt_client.loop_start()

    mqtt_client.loop_start()

    # asyncio.create_task(publish_device_data())  # 주기적으로 데이터 전송

    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        mqtt_client.loop_stop()
        other_mqtt_client.loop_stop()
        db_pool.close()
        await db_pool.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
