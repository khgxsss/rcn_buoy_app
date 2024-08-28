## RAK2245 GW -> GC ##

import serial
import pynmea2
import datetime
import socket
import time
from collections import namedtuple

# GPS 데이터 구조체 정의
GPSData = namedtuple('GPSData', 'latitude longitude speed course utc_time lat_custom lon_custom')
sequence_num = 0

# 시리얼 포트 설정
port = "/dev/ttyAMA0"
ser = serial.Serial(port, baudrate=9600, timeout=1)

# 초기화된 GPS 데이터
latest_gps_data = None
last_print_time = time.time()  # 마지막 출력 시간을 기록

# 로그 파일 경로
log_file_path = "/home/tx_gpsdata.log"

def log_error(message):
    with open(log_file_path, "a") as log_file:
        log_file.write(f"{datetime.datetime.now()}: {message}\n")

def calculate_checksum(hex_string):
    checksum = sum(bytearray.fromhex(hex_string)) % 256
    return f'{checksum:02x}'

def reverse_bytes(hex_string):
    # 바이트 단위로 역순으로 바꿔줌
    return ''.join([hex_string[i:i+2] for i in range(0, len(hex_string), 2)][::-1])

def print_binary(val, bits):
    return format(val, f'0{bits}b')

def encode_speed_course(speed, course):
    # 소수점 자리수는 고정 값으로 설정 (예: 소수점 이하 3자리)
    decimal_places_speed = 3
    decimal_places_course = 2

    # 속도 및 방향 정보를 28비트로 변환
    speed_value = int(speed * (10 ** decimal_places_speed))
    course_value = int(course * (10 ** decimal_places_course))

    # 속도 및 방향을 각각 32비트로 구성
    speed_hex = f'{(decimal_places_speed << 28) | speed_value:08x}'
    course_hex = f'{(decimal_places_course << 28) | course_value:08x}'

    # 바이트 순서 반전
    speed_hex = reverse_bytes(speed_hex)
    course_hex = reverse_bytes(course_hex)

    return speed_hex, course_hex

def encode_gps_data(sequence_num, ship_id, date_time, latitude_msb, latitude_lsb, longitude_msb, longitude_lsb, speed, course, gps_status, lat_dir, lon_dir, decimal_places):
    # 시퀀스 번호는 2바이트 (4자리 hex)
    seq_num_hex = f'{sequence_num:04x}'
    seq_num_hex = reverse_bytes(seq_num_hex)  # 엔디안 변환

    # 선박 ID는 4바이트 (8자리 hex)
    ship_id_hex = f'{ship_id:08x}'
    ship_id_hex = reverse_bytes(ship_id_hex)  # 엔디안 변환

    # 시간 정보 인코딩
    year = date_time.year  # 12 bits (0-99)
    month = date_time.month       # 4 bits (1-12)
    day = date_time.day           # 5 bits (1-31)
    hour = date_time.hour         # 5 bits (0-23)
    minute = date_time.minute     # 6 bits (0-59)
    second = date_time.second     # 6 bits (0-59)
    
    # 비트 연산을 통해 각 필드를 합침
    time_info_1 = (year << 4) | month
    time_info_2 = (day << 11) | (hour << 6) | minute
    time_info_3 = second << 2

    time_info_hex_1 = f'{time_info_1:04x}'
    time_info_hex_2 = f'{time_info_2:04x}'
    time_info_hex_3 = f'{time_info_3:02x}'

    time_info_hex_1 = reverse_bytes(time_info_hex_1)
    time_info_hex_2 = reverse_bytes(time_info_hex_2)

    # GPS 상태 정보 인코딩 (8바이트)
    gps_status_byte = (gps_status << 7) | (lat_dir << 6) | (lon_dir << 5) | (decimal_places << 2)
    gps_status_hex = f'{gps_status_byte:02x}'

    # 위도와 경도를 32비트로 구성 (15비트 정수, 17비트 소수)
    lat_hex = f'{latitude_msb:015b}{latitude_lsb:017b}'
    lon_hex = f'{longitude_msb:015b}{longitude_lsb:017b}'

    # 32비트 이진수를 8자리 16진수로 변환
    lat_hex = f'{int(lat_hex, 2):08x}'
    lon_hex = f'{int(lon_hex, 2):08x}'

    lat_hex = reverse_bytes(lat_hex)
    lon_hex = reverse_bytes(lon_hex)

    # 속도 및 방향 인코딩 (4바이트씩)
    speed_hex, course_hex = encode_speed_course(speed, course)

    # 페이로드 생성
    payload_hex = (
        f'{ship_id_hex}{time_info_hex_1}{time_info_hex_2}{time_info_hex_3}'
        f'{gps_status_hex}{lat_hex}{lon_hex}{speed_hex}{course_hex}'
    )

    # 페이로드 길이 계산
    payload_length = len(payload_hex) // 2
    payload_length_hex = f'{payload_length:02x}'

    # Checksum 계산
    full_payload_hex = f'aa43{seq_num_hex}{payload_length_hex}{payload_hex}'
    checksum_hex = calculate_checksum(full_payload_hex)

    # 최종 패킷 생성
    packet_hex = f'{full_payload_hex}{checksum_hex}fe'

    return packet_hex

def decimal_to_lat_format(decimal_degree):
    degrees = int(decimal_degree)
    minutes_full = (decimal_degree - degrees) * 60
    minutes = int(minutes_full)
    seconds = (minutes_full - minutes) * 10 # 원래 * 60 해야하는데 GC쪽에 맞춰줬음
    # 위도: abcd.efgh 형식으로 변환 (소숫점 아래 4자리까지 반올림)
    lat_format_msb = int(f"{degrees:02d}{minutes:02d}")
    lat_format_lsb = int(f"{round(seconds * 1000):04d}")
    return lat_format_msb, lat_format_lsb

def decimal_to_lon_format(decimal_degree):
    degrees = int(decimal_degree)
    minutes_full = (decimal_degree - degrees) * 60
    minutes = int(minutes_full)
    seconds = (minutes_full - minutes) * 10 # 원래 * 60 해야하는데 GC쪽에 맞춰줬음
    # 경도: abcde.fghi 형식으로 변환 (소숫점 아래 4자리까지 반올림)
    lon_format_msb = int(f"{degrees:03d}{minutes:02d}")
    lon_format_lsb = int(f"{round(seconds * 1000):04d}")
    return lon_format_msb, lon_format_lsb

def parseGPS(data):
    global latest_gps_data
    if data[0:6] == '$GPRMC':
        
        try:
            msg = pynmea2.parse(data)
            lat = msg.latitude
            lon = msg.longitude
            speed = getattr(msg, 'spd_over_grnd', 0.0)
            course = getattr(msg, 'true_course', 0.0)
            utc_time = datetime.datetime.combine(msg.datestamp, msg.timestamp)
            
            # 위도와 경도를 abcd.efgh 및 abcde.fghi 형식으로 변환
            lat_custom = decimal_to_lat_format(lat)
            lon_custom = decimal_to_lon_format(lon)
            
            # 최신 GPS 데이터 업데이트
            latest_gps_data = GPSData(lat, lon, speed, course, utc_time, lat_custom, lon_custom)
        except pynmea2.ParseError as e:
            log_error(f"Could not parse GPS data: {e}")
        except AttributeError as e:
            log_error(f"Attribute error: {e}")

# 데이터를 전송하는 부분
def send_data(data):
    try:
        # 대상 IP와 포트 설정
        TARGET_IP = '115.71.11.205'  # 여기에 실제 IP 주소를 넣으세요.
        TARGET_PORT = 9988           # 여기에 실제 포트 번호를 넣으세요.
        # 소켓 생성
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            # 서버에 연결
            s.connect((TARGET_IP, TARGET_PORT))
            # 데이터를 바이너리로 인코딩 후 전송
            s.sendall(bytes.fromhex(data))
            log_error(f"Sent: {data}")
    except Exception as e:
        log_error(f"Failed to send data: {e}")

# GPS 데이터 수신 및 주기적 전송 루프
while True:
    try:
        data = ser.readline().decode('ascii', errors='replace')
        parseGPS(data)

        # 현재 시간
        current_time = time.time()

        # 10초마다 latest_gps_data 출력
        if current_time - last_print_time >= 10:
            if latest_gps_data.latitude:
                sequence_num = sequence_num+1
                ship_id = 901
                date_time = datetime.datetime.utcnow() + datetime.timedelta(hours=0)
                (latitude_msb,latitude_lsb) = latest_gps_data.lat_custom
                (longitude_msb, longitude_lsb) = latest_gps_data.lon_custom
                # print(latitude_msb,latitude_lsb,longitude_msb,longitude_lsb)
                speed = latest_gps_data.speed
                course = 0
                # course = 0 if latest_gps_data.course == None else latest_gps_data.course
                gps_status = 0
                lat_dir = 0 if latitude_msb>=0 else 1 # 북(N)
                lon_dir = 0 if longitude_msb>=0 else 1 # 동(E)
                decimal_places = 4  # 소수점 자리수(ascen)
                packet_hex = encode_gps_data(sequence_num, ship_id, date_time, latitude_msb, latitude_lsb, longitude_msb, longitude_lsb, speed, course, gps_status, lat_dir, lon_dir, decimal_places)
                # print(f"Latest GPS Data: {packet_hex}")
                send_data(packet_hex)
            last_print_time = current_time

    except KeyboardInterrupt:
        log_error("Exiting Program")
        break
    except Exception as e:
        log_error(f"Error: {e}")
        continue
