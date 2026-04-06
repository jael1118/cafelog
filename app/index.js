import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, SafeAreaView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, useFocusEffect } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const colors = {
  primary: '#8D6E63', secondary: '#F5EEDC', background: '#FFFFFF',
  text: '#5D4037', accent: '#D7CCC8', white: '#FFFFFF',
};

const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
const ITEM_HEIGHT = 46;

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [calendarDates, setCalendarDates] = useState([]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  
  const [logs, setLogs] = useState([]);
  
  const yearScrollRef = useRef(null);
  const monthScrollRef = useRef(null);

  const realToday = new Date();

  useFocusEffect(
    useCallback(() => {
      const fetchLogs = async () => {
        try {
          const storedLogs = await AsyncStorage.getItem('cafe_logs');
          if (storedLogs) {
            setLogs(JSON.parse(storedLogs)); 
          }
        } catch (error) {
          console.error("讀取紀錄失敗", error);
        }
      };
      fetchLogs();
    }, [])
  );

  // === 📊 修正：統計資料改為跟隨「目前查看的 currentDate」連動 ===
  const stats = {
    total: logs.length, // 總數不變，永遠是所有紀錄
    thisYear: logs.filter(log => {
      if (!log.date) return false;
      // 改為比對「目前月曆顯示的年份」
      return log.date.startsWith(currentDate.getFullYear().toString());
    }).length,
    thisMonth: logs.filter(log => {
      if (!log.date) return false;
      // 改為比對「目前月曆顯示的年-月」
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
    
    const isToday = realToday.getFullYear() === currentDate.getFullYear() && 
                    realToday.getMonth() === currentDate.getMonth() && 
                    realToday.getDate() === day;

    return (
      <TouchableOpacity 
        style={styles.calendarCellContainer} 
        key={`day-${index}`}
        // 🌟 保留你修改過的跳轉路徑 '/log'
        onPress={() => { if (hasLog) router.push({ pathname: '/log', params: { date: cellDateStr } }); }}
      >
        <View style={[styles.calendarDayBackground, isToday && styles.todayBackground]}>
          <Text style={[styles.calendarDayText, isToday && styles.todayText, hasLog && styles.logDayText]}>{day}</Text>
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
      <View style={styles.header}>
        <View style={styles.logoArea}>
          <Ionicons name="heart-outline" size={24} color={colors.text} style={styles.logoIcon} />
          <Text style={styles.logoText}>月曆</Text>
        </View>
        
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePrevMonth}><Ionicons name="chevron-back" size={18} color={colors.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.monthBadge} onPress={() => setIsPickerVisible(true)}>
            <Text style={styles.monthLabel}>{`${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextMonth}><Ionicons name="chevron-forward" size={18} color={colors.text} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
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

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>統計資料</Text>
          <View style={styles.statsRow}>
            {/* 🌟 統計標題也幫你動態更新，看起來更直覺！ */}
            <StatsCard label="累積咖啡數" value={stats.total} unit="咖" />
            <StatsCard label={`${currentDate.getFullYear()}年`} value={stats.thisYear} unit="咖" />
            <StatsCard label={`${currentDate.getMonth() + 1}月`} value={stats.thisMonth} unit="咖" />
          </View>
        </View>
      </ScrollView>

      <Modal visible={isPickerVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsPickerVisible(false)} />
          <View style={styles.pickerCard}>
            <View style={styles.pickerColumn}>
              <View style={styles.selectionHighlight} pointerEvents="none" />
              <ScrollView ref={yearScrollRef} showsVerticalScrollIndicator={false} snapToInterval={ITEM_HEIGHT} decelerationRate="fast" onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                if (years[idx]) setCurrentDate(prev => new Date(years[idx], prev.getMonth(), 1));
              }} contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}>
                {years.map((y, index) => (
                  <TouchableOpacity key={y} style={styles.pickerItem} onPress={() => handleYearSelect(y, index)}>
                    <Text style={[styles.pickerItemText, y === currentDate.getFullYear() && styles.pickerItemTextSelected]}>{y}年</Text>
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
                    <Text style={[styles.pickerItemText, m === currentDate.getMonth() && styles.pickerItemTextSelected]}>{m + 1}月</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
          <Ionicons name={pathname === '/' ? "home" : "home-outline"} size={26} color={pathname === '/' ? colors.primary : colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/map')}>
          <Ionicons name={pathname === '/map' ? "map" : "map-outline"} size={26} color={pathname === '/map' ? colors.primary : colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/logbook')}>
          <Ionicons name={pathname === '/logbook' ? "book" : "book-outline"} size={26} color={pathname === '/logbook' ? colors.primary : colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/setting')}>
          <Ionicons name={pathname === '/setting' ? "person" : "person-outline"} size={26} color={pathname === '/setting' ? colors.primary : colors.accent} />
        </TouchableOpacity>
      </View>
      
      {/* 🌟 保留你修改過的跳轉路徑 '/addlog' */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/addlog')}>
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const StatsCard = ({ label, value, unit }) => (
  <View style={styles.statsCard}>
    <Text style={styles.statsLabel}>{label}</Text>
    <View style={styles.statsValueContainer}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsUnit}>{unit}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoArea: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  monthHeader: { flexDirection: 'row', alignItems: 'center' },
  monthBadge: { backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginHorizontal: 8 },
  monthLabel: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  content: { flex: 1 },
  calendarContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  daysOfWeekRow: { flexDirection: 'row', marginBottom: 15 },
  dayOfWeekText: { flex: 1, textAlign: 'center', color: colors.accent, fontSize: 12, fontWeight: 'bold' },
  calendarCellContainer: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  calendarCellEmpty: { flex: 1, height: 50 },
  calendarDayBackground: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  todayBackground: { backgroundColor: colors.secondary },
  calendarDayText: { fontSize: 16, color: colors.text },
  todayText: { fontWeight: 'bold' },
  logDayText: { fontWeight: 'bold', color: colors.primary },
  logIconContainer: { position: 'absolute', bottom: 2, right: 8 },
  statsSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statsCard: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.secondary, padding: 15, borderRadius: 60, width: '31%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  statsLabel: { fontSize: 10, color: colors.text, marginBottom: 5 },
  statsValueContainer: { flexDirection: 'row', alignItems: 'baseline' },
  statsValue: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  statsUnit: { fontSize: 12, color: colors.text, marginLeft: 2 },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: colors.text, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  tabBar: { flexDirection: 'row', height: 80, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.secondary, paddingBottom: 20, elevation: 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1, alignItems: 'center', paddingTop: 110 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.05)' },
  pickerCard: { flexDirection: 'row', backgroundColor: '#D7CCC8', borderRadius: 25, width: '85%', height: ITEM_HEIGHT * 3, paddingHorizontal: 10, elevation: 8, overflow: 'hidden' },
  pickerColumn: { flex: 1, height: '100%', position: 'relative' },
  selectionHighlight: { position: 'absolute', top: ITEM_HEIGHT, left: 10, right: 10, height: ITEM_HEIGHT, backgroundColor: '#F5EEDC', borderRadius: 20 },
  pickerItem: { height: ITEM_HEIGHT, width: '100%', alignItems: 'center', justifyContent: 'center' },
  pickerItemText: { fontSize: 20, color: '#A1887F', fontWeight: 'bold' },
  pickerItemTextSelected: { color: '#5D4037' }
});