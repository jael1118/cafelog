import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, ActivityIndicator, Alert, Image, Linking, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import * as Location from 'expo-location';

// 🌟 全面換成與其他頁面一致的紫色/治癒系風格！
const colors = {
  primary: '#9B7ED9',         // 主要深紫 (標記、主要按鈕)
  secondary: '#EBE5F5',       // 淺紫 (次要按鈕、背景)
  background: '#F8F8FC',      // 頁面極淺灰紫底色
  text: '#4A4A4A',            // 標題深灰色
  grayText: '#888888',        // 次要灰色文字
  white: '#FFFFFF',
  accentPink: '#FCA5F1',      // 裝飾粉紅
  heart: '#FFB6C1',           // 愛心粉紅
};

// 🗺️ 客製化地圖樣式 (讓地圖變成你截圖中的復古淺綠色調)
const customMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#e0e3c8" }] }, // 復古淺綠底色
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#c6ccae" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f0e6c5" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#e1d4b1" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f5dfa2" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#e1c880" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#b9d3c2" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#92998d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const placeholderImages = [
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=300&auto=format&fit=crop'
];

let globalSavedRegion = null;
let globalSavedCafes = [];

export default function MapScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const mapRef = useRef(null);

  const [allCafes, setAllCafes] = useState(globalSavedCafes);
  const [displayedCafes, setDisplayedCafes] = useState(globalSavedCafes);
  const [userRegion, setUserRegion] = useState(globalSavedRegion);
  const [currentMapRegion, setCurrentMapRegion] = useState(globalSavedRegion); 
  
  const [isLoading, setIsLoading] = useState(!globalSavedRegion); 
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showSearchHereBtn, setShowSearchHereBtn] = useState(false); 
  const [isFirstLoad, setIsFirstLoad] = useState(true); 

  const excludeKeywords = ['50嵐', '清心', '麻古', '可不可', '迷客夏', '茶湯會', '萬波', '得正', '八曜', '手搖', '茶飲', 'TEA', 'Tea', '大苑子', '龜記', 'CoCo', '鮮茶道'];

  useEffect(() => {
    if (globalSavedRegion) {
      return; 
    }

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限不足', '請開啟定位權限以顯示所在地點的咖啡廳');
        const defaultLoc = { latitude: 25.0330, longitude: 121.5654, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        globalSavedRegion = defaultLoc; 
        setUserRegion(defaultLoc);
        fetchRealCafes(defaultLoc.latitude, defaultLoc.longitude);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      
      globalSavedRegion = currentLoc; 
      setUserRegion(currentLoc);
      setCurrentMapRegion(currentLoc);
      fetchRealCafes(currentLoc.latitude, currentLoc.longitude);
    })();
  }, []);

  const fetchRealCafes = async (lat, lng) => {
    try {
      setIsLoading(true);
      setShowSearchHereBtn(false); 
      
      const query = `[out:json];node(around:3000,${lat},${lng})["amenity"="cafe"];out;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        console.log('API 忙碌中，請稍後再試');
        setIsLoading(false);
        return;
      }

      const text = await response.text(); 
      const data = JSON.parse(text); 

      const realData = data.elements
        .filter(node => node.tags && node.tags.name)
        .filter(node => {
           const cafeName = node.tags.name;
           const isBubbleTea = excludeKeywords.some(keyword => cafeName.includes(keyword));
           return !isBubbleTea;
        })
        .map((node) => ({
          id: node.id.toString(),
          name: node.tags.name,
          lat: node.lat,
          lng: node.lon,
          imageUrl: placeholderImages[Math.floor(Math.random() * placeholderImages.length)],
          address: node.tags['addr:street'] ? `${node.tags['addr:street']}${node.tags['addr:housenumber'] || ''}` : '看地圖定位尋寶去 🐾',
          businessHours: node.tags.opening_hours || '營業時間未提供',
          rating: (Math.random() * (5.0 - 3.8) + 3.8).toFixed(1),
          tags: ['#真實店家', node.tags.internet_access === 'wlan' ? '#有WiFi' : '#新發現']
        }));

      globalSavedCafes = realData; 
      setAllCafes(realData);
      setDisplayedCafes(realData);
      setIsLoading(false);
    } catch (error) {
      console.log("抓取失敗", error); 
      setIsLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text) {
      const filtered = allCafes.filter(cafe => 
        cafe.name.toLowerCase().includes(text.toLowerCase())
      );
      setDisplayedCafes(filtered);
    } else {
      setDisplayedCafes(allCafes);
    }
    setSelectedCafe(null);
  };

  const goToCurrentLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({});
      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      
      mapRef.current?.animateToRegion(currentLoc, 800);
      globalSavedRegion = currentLoc;
      setCurrentMapRegion(currentLoc);
    } catch (error) {
      console.log("定位失敗", error);
    }
  };

  const openGoogleMaps = (cafe) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.name)}`;
    Linking.openURL(url).catch((err) => {
      console.error('無法打開地圖', err);
      Alert.alert('錯誤', '無法開啟地圖應用程式');
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        
        {userRegion ? (
          <MapView
            ref={mapRef} 
            style={styles.map}
            initialRegion={userRegion}
            showsUserLocation={true}
            customMapStyle={customMapStyle} // 🌟 套用復古淺綠色調濾鏡
            onPress={() => setSelectedCafe(null)}
            onRegionChangeComplete={(region) => {
              globalSavedRegion = region; 
              setCurrentMapRegion(region);
              if (!isFirstLoad) {
                setShowSearchHereBtn(true); 
              }
              setIsFirstLoad(false);
            }}
          >
            {displayedCafes.map((cafe) => (
              <Marker 
                key={cafe.id}
                coordinate={{ latitude: cafe.lat, longitude: cafe.lng }}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedCafe(cafe);
                }}
              >
                {/* 🌟 圖標改為紫色系 */}
                <View style={[styles.customMarker, selectedCafe?.id === cafe.id && styles.activeMarker]}>
                  <Ionicons name="cafe" size={16} color={selectedCafe?.id === cafe.id ? colors.primary : colors.white} />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.loadingFull}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{marginTop: 10, color: colors.text}}>正在定位你的位置...</Text>
          </View>
        )}

        {/* 頂部搜尋框 */}
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="點擊查詢店家..." 
            placeholderTextColor={colors.grayText} 
            value={searchText}
            onChangeText={handleSearch}
          />
          <Ionicons name="search" size={20} color={colors.text} />
        </View>

        {/* 右側定位按鈕 */}
        {userRegion && (
          <TouchableOpacity style={styles.locateButton} onPress={goToCurrentLocation}>
            <Ionicons name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* 重新搜尋按鈕 */}
        {showSearchHereBtn && currentMapRegion && !isLoading && (
          <TouchableOpacity 
            style={styles.searchHereBtn}
            onPress={() => fetchRealCafes(currentMapRegion.latitude, currentMapRegion.longitude)}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} style={{marginRight: 5}} />
            <Text style={styles.searchHereText}>在地圖此區域搜尋</Text>
          </TouchableOpacity>
        )}

        {isLoading && userRegion && (
          <View style={styles.loadingFloating}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingFloatingText}>搜尋附近店家...</Text>
          </View>
        )}

        {/* 🌟 選中店家後的卡片，依照圖片重新排版 */}
        {selectedCafe && (
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cafeName} numberOfLines={1}>{selectedCafe.name}</Text>
              
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((item, index) => (
                  <Ionicons key={index} name="heart" size={12} color={colors.heart} style={{marginRight: 2}} />
                ))}
                <Text style={styles.ratingScore}>{selectedCafe.rating}</Text>
              </View>
            </View>

            <View style={styles.cardMainContent}>
              <Image source={{ uri: selectedCafe.imageUrl }} style={styles.cafeImage} />
              
              <View style={styles.cardInfoColumn}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>地址:</Text>
                  <Text style={styles.detailText} numberOfLines={2}>{selectedCafe.address}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>營業時間:</Text>
                  <Text style={styles.detailText} numberOfLines={1}>{selectedCafe.businessHours}</Text>
                </View>

                {/* 標籤群 */}
                <View style={styles.tagsContainer}>
                  {selectedCafe.tags.map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                
                {/* 導航與紀錄按鈕移到這裡 */}
                <View style={styles.actionButtonRow}>
                  <TouchableOpacity style={[styles.actionButton, styles.mapButton]} onPress={() => openGoogleMaps(selectedCafe)}>
                    <Text style={styles.mapButtonText}>開啟導航</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.logButton]} onPress={() => router.push('/add-log')}>
                    <Text style={styles.logButtonText}>寫紀錄</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </View>
        )}

        {/* 🌟 依據設計圖製作的新版導覽列 */}
        <View style={styles.tabBarWrapper}>
          <View style={styles.tabBar}>
            <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
               <Ionicons name="calendar-outline" size={22} color={colors.grayText} />
              <Text style={styles.tabText}>主頁</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/map')}>
              {/* 目前在地圖頁，所以給它一個特別的紫色圓形背景 */}
              <View style={styles.tabItemActiveBg}>
                 <Ionicons name="map-outline" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.tabText, styles.tabTextActive]}>地圖</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/logbook')}>
              <Ionicons name="book-outline" size={22} color={colors.grayText} />
               <Text style={styles.tabText}>紀錄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/setting')}>
              <Ionicons name="settings-outline" size={22} color={colors.grayText} />
               <Text style={styles.tabText}>設定</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  
  // 搜尋框 (變更為圖片中的長條純白樣式)
  searchContainer: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', backgroundColor: colors.white, borderRadius: 15, paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'space-between', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, marginRight: 10 },
  
  locateButton: { position: 'absolute', top: 140, right: 20, backgroundColor: colors.white, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, zIndex: 10 },
  searchHereBtn: { position: 'absolute', top: 140, alignSelf: 'center', flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, zIndex: 10 },
  searchHereText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  
  loadingFloating: { position: 'absolute', top: 140, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', elevation: 3 },
  loadingFloatingText: { color: colors.primary, marginLeft: 8, fontWeight: 'bold', fontSize: 12 },

  // 地圖圖標 (換成紫色系)
  customMarker: { backgroundColor: colors.primary, padding: 6, borderRadius: 15, borderWidth: 2, borderColor: colors.white },
  activeMarker: { backgroundColor: colors.white, borderColor: colors.primary },
  
  // 店家詳細卡片 (依據圖片重排)
  detailCard: { position: 'absolute', bottom: 120, left: 20, right: 20, backgroundColor: colors.white, borderRadius: 25, padding: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cafeName: { fontSize: 20, fontWeight: '900', color: colors.text, marginRight: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingScore: { fontSize: 10, color: colors.grayText, marginLeft: 4, fontWeight: 'bold' },
  
  cardMainContent: { flexDirection: 'row' },
  cafeImage: { width: 100, height: 100, borderRadius: 15, marginRight: 15 },
  cardInfoColumn: { flex: 1, justifyContent: 'space-between' },
  
  detailItem: { flexDirection: 'row', marginBottom: 4 },
  detailLabel: { fontSize: 11, color: colors.text, fontWeight: 'bold', marginRight: 4 }, 
  detailText: { fontSize: 11, color: colors.grayText, flex: 1, textDecorationLine: 'underline' }, // 圖片中地址有底線
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 8 },
  tagBadge: { backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
  tagText: { color: colors.primary, fontSize: 10, fontWeight: 'bold' },
  
  actionButtonRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 'auto' },
  actionButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, marginRight: 8 },
  mapButton: { backgroundColor: '#F0F0F0' },
  logButton: { backgroundColor: colors.primary },
  mapButtonText: { color: colors.text, fontWeight: 'bold', fontSize: 12 },
  logButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 12 },
  
  // 新版導覽列
  tabBarWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' },
  tabBar: { flexDirection: 'row', height: 85, backgroundColor: colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 10, paddingHorizontal: 15 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 15 },
  tabItemActiveBg: { backgroundColor: colors.secondary, width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginTop: -8, marginBottom: 2 },
  tabText: { fontSize: 10, color: colors.grayText, marginTop: 4, fontWeight: 'bold' },
  tabTextActive: { color: colors.primary }
});