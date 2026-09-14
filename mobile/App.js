import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const DEFAULT_BACKEND_URL = 'https://ais-pre-7ie4f7htev3opuzhlz6k5a-41981073694.us-east1.run.app';

export default function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'grocery'
  const [zoneFilter, setZoneFilter] = useState('ALL'); // 'ALL' | 'FRIDGE' | 'PANTRY' | 'FREEZER'
  const [items, setItems] = useState([]);
  const [groceryItems, setGroceryItems] = useState([
    { id: 'g1', name: 'Greek Yogurt (Vanilla)', checked: false, zone: 'Fridge' },
    { id: 'g2', name: 'Baby Spinach (Organic)', checked: true, zone: 'Fridge' },
    { id: 'g3', name: 'Sourdough Bread', checked: false, zone: 'Pantry' },
    { id: 'g4', name: 'Extra Virgin Olive Oil', checked: false, zone: 'Pantry' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(DEFAULT_BACKEND_URL);
  const [scanResultModal, setScanResultModal] = useState(false);
  const [scannedCandidates, setScannedCandidates] = useState([]);

  // Load inventory on mount or when backend URL changes
  useEffect(() => {
    fetchInventory();
  }, [backendUrl]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/inventory/household/hh_yan_kriz_01`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.allItems) {
        setItems(data.allItems);
      }
    } catch (err) {
      console.log('Using local fallback state:', err.message);
      // Friendly initial seed if offline
      setItems([
        { id: '1', name: 'Oat Milk (Barista Blend)', location: { type: 'FRIDGE', name: 'Fridge' }, expirationDate: new Date(Date.now() + 2 * 86400000).toISOString(), daysUntilExpiration: 2, quantity: 1, unit: 'carton' },
        { id: '2', name: 'Organic Honeycrisp Apples', location: { type: 'FRIDGE', name: 'Crisper' }, expirationDate: new Date(Date.now() + 6 * 86400000).toISOString(), daysUntilExpiration: 6, quantity: 4, unit: 'pcs' },
        { id: '3', name: 'Atlantic Salmon Fillets', location: { type: 'FREEZER', name: 'Freezer' }, daysUntilExpiration: 65, quantity: 2, unit: 'portions', monthsInFreezer: 1.2 },
        { id: '4', name: 'Artisan Sourdough Loaf', location: { type: 'PANTRY', name: 'Pantry' }, expirationDate: new Date(Date.now() + 4 * 86400000).toISOString(), daysUntilExpiration: 4, quantity: 1, unit: 'loaf' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDefrost = async (itemId) => {
    try {
      const res = await fetch(`${backendUrl}/api/v1/inventory/item/${itemId}/defrost`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'usr_yan' }),
      });
      if (res.ok) {
        Alert.alert('Defrost Started', 'Item moved to Fridge with 3-day safe counter.');
        fetchInventory();
      }
    } catch (e) {
      // Local optimistic update
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, location: { type: 'FRIDGE', name: 'Fridge' }, daysUntilExpiration: 3 } : i))
      );
      Alert.alert('Defrost Started', 'Moved from Freezer to Fridge (3 days remaining).');
    }
  };

  const handleSnapCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission Required', 'Pantryo needs camera access to scan groceries.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        await processScannedImage(result.assets[0].base64);
      }
    } catch (err) {
      Alert.alert('Camera Error', err.message);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos Permission Required', 'Pantryo needs access to pick grocery photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        await processScannedImage(result.assets[0].base64);
      }
    } catch (err) {
      Alert.alert('Photo Error', err.message);
    }
  };

  const processScannedImage = async (base64) => {
    setIsScanning(true);
    try {
      const res = await fetch(`${backendUrl}/api/v1/inventory/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
      });

      if (!res.ok) throw new Error(`Scanner error: ${res.statusText}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setScannedCandidates(data.items);
        setScanResultModal(true);
      } else {
        Alert.alert('Scan Complete', 'No food items detected. Try pointing closer with better lighting.');
      }
    } catch (err) {
      Alert.alert('Scanner Notice', `Could not reach cloud AI: ${err.message}. Check your backend URL in settings.`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddCandidate = (candidate) => {
    const newItem = {
      id: `scanned_${Date.now()}`,
      name: candidate.name,
      location: { type: candidate.suggestedLocation || 'FRIDGE', name: candidate.suggestedLocation || 'Fridge' },
      daysUntilExpiration: candidate.estimatedShelfLifeDays || 5,
      quantity: candidate.quantity || 1,
      unit: candidate.unit || 'pcs',
    };
    setItems((prev) => [newItem, ...prev]);
    setScannedCandidates((prev) => prev.filter((c) => c !== candidate));
    if (scannedCandidates.length <= 1) {
      setScanResultModal(false);
      Alert.alert('Pantry Updated', `${candidate.name} added to your ${candidate.suggestedLocation || 'Fridge'}!`);
    }
  };

  const filteredItems = items.filter((item) => {
    if (zoneFilter === 'ALL') return true;
    const locType = item.location?.type || (item.locationType || 'FRIDGE');
    return locType.toUpperCase() === zoneFilter;
  });

  const fridgeCount = items.filter((i) => (i.location?.type || i.locationType) === 'FRIDGE').length;
  const pantryCount = items.filter((i) => (i.location?.type || i.locationType) === 'PANTRY').length;
  const freezerCount = items.filter((i) => (i.location?.type || i.locationType) === 'FREEZER').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF7EE" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          {/* Stylized Arch Logo Container */}
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="fridge-outline" size={20} color="#0E766E" />
          </View>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>Pantryo</Text>
              <View style={styles.livePulse} />
            </View>
            <Text style={styles.brandSubtitle}>The Yan & Kriz Kitchen</Text>
          </View>
        </View>

        {/* Backend Connectivity / Settings Gear */}
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowConfigModal(true)}>
          <Ionicons name="cloud-outline" size={16} color="#0E766E" />
          <Text style={styles.settingsText}>Cloud</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Navigation (Inventory vs Grocery) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'inventory' && styles.tabButtonActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={16}
            color={activeTab === 'inventory' ? '#0E766E' : '#70837D'}
          />
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
            Kitchen ({items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'grocery' && styles.tabButtonActive]}
          onPress={() => setActiveTab('grocery')}
        >
          <Ionicons
            name="cart-outline"
            size={16}
            color={activeTab === 'grocery' ? '#0E766E' : '#70837D'}
          />
          <Text style={[styles.tabText, activeTab === 'grocery' && styles.tabTextActive]}>
            Grocery Run ({groceryItems.filter((i) => !i.checked).length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'inventory' ? (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 110 }}>
          {/* Bento Stats Overview */}
          <View style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoEyebrow}>HOUSEHOLD EFFICIENCY</Text>
              <Text style={styles.bentoBadge}>Active Sync</Text>
            </View>
            <Text style={styles.bentoTitle}>96% Zero-Waste Pantry</Text>
            <Text style={styles.bentoSubtitle}>
              {items.length} items logged across Yan & Kriz storage zones
            </Text>

            {/* Zone Filter Chips */}
            <View style={styles.zoneRow}>
              <TouchableOpacity
                style={[styles.zoneChip, zoneFilter === 'ALL' && styles.zoneChipActive]}
                onPress={() => setZoneFilter('ALL')}
              >
                <Text style={[styles.zoneChipText, zoneFilter === 'ALL' && styles.zoneChipTextActive]}>
                  All ({items.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.zoneChip, zoneFilter === 'FRIDGE' && styles.zoneChipActive]}
                onPress={() => setZoneFilter('FRIDGE')}
              >
                <Text style={[styles.zoneChipText, zoneFilter === 'FRIDGE' && styles.zoneChipTextActive]}>
                  Fridge ({fridgeCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.zoneChip, zoneFilter === 'PANTRY' && styles.zoneChipActive]}
                onPress={() => setZoneFilter('PANTRY')}
              >
                <Text style={[styles.zoneChipText, zoneFilter === 'PANTRY' && styles.zoneChipTextActive]}>
                  Pantry ({pantryCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.zoneChip, zoneFilter === 'FREEZER' && styles.zoneChipActive]}
                onPress={() => setZoneFilter('FREEZER')}
              >
                <Text style={[styles.zoneChipText, zoneFilter === 'FREEZER' && styles.zoneChipTextActive]}>
                  Freezer ({freezerCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Items List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0E766E" />
              <Text style={styles.loadingText}>Syncing Household Pantry...</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredItems.map((item) => {
                const locType = item.location?.type || item.locationType || 'FRIDGE';
                const isFreezer = locType === 'FREEZER';
                const days = item.daysUntilExpiration;

                return (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemIconContainer}>
                      <MaterialCommunityIcons
                        name={isFreezer ? 'snowflake' : locType === 'PANTRY' ? 'package-variant' : 'food-apple'}
                        size={22}
                        color="#0E766E"
                      />
                    </View>

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.itemMeta}>
                        <Text style={styles.itemZone}>{item.location?.name || locType}</Text>
                        <Text style={styles.itemDot}>•</Text>
                        <Text style={styles.itemQty}>
                          {item.quantity} {item.unit || 'pcs'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.itemRight}>
                      {isFreezer ? (
                        <TouchableOpacity
                          style={styles.defrostButton}
                          onPress={() => handleDefrost(item.id)}
                        >
                          <Ionicons name="flame-outline" size={14} color="#0E766E" />
                          <Text style={styles.defrostText}>Defrost</Text>
                        </TouchableOpacity>
                      ) : (
                        <View
                          style={[
                            styles.expiryBadge,
                            days <= 2 ? styles.expiryUrgent : days <= 5 ? styles.expiryWarning : styles.expirySafe,
                          ]}
                        >
                          <Text style={styles.expiryText}>
                            {days <= 0 ? 'Expired' : `${days}d left`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        /* Grocery Shopping List View */
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 110 }}>
          <View style={styles.groceryHeader}>
            <Text style={styles.groceryTitle}>Shared Grocery Run</Text>
            <Text style={styles.grocerySubtitle}>Items tick off automatically into your pantry</Text>
          </View>

          {groceryItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.groceryCard, item.checked && styles.groceryCardChecked]}
              onPress={() => {
                setGroceryItems((prev) =>
                  prev.map((g) => (g.id === item.id ? { ...g, checked: !g.checked } : g))
                );
              }}
            >
              <Ionicons
                name={item.checked ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.checked ? '#0E766E' : '#9CA3AF'}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[
                    styles.groceryItemName,
                    item.checked && { textDecorationLine: 'line-through', color: '#8FA39D' },
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.groceryZoneTag}>Destination: {item.zone}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Floating SNAP & ADD! Action Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.snapButton}
          onPress={() => {
            Alert.alert(
              'SNAP & ADD! Scanner',
              'Choose how you would like to scan food or receipts:',
              [
                { text: 'Take Photo with Camera', onPress: handleSnapCamera },
                { text: 'Choose from Photo Library', onPress: handlePickPhoto },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="camera" size={18} color="#A7F3D0" />
          )}
          <Text style={styles.snapButtonText}>
            {isScanning ? 'AI VISION SCANNING...' : 'SNAP & ADD!'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Scanned Candidates Modal */}
      <Modal visible={scanResultModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gemini AI Vision Results</Text>
              <TouchableOpacity onPress={() => setScanResultModal(false)}>
                <Ionicons name="close" size={24} color="#133E3B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Select detected items to add to your pantry:
            </Text>

            <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
              {scannedCandidates.map((c, idx) => (
                <View key={idx} style={styles.candidateRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.candidateName}>{c.name}</Text>
                    <Text style={styles.candidateSub}>
                      {c.suggestedLocation || 'Fridge'} • Est. {c.estimatedShelfLifeDays || 5} days
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.candidateAddBtn}
                    onPress={() => handleAddCandidate(c)}
                  >
                    <Text style={styles.candidateAddText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Server Config Modal */}
      <Modal visible={showConfigModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Backend Server Connection</Text>
            <Text style={styles.modalSubtitle}>
              Paste your Render or local IP address here:
            </Text>

            <TextInput
              style={styles.urlInput}
              value={customUrlInput}
              onChangeText={setCustomUrlInput}
              placeholder="https://pantryo-backend.onrender.com"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowConfigModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSave}
                onPress={() => {
                  setBackendUrl(customUrlInput.trim().replace(/\/$/, ''));
                  setShowConfigModal(false);
                  Alert.alert('Saved', 'Pantryo is now connected to ' + customUrlInput);
                }}
              >
                <Text style={styles.modalSaveText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7EE',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E2D5',
    backgroundColor: '#FAF7EE',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#C4E3DC',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0D3B37',
    letterSpacing: -0.5,
  },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: 6,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#527470',
    fontWeight: '500',
    marginTop: 1,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD0',
    gap: 4,
  },
  settingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E766E',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#FAF7EE',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F0EBE0',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DDD0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#70837D',
  },
  tabTextActive: {
    color: '#0E766E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5DFD0',
    marginTop: 8,
    marginBottom: 12,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    color: '#527470',
    letterSpacing: 0.5,
  },
  bentoBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0E766E',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bentoTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0D3B37',
    marginTop: 6,
  },
  bentoSubtitle: {
    fontSize: 11,
    color: '#65827D',
    marginTop: 2,
    marginBottom: 12,
  },
  zoneRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F2ECE0',
    paddingTop: 12,
  },
  zoneChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F7FAF9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0ECE8',
  },
  zoneChipActive: {
    backgroundColor: '#0E766E',
    borderColor: '#0E766E',
  },
  zoneChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#244E49',
  },
  zoneChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E2D5',
  },
  itemIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3F8F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D3B37',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemZone: {
    fontSize: 11,
    color: '#65827D',
    fontWeight: '600',
  },
  itemDot: {
    marginHorizontal: 4,
    color: '#A0B4AF',
  },
  itemQty: {
    fontSize: 11,
    color: '#65827D',
  },
  itemRight: {
    marginLeft: 8,
  },
  expiryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expirySafe: {
    backgroundColor: '#E6F4EA',
  },
  expiryWarning: {
    backgroundColor: '#FEF3C7',
  },
  expiryUrgent: {
    backgroundColor: '#FEE2E2',
  },
  expiryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#133E3B',
  },
  defrostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E6F4F1',
    borderRadius: 8,
    gap: 3,
  },
  defrostText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E766E',
  },
  groceryHeader: {
    paddingVertical: 12,
  },
  groceryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D3B37',
  },
  grocerySubtitle: {
    fontSize: 11,
    color: '#65827D',
    marginTop: 2,
  },
  groceryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5DFD0',
    marginBottom: 8,
  },
  groceryCardChecked: {
    opacity: 0.6,
    backgroundColor: '#F9F7F1',
  },
  groceryItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D3B37',
  },
  groceryZoneTag: {
    fontSize: 10,
    color: '#70837D',
    marginTop: 2,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  snapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A3834',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  snapButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#527470',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FAF7EE',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0D9C8',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D3B37',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#527470',
    marginTop: 4,
    marginBottom: 12,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E8E2D5',
  },
  candidateName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D3B37',
  },
  candidateSub: {
    fontSize: 10,
    color: '#65827D',
  },
  candidateAddBtn: {
    backgroundColor: '#0E766E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  candidateAddText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  urlInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2CDC0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0D3B37',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#65827D',
  },
  modalSave: {
    backgroundColor: '#0E766E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
