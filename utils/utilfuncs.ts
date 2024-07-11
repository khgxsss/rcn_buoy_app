export const hexToRgb = (hex: string) => {
    // Remove the hash at the start if it's there
    hex = hex.charAt(0) === '#' ? hex.substring(1) : hex;

    // Parse r, g, b values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return { r, g, b };
};

// 사용 예시:
// const hexColor = "#3498db";
// const rgbColor = hexToRgb(hexColor);
// console.log(rgbColor);  // { r: 52, g: 152, b: 219 }

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

export const getSeoulDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const seoulTime = new Date(utc + (9 * 3600000));
    return seoulTime;
};

export const convertToSeoulTime = (utcDate) => {
    // UTC 시간 문자열을 Date 객체로 변환합니다.
    const date = new Date(utcDate);
  
    // 서울 시간대로 변환합니다. (UTC+9)
    const seoulTime = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  
    // 원하는 형식으로 변환합니다. 예: 'YYYY-MM-DD HH:mm:ss'
    const year = seoulTime.getFullYear();
    const month = String(seoulTime.getMonth() + 1).padStart(2, '0');
    const day = String(seoulTime.getDate()).padStart(2, '0');
    const hours = String(seoulTime.getHours()).padStart(2, '0');
    const minutes = String(seoulTime.getMinutes()).padStart(2, '0');
    const seconds = String(seoulTime.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

interface Options {
    body?: any;
    headers?: Record<string, string>;
}

const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
};

export const get = async (baseUrl: string, endpoint: string, headers: Record<string, string> = defaultHeaders): Promise<any> => {
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: headers,
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("GET Error:", error);
        throw error;
    }
};

export const post = async (baseUrl: string, endpoint: string, body: any, headers: Record<string, string> = defaultHeaders): Promise<any> => {
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("POST Error:", error);
        throw error;
    }
};

export const put = async (baseUrl: string, endpoint: string, body: any, headers: Record<string, string> = defaultHeaders): Promise<any> => {
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("PUT Error:", error);
        throw error;
    }
};

export const remove = async (baseUrl: string, endpoint: string, headers: Record<string, string> = defaultHeaders): Promise<any> => {
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: headers,
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("DELETE Error:", error);
        throw error;
    }
};
