import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import NaverMapView, { Marker } from 'react-native-nmap-fork1';
import { MaterialCommunityIcons } from '../components/IconSets';
import ActionButton from 'react-native-action-button-fork1';
import { useDispatch } from 'react-redux';
import { setMapType } from '../redux/stateSlice';
import Theme from '../constants/Theme';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { format } from 'date-fns';
import Slider from '@react-native-community/slider';

const HistoryOnMap: React.FC = () => {


    const [mapCenter, setMapCenter] = useState<{latitude: number, longitude: number} | null>(null);

    // Redux
    const locationSaved = useSelector((state:RootState) => state.auth.locationSaved);
    const mapType = useSelector((state:RootState) => state.auth.mapType);
    const records = useSelector((state:RootState) => state.auth.records);
    const startDate = new Date(useSelector((state: RootState) => state.auth.startDate));
    const endDate = new Date(useSelector((state: RootState) => state.auth.endDate));

    const dispatch = useDispatch();

    const [sliderValue, setSliderValue] = useState(0);

    const totalHours = useMemo(() => {
        const diffInMs = endDate.getTime() - startDate.getTime();
        return diffInMs / (1000 * 60 * 60);
    }, [startDate, endDate]);

    const filteredRecords = useMemo(() => {
        const selectedDate = new Date(startDate.getTime() + sliderValue * (totalHours / 24) * 60 * 60 * 1000);
        return records.filter(record => {
            const recordDate = new Date(record.created_at);
            return recordDate <= selectedDate;
        });
    }, [records, sliderValue, startDate, totalHours]);

    useEffect(() => {
        if (records.length > 0) {
            const firstRecord = records[0];
            setMapCenter({
                latitude: parseFloat(firstRecord.parsed_string.LATITUDE),
                longitude: parseFloat(firstRecord.parsed_string.LONGITUDE)
            });
        }
    }, [records]);

    return (
        <View style={styles.allContainer}>
            <NaverMapView 
                showsMyLocationButton={false}
                compass={true}
                scaleBar={true}
                nightMode={false}
                zoomControl={true}
                mapType={mapType}
                style={{ height:"100%" }}
                center={mapCenter ? {...mapCenter, zoom: 17} : { latitude: 37.35882350130591, longitude: 127.10469231924353, zoom: 13 }}
            >
                {/* {
                    records.map((item, index) => {
                        return (
                            <Marker
                                key={`deviceM_${index}`}
                                coordinate={{
                                    latitude: parseFloat(item.parsed_string.LATITUDE),
                                    longitude: parseFloat(item.parsed_string.LONGITUDE)
                                }}
                                width={35}
                                height={35}
                                anchor={{ x: 0.5, y: 0.5 }}
                                >
                                <MaterialCommunityIcons
                                    key={`deviceI_${index}`}
                                    name="pin"
                                    size={25}
                                    color={Theme.COLORS.BLACK}
                                />
                            </Marker>
                        )
                    })
                } */}
                {filteredRecords.map((item, index) => (
                    <Marker
                        key={`deviceD_${index}`}
                        coordinate={{
                            latitude: parseFloat(item.parsed_string.LATITUDE),
                            longitude: parseFloat(item.parsed_string.LONGITUDE)
                        }}
                        width={25}
                        height={25}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <MaterialCommunityIcons
                            key={`deviceI_${index}`}
                            name="pin"
                            size={25}
                            color={Theme.COLORS.BLACK}
                        />
                    </Marker>
                ))}
                
            </NaverMapView>

            <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>{format(new Date(startDate.getTime() + sliderValue * (totalHours / 24) * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm')}</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={24}
                    step={1}
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    minimumTrackTintColor={Theme.COLORS.PRIMARY}
                    maximumTrackTintColor={Theme.COLORS.SECONDARY}
                />
            </View>
            
            <ActionButton 
                buttonColor={Theme.COLORS.SETINGS_BTN}>
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
            </ActionButton>
        </View>
    );
};

const styles = StyleSheet.create({
    allContainer: {
        flex:1
    },
    sliderContainer: {
        position:'absolute',
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Theme.COLORS.BLACK,
        alignItems: 'center',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabel: {
        color: Theme.COLORS.WHITE,
        marginBottom: 10,
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

export default HistoryOnMap;
