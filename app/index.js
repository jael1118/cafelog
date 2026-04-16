import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, SafeAreaView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, useFocusEffect } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const colors = {
  primary: '#A078D2',         
  secondary: '#E7D7FB',       
  background: '#F8F8FC',      
  text: '#4A4A4A',            
  grayText: '#888888',        
  white: '#FFFFFF',
  pastDateBg: '#F6F1FD',      
  pastDateText: '#888888',    
  
  pickerBg: '#FFFFFF',        
  pickerHighlight: '#EBE5F5', 
  pickerText: '#D0C0ED',      
  pickerTextSelected: '#9B7ED9'
};

const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
const ITEM_HEIGHT = 46;

export default function HomeScreen() { 

  const [isShowSplash, setIsShowSplash] = useState(true);

  // 🌟 2. 倒數 2 秒後，優雅地把啟動畫面關掉
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowSplash(false);
    }, 2000); 
    return () => clearTimeout(timer);
  }, []);
  
  const router = useRouter();
  const pathname = usePathname();

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [calendarDates, setCalendarDates] = useState([]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  
  const [randomLog, setRandomLog] = useState(null); 

 const [logs, setLogs] = useState([]);
  // 🌟 1. 將原本的 randomLog 改成陣列，用來裝 3 個回顧
  const [reviewLogs, setReviewLogs] = useState([]); 
  
  const yearScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const realToday = new Date();

  useFocusEffect(
    useCallback(() => {
      const fetchLogs = async () => {
        try {
          const storedLogs = await AsyncStorage.getItem('cafe_logs');
          if (storedLogs) {
            const parsedLogs = JSON.parse(storedLogs);
            setLogs(parsedLogs); 
            
            const logsWithImages = parsedLogs.filter(log => log.imageUrl);
            if (logsWithImages.length > 0) {
              // 🌟 2. 將有照片的紀錄隨機打亂，然後取前 3 筆
              const shuffled = [...logsWithImages].sort(() => 0.5 - Math.random());
              setReviewLogs(shuffled.slice(0, 3));
            } else {
              setReviewLogs([]);
            }
          }
        } catch (error) {
          console.error("讀取紀錄失敗", error);
        }
      };
      fetchLogs();
    }, [])
  );

  const stats = {
    total: logs.length, 
    thisYear: logs.filter(log => {
      if (!log.date) return false;
      return log.date.startsWith(currentDate.getFullYear().toString());
    }).length,
    thisMonth: logs.filter(log => {
      if (!log.date) return false;
      const prefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      return log.date.startsWith(prefix);
    }).length,
  };

  const currentYear = realToday.getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const datesArray = [];
    for (let i = 0; i < firstDayOfWeek; i++) datesArray.push(0);
    for (let i = 1; i <= daysInMonth; i++) datesArray.push(i);
    while (datesArray.length % 7 !== 0) datesArray.push(0);

    setCalendarDates(datesArray);
  }, [currentDate]);

  useEffect(() => {
    if (isPickerVisible) {
      setTimeout(() => {
        const yIndex = years.indexOf(currentDate.getFullYear());
        const mIndex = currentDate.getMonth();
        yearScrollRef.current?.scrollTo({ y: yIndex * ITEM_HEIGHT, animated: false });
        monthScrollRef.current?.scrollTo({ y: mIndex * ITEM_HEIGHT, animated: false });
      }, 50); 
    }
  }, [isPickerVisible]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleYearSelect = (y, index) => {
    setCurrentDate(prev => new Date(y, prev.getMonth(), 1));
    yearScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  };

  const handleMonthSelect = (m, index) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), m, 1));
    monthScrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  };

  const renderDateCell = ({ item: day, index }) => {
    if (day === 0) return <View style={styles.calendarCellEmpty} key={`empty-${index}`} />;

    const cellDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasLog = logs.some(log => log.date === cellDateStr);
    
    const cellDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const todayZeroTime = new Date(realToday.getFullYear(), realToday.getMonth(), realToday.getDate());

    const isToday = cellDateObj.getTime() === todayZeroTime.getTime();
    const isPast = cellDateObj.getTime() < todayZeroTime.getTime();

    return (
      <TouchableOpacity 
        style={styles.calendarCellContainer} 
        key={`day-${index}`}
        onPress={() => router.push({ pathname: '/logbook', params: { filterDate: cellDateStr } })}
      >
        <View style={[
          styles.calendarDayBackground, 
          isToday && styles.todayBackground,
          isPast && !isToday && styles.pastBackground
        ]}>
          <Text style={[
            styles.calendarDayText, 
            isToday && styles.todayText, 
            hasLog && styles.logDayText,
            isPast && !isToday && styles.pastText
          ]}>{day}</Text>
        </View>
        {hasLog && (
          <View style={styles.logIconContainer}>
            <Ionicons name="cafe" size={10} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  
  return (
    <SafeAreaView style={styles.container}>
      {/* 🌟 修改 1：拿掉外層的固定 header，移到 ScrollView 裡面 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 🌟 移進來的 header */}
        <View style={styles.header}>
          {/* 🌟 修改 2：將 fontSize 改為 18，與其他區塊標題統一 */}
          <Text style={styles.sectionTitle}>統計資料</Text>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatsCard label="累積" value={stats.total} unit="咖" />
            <StatsCard label="這年" value={stats.thisYear} unit="咖" />
            <StatsCard label="這月" value={stats.thisMonth} unit="咖" />
          </View>
        </View>

        <View style={styles.calendarWrapper}>
          <View style={styles.monthHeaderRow}>
            <Text style={styles.sectionTitle}>月曆</Text>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={handlePrevMonth}><Ionicons name="chevron-back" size={16} color={colors.text} /></TouchableOpacity>
              <TouchableOpacity style={styles.monthBadge} onPress={() => setIsPickerVisible(true)}>
                <Text style={styles.monthLabel}>{`${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextMonth}><Ionicons name="chevron-forward" size={16} color={colors.text} /></TouchableOpacity>
            </View>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.daysOfWeekRow}>
              {daysOfWeek.map((day, idx) => (<Text key={idx} style={styles.dayOfWeekText}>{day}</Text>))}
            </View>
            <FlatList
              data={calendarDates}
              renderItem={renderDateCell}
              keyExtractor={(item, index) => index.toString()}
              numColumns={7}
              scrollEnabled={false}
            />
          </View>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 25 }]}>回顧</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewScrollContent}>
            
            {/* 🌟 修改 4：用 map 自動把陣列裡的 3 個回顧渲染出來 */}
            {reviewLogs.length > 0 ? (
              reviewLogs.map((log, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.reviewCard}
                  onPress={() => router.push({ pathname: '/log', params: { id: log.id } })}
                >
                  <Image source={{ uri: log.imageUrl }} style={styles.reviewImage} />
                  <View style={styles.reviewOverlay}>
                    <View style={styles.reviewStarBadge}>
                       <Ionicons name="star-outline" size={14} color={colors.white} />
                    </View>
                    <View style={styles.reviewDateBadge}>
                      <Text style={styles.reviewDateMonth}>{new Date(log.date).getMonth() + 1}月</Text>
                      <Text style={styles.reviewDateDay}>{String(new Date(log.date).getDate()).padStart(2, '0')}</Text>
                    </View>
                    <View style={styles.reviewLocationContainer}>
                       <Ionicons name="location-outline" size={12} color={colors.white} />
                       <Text style={styles.reviewLocationText} numberOfLines={1}>{log.location || '秘密基地'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
               <View style={styles.emptyReviewCard}>
                  <Text style={{color: colors.grayText}}>還沒有可以回顧的照片喔☕️</Text>
               </View>
            )}
          </ScrollView>
        </View>
        
        <View style={{height: 100}} /> 
      </ScrollView>

      <Modal visible={isPickerVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsPickerVisible(false)} />
          <View style={[styles.pickerCard, { backgroundColor: colors.pickerBg }]}>
            <View style={styles.pickerColumn}>
              <View style={styles.selectionHighlight} pointerEvents="none" />
              <ScrollView ref={yearScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                if (years[idx]) setCurrentDate(prev => new Date(years[idx], prev.getMonth(), 1));
              }} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {years.map((y, index) => (
                  <TouchableOpacity key={y} style={styles.pickerItem} onPress={() => handleYearSelect(y, index)}>
                    <Text style={[styles.pickerItemText, { color: colors.pickerText }, y === currentDate.getFullYear() && { color: colors.pickerTextSelected }]}>{y}年</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.pickerColumn}>
              <View style={styles.selectionHighlight} pointerEvents="none" />
              <ScrollView ref={monthScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                if (months[idx] !== undefined) setCurrentDate(prev => new Date(prev.getFullYear(), months[idx], 1));
              }} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {months.map((m, index) => (
                  <TouchableOpacity key={m} style={styles.pickerItem} onPress={() => handleMonthSelect(m, index)}>
                    <Text style={[styles.pickerItemText, { color: colors.pickerText }, m === currentDate.getMonth() && { color: colors.pickerTextSelected }]}>{m + 1}月</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
            <View style={styles.tabItemActiveBg}>
               <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.tabText, styles.tabTextActive]}>主頁</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/map')}>
            <Ionicons name="map-outline" size={22} color={colors.grayText} />
             <Text style={styles.tabText}>地圖</Text>
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

    </SafeAreaView>
  );
}

const StatsCard = ({ label, value, unit }) => (
  <View style={styles.statsCard}>
    <View style={styles.statsLabelRow}>
       <Text style={styles.statsLabel}>{label}</Text>
    </View>
    <View style={styles.statsValueContainer}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsUnit}>{unit}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // 🌟 修改 1：拿掉頂部多餘的推擠
  header: { paddingTop: 20, paddingHorizontal: 25, paddingBottom: 15 },
  content: { flex: 1 },
  
  statsSection: { paddingHorizontal: 25, marginBottom: 25 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statsCard: { backgroundColor: colors.white, borderRadius: 20, padding: 15, width: '31%', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  statsLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statsLabel: { fontSize: 12, color: colors.text, fontWeight: 'bold' },
  statsValueContainer: { flexDirection: 'row', alignItems: 'baseline' },
  statsValue: { fontSize: 36, fontWeight: 'bold', color: colors.primary }, 
  statsUnit: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 6 },
  
  calendarWrapper: { paddingHorizontal: 25, marginBottom: 30 },
  monthHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  // 🌟 修改 2：統一大標題為 18
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  monthSelector: { flexDirection: 'row', alignItems: 'center' },
  monthBadge: { backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, marginHorizontal: 8 }, 
  monthLabel: { fontSize: 13, fontWeight: 'bold', color: colors.text },
  
  calendarContainer: { backgroundColor: colors.white, borderRadius: 25, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  daysOfWeekRow: { flexDirection: 'row', marginBottom: 15 },
  dayOfWeekText: { flex: 1, textAlign: 'center', color: colors.pickerText, fontSize: 11, fontWeight: 'bold' }, 
  calendarCellContainer: { flex: 1, height: 45, justifyContent: 'center', alignItems: 'center' },
  calendarCellEmpty: { flex: 1, height: 45 },
  
  calendarDayBackground: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  todayBackground: { backgroundColor: colors.secondary }, 
  pastBackground: { backgroundColor: colors.pastDateBg }, 
  
  calendarDayText: { fontSize: 14, color: colors.text },
  todayText: { fontWeight: 'bold', color: colors.primary },
  pastText: { color: colors.pastDateText }, 
  logDayText: { fontWeight: 'bold' },
  
  logIconContainer: { position: 'absolute', bottom: 2, right: 8 },
  
  reviewSection: { marginBottom: 20 }, 
  // 🌟 修改：將左側推擠移到這裡，並讓右側也留空間
  reviewScrollContent: { paddingLeft: 25, paddingRight: 25, marginTop: 15 }, 
  
  // 🌟 修改：卡片改窄一點 (165 -> 140)，比例更漂亮，一次能顯示更多
  reviewCard: { width: 250, height: 200, borderRadius: 15, overflow: 'hidden', marginRight: 15, backgroundColor: colors.white },  reviewImage: { width: '100%', height: '100%' },
  reviewOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', padding: 10, backgroundColor: 'rgba(0,0,0,0.1)' },
  reviewDateBadge: { width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, alignSelf: 'flex-start', alignItems: 'center' },
  reviewDateMonth: { fontSize: 10, fontWeight: 'bold', color: colors.text, },
  reviewDateDay: { fontSize: 18, fontWeight: '900', color: colors.text,  },
  
  reviewStarBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'transparent' },
  
  reviewLocationContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingRight: 10 },
  reviewLocationText: { color: colors.white, fontSize: 10, fontWeight: 'bold', marginLeft: 2, flex: 1 },
  // 🌟 修改 3：空卡片寬度也對齊 165
  emptyReviewCard: { width: 140, height: 180, borderRadius: 15, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' },
  tabBarWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' },
  tabBar: { flexDirection: 'row', height: 85, backgroundColor: colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 10, paddingHorizontal: 15 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 15 },
  tabItemActiveBg: { backgroundColor: colors.secondary, width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginTop: -8, marginBottom: 2 },
  tabText: { fontSize: 10, color: colors.grayText, marginTop: 4, fontWeight: 'bold' },
  tabTextActive: { color: colors.primary },

  modalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.2)' },
  pickerCard: { flexDirection: 'row', borderRadius: 25, width: '85%', height: ITEM_HEIGHT * 3, paddingHorizontal: 10, elevation: 8, overflow: 'hidden' },
  pickerColumn: { flex: 1, height: '100%', position: 'relative' },
  selectionHighlight: { backgroundColor:colors.pickerHighlight, position: 'absolute', top: ITEM_HEIGHT, left: 10, right: 10, height: ITEM_HEIGHT, borderRadius: 20 },
  pickerItem: { height: ITEM_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'center' },
  pickerItemText: { fontSize: 18, fontWeight: 'bold' },
});