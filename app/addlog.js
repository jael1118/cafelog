import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, ScrollView, Platform, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const colors = {
  primary: '#FCA5F1',         
  secondary: '#EBE5F5',       
  background: '#F8F8FC',      
  text: '#4A4A4A',            
  grayText: '#888888',        
  white: '#FFFFFF',
  heart: '#FCA5F1',           
  tagText: '#9B7ED9',         
  
  pickerBg: '#FFFFFF',        
  pickerHighlight: '#EBE5F5', 
  pickerText: '#D0C0ED',      
  pickerTextSelected: '#9B7ED9',
  primaryText: '#9B7ED9',     // 新增紫羅蘭色給地點圖示用
};

const ITEM_HEIGHT = 46;

export default function AddLogScreen() {
  const router = useRouter();
  
  const { editLogData } = useLocalSearchParams(); 

  const [editId, setEditId] = useState(null); 
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState(null); 
  const [largeImageUri, setLargeImageUri] = useState(null); 
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  
  // 🌟 新增：地點選擇選單的狀態與紀錄
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);

  const yearScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const [days, setDays] = useState(Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, i) => i + 1));

  // 🌟 啟動時自動去保險箱找「所有曾經去過的地點」
  useEffect(() => {
    const fetchRecentLocations = async () => {
      try {
        const existingLogsJson = await AsyncStorage.getItem('cafe_logs');
        if (existingLogsJson) {
          const logs = JSON.parse(existingLogsJson);
          // 利用 Set 來過濾掉重複的地點名稱
          const locs = [...new Set(logs.map(l => l.location).filter(Boolean))];
          setRecentLocations(locs);
        }
      } catch (error) {
        console.log("讀取地點紀錄失敗", error);
      }
    };
    fetchRecentLocations();
  }, []);

  useEffect(() => {
    if (editLogData) {
      try {
        const log = JSON.parse(editLogData);
        setEditId(log.id);
        setTitle(log.title || '');
        setLocation(log.location || '');
        setRating(log.rating || 0);
        setTags(log.tags || '');
        setNote(log.note || '');
        setImageUri(log.imageUrl || null);
        setLargeImageUri(log.largeImageUrl || null);
        
        if (log.date) {
          const parts = log.date.split('-');
          setSelectedDate(new Date(parts[0], parseInt(parts[1]) - 1, parts[2]));
        }
      } catch (error) {
        console.error("解析編輯資料失敗", error);
      }
    }
  }, [editLogData]);

  useEffect(() => {
    const daysCount = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
    setDays(Array.from({ length: daysCount }, (_, i) => i + 1));
    if (selectedDate.getDate() > daysCount) {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), daysCount));
    }
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  useEffect(() => {
    if (isDatePickerVisible) {
      setTimeout(() => {
        const yIndex = years.indexOf(selectedDate.getFullYear());
        const mIndex = selectedDate.getMonth();
        const dIndex = selectedDate.getDate() - 1;
        yearScrollRef.current?.scrollTo({ y: yIndex * ITEM_HEIGHT, animated: false });
        monthScrollRef.current?.scrollTo({ y: mIndex * ITEM_HEIGHT, animated: false });
        dayScrollRef.current?.scrollTo({ y: dIndex * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [isDatePickerVisible]);

  const handleScrollEnd = (event, type) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    if (type === 'year' && years[index]) setSelectedDate(prev => new Date(years[index], prev.getMonth(), prev.getDate()));
    if (type === 'month' && months[index] !== undefined) setSelectedDate(prev => new Date(prev.getFullYear(), months[index], prev.getDate()));
    if (type === 'day' && days[index]) setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), days[index]));
  };

  const handleSelect = (val, index, type) => {
    if (type === 'year') {
      setSelectedDate(prev => new Date(val, prev.getMonth(), prev.getDate()));
      yearScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    if (type === 'month') {
      setSelectedDate(prev => new Date(prev.getFullYear(), val, prev.getDate()));
      monthScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    if (type === 'day') {
      setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), val));
      dayScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  };

  const formattedTime = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 ${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('需要權限', '請允許存取相簿才能上傳照片喔！📷');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickLargeImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('需要權限', '請允許存取相簿才能上傳照片喔！📷');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
      quality: 0.8,
    });
    if (!result.canceled) {
      setLargeImageUri(result.assets[0].uri);
    }
  };

  const handleSaveLog = async () => {
    if (!title.trim()) {
      Alert.alert('提醒', '請輸入標題唷！✏️');
      return;
    }
    try {
      const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      const newLog = {
        id: editId ? editId : Date.now().toString(),
        date: dateString,
        title: title,
        location: location,
        rating: rating,
        tags: tags,
        note: note,
        imageUrl: imageUri,
        largeImageUrl: largeImageUri, 
        displayTime: formattedTime
      };

      const existingLogsJson = await AsyncStorage.getItem('cafe_logs');
      let currentLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];

      if (editId) {
        const index = currentLogs.findIndex(l => l.id === editId);
        if (index !== -1) {
          currentLogs[index] = newLog;
        } else {
          currentLogs.unshift(newLog);
        }
      } else {
        currentLogs.unshift(newLog);
      }

      await AsyncStorage.setItem('cafe_logs', JSON.stringify(currentLogs));
      
      if (editId) {
        router.replace('/'); 
      } else {
        router.back();
      }

    } catch (error) {
      console.error('儲存失敗', error);
      Alert.alert('錯誤', '儲存時發生了一點問題 🥲');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={{ marginBottom: 10, alignSelf: 'flex-start' }} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <TextInput
              style={styles.titleInput}
              placeholder="請輸入標題"
              placeholderTextColor={colors.grayText}
              value={title}
              onChangeText={setTitle}
            />
            <TouchableOpacity onPress={() => setIsDatePickerVisible(true)}>
              <Text style={styles.timeText}>{formattedTime}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <TouchableOpacity style={styles.thumbnailBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
              ) : (
                <Text style={styles.thumbnailText}>選擇縮圖</Text>
              )}
            </TouchableOpacity>

            <View style={styles.metaColumn}>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color={colors.grayText} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="選擇或輸入地點..."
                  placeholderTextColor={colors.grayText}
                  value={location}
                  onChangeText={setLocation}
                />
                {/* 🌟 新增：下拉選單按鈕 */}
                <TouchableOpacity onPress={() => setIsLocationModalVisible(true)} style={styles.dropdownBtn}>
                  <Ionicons name="chevron-down-circle" size={18} color={colors.tagText} />
                </TouchableOpacity>
              </View>

              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((heart) => (
                  <TouchableOpacity key={heart} onPress={() => setRating(heart)}>
                    <Ionicons 
                      name={heart <= rating ? "heart" : "heart"} 
                      size={18} 
                      color={heart <= rating ? colors.heart : '#E0E0E0'} 
                      style={{ marginRight: 4 }}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={handleSaveLog}>
              <Text style={styles.doneButtonText}>{editId ? '更新' : '完成'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagRow}>
            <View style={styles.tagBadge}>
              <TextInput
                style={styles.tagInput}
                placeholder="關鍵字..."
                placeholderTextColor={colors.grayText}
                value={tags}
                onChangeText={setTags}
              />
              <Ionicons name="pencil" size={12} color={colors.tagText} />
            </View>
          </View>

          <TextInput
            style={styles.noteTextArea}
            placeholder="寫點什麼..."
            placeholderTextColor={colors.grayText}
            multiline={true}
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity style={styles.largeImageUploadBox} onPress={pickLargeImage}>
            {largeImageUri ? (
              <Image source={{ uri: largeImageUri }} style={styles.largeImage} />
            ) : (
              <View style={styles.largeImagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={colors.grayText} />
                <Text style={styles.largeImageText}>點擊新增內文照片</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{height: 50}} /> 
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🌟 日期輪盤選單 */}
      <Modal visible={isDatePickerVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsDatePickerVisible(false)} />
          
          <View style={[styles.pickerCard, { backgroundColor: colors.pickerBg }]}>
            <View style={styles.pickerColumn}>
              <View style={[styles.selectionHighlight, { backgroundColor: colors.pickerHighlight }]} pointerEvents="none" />
              <ScrollView ref={yearScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => handleScrollEnd(e, 'year')} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {years.map((y, index) => (
                  <TouchableOpacity key={`y-${y}`} style={styles.pickerItem} activeOpacity={0.7} onPress={() => handleSelect(y, index, 'year')}>
                    <Text style={[styles.pickerItemText, { color: colors.pickerText }, y === selectedDate.getFullYear() && { color: colors.pickerTextSelected }]}>{y}年</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <View style={[styles.selectionHighlight, { backgroundColor: colors.pickerHighlight }]} pointerEvents="none" />
              <ScrollView ref={monthScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => handleScrollEnd(e, 'month')} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {months.map((m, index) => (
                  <TouchableOpacity key={`m-${m}`} style={styles.pickerItem} activeOpacity={0.7} onPress={() => handleSelect(m, index, 'month')}>
                    <Text style={[styles.pickerItemText, { color: colors.pickerText }, m === selectedDate.getMonth() && { color: colors.pickerTextSelected }]}>{m + 1}月</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <View style={[styles.selectionHighlight, { backgroundColor: colors.pickerHighlight }]} pointerEvents="none" />
              <ScrollView ref={dayScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => handleScrollEnd(e, 'day')} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {days.map((d, index) => (
                  <TouchableOpacity key={`d-${d}`} style={styles.pickerItem} activeOpacity={0.7} onPress={() => handleSelect(d, index, 'day')}>
                    <Text style={[styles.pickerItemText, { color: colors.pickerText }, d === selectedDate.getDate() && { color: colors.pickerTextSelected }]}>{d}日</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🌟 新增：地點歷史紀錄選單 */}
      <Modal visible={isLocationModalVisible} transparent={true} animationType="slide">
        <View style={styles.bottomModalOverlay}>
          <TouchableOpacity style={styles.bottomModalBgClose} activeOpacity={1} onPress={() => setIsLocationModalVisible(false)} />
          <View style={styles.bottomModalCard}>
            <Text style={styles.bottomModalTitle}>選擇去過的地點</Text>
            <ScrollView style={{maxHeight: 250}} showsVerticalScrollIndicator={false}>
              {recentLocations.length > 0 ? (
                recentLocations.map((loc, idx) => (
                  <TouchableOpacity key={idx} style={styles.locationOptionBtn} onPress={() => { setLocation(loc); setIsLocationModalVisible(false); }}>
                    <Ionicons name="cafe-outline" size={18} color={colors.primaryText} style={{marginRight: 12}} />
                    <Text style={styles.locationOptionText}>{loc}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{color: colors.grayText, textAlign: 'center', padding: 20}}>還沒有地點紀錄喔，請直接輸入！☕️</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25 },
  titleInput: { fontSize: 22, fontWeight: 'bold', color: colors.text, padding: 0, flex: 1 },
  timeText: { fontSize: 10, color: colors.grayText, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 25 },
  thumbnailBox: { width: 80, height: 80, backgroundColor: colors.secondary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailText: { fontSize: 12, color: colors.grayText, fontWeight: 'bold' },
  metaColumn: { flex: 1, justifyContent: 'center', paddingTop: 5 },
  
  // 地點列與下拉按鈕
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationInput: { fontSize: 13, color: colors.grayText, marginLeft: 4, padding: 0, flex: 1 },
  dropdownBtn: { paddingHorizontal: 5 },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingNumber: { fontSize: 12, color: colors.grayText, marginLeft: 8, fontWeight: 'bold' },
  doneButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  doneButtonText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  tagRow: { flexDirection: 'row', marginBottom: 25 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  tagInput: { fontSize: 13, color: colors.tagText, padding: 0, marginRight: 5, minWidth: 60, fontWeight: 'bold' },
  noteTextArea: { fontSize: 15, color: colors.text, lineHeight: 24, textAlignVertical: 'top', minHeight: 150 },
  largeImageUploadBox: { width: '100%', height: 200, backgroundColor: colors.secondary, borderRadius: 15, overflow: 'hidden', marginTop: 15 },
  largeImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  largeImageText: { color: colors.grayText, marginTop: 10, fontSize: 14, fontWeight: 'bold' },
  largeImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  // --- Date Picker Modal ---
  modalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.1)' },
  pickerCard: { flexDirection: 'row', borderRadius: 25, width: '90%', height: ITEM_HEIGHT * 3, paddingHorizontal: 5, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, overflow: 'hidden', zIndex: 1 },
  pickerColumn: { flex: 1, height: '100%', position: 'relative' },
  selectionHighlight: { position: 'absolute', top: ITEM_HEIGHT, left: 5, right: 5, height: ITEM_HEIGHT, borderRadius: 20 },
  pickerItem: { height: ITEM_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'center' },
  pickerItemText: { fontSize: 18, fontWeight: 'bold' },
  pickerItemTextSelected: { fontSize: 20, fontWeight: '900' },

  // --- Location Selection Modal ---
  bottomModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  bottomModalBgClose: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  bottomModalCard: { backgroundColor: colors.white, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40, width: '100%' },
  bottomModalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15, textAlign: 'center' },
  locationOptionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  locationOptionText: { fontSize: 16, color: colors.text }
});