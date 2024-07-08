// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import deviceReducer from './deviceSlice';
import authReducer from './stateSlice'

export const store = configureStore({
  reducer: {
    device: deviceReducer,
    auth: authReducer,
  },
});

// RootState Ÿ���� �����մϴ�.
export type RootState = ReturnType<typeof store.getState>;

// �߰�������, ������� ����ġ Ÿ���� �����Ͽ� ����� �� �ֽ��ϴ�.
export type AppDispatch = typeof store.dispatch;