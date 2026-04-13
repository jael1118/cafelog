import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, ActivityIndicator, Alert, Image, Linking, FlatList } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const colors = {
  primary: '#9B7ED9',
  secondary: '#EBE5F5',
  background: '#F8F8FC',
  text: '#4A4A4A',
  grayText: '#888888',
  white: '#FFFFFF',
  accentPink: '#FCA5F1',
  heart: '#FCA5F1',
};

const customMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#e0e3c8" }] },
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

const CafeMarker = ({ cafe, isSelected, isVisited, count, onPress }) => {
  // 🌟 核心修改：我們不用固定的 false，而是讓它在選中/未選中切換時，多給它一點時間重繪
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true); // 只要狀態改變，就立刻開啟重繪追蹤
    
    // 給予更充裕的重繪時間 (1.5秒)，確保手機有足夠時間把新的大圖標畫出來
    // 之後再關閉以保持地圖滑動順暢
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 1); 
    
    return () => clearTimeout(timer);
  }, [isSelected]); // 監聽 isSelected，當它被點擊或取消時觸發

  return (
    <Marker 
      // 🌟 核心修改 2：把 key 改回最單純的 id。
      // 因為我們已經用 tracksViewChanges 控制重繪了，再把 isSelected 塞進 key 會導致元件被強制摧毀重建，
      // 這反而就是圖標會「瞬間消失」的元兇！
      key={cafe.id} 
      coordinate={{ latitude: cafe.lat, longitude: cafe.lng }}
      onPress={onPress}
      style={{ zIndex: isSelected ? 999 : 1 }}
      tracksViewChanges={tracksViewChanges} // 綁定狀態
    >
      <View style={{ width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }}>
        {isSelected ? (
          <Ionicons 
            name="location"
            size={46}
            color={colors.primary}
          />
        ) : isVisited ? (
          <View style={styles.visitedMarker}>
            <Text style={styles.visitCountText}>{count}</Text>
          </View>
        ) : (
          <View style={styles.unvisitedMarker}>
            <Ionicons name="cafe" size={14} color={colors.primary} />
          </View>
        )}
      </View>
    </Marker>
  );
};

export default function MapScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const mapRef = useRef(null);

  const [allCafes, setAllCafes] = useState(globalSavedCafes);
  const [displayedCafes, setDisplayedCafes] = useState(globalSavedCafes);
  const [userRegion, setUserRegion] = useState(globalSavedRegion);
  const [currentMapRegion, setCurrentMapRegion] = useState(globalSavedRegion);

  const [isLoading, setIsLoading] = useState(!globalSavedRegion);
  const [selectedCafeId, setSelectedCafeId] = useState(null);

  const selectedCafe = allCafes.find(c => c.id === selectedCafeId);
  const [searchText, setSearchText] = useState('');
  const [showSearchHereBtn, setShowSearchHereBtn] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const [visitData, setVisitData] = useState({});
  const [isSearchListVisible, setIsSearchListVisible] = useState(false);

  const excludeKeywords = ['50嵐', '清心', '麻古', '可不可', '迷客夏', '茶湯會', '萬波', '得正', '八曜', '手搖', '茶飲', 'TEA', 'Tea', '大苑子', '龜記', 'CoCo', '鮮茶道'];

  useFocusEffect(
    useCallback(() => {
      const fetchVisited = async () => {
        try {
          const logsStr = await AsyncStorage.getItem('cafe_logs');
          if (logsStr) {
            const logs = JSON.parse(logsStr);
            const data = {};
            logs.forEach(log => {
              if (log.location) {
                const locName = log.location.toLowerCase().trim();
                if (!data[locName]) {
                  data[locName] = { count: 0, rating: log.rating || 0 };
                }
                data[locName].count += 1;
              }
            });
            setVisitData(data);
          }
        } catch (error) {
          console.error("讀取去過的地點失敗", error);
        }
      };
      fetchVisited();
    }, [])
  );

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
          address: node.tags['addr:street'] ? `${node.tags['addr:street']}${node.tags['addr:housenumber'] || ''}` : `${node.lat.toFixed(5)}, ${node.lon.toFixed(5)}`,
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
    setSelectedCafeId(null); // 更新：搜尋時清除選中狀態
  };

  // 🌟 修改2：清除搜尋內容的函式
  const handleClearSearch = () => {
    setSearchText('');
    setDisplayedCafes(allCafes);
    Keyboard.dismiss();
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    setIsSearchListVisible(true);
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
    const url = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`;
    Linking.openURL(url).catch((err) => {
      console.error('無法打開地圖', err);
      Alert.alert('錯誤', '無法開啟地圖應用程式');
    });
  };

  const selectedVData = selectedCafe ? visitData[selectedCafe.name.toLowerCase().trim()] : null;
  const isSelectedVisited = selectedVData && selectedVData.count > 0;
  const selectedUserRating = selectedVData ? selectedVData.rating : 0;

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setIsSearchListVisible(false);
    }}>
      <View style={styles.container}>

        {userRegion ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={userRegion}
            showsUserLocation={true}
            customMapStyle={customMapStyle}
            onPress={() => {
              setSelectedCafeId(null);
              setIsSearchListVisible(false);
            }}
            onRegionChangeComplete={(region) => {
              globalSavedRegion = region;
              setCurrentMapRegion(region);
              if (!isFirstLoad) {
                setShowSearchHereBtn(true);
              }
              setIsFirstLoad(false);
            }}
          >
            {displayedCafes.map((cafe) => {
              const vData = visitData[cafe.name.toLowerCase().trim()];
              const count = vData ? vData.count : 0;
              const isVisited = count > 0;
              const isSelected = selectedCafeId === cafe.id;

              return (
                <CafeMarker
                  key={`${cafe.id}-${isSelected}`} // 🌟 沿用你的設定
                  cafe={cafe}
                  isSelected={isSelected}
                  isVisited={isVisited}
                  count={count}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedCafeId(cafe.id);
                    setIsSearchListVisible(false);
                  }}
                />
              );
            })}
            
          </MapView>
        ) : (
          <View style={styles.loadingFull}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.text }}>正在定位你的位置...</Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="點擊查詢店家..."
            placeholderTextColor={colors.grayText}
            value={searchText}
            onChangeText={handleSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {/* 🌟 修改3：加上「叉叉」按鈕，只有在搜尋框有字的時候才顯示 */}
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={{ marginRight: 15 }}>
              <Ionicons name="close-circle" size={18} color={colors.grayText} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSearchSubmit}>
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isSearchListVisible && (
          <View style={styles.searchListContainer}>
            <View style={styles.searchListHeader}>
              <Text style={styles.searchListTitle}>搜尋結果 ({displayedCafes.length})</Text>
              <TouchableOpacity onPress={() => setIsSearchListVisible(false)}>
                <Ionicons name="close-circle" size={24} color={colors.grayText} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={displayedCafes}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.searchListItem} onPress={() => {
                  setIsSearchListVisible(false);
                  setSelectedCafeId(item.id); // 更新：使用 ID
                  mapRef.current?.animateToRegion({
                    latitude: item.lat,
                    longitude: item.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                  }, 800);
                }}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchListItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.searchListItemAddress} numberOfLines={1}>{item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {userRegion && (
          <TouchableOpacity style={styles.locateButton} onPress={goToCurrentLocation}>
            <Ionicons name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}

        {showSearchHereBtn && currentMapRegion && !isLoading && (
          <TouchableOpacity
            style={styles.searchHereBtn}
            onPress={() => fetchRealCafes(currentMapRegion.latitude, currentMapRegion.longitude)}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={styles.searchHereText}>在地圖此區域搜尋</Text>
          </TouchableOpacity>
        )}

        {isLoading && userRegion && (
          <View style={styles.loadingFloating}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingFloatingText}>搜尋附近店家...</Text>
          </View>
        )}

        {selectedCafe && (
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cafeName} numberOfLines={1}>{selectedCafe.name}</Text>

              {isSelectedVisited ? (
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((item, index) => (
                    <Ionicons key={index} name="heart" size={12} color={item <= selectedUserRating ? colors.heart : '#E0E0E0'} style={{ marginRight: 2 }} />
                  ))}
                  <Text style={styles.ratingScore}>{Number(selectedUserRating).toFixed(1)}</Text>
                </View>
              ) : (
                <View style={styles.ratingRow}></View>
              )}
            </View>

            <View style={styles.cardMainContent}>
              <Image source={{ uri: selectedCafe.imageUrl }} style={styles.cafeImage} />

              <View style={styles.cardInfoColumn}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(selectedCafe.address) ? '座標:' : '地址:'}
                  </Text>
                  <Text style={styles.detailText} numberOfLines={2}>{selectedCafe.address}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>營業時間:</Text>
                  <Text style={styles.detailText} numberOfLines={1}>{selectedCafe.businessHours}</Text>
                </View>

                <View style={styles.tagsContainer}>
                  {selectedCafe.tags.map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.actionButtonRow}>
                  <TouchableOpacity style={[styles.actionButton, styles.mapButton]} onPress={() => openGoogleMaps(selectedCafe)}>
                    <Text style={styles.mapButtonText}>開啟導航</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.logButton]}
                    onPress={() => router.push({
                      pathname: '/addlog',
                      params: { prefillTitle: selectedCafe.name, prefillLocation: selectedCafe.name }
                    })}
                  >
                    <Text style={styles.logButtonText}>寫紀錄</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </View>
        )}

        <View style={styles.tabBarWrapper}>
          <View style={styles.tabBar}>
            <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
              <Ionicons name="calendar-outline" size={22} color={colors.grayText} />
              <Text style={styles.tabText}>主頁</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/map')}>
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

  searchContainer: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', backgroundColor: colors.white, borderRadius: 15, paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'space-between', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, marginRight: 10 },

  searchListContainer: { position: 'absolute', top: 120, left: 20, right: 20, maxHeight: 300, backgroundColor: colors.white, borderRadius: 15, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, zIndex: 20, overflow: 'hidden' },
  searchListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.secondary },
  searchListTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  searchListItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F8F8FC' },
  searchListItemName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  searchListItemAddress: { fontSize: 12, color: colors.grayText, marginTop: 4 },

  locateButton: { position: 'absolute', top: 140, right: 20, backgroundColor: colors.white, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, zIndex: 10 },
  searchHereBtn: { position: 'absolute', top: 140, alignSelf: 'center', flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, zIndex: 10 },
  searchHereText: { color: colors.primary, fontWeight: 'bold', fontSize: 14, includeFontPadding: false },

  loadingFloating: { position: 'absolute', top: 140, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', elevation: 3 },
  loadingFloatingText: { color: colors.primary, marginLeft: 8, fontWeight: 'bold', fontSize: 12 },

  unvisitedMarker: { backgroundColor: colors.white, borderColor: colors.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, elevation: 3 },
  visitedMarker: { backgroundColor: colors.primary, borderColor: colors.white, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, elevation: 3 },
  visitCountText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },

  detailCard: { position: 'absolute', bottom: 120, left: 20, right: 20, backgroundColor: colors.white, borderRadius: 25, padding: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cafeName: { fontSize: 20, fontWeight: '900', color: colors.text, marginRight: 10, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingScore: { fontSize: 10, color: colors.grayText, marginLeft: 4, fontWeight: 'bold' },

  cardMainContent: { flexDirection: 'row' },
  cafeImage: { width: 100, height: 100, borderRadius: 15, marginRight: 15 },
  cardInfoColumn: { flex: 1, justifyContent: 'space-between' },

  detailItem: { flexDirection: 'row', marginBottom: 4 },
  detailLabel: { fontSize: 11, color: colors.text, fontWeight: 'bold', marginRight: 4 },
  detailText: { fontSize: 11, color: colors.grayText, flex: 1, textDecorationLine: 'underline' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 8 },
  tagBadge: { backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 },
  tagText: { color: colors.primary, fontSize: 10, fontWeight: 'bold' },

  actionButtonRow: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: 'auto' },
  actionButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, marginRight: 8 },
  mapButton: { backgroundColor: '#F0F0F0' },
  logButton: { backgroundColor: colors.primary },
  mapButtonText: { color: colors.text, fontWeight: 'bold', fontSize: 12 },
  logButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 12 },

  tabBarWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' },
  tabBar: { flexDirection: 'row', height: 85, backgroundColor: colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 10, paddingHorizontal: 15 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 15 },
  tabItemActiveBg: { backgroundColor: colors.secondary, width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginTop: -8, marginBottom: 2 },
  tabText: { fontSize: 10, color: colors.grayText, marginTop: 4, fontWeight: 'bold' },
  tabTextActive: { color: colors.primary }
});