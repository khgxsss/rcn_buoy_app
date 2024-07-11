import React, { useEffect, useState } from 'react';
import {
  FlatList, Image, SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions // Dimensions API 임포트
  , View
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { convertToSeoulTime } from '../utils/utilfuncs';

const buoyOnImagePath = require('../assets/img/buoy.png');

const Home: React.FC = () => {
  const fetchedWData = useSelector((state: RootState) => state.auth.fetchedWData);
  const backgroundStyle = {
    // backgroundColor: isDarkMode ? "#000000" : "#ffffff",
    backgroundColor: "#ffffff"
  };
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // useWindowDimensions 훅을 사용하여 화면 크기 가져오기
  const { width, height } = useWindowDimensions();

  // 화면 너비가 높이보다 크면 가로 모드, 아니면 세로 모드
  const numColumns = width > height ? 3 : 2;
  const flatListKey = numColumns.toString();

  useEffect(() => {
    // numColumns가 변경될 때마다 imageSize를 업데이트합니다.
    const newWidth = width / numColumns - 10 * 2;
    setImageSize({ width: newWidth, height: newWidth });
  }, [numColumns]);

  const renderItem = ({ item }) => (
    <View style={[styles.itemContainer, { width: imageSize.width, height: imageSize.height }]}>
      <Image
        source={buoyOnImagePath}
        style={[styles.buoyImage, { width: imageSize.width, height: imageSize.height }]}
        resizeMode="contain"
      />
      <Text style={[styles.deviceIdText, { zIndex: 1 }]}>{item.dev_eui.substring(12)}</Text>
      <Text style={[styles.deviceText, { zIndex: 1 }]}>{convertToSeoulTime(item.received_at)}</Text>
      <Text style={[styles.dataText, { zIndex: 1 }]}>{'<Location>\n'}{`${item.parsed_string.LATITUDE}\n${item.parsed_string.LONGITUDE}`}</Text>
    </View>
  );

  return (
    <SafeAreaView style={backgroundStyle}>
      <FlatList
        data={fetchedWData}
        renderItem={renderItem}
        keyExtractor={item => item.dev_eui}
        key={flatListKey}
        numColumns={numColumns}
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContentContainer: {
    alignItems: 'center',
  },
  itemContainer: {
    margin: 10,
    position: 'relative', // 자식 요소에 absolute 포지션을 사용하도록 함
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  deviceIdText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 8,
    zIndex: 1, // 이미지를 덮어쓰도록 설정
    position: 'absolute', // 위치를 절대적으로 설정
    top: 10, // 이미지 상단에서부터의 간격,
    backgroundColor:'#f0f0f0',
    opacity: 0.7
  },
  deviceText: {
    color: '#333333',
    marginBottom: 8,
    zIndex: 1,
    fontWeight: 'bold',
    position: 'absolute',
    fontSize: 14,
    backgroundColor:'#f0f0f0',
    opacity: 0.7
  },
  dataText: {
    color: '#333333',
    marginBottom: 8,
    zIndex: 1,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 10, // 이미지 하단에서부터의 간격
    fontSize: 14,
    backgroundColor:'#f0f0f0',
    opacity: 0.7
  },
  buoyImage: {
    position: 'absolute', // 배경에 이미지가 깔리도록 설정
    top: 0,
    left: 0,
    zIndex: 0, // 다른 요소보다 뒤에 오도록 설정
  }
});

export default Home;
