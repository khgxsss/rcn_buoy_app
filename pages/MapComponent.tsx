import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button, View, Modal, TouchableOpacity, Text, StyleSheet, Alert, Linking, PermissionsAndroid } from 'react-native';
import NaverMapView, { Coord, Marker, NaverMapViewInstance, Polyline } from 'react-native-nmap-fork1';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import { Ionicons, MaterialCommunityIcons } from '../components/IconSets';
import ActionButton from 'react-native-action-button-fork1';
import IntentLauncher from 'react-native-intent-launcher-fork1';
import { useDispatch } from 'react-redux';
import { setLocationSaved, setMapSettingsModalVisible, setMapType } from '../redux/stateSlice';
import Theme from '../constants/Theme';
import { calculateDistance, convertToSeoulTime, hexToRgb } from '../utils/utilfuncs';
import MapSettingsModalComponent from '../components/mapSettingsModal';
import { DeviceDataType, Region } from '../constants/types';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { handleSignOut, setMapLocationSettingsFirebase } from '../firebase/functions';

const MapComponent = () => {
    const [lastTouchTime, setLastTouchTime] = useState<number | null>(null);
    const [region, setRegion] = useState<Region>({"contentRegion": [{"latitude": 36.43313265533338, "longitude": 127.40861266544789}, {"latitude": 36.44320541782096, "longitude": 127.40861266544789}, {"latitude": 36.44320541782096, "longitude": 127.41719573454998}, {"latitude": 36.43313265533338, "longitude": 127.41719573454998}, {"latitude": 36.43313265533338, "longitude": 127.40861266544789}], "coveringRegion": [{"latitude": 36.43313265533338, "longitude": 127.40861266544789}, {"latitude": 36.44320541782096, "longitude": 127.40861266544789}, {"latitude": 36.44320541782096, "longitude": 127.41719573454998}, {"latitude": 36.43313265533338, "longitude": 127.41719573454998}, {"latitude": 36.43313265533338, "longitude": 127.40861266544789}], "latitude": 36.43816920000003, "longitude": 127.41290420000009, "zoom": 16});
    const mapView = useRef<NaverMapViewInstance>(null);
    
    // 현재 표시되어야 하는 buoy_id를 저장하는 상태
    const [showDeviceId, setShowDeviceId] = useState<string | null>(null);
    const [showUpdateLocationButton, setShowUpdateLocationButton] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<DeviceDataType | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Redux
    const locationSaved = useSelector((state:RootState) => state.auth.locationSaved);
    const user = useSelector((state:RootState) => state.auth.user);
    const fetchedWData = useSelector((state:RootState) => state.auth.fetchedWData);
    const seeAllDevices = useSelector((state:RootState) => state.auth.seeAllDevices);
    const mapType = useSelector((state:RootState) => state.auth.mapType);
    const seeDistanceLines = useSelector((state:RootState) => state.auth.seeDistanceLines);
    const wifiOn = useSelector((state:RootState) => state.auth.wifiOn);
    const cellularOn = useSelector((state:RootState) => state.auth.cellularOn);
    const isMapSettingsModalVisible = useSelector((state:RootState) => state.auth.isMapSettingsModalVisible);

    const dispatch = useDispatch();

    useEffect(() => {
        const watchId = Geolocation.watchPosition(
            position => {
                const { latitude, longitude } = position.coords;
                // 사용자가 마지막으로 지도를 터치한 시점에서 3.5초가 지나지 않았다면 위치를 업데이트 하지 않는다.
                if (lastTouchTime && Date.now() - lastTouchTime < 3500) {
                    return;
                }
                if (0){

                }else {
                    mapView.current?.animateToCoordinate({ latitude, longitude });
                    dispatch(setLocationSaved({...locationSaved, latitude:latitude, longitude:longitude }))
                }
                
                setShowUpdateLocationButton(false)
            },
            (error) => {
                switch (error.code) {
                    case 1: 
                        requestLocationPermission();
                        break;
                    case 2: 
                        setShowUpdateLocationButton(false)
                        Alert.alert(
                            'GPS Required',
                            'Please turn on GPS for better experience',
                            [
                                {
                                text: 'Go to GPS Settings',
                                onPress: () => {
                                    IntentLauncher.startActivity({
                                        action: 'android.settings.LOCATION_SOURCE_SETTINGS',
                                        category: '',
                                        data: ''
                                    });
                                }
                                },
                                {
                                text: 'Cancel',
                                onPress: () => {},
                                style: 'cancel',
                                },
                            ]
                        );
                        break;
                }
              },
            {
                enableHighAccuracy: true,
                interval: 1000,
                distanceFilter: 0,
                forceRequestLocation: true,
                showLocationDialog: true,
            }
        );

        return () => {
            Geolocation.clearWatch(watchId);
            setMapLocationSettingsFirebase(user,locationSaved)
        };
    }, [lastTouchTime]);

    const requestLocationPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: "Location Permission",
                    message: "This app requires access to your location.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("Location permission granted");
                // 권한이 허용된 경우의 로직을 추가합니다.
            } else {
                console.log("Location permission denied");
                // 권한이 거부된 경우의 로직을 추가합니다.
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const handleDeviceDetail = () => {
        if (!isModalVisible){
            setIsModalVisible(true);
        }
    };

    const handleOnCameraChange = (cameraChangeEvent: Region) => {
        // 사용자가 지도를 터치할 때마다 현재 시간을 저장한다.
        setLastTouchTime(Date.now());
        setRegion(cameraChangeEvent);
    }

    const handleOnTouch = () => {
        if (!showUpdateLocationButton) setShowUpdateLocationButton(true); 
        setLastTouchTime(Date.now());
    }

    const isInsideMap = (deviceCoord: Coord, mapBounds: Coord[]) => {
        return deviceCoord.latitude >= mapBounds[0].latitude && 
               deviceCoord.latitude <= mapBounds[2].latitude && 
               deviceCoord.longitude >= mapBounds[0].longitude && 
               deviceCoord.longitude <= mapBounds[2].longitude;
    }
    
    const adjustDevicePosition = (deviceCoord: Coord, mapBounds: Coord[]) => {
        const [bottomLeft, topLeft, topRight, bottomRight] = mapBounds;
    
        let adjustedCoord = { ...deviceCoord };
    
        // 위/아래 경계 확인
        if (deviceCoord.latitude > topRight.latitude) {
            adjustedCoord.latitude = topRight.latitude;
        } else if (deviceCoord.latitude < bottomLeft.latitude) {
            adjustedCoord.latitude = bottomLeft.latitude;
        }
    
        // 좌/우 경계 확인
        if (deviceCoord.longitude > topRight.longitude) {
            adjustedCoord.longitude = topRight.longitude;
        } else if (deviceCoord.longitude < topLeft.longitude) {
            adjustedCoord.longitude = topLeft.longitude;
        }
    
        return adjustedCoord;
    };

    const moveToCurrentLocation = async () => {
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            // 맵의 중심을 현재 위치로 이동
            mapView.current?.animateToCoordinate({ latitude, longitude });
            
            setShowUpdateLocationButton(false)
        } catch (error) {
            console.error("Error fetching current position:", error);
        }
    };
    
    const getCurrentPosition = (): Promise<GeoPosition> => {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                position => resolve(position),
                error => reject(error),
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 1000,
                    forceRequestLocation: true
                }
            );
        });
    };

    const userMarker = useMemo(() => {
        if (!mapView.current || !mapView.current.props.center) return null;
        
        const { zoom, ...rest } = mapView.current.props.center;
        return (
            <Marker coordinate={rest} height={25} width={25} anchor={{ x: 0.5, y: 0.5 }}>
                <MaterialCommunityIcons name="circle-slice-8" size={25} color="red" />
            </Marker>
        );
    }, [mapView.current?.props.center]);

    const deviceMarkers = useMemo(() => {
        if (!fetchedWData || fetchedWData.length === 0) return null;
        return fetchedWData.map((device:DeviceDataType, i: any) => {
            let deviceCoord = {latitude:parseFloat(device.parsed_string.LATITUDE), longitude:parseFloat(device.parsed_string.LONGITUDE)};
            if(!isInsideMap(deviceCoord, region?.coveringRegion)) {
                deviceCoord = adjustDevicePosition(deviceCoord, region.coveringRegion);
            }
            // received_at을 Date 객체로 변환 (GMT +0 기준)
            const receivedAtDate = new Date(device.received_at);
            
            // GMT+9로 시간대를 변환
            const receivedAtDateKST = new Date(receivedAtDate.getTime() + (9 * 60 * 60 * 1000));
            const currentTime = Date.now();
            const timeDifference = currentTime - receivedAtDateKST.getTime();
            const deviceOn = timeDifference < 360000;
            return (
                <Marker 
                    key={`deviceM_${i}`} 
                    hidden={false}
                    coordinate={deviceCoord}
                    caption={!seeAllDevices ? selectedDevice?.dev_eui === device.dev_eui? {'text':(device.dev_eui).substring(12), 'textSize':12, 'color':'#fffb00', 'haloColor':'#000'} : {} : {'text':(device.dev_eui).substring(12), 'textSize':12, 'color':'#fffb00', 'haloColor':'#000'}}
                    width={35}
                    height={35}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onClick={() => handleDeviceClick(device)} // 마커 클릭 핸들러 추가
                >
                <MaterialCommunityIcons
                    key={`deviceI_${i}`} 
                    name="panorama-sphere" 
                    size={35} 
                    color={deviceOn ? Theme.COLORS.DEVICE_ON : Theme.COLORS.DEVICE_OFF} 
                />
                </Marker>
            )
        });
    }, [fetchedWData, region, showDeviceId]);

    const DeviceDetailModal = () => {
        if (!selectedDevice) return null;
        return (
            <View style={styles.overlayContainer}>
                <View style={styles.overlayContent}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedDevice.dev_eui}</Text>
                        <Text style={styles.modalDetail}>Latitude: {selectedDevice.parsed_string.LATITUDE}</Text>
                        <Text style={styles.modalDetail}>Longitude: {selectedDevice.parsed_string.LONGITUDE}</Text>
                        <Text style={styles.modalDetail}>Received at: {convertToSeoulTime(selectedDevice.received_at)}</Text>
                        <TouchableOpacity onPress={()=>setIsModalVisible(false)} style={styles.closeButton}>
                            <Text>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const handleDeviceClick = (device) => {
        // 이미 표시된 buoy_id를 클릭하면 숨기고, 그렇지 않으면 표시합니다.
        if (selectedDevice === device) {
            setShowDeviceId(null);
            setSelectedDevice(null)
        } else {
            setShowDeviceId(device.dev_eui);
            setSelectedDevice(device)
        }
    }

    const distanceLines = useMemo(() => {
        if (!locationSaved || !fetchedWData) return null;
        const userLat = locationSaved.latitude!;
        const userLon = locationSaved.longitude!;
        return fetchedWData.map((device: DeviceDataType, i: React.Key | null | undefined) => {
            const deviceLat = parseFloat(device.parsed_string.LATITUDE);
            const deviceLon = parseFloat(device.parsed_string.LONGITUDE);
            const distance:any = calculateDistance(userLat, userLon, deviceLat, deviceLon);
            if (distance <= 3) {
                const midLat = (userLat + deviceLat) / 2;
                const midLon = (userLon + deviceLon) / 2;
                return (
                    <View key = {i}>
                        <Polyline
                            key={`lineP_${i}`}
                            coordinates={[{latitude: locationSaved.latitude,longitude: locationSaved.longitude}, {latitude:parseFloat(device.parsed_string.LATITUDE),longitude:parseFloat(device.parsed_string.LONGITUDE)}]}
                            strokeWidth={2}
                            strokeColor="#ff641c"/>
                        <Marker 
                            key={`distanceM_${i}`}
                            coordinate={{latitude: midLat, longitude: midLon}}
                            anchor={{ x: 0.5, y: 0.5 }}
                            width={40} height={35}
                        >
                            <View style={styles.distanceContainer} key={`distanceV_${i}`}>
                                <Text key={`distanceT_${i}`} style={styles.distanceText}>{`${distance.toFixed(3)*1000}m`}</Text>
                            </View>
                        </Marker>
                    </View>
                );
            }
            return null;
        });
    }, [locationSaved, fetchedWData]);

    return (
        <View style={styles.allContainer}>
            <NaverMapView 
                showsMyLocationButton={false}
                compass={true}
                scaleBar={true}
                nightMode={false}
                zoomControl={true}
                rotateGesturesEnabled={false}
                tiltGesturesEnabled={false}
                // logoMargin={{left: -50}} 네이버 맵 정책으로 반드시 보여야 함
                mapType={mapType}
                style={{ height:"100%" }}
                center={locationSaved ? {latitude: locationSaved.latitude, longitude:locationSaved.longitude, zoom: locationSaved.mapZoomLevel}:{latitude: 37.35882350130591, longitude: 127.10469231924353, zoom: 13}}
                onCameraChange={handleOnCameraChange}
                onTouch={handleOnTouch}
                ref={mapView}
            >
                {userMarker}
                {deviceMarkers}
                {seeDistanceLines && distanceLines}
                
            </NaverMapView>
            
            <View style={styles.upperContainer}>
                <View style={styles.networkState}>
                    <View style={{...styles.networkState1, backgroundColor:wifiOn?Theme.COLORS.NETWORK_STATUS_ON:Theme.COLORS.NETWORK_STATUS_OFF}}>
                        <Text style={styles.networkStateText}>WiFi</Text>
                        <MaterialCommunityIcons name="signal-variant" color={'#000'} size={13}/>
                    </View>
                    <View style={{...styles.networkState2, backgroundColor:cellularOn?Theme.COLORS.NETWORK_STATUS_ON:Theme.COLORS.NETWORK_STATUS_OFF}}>
                        <Text style={styles.networkStateText}>Cellular</Text>
                        <MaterialCommunityIcons name="signal" color={'#000'} size={13}/>
                    </View>
                </View>
                {
                    showUpdateLocationButton && (
                        <TouchableOpacity
                            style={styles.updateLocationButton}
                            onPress={moveToCurrentLocation}>
                            <MaterialCommunityIcons name="navigation-variant" color={Theme.COLORS.PRIMARY} size={20}/>
                            <Text style={styles.updateLocationButtonText}> Back to My Location</Text>
                        </TouchableOpacity>
                    )
                }
                
            </View>

            {
                (showDeviceId) && (
                    <TouchableOpacity onPress={handleDeviceDetail} style={{position:'absolute', bottom:'60%', right: '3%'}}>
                        <MaterialCommunityIcons 
                            name="more" 
                            size={50} 
                            color={Theme.COLORS.PRIMARY} 
                        />    
                    </TouchableOpacity>
                )
            }
            {
                (isModalVisible) && (
                    <DeviceDetailModal/>
                )
            }
            
            <ActionButton 
                buttonColor={Theme.COLORS.SETINGS_BTN}>
                <ActionButton.Item 
                    buttonColor={Theme.COLORS.BUTTON_COLOR} 
                    title={'Settings'}
                    onPress={() => {dispatch(setMapSettingsModalVisible(true));}}>
                    <Ionicons name="settings-sharp" color={'#fff'} size={25}/>
                </ActionButton.Item>
                <ActionButton.Item 
                    buttonColor={Theme.COLORS.BUTTON_COLOR} 
                    title={'BASIC'}
                    onPress={() => {dispatch(setMapType(0));}}>
                    <MaterialCommunityIcons name="map" color={'#fff'} size={25}/>
                </ActionButton.Item>
                <ActionButton.Item 
                    buttonColor={Theme.COLORS.BUTTON_COLOR} 
                    title={'SATELLITE'}
                    onPress={() => {dispatch(setMapType(2));}}>
                    <MaterialCommunityIcons name="satellite-variant" color={'#fff'} size={25}/>
                </ActionButton.Item>
                <ActionButton.Item 
                    buttonColor={Theme.COLORS.BUTTON_COLOR} 
                    title={'HYBRID'}
                    onPress={() => {dispatch(setMapType(3));}}>
                    <MaterialCommunityIcons name="satellite" color={'#fff'} size={25}/>
                </ActionButton.Item>
                <ActionButton.Item 
                    buttonColor={Theme.COLORS.BUTTON_COLOR} 
                    title={'TERRAIN'}
                    onPress={() => {dispatch(setMapType(4));}}>
                    <MaterialCommunityIcons name="map-legend" color={'#fff'} size={25}/>
                </ActionButton.Item>
                <ActionButton.Item 
                    buttonColor={Theme.COLORS.BUTTON_COLOR} 
                    title={'logout'}
                    onPress={() => {handleSignOut(dispatch)}}>
                    <MaterialCommunityIcons name="map-legend" color={'#fff'} size={25}/>
                </ActionButton.Item>
            </ActionButton>
            {
                isMapSettingsModalVisible && (
                    <MapSettingsModalComponent/>
                )
            }
        </View>
    );
};

const styles = StyleSheet.create({
    allContainer: {
        height:'100%'
    },
    markerContainer: {
        alignItems: 'center'
    },
    iconContainer: {
        position: 'absolute',
        display:'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width:'auto'
    },
    deviceContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 2,
        borderRadius: 3,
        borderColor: 'gray',
        borderWidth: 0.5,
        top: 0, // 아이콘 위에 위치를 조절하려면 이 값을 조정
    },
    deviceIdText: {
        fontSize: 10,
        color: 'blue'
    },
    distanceContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 2,
        borderRadius: 3,
        borderColor: 'gray',
        borderWidth: 0.5,
    },
    distanceText: {
        fontSize: 10,
        color: 'black'
    },
    upperContainer: {
        position: 'absolute',
        display:'flex',
        flexDirection:'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
    },
    updateLocationButton: {
        width:'auto',
        backgroundColor: Theme.COLORS.SECONDARY,
        flexDirection:'row',
        padding: 10,
        marginTop: 30,
        marginRight: 30,
        borderRadius: 20,
        borderColor: 'gray',
        borderWidth: 0.5,
    },
    updateLocationButtonText: {
        fontSize: 14,
        color: 'black',
    },
    networkState: {
        width:'auto',
        flexDirection:'row',
        marginTop: 30,
        marginLeft: 30,
    },
    networkState1: {
        width:'auto',
        flexDirection:'row',
        padding: 5,
        borderRadius: 20,
        borderColor: 'gray',
        borderWidth: 0.5,
    },
    networkState2: {
        width:'auto',
        flexDirection:'row',
        padding: 5,
        borderRadius: 20,
        borderColor: 'gray',
        borderWidth: 0.5,
        marginLeft: 10
    },
    networkStateText: {
        fontSize: 10,
        color: 'black',
    },
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    overlayContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        color: 'black'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'black'
    },
    modalDetail: {
        fontSize: 18,
        marginBottom: 10,
        color: 'black'
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: Theme.COLORS.BLACK,
        borderRadius: 5,
    },
});

export default MapComponent;
