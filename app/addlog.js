import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, ScrollView, Platform, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const colors = {
  primary: '#8D6E63', secondary: '#F5EEDC', background: '#FFFFFF', text: '#5D4037', accent: '#E0DCD3', grayText: '#9E9E9E', white: '#FFFFFF', tagBg: '#F4ECE4'
};

const ITEM_HEIGHT = 46;

export default function AddLogScreen() {
  const router = useRouter();

  // --- 表單狀態 ---
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [imageUri, setImageUri] = useState(null);
  
  // --- 時間與輪盤狀態 ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const yearScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const dayScrollRef = useRef(null);

  // 產生滾輪的資料 (年、月、日)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  // 動態計算該月有幾天
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const [days, setDays] = useState(Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, i) => i + 1));

  // 當年月改變時，重新計算那個月有幾天 (例如閏年 2 月有 29 天)
  useEffect(() => {
    const daysCount = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth());
    setDays(Array.from({ length: daysCount }, (_, i) => i + 1));
    
    // 如果原本選 31 號，但切換到 2 月，要把日期拉回 28 號
    if (selectedDate.getDate() > daysCount) {
      setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), daysCount));
    }
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  // 打開輪盤時，自動捲動到選中的日期
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

  // --- 滾輪停止時的更新邏輯 ---
  const handleScrollEnd = (event, type) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    if (type === 'year' && years[index]) setSelectedDate(prev => new Date(years[index], prev.getMonth(), prev.getDate()));
    if (type === 'month' && months[index] !== undefined) setSelectedDate(prev => new Date(prev.getFullYear(), months[index], prev.getDate()));
    if (type === 'day' && days[index]) setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth(), days[index]));
  };

  // --- 點擊選項時的動畫滑動 ---
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

  // 格式化顯示時間
  const formattedTime = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 ${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('需要權限', '請允許 App 存取您的相簿才能上傳咖啡美照喔！📷');
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

  const handleSaveLog = async () => {
    if (!title.trim()) {
      Alert.alert('提醒', '請輸入標題唷！✏️');
      return;
    }
    try {
      // 🌟 存入你自訂的日期
      const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      const newLog = {
        id: Date.now().toString(),
        date: dateString,
        title: title,
        location: location,
        rating: rating,
        tags: tags,
        note: note,
        imageUrl: imageUri,
        displayTime: formattedTime
      };

      const existingLogsJson = await AsyncStorage.getItem('cafe_logs');
      let currentLogs = existingLogsJson ? JSON.parse(existingLogsJson) : [];
      currentLogs.unshift(newLog);

      await AsyncStorage.setItem('cafe_logs', JSON.stringify(currentLogs));
      router.back();

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
              placeholderTextColor={colors.text}
              value={title}
              onChangeText={setTitle}
            />
            {/* 🌟 讓時間變成可以點擊的按鈕 */}
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
                  placeholder="選擇地點..."
                  placeholderTextColor={colors.grayText}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((heart) => (
                  <TouchableOpacity key={heart} onPress={() => setRating(heart)}>
                    <Ionicons 
                      name={heart <= rating ? "heart" : "heart"} 
                      size={18} 
                      color={heart <= rating ? "#E5B8B8" : "#E0E0E0"} 
                      style={{ marginRight: 4 }}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={handleSaveLog}>
              <Text style={styles.doneButtonText}>完成</Text>
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
              <Ionicons name="pencil" size={12} color={colors.grayText} />
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

        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- 🌟 完美還原的三環滾輪選擇器 --- */}
      <Modal visible={isDatePickerVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsDatePickerVisible(false)} />
          
          <View style={styles.pickerCard}>
            
            {/* 固定的選中框亮色背景 */}
            <View style={styles.selectionHighlight} pointerEvents="none" />
            
            {/* 年份滾輪 */}
            <View style={styles.pickerColumn}>
              <ScrollView ref={yearScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => handleScrollEnd(e, 'year')} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {years.map((y, index) => (
                  <TouchableOpacity key={`y-${y}`} style={styles.pickerItem} activeOpacity={0.7} onPress={() => handleSelect(y, index, 'year')}>
                    <Text style={[styles.pickerItemText, y === selectedDate.getFullYear() && styles.pickerItemTextSelected]}>{y}年</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 月份滾輪 */}
            <View style={styles.pickerColumn}>
              <ScrollView ref={monthScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => handleScrollEnd(e, 'month')} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {months.map((m, index) => (
                  <TouchableOpacity key={`m-${m}`} style={styles.pickerItem} activeOpacity={0.7} onPress={() => handleSelect(m, index, 'month')}>
                    <Text style={[styles.pickerItemText, m === selectedDate.getMonth() && styles.pickerItemTextSelected]}>{m + 1}月</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 日期滾輪 */}
            <View style={styles.pickerColumn}>
              <ScrollView ref={dayScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => handleScrollEnd(e, 'day')} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {days.map((d, index) => (
                  <TouchableOpacity key={`d-${d}`} style={styles.pickerItem} activeOpacity={0.7} onPress={() => handleSelect(d, index, 'day')}>
                    <Text style={[styles.pickerItemText, d === selectedDate.getDate() && styles.pickerItemTextSelected]}>{d}日</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

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
  thumbnailBox: { width: 80, height: 80, backgroundColor: colors.accent, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailText: { fontSize: 12, color: colors.grayText, fontWeight: 'bold' },
  metaColumn: { flex: 1, justifyContent: 'center', paddingTop: 5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationInput: { fontSize: 13, color: colors.grayText, marginLeft: 4, padding: 0, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingNumber: { fontSize: 12, color: colors.grayText, marginLeft: 8, fontWeight: 'bold' },
  doneButton: { backgroundColor: colors.secondary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  doneButtonText: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  tagRow: { flexDirection: 'row', marginBottom: 25 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.tagBg, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  tagInput: { fontSize: 13, color: colors.text, padding: 0, marginRight: 5, minWidth: 60 },
  noteTextArea: { fontSize: 15, color: colors.text, lineHeight: 24, textAlignVertical: 'top', minHeight: 200 },

  // --- Modal 與滾輪專屬樣式 ---
  modalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.1)' },
  pickerCard: { flexDirection: 'row', backgroundColor: '#D7CCC8', borderRadius: 25, width: '90%', height: ITEM_HEIGHT * 3, paddingHorizontal: 5, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, overflow: 'hidden', zIndex: 1 },
  pickerColumn: { flex: 1, height: '100%', position: 'relative' },
  selectionHighlight: { position: 'absolute', top: ITEM_HEIGHT, left: 5, right: 5, height: ITEM_HEIGHT, backgroundColor: '#F5EEDC', borderRadius: 20 },
  pickerItem: { height: ITEM_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'center' },
  pickerItemText: { fontSize: 18, color: '#A1887F', fontWeight: 'bold' },
  pickerItemTextSelected: { color: '#5D4037', fontSize: 20 }
});