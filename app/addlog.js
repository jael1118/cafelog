import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Image, Modal, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const colors = {
  primary: '#FCA5F1',         
  secondary: '#EBE5F5',       
  background: '#F8F8FC',      
  text: '#666666',            
  grayText: '#A0A0A0',        
  white: '#FFFFFF',
  heart: '#E0E0E0',           
  heartActive: '#D0C0ED',     
  tagText: '#9B7ED9',         
  
  pickerBg: '#FFFFFF',        
  pickerHighlight: '#EBE5F5', 
  pickerText: '#D0C0ED',      
  pickerTextSelected: '#9B7ED9',
  primaryText: '#9B7ED9',     
};

const ITEM_HEIGHT = 40;

export default function AddLogScreen() {
  const router = useRouter();
  const { editLogData, prefillLocation } = useLocalSearchParams(); 

  const [editId, setEditId] = useState(null); 
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState(null); 
  
  const [largeImageUris, setLargeImageUris] = useState([]); 
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const yearScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const [days, setDays] = useState(Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, i) => i + 1));

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    const fetchRecentLocations = async () => {
      try {
        const existingLogsJson = await AsyncStorage.getItem('cafe_logs');
        if (existingLogsJson) {
          const logs = JSON.parse(existingLogsJson);
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
        setTitle(log.title === '無標題' ? '' : (log.title || ''));
        setLocation(log.location || '');
        setRating(log.rating || 0);
        setTags(log.tags || '');
        setNote(log.note || '');
        setImageUri(log.imageUrl || null);
        
        if (log.largeImageUrl) {
            setLargeImageUris([log.largeImageUrl]);
        } else if (log.largeImageUris) {
            setLargeImageUris(log.largeImageUris);
        }
        
        if (log.date && log.displayTime) {
          const dateParts = log.date.split('-');
          const timeMatch = log.displayTime.match(/ (\d{2}):(\d{2})/);
          let h = 0, m = 0;
          if(timeMatch) {
              h = parseInt(timeMatch[1]);
              m = parseInt(timeMatch[2]);
          }
          setSelectedDate(new Date(dateParts[0], parseInt(dateParts[1]) - 1, dateParts[2], h, m));
        }
      } catch (error) {
        console.error("解析編輯資料失敗", error);
      }
    } 
    else if (prefillLocation) {
        setLocation(prefillLocation);
    }
  }, [editLogData, prefillLocation]);

  useEffect(() => {
    const daysCount = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
    setDays(Array.from({ length: daysCount }, (_, i) => i + 1));
    if (selectedDate.getDate() > daysCount) {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), daysCount, selectedDate.getHours(), selectedDate.getMinutes()));
    }
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  useEffect(() => {
    if (isDatePickerVisible) {
      setTimeout(() => {
        const yIndex = years.indexOf(selectedDate.getFullYear());
        const mIndex = selectedDate.getMonth();
        const dIndex = selectedDate.getDate() - 1;
        const hIndex = selectedDate.getHours();
        const minIndex = selectedDate.getMinutes();
        
        yearScrollRef.current?.scrollTo({ y: yIndex * ITEM_HEIGHT, animated: false });
        monthScrollRef.current?.scrollTo({ y: mIndex * ITEM_HEIGHT, animated: false });
        dayScrollRef.current?.scrollTo({ y: dIndex * ITEM_HEIGHT, animated: false });
        hourScrollRef.current?.scrollTo({ y: hIndex * ITEM_HEIGHT, animated: false });
        minuteScrollRef.current?.scrollTo({ y: minIndex * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [isDatePickerVisible]);

  const handleScrollEnd = (event, type) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    if (type === 'year' && years[index]) setSelectedDate(prev => new Date(years[index], prev.getMonth(), prev.getDate(), prev.getHours(), prev.getMinutes()));
    if (type === 'month' && months[index] !== undefined) setSelectedDate(prev => new Date(prev.getFullYear(), months[index], prev.getDate(), prev.getHours(), prev.getMinutes()));
    if (type === 'day' && days[index]) setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), days[index], prev.getHours(), prev.getMinutes()));
    if (type === 'hour' && hours[index] !== undefined) setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), hours[index], prev.getMinutes()));
    if (type === 'minute' && minutes[index] !== undefined) setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), prev.getHours(), minutes[index]));
  };

  const handleSelect = (val, index, type) => {
    if (type === 'year') {
      setSelectedDate(prev => new Date(val, prev.getMonth(), prev.getDate(), prev.getHours(), prev.getMinutes()));
      yearScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    if (type === 'month') {
      setSelectedDate(prev => new Date(prev.getFullYear(), val, prev.getDate(), prev.getHours(), prev.getMinutes()));
      monthScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    if (type === 'day') {
      setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), val, prev.getHours(), prev.getMinutes()));
      dayScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    if (type === 'hour') {
      setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), val, prev.getMinutes()));
      hourScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    if (type === 'minute') {
      setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), prev.getHours(), val));
      minuteScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
  };

  const formattedDateOnly = `${selectedDate.getFullYear()}年${String(selectedDate.getMonth() + 1).padStart(2, '0')}月${String(selectedDate.getDate()).padStart(2, '0')}日`;
  const formattedTimeOnly = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;
  const formattedTimeFull = `${formattedDateOnly} ${formattedTimeOnly}`;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const openCameraForLargeImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
      quality: 0.8,
    });
    if (!result.canceled) setLargeImageUris(prev => [...prev, result.assets[0].uri]);
  };

  const openLibraryForLargeImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, 
      quality: 0.8,
    });
    if (!result.canceled) setLargeImageUris(prev => [...prev, result.assets[0].uri]);
  };

  const removeLargeImage = (indexToRemove) => {
      setLargeImageUris(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveLog = async () => {
    try {
      const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      const finalTitle = title.trim() ? title : '無標題';

      const newLog = {
        id: editId ? editId : Date.now().toString(),
        date: dateString,
        title: finalTitle,
        location: location,
        rating: rating,
        tags: tags,
        note: note,
        imageUrl: imageUri,
        largeImageUris: largeImageUris, 
        displayTime: formattedTimeFull
      };

      const existingLogsJson = await AsyncStorage.getItem('cafe_logs');
      let currentLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];

      if (editId) {
        const index = currentLogs.findIndex(l => l.id === editId);
        if (index !== -1) currentLogs[index] = newLog;
        else currentLogs.unshift(newLog);
      } else {
        currentLogs.unshift(newLog);
      }

      await AsyncStorage.setItem('cafe_logs', JSON.stringify(currentLogs));
      
      if (editId) router.replace('/'); 
      else router.back();

    } catch (error) {
      console.error('儲存失敗', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.topNavRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setIsDatePickerVisible(true)}>
              <Text style={styles.timeText}>{formattedTimeFull}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneButton} onPress={handleSaveLog}>
              <Text style={styles.doneButtonText}>完成</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mainInfoContainer}>
            <TouchableOpacity style={styles.largeThumbnailBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.largeThumbnailImage} />
              ) : (
                <Text style={styles.largeThumbnailText}>選擇縮圖</Text>
              )}
            </TouchableOpacity>

            <View style={styles.rightInfoColumn}>
              <TextInput
                style={styles.titleInput}
                placeholder="請輸入標題"
                placeholderTextColor={colors.grayText}
                value={title}
                onChangeText={setTitle}
              />
              
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color={colors.grayText} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="選擇地點..."
                  placeholderTextColor={colors.grayText}
                  value={location}
                  onChangeText={setLocation}
                />
                <TouchableOpacity onPress={() => setIsLocationModalVisible(true)} style={styles.dropdownBtn}>
                  <Ionicons name="chevron-down-circle" size={16} color={colors.grayText} />
                </TouchableOpacity>
              </View>

              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((heart) => (
                  <TouchableOpacity key={heart} onPress={() => setRating(heart)}>
                    <Ionicons 
                      name={heart <= rating ? "heart" : "heart"} 
                      size={14} 
                      color={heart <= rating ? colors.heartActive : colors.heart} 
                      style={{ marginRight: 4 }}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
              </View>

              <View style={styles.tagRow}>
                <View style={styles.tagBadge}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="關鍵字..."
                    placeholderTextColor={colors.tagText}
                    value={tags}
                    onChangeText={setTags}
                  />
                  <Ionicons name="pencil" size={12} color={colors.tagText} />
                </View>
              </View>
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

          <View style={styles.imagesContainer}>
              {largeImageUris.map((uri, index) => (
                  <View key={index} style={styles.largeImageDisplayBox}>
                     <Image source={{ uri: uri }} style={styles.largeImage} />
                     <TouchableOpacity 
                       style={styles.removeImageBtn} 
                       onPress={() => removeLargeImage(index)}
                     >
                       <Ionicons name="close" size={16} color={colors.white} />
                     </TouchableOpacity>
                  </View>
              ))}
          </View>

          <View style={{height: 100}} /> 
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomToolbar, { bottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={openCameraForLargeImage}>
           <Ionicons name="camera-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={openLibraryForLargeImage}>
           <Ionicons name="image-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

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

            <View style={styles.pickerColumn}>
              <View style={[styles.selectionHighlight, { backgroundColor: colors.pickerHighlight }]} pointerEvents="none" />
              <ScrollView ref={hourScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => handleScrollEnd(e, 'hour')} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {hours.map((h, index) => (
                  <TouchableOpacity key={`h-${h}`} style={styles.pickerItem} activeOpacity={0.7} onPress={() => handleSelect(h, index, 'hour')}>
                    <Text style={[styles.pickerItemText, { color: colors.pickerText }, h === selectedDate.getHours() && { color: colors.pickerTextSelected }]}>{String(h).padStart(2, '0')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <View style={[styles.selectionHighlight, { backgroundColor: colors.pickerHighlight }]} pointerEvents="none" />
              <ScrollView ref={minuteScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => handleScrollEnd(e, 'minute')} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {minutes.map((m, index) => (
                  <TouchableOpacity key={`min-${m}`} style={styles.pickerItem} activeOpacity={0.7} onPress={() => handleSelect(m, index, 'minute')}>
                    <Text style={[styles.pickerItemText, { color: colors.pickerText }, m === selectedDate.getMinutes() && { color: colors.pickerTextSelected }]}>{String(m).padStart(2, '0')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

          </View>
        </View>
      </Modal>

      <Modal visible={isLocationModalVisible} transparent={true} animationType="fade">
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity style={styles.centerModalBgClose} activeOpacity={1} onPress={() => setIsLocationModalVisible(false)} />
          <View style={styles.centerModalCard}>
            <Text style={styles.centerModalTitle}>選擇去過的地點</Text>
            <ScrollView style={{maxHeight: 250}} showsVerticalScrollIndicator={false}>
              {recentLocations.length > 0 ? (
                recentLocations.map((loc, idx) => (
                  <TouchableOpacity key={idx} style={styles.locationOptionBtn} onPress={() => { setLocation(loc); setIsLocationModalVisible(false); }}>
                    <Ionicons name="cafe-outline" size={16} color={colors.primaryText} style={{marginRight: 10}} />
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
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, paddingHorizontal: 25, paddingTop: 15 },
  
  topNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  timeText: { fontSize: 12, color: colors.primaryText, fontWeight: '600' },
  doneButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  doneButtonText: { color: colors.white, fontSize: 13, fontWeight: 'bold' },

  mainInfoContainer: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 20 },
  // 🌟 關鍵修改：將尺寸由 110 改為 140
  largeThumbnailBox: { width: 140, height: 140, backgroundColor: '#E0E0E0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  largeThumbnailImage: { width: '100%', height: '100%' },
  largeThumbnailText: { fontSize: 12, color: colors.text, fontWeight: 'bold' },
  
  rightInfoColumn: { flex: 1, justifyContent: 'center', paddingVertical: 2 },
  titleInput: { fontSize: 16, fontWeight: 'bold', color: colors.text, padding: 0, marginBottom: 8 },
  
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationInput: { fontSize: 12, color: colors.grayText, marginLeft: 4, padding: 0, flex: 1 },
  dropdownBtn: { padding: 2 }, 
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingNumber: { fontSize: 10, color: colors.grayText, marginLeft: 8, fontWeight: 'bold' },
  
  tagRow: { flexDirection: 'row' },
  tagBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
  tagInput: { fontSize: 10, color: colors.tagText, padding: 0, marginRight: 5, minWidth: 40, fontWeight: 'bold' },

  noteTextArea: { fontSize: 14, color: colors.text, lineHeight: 24, textAlignVertical: 'top', minHeight: 100, marginTop: 10 },
  
  imagesContainer: { marginTop: 10 },
  largeImageDisplayBox: { width: '100%', height: 220, borderRadius: 15, overflow: 'hidden', marginBottom: 15 },
  largeImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.4)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  bottomToolbar: { position: 'absolute', left: 0, right: 0, height: 50, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderTopWidth: 1, borderTopColor: '#EBE5F5' },
  toolbarBtn: { padding: 10, marginRight: 5 },

  modalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.1)' },
  pickerCard: { flexDirection: 'row', borderRadius: 25, width: '95%', height: ITEM_HEIGHT * 3, paddingHorizontal: 5, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, overflow: 'hidden', zIndex: 1 },
  pickerColumn: { flex: 1, height: '100%', position: 'relative' },
  selectionHighlight: { position: 'absolute', top: ITEM_HEIGHT, left: 2, right: 2, height: ITEM_HEIGHT, borderRadius: 20 },
  pickerItem: { height: ITEM_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'center' },
  pickerItemText: { fontSize: 14, fontWeight: 'bold' },
  pickerItemTextSelected: { fontSize: 16, fontWeight: '900' },

  centerModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerModalBgClose: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.05)' }, 
  centerModalCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20, width: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  centerModalTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 15, textAlign: 'center' },
  locationOptionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8FC' },
  locationOptionText: { fontSize: 14, color: colors.text }
});