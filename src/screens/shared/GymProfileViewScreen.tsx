import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { getOrCreateConversation } from '../../services/messaging';
import {
  GlassCard,
  GradientButton,
  SectionHeader,
  StatCard,
  AnimatedListItem,
} from '../../components';

type GymProfile = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  facilities?: string[];
  photos?: string[];
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  member_count?: number;
  events_this_month?: number;
};

type AffiliatedFighter = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  weight_class?: string;
};

type AffiliatedCoach = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  specializations?: string[];
};

const MOCK_GYM: GymProfile = {
  id: '1',
  user_id: 'user1',
  name: 'Elite Boxing Academy',
  description: 'Premier boxing facility in Berlin offering world-class training for fighters of all levels. Our experienced coaches and state-of-the-art equipment make us the top choice for serious boxers.',
  address: 'Friedrichstraße 123, 10117 Berlin',
  city: 'Berlin',
  country: 'Germany',
  contact_email: 'info@eliteboxing.de',
  contact_phone: '+49 30 1234567',
  website: 'https://eliteboxing.de',
  facilities: ['Boxing Ring', 'Heavy Bags', 'Speed Bags', 'Weights', 'Locker Rooms', 'Sauna', 'Physio'],
  photos: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800',
  ],
  instagram: '@eliteboxingberlin',
  member_count: 125,
  events_this_month: 12,
};

// Breakpoint for responsive layout
const DESKTOP_BREAKPOINT = 768;

export function GymProfileViewScreen({ navigation, route }: any) {
  const { profile: currentUserProfile, user } = useAuth();
  const { gymId } = route.params;
  const [gym, setGym] = useState<GymProfile>(MOCK_GYM);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [fighters, setFighters] = useState<AffiliatedFighter[]>([]);
  const [coaches, setCoaches] = useState<AffiliatedCoach[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const isOwnGym = currentUserProfile && 'name' in currentUserProfile &&
    (currentUserProfile as any).id === gymId;

  useEffect(() => {
    loadGymProfile();
    loadAffiliatedMembers();
  }, [gymId]);

  const loadGymProfile = async () => {
    if (!isSupabaseConfigured) {
      setGym(MOCK_GYM);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymId)
        .single();

      if (error) throw error;
      if (data) setGym(data);
    } catch (error) {
      console.error('Error loading gym:', error);
      Alert.alert('Error', 'Failed to load gym profile');
    } finally {
      setLoading(false);
    }
  };

  const loadAffiliatedMembers = async () => {
    if (!isSupabaseConfigured || !gymId) return;

    try {
      const { data: fightersData } = await supabase
        .from('fighters')
        .select('id, first_name, last_name, avatar_url, weight_class')
        .eq('gym_id', gymId)
        .eq('is_active', true)
        .limit(20);

      if (fightersData) setFighters(fightersData);

      const { data: coachesData } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, avatar_url, specializations')
        .eq('gym_id', gymId)
        .limit(10);

      if (coachesData) setCoaches(coachesData);
    } catch (error) {
      console.error('Error loading affiliated members:', error);
    }
  };

  const handleContact = (type: 'email' | 'phone' | 'website') => {
    if (type === 'email' && gym.contact_email) {
      Linking.openURL(`mailto:${gym.contact_email}`);
    } else if (type === 'phone' && gym.contact_phone) {
      Linking.openURL(`tel:${gym.contact_phone}`);
    } else if (type === 'website' && gym.website) {
      Linking.openURL(gym.website);
    }
  };

  const handleViewEvents = () => {
    navigation.navigate('GymEvents', { gymId });
  };

  const handleEdit = () => {
    navigation.navigate('GymProfile');
  };

  const handleMessage = async () => {
    if (!user?.id || !gym.user_id) {
      Alert.alert('Error', 'Unable to start conversation');
      return;
    }

    setStartingChat(true);
    try {
      const conversationId = await getOrCreateConversation(user.id, gym.user_id);
      navigation.navigate('Chat', {
        conversationId,
        otherUserId: gym.user_id,
        name: gym.name,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setStartingChat(false);
    }
  };

  // Contact Card Component
  const ContactCard = () => (
    <GlassCard style={isDesktop ? styles.stickyCard : undefined}>
      <SectionHeader title="Contact & Actions" />

      {/* Quick Actions */}
      {!isOwnGym && (
        <View style={styles.actionButtonsVertical}>
          <GradientButton
            title="Send Message"
            onPress={handleMessage}
            icon="chatbubble"
            loading={startingChat}
            disabled={startingChat}
            fullWidth
          />
          <GlassCard
            intensity="light"
            onPress={handleViewEvents}
            style={styles.secondaryActionCard}
          >
            <View style={styles.secondaryActionRow}>
              <Ionicons name="calendar" size={20} color={colors.primary[500]} />
              <Text style={styles.secondaryButtonText}>View Events</Text>
            </View>
          </GlassCard>
        </View>
      )}

      {/* Contact Details */}
      <View style={styles.contactDetails}>
        {gym.address && (
          <View style={styles.contactItem}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="location" size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.contactTextWrapper}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactValue}>{gym.address}</Text>
            </View>
          </View>
        )}

        {gym.contact_phone && (
          <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('phone')}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="call" size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.contactTextWrapper}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={[styles.contactValue, styles.contactLink]}>{gym.contact_phone}</Text>
            </View>
          </TouchableOpacity>
        )}

        {gym.contact_email && (
          <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('email')}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="mail" size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.contactTextWrapper}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={[styles.contactValue, styles.contactLink]}>{gym.contact_email}</Text>
            </View>
          </TouchableOpacity>
        )}

        {gym.website && (
          <TouchableOpacity style={styles.contactItem} onPress={() => handleContact('website')}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="globe" size={18} color={colors.primary[500]} />
            </View>
            <View style={styles.contactTextWrapper}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={[styles.contactValue, styles.contactLink]} numberOfLines={1}>{gym.website}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Social Links */}
      {(gym.instagram || gym.facebook || gym.tiktok || gym.youtube) && (
        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Social Media</Text>
          <View style={styles.socialIcons}>
            {gym.instagram && (
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-instagram" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            {gym.facebook && (
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-facebook" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            {gym.tiktok && (
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-tiktok" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            {gym.youtube && (
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-youtube" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </GlassCard>
  );

  // Stats Row Component
  const StatsRow = () => (
    <View style={styles.statsRow}>
      <StatCard
        icon="people"
        value={gym.member_count || 0}
        label="Members"
      />
      <StatCard
        icon="calendar"
        value={gym.events_this_month || 0}
        label="Events/Mo"
      />
      <StatCard
        icon="school"
        value={coaches.length}
        label="Coaches"
      />
    </View>
  );

  // Team Member Card Component
  const TeamMemberCard = ({ member, type, index }: { member: AffiliatedFighter | AffiliatedCoach, type: 'fighter' | 'coach', index: number }) => (
    <AnimatedListItem index={index}>
      <GlassCard
        intensity="light"
        onPress={() => navigation.navigate(
          type === 'fighter' ? 'FighterProfileView' : 'CoachProfileView',
          type === 'fighter' ? { fighterId: member.id } : { coachId: member.id }
        )}
        style={styles.memberCard}
      >
        <View style={styles.memberRow}>
          {member.avatar_url ? (
            <Image source={{ uri: member.avatar_url }} style={styles.memberAvatar} />
          ) : (
            <View style={styles.memberAvatarPlaceholder}>
              <Ionicons name="person" size={28} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.first_name} {member.last_name}</Text>
            <Text style={styles.memberSubtitle}>
              {type === 'fighter'
                ? (member as AffiliatedFighter).weight_class || 'Fighter'
                : (member as AffiliatedCoach).specializations?.[0] || 'Coach'
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </GlassCard>
    </AnimatedListItem>
  );

  // Photo Gallery
  const PhotoGallery = () => {
    if (!gym.photos || gym.photos.length === 0) return null;

    return (
      <View style={[styles.photoGallery, isDesktop && styles.photoGalleryDesktop]}>
        <Image
          source={{ uri: gym.photos[activePhotoIndex] }}
          style={[styles.mainPhoto, isDesktop && styles.mainPhotoDesktop]}
        />
        {gym.photos.length > 1 && (
          <View style={styles.photoThumbnails}>
            {gym.photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setActivePhotoIndex(index)}
                style={[
                  styles.thumbnail,
                  activePhotoIndex === index && styles.thumbnailActive
                ]}
              >
                <Image source={{ uri: photo }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // DESKTOP LAYOUT
  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.desktopHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gym Profile</Text>
          {isOwnGym && (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color={colors.primary[500]} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.desktopContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.desktopContent}>
            {/* Left Column - Main Content */}
            <View style={styles.mainColumn}>
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <PhotoGallery />

                <View style={styles.gymIdentity}>
                  <View style={styles.gymLogoLarge}>
                    <Ionicons name="business" size={40} color={colors.primary[500]} />
                  </View>
                  <View style={styles.gymTitleBlock}>
                    <Text style={styles.gymNameLarge}>{gym.name}</Text>
                    <View style={styles.locationBadge}>
                      <Ionicons name="location" size={16} color={colors.textMuted} />
                      <Text style={styles.locationText}>{gym.city}, {gym.country}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Stats */}
              <StatsRow />

              {/* About Section */}
              {gym.description && (
                <GlassCard style={styles.sectionCard}>
                  <SectionHeader title="About" />
                  <Text style={styles.descriptionText}>{gym.description}</Text>
                </GlassCard>
              )}

              {/* Facilities */}
              {gym.facilities && gym.facilities.length > 0 && (
                <GlassCard style={styles.sectionCard}>
                  <SectionHeader title="Facilities & Amenities" />
                  <View style={styles.facilitiesGrid}>
                    {gym.facilities.map((facility, index) => (
                      <View key={index} style={styles.facilityItem}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Text style={styles.facilityText}>{facility}</Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              )}

              {/* Team Section */}
              {(coaches.length > 0 || fighters.length > 0) && (
                <GlassCard style={styles.sectionCard}>
                  <SectionHeader title="Team" />

                  {coaches.length > 0 && (
                    <View style={styles.teamSection}>
                      <Text style={styles.teamSubtitle}>Coaches ({coaches.length})</Text>
                      <View style={styles.teamGrid}>
                        {coaches.map((coach, index) => (
                          <TeamMemberCard key={coach.id} member={coach} type="coach" index={index} />
                        ))}
                      </View>
                    </View>
                  )}

                  {fighters.length > 0 && (
                    <View style={styles.teamSection}>
                      <Text style={styles.teamSubtitle}>Fighters ({fighters.length})</Text>
                      <View style={styles.teamGrid}>
                        {fighters.slice(0, 6).map((fighter, index) => (
                          <TeamMemberCard key={fighter.id} member={fighter} type="fighter" index={index} />
                        ))}
                      </View>
                      {fighters.length > 6 && (
                        <TouchableOpacity style={styles.viewAllButton}>
                          <Text style={styles.viewAllText}>View all {fighters.length} fighters</Text>
                          <Ionicons name="arrow-forward" size={16} color={colors.primary[500]} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </GlassCard>
              )}
            </View>

            {/* Right Column - Sidebar */}
            <View style={styles.sideColumn}>
              <ContactCard />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // MOBILE LAYOUT
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gym Profile</Text>
        {isOwnGym ? (
          <TouchableOpacity onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color={colors.primary[500]} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <PhotoGallery />

        {/* Gym Header */}
        <View style={styles.gymHeader}>
          <View style={styles.gymTitleRow}>
            <View style={styles.gymIcon}>
              <Ionicons name="business" size={32} color={colors.primary[500]} />
            </View>
            <View style={styles.gymTitleInfo}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={colors.textMuted} />
                <Text style={styles.location}>{gym.city}, {gym.country}</Text>
              </View>
            </View>
          </View>

          {!isOwnGym && (
            <View style={styles.actionButtons}>
              <GradientButton
                title="Message"
                onPress={handleMessage}
                icon="chatbubble"
                loading={startingChat}
                disabled={startingChat}
                style={{ flex: 1 }}
              />
              <GlassCard
                intensity="light"
                onPress={handleViewEvents}
                style={styles.viewEventsCard}
              >
                <View style={styles.secondaryActionRow}>
                  <Ionicons name="calendar" size={18} color={colors.primary[500]} />
                  <Text style={styles.viewEventsButtonText}>Events</Text>
                </View>
              </GlassCard>
            </View>
          )}
        </View>

        <View style={styles.mobileStatsContainer}>
          <StatsRow />
        </View>

        {gym.description && (
          <View style={styles.mobileSection}>
            <SectionHeader title="About" />
            <Text style={styles.descriptionText}>{gym.description}</Text>
          </View>
        )}

        {gym.facilities && gym.facilities.length > 0 && (
          <View style={styles.mobileSection}>
            <SectionHeader title="Facilities" />
            <View style={styles.facilitiesWrap}>
              {gym.facilities.map((facility, index) => (
                <View key={index} style={styles.facilityChip}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.facilityChipText}>{facility}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Section - Mobile */}
        <View style={styles.mobileSection}>
          <SectionHeader title="Contact" />
          {gym.address && (
            <View style={styles.mobileContactRow}>
              <Ionicons name="location" size={20} color={colors.textMuted} />
              <Text style={styles.mobileContactText}>{gym.address}</Text>
            </View>
          )}
          {gym.contact_phone && (
            <TouchableOpacity style={styles.mobileContactRow} onPress={() => handleContact('phone')}>
              <Ionicons name="call" size={20} color={colors.textMuted} />
              <Text style={[styles.mobileContactText, styles.contactLink]}>{gym.contact_phone}</Text>
            </TouchableOpacity>
          )}
          {gym.contact_email && (
            <TouchableOpacity style={styles.mobileContactRow} onPress={() => handleContact('email')}>
              <Ionicons name="mail" size={20} color={colors.textMuted} />
              <Text style={[styles.mobileContactText, styles.contactLink]}>{gym.contact_email}</Text>
            </TouchableOpacity>
          )}
          {gym.website && (
            <TouchableOpacity style={styles.mobileContactRow} onPress={() => handleContact('website')}>
              <Ionicons name="globe" size={20} color={colors.textMuted} />
              <Text style={[styles.mobileContactText, styles.contactLink]}>{gym.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Team Section - Mobile */}
        {(coaches.length > 0 || fighters.length > 0) && (
          <View style={styles.mobileSection}>
            <SectionHeader title="Team" />
            {coaches.length > 0 && (
              <View style={styles.mobileTeamSection}>
                <Text style={styles.mobileTeamSubtitle}>Coaches</Text>
                {coaches.map((coach, index) => (
                  <TeamMemberCard key={coach.id} member={coach} type="coach" index={index} />
                ))}
              </View>
            )}
            {fighters.length > 0 && (
              <View style={styles.mobileTeamSection}>
                <Text style={styles.mobileTeamSubtitle}>Fighters ({fighters.length})</Text>
                {fighters.slice(0, 4).map((fighter, index) => (
                  <TeamMemberCard key={fighter.id} member={fighter} type="fighter" index={index} />
                ))}
                {fighters.length > 4 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>View all fighters</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary[500]} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[4],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  editButtonText: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },

  // Container
  container: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
  },
  desktopContent: {
    flexDirection: 'row',
    padding: spacing[6],
    gap: spacing[6],
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
  },
  sideColumn: {
    width: 360,
    flexShrink: 0,
  },

  // Photo Gallery
  photoGallery: {
    marginBottom: spacing[4],
  },
  photoGalleryDesktop: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  mainPhoto: {
    width: '100%',
    height: 250,
    backgroundColor: colors.surfaceLight,
  },
  mainPhotoDesktop: {
    height: 400,
  },
  photoThumbnails: {
    flexDirection: 'row',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.surface,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: colors.primary[500],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // Hero Section (Desktop)
  heroSection: {
    marginBottom: spacing[5],
  },
  gymIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
  },
  gymLogoLarge: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymTitleBlock: {
    flex: 1,
  },
  gymNameLarge: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  locationText: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  mobileStatsContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },

  // Section Card (Desktop)
  sectionCard: {
    marginBottom: spacing[5],
  },

  // Sections
  mobileSection: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: 26,
  },

  // Facilities
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    width: '48%',
    paddingVertical: spacing[2],
  },
  facilityText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  facilitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
  },
  facilityChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },

  // Sticky card (sidebar)
  stickyCard: {
    position: Platform.OS === 'web' ? 'sticky' as any : 'relative',
    top: spacing[6],
  },

  // Action Buttons
  actionButtonsVertical: {
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  secondaryActionCard: {
    padding: spacing[3],
  },
  secondaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },

  // Contact Details (Sidebar)
  contactDetails: {
    gap: spacing[3],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  contactIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextWrapper: {
    flex: 1,
  },
  contactLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing[0.5],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  contactLink: {
    color: colors.primary[500],
  },

  // Social Section
  socialSection: {
    marginTop: spacing[4],
  },
  socialTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Team
  teamSection: {
    marginBottom: spacing[4],
  },
  teamSubtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
  teamGrid: {
    gap: spacing[2],
  },
  memberCard: {
    padding: spacing[2],
    marginBottom: spacing[1],
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing[0.5],
  },
  memberSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  viewAllText: {
    fontSize: typography.fontSize.base,
    color: colors.primary[500],
    fontWeight: typography.fontWeight.medium,
  },

  // Mobile specific
  gymHeader: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gymTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  gymIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymTitleInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  location: {
    fontSize: typography.fontSize.base,
    color: colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  viewEventsCard: {
    flex: 1,
    padding: spacing[2.5],
    justifyContent: 'center',
  },
  viewEventsButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
  },
  mobileContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  mobileContactText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    flex: 1,
  },
  mobileTeamSection: {
    marginBottom: spacing[4],
  },
  mobileTeamSubtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
});
