import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import client, { BASE_URL } from '../api/client';

export default function ProductDetailScreen({ route, navigation }) {
  const { product, isAdmin } = route.params;

  const handleDelete = () => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/products/${product.id}`);
            Alert.alert('Success', 'Product deleted');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete product');
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {product.image_url ? (
        <Image source={{ uri: `${BASE_URL}${product.image_url}` }} style={styles.image} />
      ) : (
        <View style={[styles.image, {backgroundColor: '#e1e4e8', justifyContent: 'center', alignItems: 'center'}]}>
          <Text style={{color: '#6a737d'}}>No Image</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <Text style={styles.descriptionHeader}>Description:</Text>
        <Text style={styles.description}>{product.description || 'No description provided.'}</Text>
      </View>
      
      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity 
            style={[styles.btn, {backgroundColor: '#ffc107'}]}
            onPress={() => navigation.navigate('AddEditProduct', { product })}
          >
            <Text style={styles.btnText}>Edit Product</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, {backgroundColor: '#dc3545'}]} onPress={handleDelete}>
            <Text style={styles.btnText}>Delete Product</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  content: { padding: 20 },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  price: { fontSize: 22, color: '#28a745', fontWeight: 'bold', marginBottom: 20 },
  descriptionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  description: { fontSize: 16, color: '#444', lineHeight: 24 },
  adminActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, borderTopWidth: 1, borderColor: '#eee' },
  btn: { padding: 15, borderRadius: 5, width: '45%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
