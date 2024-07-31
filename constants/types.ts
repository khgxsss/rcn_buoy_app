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
    //지도의 콘텐츠 영역에 대한 좌표열을 반환합니다. 좌표열은 네 개의 좌표로 구성된 사각형으로 표현됩니다. 단, 반환되는 배열의 크기는 5이며, 첫 번째 원소와 마지막 원소가 동일한 지점을 가리킵니다. 콘텐츠 패딩이 모두 0이면 getCoveringRegion()과 동일한 사각형이, 콘텐츠 패딩이 지정되어 있으면 getCoveringRegion()에서 콘텐츠 패딩을 제외한 사각형이 반환됩니다.
    contentRegion: [Coord, Coord, Coord, Coord, Coord];
    // 콘텐츠 패딩을 포함한 지도의 뷰 전체 영역에 대한 좌표열을 반환합니다. 좌표열은 네 개의 좌표로 구성된 사각형으로 표현됩니다. 단, 반환되는 배열의 크기는 5이며, 첫 번째 원소와 마지막 원소가 동일한 지점을 가리킵니다.
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
    provider: 'google', // 'google' 또는 'facebook'
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