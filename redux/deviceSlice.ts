// src/deviceSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DeviceState {
  deviceData: { [macAddr: string]: any }; // �� macAddr���� �����͸� �����ϴ� ��ü
}

const initialState: DeviceState = {
  deviceData: {},
};

export const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDeviceData: (state, action: PayloadAction<{ macAddr: string; data: any }>) => {
      const { macAddr, data } = action.payload;
      // �� macAddr���� �����͸� ������Ʈ
      state.deviceData[macAddr] = data;
    },
  },
});

export const { setDeviceData } = deviceSlice.actions;

export default deviceSlice.reducer;
