// src/features/auth/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@react-native-google-signin/google-signin';
import { DeviceDataType, deviceType, FetchedDataType, serverLoginInputType, locationSavedType, appDimensionType,  Region, MAP_TYPE, oauth_config, Record } from '../constants/types';
import { getSeoulDate } from '../utils/utilfuncs';

interface AuthState {
  user: User | null;
  // user: User;
  activeTab: string;
  mapType: number;
  fetchedWData: DeviceDataType[];
  isWifiModalVisible: boolean;
  isMapSettingsModalVisible: boolean;
  loading: boolean;
  defaultMapZoomLevel: number;
  wifiOn: boolean;
  cellularOn: boolean;
  appDimension: appDimensionType;
  locationSaved: locationSavedType;
  seeAllDevices: boolean;
  seeDistanceLines: boolean;
  serverLoginInput: serverLoginInputType;
  records: Record[];
  startDate: string;
  endDate: string
}

const initialState: AuthState = {
  // user : {
  //   user: {
  //     id: 'fXPdoIp6FpdQbCXlITK2C1gBiQz2',
  //     name: 'RCN',
  //     email: 'rcnappdev@gmail.com',
  //     photo: 'photoURL',
  //     familyName: 'RCN',
  //     givenName: 'RCN'
  //   },
  //   scopes: ['1','2'],
  //   idToken: 'idtoken',
  //   serverAuthCode: 'serverAuthCode'
  // },
  user: null,
  activeTab: 'Map',
  mapType: 0,
  fetchedWData: [],
  isWifiModalVisible: false,
  isMapSettingsModalVisible: false,
  loading: false,
  defaultMapZoomLevel: 13,
  wifiOn: false,
  cellularOn: false,
  appDimension: {
    appWidth: 0,
    appHeight: 0,
    componentHeight: 0,
    tabHeight: 65
  },
  locationSaved: {
    latitude: 37.3588,
    longitude: 127.1047,
    mapZoomLevel: 13
  },
  seeAllDevices: false,
  seeDistanceLines: false,
  serverLoginInput: {
    ip: '192.168.0.1',
    port: 12345,
    password: '123'
  },
  records: [],
  startDate: getSeoulDate().toISOString(),
  endDate: getSeoulDate().toISOString()
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {  // sync
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setMapType: (state, action: PayloadAction<number>) => {
      state.mapType = action.payload;
    },
    setFetchedWData: (state, action: PayloadAction<DeviceDataType[]>) => {
      state.fetchedWData = action.payload;
    },
    setWifiModalVisible: (state, action: PayloadAction<boolean>) => {
      state.isWifiModalVisible = action.payload;
    },
    setMapSettingsModalVisible: (state, action: PayloadAction<boolean>) => {
      state.isMapSettingsModalVisible = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setDefaultMapZoomLevel: (state, action: PayloadAction<number>) => {
      state.defaultMapZoomLevel = action.payload;
    },
    setWifiOn: (state, action: PayloadAction<boolean>) => {
      state.wifiOn = action.payload;
    },
    setCellularOn: (state, action: PayloadAction<boolean>) => {
      state.cellularOn = action.payload;
    },
    setAppDimension: (state, action: PayloadAction<appDimensionType>) => {
      state.appDimension = action.payload;
    },
    setLocationSaved: (state, action: PayloadAction<locationSavedType>) => {
      state.locationSaved = action.payload;
    },
    setSeeAllDevices: (state, action: PayloadAction<boolean>) => {
      state.seeAllDevices = action.payload;
    },
    setSeeDistanceLines: (state, action: PayloadAction<boolean>) => {
      state.seeDistanceLines = action.payload;
    },
    setServerLoginInput: (state, action: PayloadAction<serverLoginInputType>) => {
      state.serverLoginInput = action.payload;
    },
    setRecords: (state, action: PayloadAction<Record[]>) => {
      state.records = action.payload;
    },
    setStartDate: (state, action: PayloadAction<string>) => {
      state.startDate = action.payload;
    },
    setEndDate: (state, action: PayloadAction<string>) => {
      state.endDate = action.payload;
    },
  },
  // 아래 부분은 다른 파일에서 구현
//   extraReducers: (builder) => { // async
//     builder
//       .addCase(signIn.fulfilled, (state, action) => {
//         state.user = action.payload; // Set user on sign-in
//       })
//       .addCase(signOut.fulfilled, (state) => {
//         state.user = null; // Clear user on sign-out
//       })
//       // Handle pending and rejected states if necessary
//       .addCase(signIn.rejected, (state, action) => {
//         // Handle error
//       })
//       .addCase(signOut.rejected, (state, action) => {
//         // Handle error
//       });
//   }
});

export const {
  setUser, setActiveTab, setMapType, setFetchedWData,
  setWifiModalVisible, setMapSettingsModalVisible, setLoading, setDefaultMapZoomLevel,
  setWifiOn, setCellularOn, setAppDimension, setLocationSaved, setSeeAllDevices,
  setSeeDistanceLines, setServerLoginInput, setRecords, setStartDate, setEndDate
} = authSlice.actions;

export default authSlice.reducer;


  