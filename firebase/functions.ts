import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, User } from '@react-native-google-signin/google-signin';
// import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { DeviceDataType, deviceType, FetchedDataType, serverLoginInputType, locationSavedType, appDimensionType,  Region, MAP_TYPE, oauth_config, default_user } from '../constants/types';
import { setLocationSaved, setDefaultMapZoomLevel, setUser, setActiveTab } from '../redux/stateSlice';
import { AppDispatch } from '../redux/store';

// Google 로그인 함수
const signInWithGoogle = async () => {
  try {
    // Google Play 서비스 사용 가능 여부 확인
    await GoogleSignin.hasPlayServices();

    // Google 로그인 시작
    const userInfo = await GoogleSignin.signIn();
    return userInfo;
  } catch (error) {
    console.error('Google sign-in failed:', error);
    throw error;
  }
};

// Facebook 로그인 함수
// const signInWithFacebook = async () => {
//   try {
//     const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
//     if (result.isCancelled) {
//       throw new Error('User cancelled the login process');
//     }

//     const data = await AccessToken.getCurrentAccessToken();
//     if (!data) {
//       throw new Error('Something went wrong obtaining the access token');
//     }

//     const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);
//     const result = await auth().signInWithCredential(facebookCredential);
//     return result.user;
//   } catch (error) {
//     console.error('Facebook sign-in failed:', error);
//     throw error;
//   }
// };

// 사용자 정보를 업데이트하는 함수
export const updateFirebaseStorage = async (user: User, dispatch: AppDispatch) => {
  const userDocRef = firestore().collection('users').doc(user.user.id);
  
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    await userDocRef.set({
      about: '', 
      devices: [], 
      name: user.user.name || '',
      email: user.user.email,
      lastLocation: {latitude: 37.35882350130591, longitude: 127.10469231924353, mapZoomLevel: 13}
    });
  } else {
    await userDocRef.update({
      name: user.user.name || '',
      email: user.user.email,
    });
  }
  dispatch(setLocationSaved(userDoc.data()?.lastLocation));
  dispatch(setDefaultMapZoomLevel(userDoc.data()?.lastLocation.mapZoomLevel));
}

// 사용자 로그인 함수
export const handleSignIn = async (dispatch: AppDispatch) => {
  try {
    let signedInUser: User = default_user;
    if (oauth_config.provider === 'google') {
      signedInUser = await signInWithGoogle();
    } else {
      throw new Error('Unsupported provider');
    }

    if (signedInUser) {
      dispatch(setUser(signedInUser));
      await AsyncStorage.setItem('user', JSON.stringify(signedInUser));
      await updateFirebaseStorage(signedInUser, dispatch);
    }
  } catch (err) {
    console.log(err);
  }
};

// 사용자 로그아웃 함수
export const handleSignOut = async (dispatch: AppDispatch) => {
  try {
    await GoogleSignin.signOut();
    dispatch(setUser(default_user));
    dispatch(setActiveTab('Map'));
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error(error);
  }
};

// 현재 사용자 정보 가져오기
export const handleGetCurrentUser = async () => {
  try {
    const currentUser = GoogleSignin.getCurrentUser();
    console.log(currentUser);
    if (currentUser) {
      const userDocRef = firestore().collection('users').doc(currentUser.user.id);
      const userDoc = await userDocRef.get();
      console.log(userDoc.data());
    } else {
      console.log('No user is currently signed in');
    }
    return currentUser;
  } catch (error) {
    console.error(error);
  }
};

// Firestore에서 사용자 정보 가져오기
export const getUser = async (user: User) => {
  try {
    const documentSnapshot = await firestore().collection('users').doc(user.user.id).get();
    if (documentSnapshot.exists) {
      console.log('User Data', documentSnapshot.data());
    }
  } catch (err) {
    console.log(err);
  }
}

// Firebase에서 사용자 위치 정보 업데이트
export const setMapLocationSettingsFirebase = async (user: User|null, locationSaved: locationSavedType) => {
  try {
    const userDocRef = firestore().collection('users').doc(user?.user.id);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
      await userDocRef.update({
        lastLocation: locationSaved,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

// 기기 정보 가져오기 (사용 안함)
export const fetchDevices = async (user: User) => {
  try {
    const list: deviceType[] = [];
    const querySnapshot = await firestore()
      .collection('devices')
      .where('userId', '==', user.user.id)
      .orderBy('regTime', 'desc')
      .get();

    querySnapshot.forEach((doc) => {
      const { userId, device, deviceImg, regTime, userName } = doc.data();
      list.push({
        userId,
        userName: 'Test Name',
        regTime: regTime,
        device,
        deviceImg,
        online: false,
      });
    });
    console.log(list);
  } catch (e) {
    console.log(e);
  }
};
