import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import client, { BASE_URL } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdmin = async () => {
    const token = await SecureStore.getItemAsync('adminToken');
    setIsAdmin(!!token);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await client.get('/products');
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkAdmin();
      fetchProducts();
    }, [])
  );

  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const filtered = products.filter(p => p.name.toLowerCase().includes(text.toLowerCase()) || (p.description && p.description.toLowerCase().includes(text.toLowerCase())));
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('adminToken');
    setIsAdmin(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { product: item, isAdmin })}
    >
      {item.image_url ? (
        <Image source={{ uri: `${BASE_URL}${item.image_url}` }} style={styles.image} />
      ) : (
        <View style={[styles.image, {backgroundColor: '#e1e4e8', justifyContent: 'center', alignItems: 'center'}]}>
          <Text style={{color: '#6a737d'}}>No Image</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isAdmin ? (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('AddEditProduct')} style={styles.adminBtn}>
              <Text style={styles.adminBtnText}>+ Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.adminBtn, {backgroundColor: '#dc3545'}]}>
              <Text style={styles.adminBtnText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.adminBtn}>
            <Text style={styles.adminBtnText}>Admin Login</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search products..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? <ActivityIndicator size="large" style={{marginTop: 20}} /> : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No products found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  adminBtn: { padding: 10, backgroundColor: '#007bff', borderRadius: 5 },
  adminBtnText: { color: '#fff', fontWeight: 'bold' },
  searchContainer: { padding: 10, backgroundColor: '#fff' },
  searchInput: { backgroundColor: '#f1f3f5', padding: 10, borderRadius: 8, fontSize: 16 },
  list: { padding: 10 },
  card: { backgroundColor: '#fff', marginBottom: 15, borderRadius: 8, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: {width: 0, height: 2} },
  image: { width: '100%', height: 200, resizeMode: 'cover' },
  info: { padding: 15 },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  price: { fontSize: 16, color: '#28a745', fontWeight: 'bold' }
});
