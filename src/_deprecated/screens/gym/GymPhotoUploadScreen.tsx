import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { GlassCard, GradientButton, SectionHeader } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { pickImage as selectImage, takePicture, uploadGymPhoto, deleteImage } from '../../lib/storage';

type GymPhotoUploadScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// Stock gym images - placeholders for now, can be replaced with actual stock images
const STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
  'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400',
  'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=400',
];

export function GymPhotoUploadScreen({ navigation }: GymPhotoUploadScreenProps) {
  const { profile, refreshProfile } = useAuth();
  const [photos, setPhotos] = useState<string[]>(
    (profile as any)?.photos || []
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const image = await selectImage();
      if (!image) return;

      await uploadPhoto(image.uri);
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const image = await takePicture();
      if (!image) return;

      await uploadPhoto(image.uri);
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', error.message || 'Failed to take photo');
    }
  };

  const uploadPhoto = async (uri: string) => {
    if (!isSupabaseConfigured) {
      // Demo mode - just add to local state
      setPhotos([...photos, uri]);
      Alert.alert('Success', 'Photo added! (Demo mode)');
      return;
    }

    setUploading(true);
    try {
      const gymId = (profile as any)?.id;
      if (!gymId) throw new Error('Gym ID not found');

      // Upload to Supabase Storage
      const publicUrl = await uploadGymPhoto(gymId, uri);

      // Update gym profile with new photo URL
      const updatedPhotos = [...photos, publicUrl];

      const { error } = await supabase
        .from('gyms')
        .update({ photos: updatedPhotos })
        .eq('user_id', (profile as any)?.user_id);

      if (error) throw error;

      setPhotos(updatedPhotos);
      await refreshProfile();
      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const addStockImage = async (imageUrl: string) => {
    if (!isSupabaseConfigured) {
      setPhotos([...photos, imageUrl]);
      Alert.alert('Success', 'Stock photo added! (Demo mode)');
      return;
    }

    setLoading(true);
    try {
      const updatedPhotos = [...photos, imageUrl];

      const { error } = await supabase
        .from('gyms')
        .update({ photos: updatedPhotos })
        .eq('user_id', (profile as any)?.user_id);

      if (error) throw error;

      setPhotos(updatedPhotos);
      await refreshProfile();
      Alert.alert('Success', 'Stock photo added!');
    } catch (error) {
      console.error('Error adding stock photo:', error);
      Alert.alert('Error', 'Failed to add stock photo');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedPhotos = photos.filter((_, i) => i !== index);

            if (isSupabaseConfigured) {
              try {
                const { error } = await supabase
                  .from('gyms')
                  .update({ photos: updatedPhotos })
                  .eq('user_id', (profile as any)?.user_id);

                if (error) throw error;
                await refreshProfile();
              } catch (error) {
                console.error('Error removing photo:', error);
                Alert.alert('Error', 'Failed to remove photo');
                return;
              }
            }

            setPhotos(updatedPhotos);
          },
        },
      ]
    );
  };

  const handleDone = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gym Photos</Text>
        <TouchableOpacity onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Showcase Your Gym</Text>
        <Text style={styles.subtitle}>
          Add photos to help fighters discover your facility
        </Text>

        {/* Upload Options */}
        <View style={styles.uploadOptions}>
          <GlassCard onPress={pickImage} style={styles.uploadButton}>
            <View style={styles.uploadButtonContent}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="images" size={32} color={colors.primary[500]} />
              </View>
              <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
            </View>
          </GlassCard>

          <GlassCard onPress={takePhoto} style={styles.uploadButton}>
            <View style={styles.uploadButtonContent}>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="camera" size={32} color={colors.primary[500]} />
              </View>
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </View>
          </GlassCard>
        </View>

        {/* Current Photos */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={`Your Photos (${photos.length})`} />
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stock Images */}
        <View style={styles.section}>
          <SectionHeader title="Or Choose Stock Photos" subtitle="Professional boxing gym images you can use" />

          <View style={styles.photosGrid}>
            {STOCK_IMAGES.map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stockPhotoContainer}
                onPress={() => addStockImage(imageUrl)}
                disabled={loading}
              >
                <Image source={{ uri: imageUrl }} style={styles.photo} />
                <View style={styles.addOverlay}>
                  <Ionicons name="add-circle" size={32} color={colors.primary[500]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <GlassCard intensity="accent">
          <View style={styles.infoBoxContent}>
            <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
            <Text style={styles.infoText}>
              Photos help fighters get to know your gym. Add images of your equipment,
              training areas, and atmosphere.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  doneText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  container: {
    flex: 1,
    padding: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing[6],
    lineHeight: 22,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  uploadButton: {
    flex: 1,
  },
  uploadButtonContent: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  uploadButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing[6],
  },
  // sectionHeader styles removed - using SectionHeader component
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  photoContainer: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  stockPhotoContainer: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  addOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBoxContent: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
