import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase, isSupabaseConfigured } from './supabase';

export type UploadOptions = {
  bucket: 'avatars' | 'event-photos' | 'gym-photos' | 'fighter-photos';
  path: string; // e.g., "user-123/avatar.jpg"
  file: string; // local file URI
};

/**
 * Uploads an image to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export const uploadImage = async (options: UploadOptions): Promise<string> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Simulating image upload:', options.path);
    // Return mock URL for demo mode
    return `https://placeholder-images.com/${options.bucket}/${options.path}`;
  }

  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(options.file, {
      encoding: 'base64',
    });

    // Determine content type
    const ext = options.file.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(options.path, decode(base64), {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(options.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Deletes an image from Supabase Storage
 */
export const deleteImage = async (bucket: string, path: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    console.log('[Demo Mode] Simulating image deletion:', path);
    return;
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Opens the image picker and returns the selected image
 */
export const pickImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }

  // Open picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Square aspect ratio
    quality: 0.8, // Compress to reduce file size
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
};

/**
 * Opens the camera and returns the captured image
 */
export const takePicture = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  // Request permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Permission to access camera was denied');
  }

  // Open camera
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
};

/**
 * Helper to pick or take a photo (shows action sheet)
 */
export const selectImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  // For now, just use pickImage. In production, you'd show an ActionSheet
  // to let users choose between camera and library
  return await pickImage();
};

/**
 * Generates a unique filename for uploads
 */
export const generateFilename = (userId: string, prefix?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const prefixStr = prefix ? `${prefix}-` : '';
  return `${userId}/${prefixStr}${timestamp}-${random}.jpg`;
};

/**
 * Uploads a user avatar
 */
export const uploadAvatar = async (userId: string, fileUri: string): Promise<string> => {
  const filename = generateFilename(userId, 'avatar');
  return await uploadImage({
    bucket: 'avatars',
    path: filename,
    file: fileUri,
  });
};

/**
 * Uploads an event photo
 */
export const uploadEventPhoto = async (
  userId: string,
  eventId: string,
  fileUri: string
): Promise<string> => {
  const filename = `${userId}/event-${eventId}-${Date.now()}.jpg`;
  return await uploadImage({
    bucket: 'event-photos',
    path: filename,
    file: fileUri,
  });
};

/**
 * Uploads a gym photo
 */
export const uploadGymPhoto = async (gymId: string, fileUri: string): Promise<string> => {
  const filename = generateFilename(gymId, 'gym');
  return await uploadImage({
    bucket: 'gym-photos',
    path: filename,
    file: fileUri,
  });
};

/**
 * Uploads a fighter photo
 */
export const uploadFighterPhoto = async (fighterId: string, fileUri: string): Promise<string> => {
  const filename = generateFilename(fighterId, 'fighter');
  return await uploadImage({
    bucket: 'fighter-photos',
    path: filename,
    file: fileUri,
  });
};
