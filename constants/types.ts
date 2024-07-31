import { Coord } from 'react-native-nmap-fork1';

export interface serverLoginInputType {
    ip:string;
    port:number,
    password:string;
}
export interface appDimensionType {
    appWidth: number;
    appHeight: number;
    x?: number;
    y?: number;
    componentHeight:number;
    tabHeight:number;
}
export interface locationSavedType extends Coord  {
    mapZoomLevel: number;
}
export interface deviceType {
    userId: string;
    userName: string;
    regTime: string;
    device: string;
    deviceImg: string;
    online: boolean;
}
  
// export interface DeviceDataType {
//     buoy_id: string;
//     location: Coord;
//     time_generation: {
//         year: number,
//         month: number,
//         day: number,
//         hours: number,
//         minutes: number,
//         seconds: number,
//         time: number, //timestamp
//     };
//     status?: string;
// };

export interface DeviceDataType {
    received_at: string;
    frequency: string;
    hexString: string;
    dev_eui: string;
    dev_addr: string;
    application_id: string;
    parsed_string: {
        DATA_LENGTH: number;
        SOF: string;
        MSG_ID: string;
        Sequence: string;
        PAYLOAD_LENGTH: string;
        BUOY_ID: string;
        BUOY_STATUS_HEX: string;
        BUOY_STATUS_BINARY: string;
        WIRELESS_STATUS: string;
        MAIN_MODULE_STATUS: string;
        PLORA_MODULE_STATUS: string;
        GNSS_STATUS1: string;
        POWER: string;
        LORA_STATUS: string;
        PLORA_STATUS: string;
        FISHINGBOAT_GW_STATUS: string;
        YEAR: string;
        MONTH: string;
        DHM: string;
        DAY: string;
        HOUR: number;
        MIN: string;
        SECOND: string;
        GPS_STATUS: string;
        GNSS_STATUS2: string;
        LATITUDE_CONDITION: string;
        LONGITUDE_CONDITION: string;
        GPS_MANUFACTURER: string;
        PRELIMINARY_VALUE: string;
        LATITUDE: string;
        LONGITUDE: string;
    };
};

  
export interface FetchedDataType {
    shiplocation: Coord;
    device: DeviceDataType
}
  
export interface Region {
    latitude: number;
    longitude: number;
    zoom: number;
    //������ ������ ������ ���� ��ǥ���� ��ȯ�մϴ�. ��ǥ���� �� ���� ��ǥ�� ������ �簢������ ǥ���˴ϴ�. ��, ��ȯ�Ǵ� �迭�� ũ��� 5�̸�, ù ��° ���ҿ� ������ ���Ұ� ������ ������ ����ŵ�ϴ�. ������ �е��� ��� 0�̸� getCoveringRegion()�� ������ �簢����, ������ �е��� �����Ǿ� ������ getCoveringRegion()���� ������ �е��� ������ �簢���� ��ȯ�˴ϴ�.
    contentRegion: [Coord, Coord, Coord, Coord, Coord];
    // ������ �е��� ������ ������ �� ��ü ������ ���� ��ǥ���� ��ȯ�մϴ�. ��ǥ���� �� ���� ��ǥ�� ������ �簢������ ǥ���˴ϴ�. ��, ��ȯ�Ǵ� �迭�� ũ��� 5�̸�, ù ��° ���ҿ� ������ ���Ұ� ������ ������ ����ŵ�ϴ�.
    coveringRegion: [Coord, Coord, Coord, Coord, Coord]; 
}

export interface Record {
    created_at: string;
    parsed_string: {
      [key: string]: string;
    };
  }
  
export const MAP_TYPE = {
    BASIC: 0,
    TERRAIN: 4,
    SATELLITE: 2,
    HYBRID: 3,
    NAVI: 1
};

export const oauth_config = {
    provider: 'google', // 'google' �Ǵ� 'facebook'
};

export const default_user = {
    user: {
        id: '',
        name: null,
        email: '',
        photo: null,
        familyName: null,
        givenName: null
    },
    scopes: [],
    idToken: null,
    serverAuthCode: null
}