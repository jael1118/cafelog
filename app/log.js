import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 依照你設計圖的柔和配色
const colors = {
  primary: '#8D6E63', 
  secondary: '#FCECDA', // 編輯按鈕的淺橘色
  background: '#FFFFFF', 
  text: '#4A3728',      // 標題深棕色
  grayText: '#9E9E9E',  // 次要資訊灰色
  tagBg: '#F5EFE9',     // 標籤淺底色
  tagText: '#7A6255',   // 標籤文字色
  heart: '#F27B7B',     // 愛心粉紅色
  heartEmpty: '#E0E0E0' // 愛心空底色
};

export default function LogDetailScreen() {
  const router = useRouter();
  // 🌟 接收從首頁傳過來的「日期」參數 (例如: "2026-04-07")
  const { date } = useLocalSearchParams(); 
  
  const [dayLogs, setDayLogs] = useState([]);

  useEffect(() => {
    const fetchDayLogs = async () => {
      try {
        const storedLogs = await AsyncStorage.getItem('cafe_logs');
        if (storedLogs) {
          const allLogs = JSON.parse(storedLogs);
          // 🔍 從保險箱撈出資料後，只留下「日期符合這一天」的紀錄
          const filteredLogs = allLogs.filter(log => log.date === date);
          setDayLogs(filteredLogs);
        }
      } catch (error) {
        console.error("讀取紀錄失敗", error);
      }
    };
    if (date) fetchDayLogs();
  }, [date]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部導覽 */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {dayLogs.length === 0 ? (
          <Text style={styles.emptyText}>這天還沒有喝咖啡的紀錄喔 ☕️</Text>
        ) : (
          // 萬一這天喝了兩家以上的咖啡，我們用 map 把每一筆都印出來
          dayLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              
              {/* === 1. 標題與時間 === */}
              <View style={styles.headerRow}>
                <Text style={styles.titleText}>{log.title}</Text>
                <Text style={styles.timeText}>{log.displayTime}</Text>
              </View>

              {/* === 2. 縮圖、地點、評分、編輯按鈕 === */}
              <View style={styles.infoRow}>
                
                {/* 縮圖 */}
                <View style={styles.thumbnailBox}>
                  {log.imageUrl ? (
                    <Image source={{ uri: log.imageUrl }} style={styles.thumbnailImage} />
                  ) : (
                    <Ionicons name="cafe" size={30} color="#D7CCC8" />
                  )}
                </View>

                {/* 地點與愛心 */}
                <View style={styles.metaColumn}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={14} color={colors.grayText} />
                    <Text style={styles.locationText}>{log.location || '未填寫地點'}</Text>
                  </View>

                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((heart) => (
                      <Ionicons 
                        key={heart}
                        name="heart" 
                        size={14} 
                        color={heart <= log.rating ? colors.heart : colors.heartEmpty} 
                        style={{ marginRight: 3 }}
                      />
                    ))}
                    <Text style={styles.ratingNumber}>{Number(log.rating).toFixed(1)}</Text>
                  </View>
                </View>

                {/* 編輯按鈕 (目前先做 UI，你可以之後擴充修改功能) */}
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="pencil" size={14} color="#C99B78" />
                </TouchableOpacity>
              </View>

              {/* === 3. 關鍵字標籤 === */}
              {log.tags ? (
                <View style={styles.tagsContainer}>
                  {/* 將使用者輸入的文字用空白切開，變成一顆顆的標籤 */}
                  {log.tags.split(' ').filter(t => t.trim() !== '').map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* === 4. 筆記內文 === */}
              <Text style={styles.noteText}>{log.note}</Text>

              {/* 依照你的設計圖，下方有一個大塊的灰底圖片佔位區 */}
              {log.imageUrl && (
                 <Image source={{ uri: log.imageUrl }} style={styles.largeImage} />
              )}

              {/* 分隔線 (如果一天有多筆紀錄) */}
              <View style={styles.divider} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  navBar: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10 },
  backBtn: { padding: 5, alignSelf: 'flex-start' },
  content: { flex: 1, paddingHorizontal: 25 },
  emptyText: { textAlign: 'center', color: colors.grayText, marginTop: 50, fontSize: 16 },
  
  logCard: { marginBottom: 30 },
  
  // 1. 標題與時間
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  titleText: { fontSize: 22, fontWeight: '900', color: colors.text, flex: 1 },
  timeText: { fontSize: 11, color: colors.grayText, marginBottom: 4 },

  // 2. 主要資訊區
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  thumbnailBox: { width: 65, height: 65, backgroundColor: '#F0F0F0', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  thumbnailImage: { width: '100%', height: '100%' },
  
  metaColumn: { flex: 1, justifyContent: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  locationText: { fontSize: 13, color: colors.grayText, marginLeft: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingNumber: { fontSize: 12, color: colors.grayText, marginLeft: 6, fontWeight: 'bold' },
  
  editButton: { backgroundColor: colors.secondary, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },

  // 3. 標籤區
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  tagBadge: { backgroundColor: colors.tagBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15, marginRight: 8, marginBottom: 8 },
  tagText: { color: colors.tagText, fontSize: 12, fontWeight: 'bold' },

  // 4. 筆記區
  noteText: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },
  
  // 大圖區
  largeImage: { width: '100%', height: 200, backgroundColor: '#E0E0E0', borderRadius: 8, marginTop: 10 },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 25 }
});