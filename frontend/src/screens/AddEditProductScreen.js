import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import client, { BASE_URL } from '../api/client';

export default function AddEditProductScreen({ route, navigation }) {
  const isEditing = route.params?.product != null;
  const product = route.params?.product;

  const [name, setName] = useState(product ? product.name : '');
  const [description, setDescription] = useState(product ? product.description : '');
  const [price, setPrice] = useState(product ? product.price.toString() : '');
  const [imageUri, setImageUri] = useState(product && product.image_url ? `${BASE_URL}${product.image_url}` : null);
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!name || !price) {
      return Alert.alert('Error', 'Name and Price are required');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description || '');
      formData.append('price', price);

      if (newImage) {
        const fileExtension = newImage.uri.split('.').pop();
        formData.append('image', {
          uri: newImage.uri,
          name: `photo.${fileExtension}`,
          type: `image/${fileExtension}`
        });
      }

      if (isEditing) {
        await client.put(`/products/${product.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await client.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      Alert.alert('Success', `Product ${isEditing ? 'updated' : 'added'}!`);
      // Go back to the list screen, wait a bit so it triggers useFocusEffect smoothly
      navigation.navigate('ProductList');
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
      console.log(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Product Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Wireless Mouse" />

      <Text style={styles.label}>Price ($)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="e.g. 29.99" keyboardType="numeric" />

      <Text style={styles.label}>Description</Text>
      <TextInput 
        style={[styles.input, {height: 100, textAlignVertical: 'top'}]} 
        value={description} 
        onChangeText={setDescription} 
        placeholder="Product details..." 
        multiline 
      />

      <Text style={styles.label}>Product Image</Text>
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, {backgroundColor: '#e1e4e8', justifyContent: 'center', alignItems: 'center'}]}>
            <Text>No Image Selected</Text>
          </View>
        )}
      </View>
      <View style={styles.imgRow}>
        <TouchableOpacity style={styles.imgBtn} onPress={pickImage}>
          <Text style={styles.imgBtnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imgBtn} onPress={takePhoto}>
          <Text style={styles.imgBtnText}>Camera</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isEditing ? 'Update Product' : 'Add Product'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 5, marginBottom: 15, fontSize: 16 },
  imageContainer: { alignItems: 'center', marginBottom: 10 },
  preview: { width: '100%', height: 200, borderRadius: 5, resizeMode: 'cover' },
  imgRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  imgBtn: { flex: 0.48, backgroundColor: '#6c757d', padding: 12, borderRadius: 5, alignItems: 'center' },
  imgBtnText: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center', marginBottom: 50 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});
