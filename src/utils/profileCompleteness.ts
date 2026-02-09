import { Fighter, Gym } from '../types';

export type ProfileField = {
  name: string;
  label: string;
  completed: boolean;
  importance: 'required' | 'recommended' | 'optional';
};

export type ProfileCompletenessResult = {
  percentage: number;
  requiredFields: ProfileField[];
  recommendedFields: ProfileField[];
  optionalFields: ProfileField[];
  allFields: ProfileField[];
  isComplete: boolean;
};

/**
 * Calculate profile completeness for a fighter
 */
export function calculateFighterCompleteness(fighter: Fighter | null): ProfileCompletenessResult {
  if (!fighter) {
    return {
      percentage: 0,
      requiredFields: [],
      recommendedFields: [],
      optionalFields: [],
      allFields: [],
      isComplete: false,
    };
  }

  const fields: ProfileField[] = [
    // Required fields
    {
      name: 'first_name',
      label: 'First Name',
      completed: !!fighter.first_name,
      importance: 'required',
    },
    {
      name: 'last_name',
      label: 'Last Name',
      completed: !!fighter.last_name,
      importance: 'required',
    },
    // These are now "recommended" since we set defaults during simplified onboarding
    // Users should update them from the defaults to get accurate matching
    {
      name: 'weight_class',
      label: 'Weight Class',
      // Default is 'welterweight' - consider complete if user changed it
      completed: !!fighter.weight_class && fighter.weight_class !== 'welterweight',
      importance: 'recommended',
    },
    {
      name: 'experience_level',
      label: 'Experience Level',
      // Default is 'beginner' - consider complete if user set it intentionally
      completed: !!fighter.experience_level && fighter.experience_level !== 'beginner',
      importance: 'recommended',
    },

    // Recommended fields
    {
      name: 'bio',
      label: 'Bio',
      completed: !!fighter.bio && fighter.bio.length >= 20,
      importance: 'recommended',
    },
    {
      name: 'city',
      label: 'City',
      completed: !!fighter.city,
      importance: 'recommended',
    },
    {
      name: 'country',
      label: 'Country',
      completed: !!fighter.country,
      importance: 'recommended',
    },
    {
      name: 'avatar_url',
      label: 'Profile Photo',
      completed: !!fighter.avatar_url,
      importance: 'recommended',
    },

    // Optional fields
    {
      name: 'nickname',
      label: 'Nickname',
      completed: !!fighter.nickname,
      importance: 'optional',
    },
    {
      name: 'age',
      label: 'Age',
      completed: !!fighter.age,
      importance: 'optional',
    },
    {
      name: 'height_cm',
      label: 'Height',
      completed: !!fighter.height_cm,
      importance: 'optional',
    },
    {
      name: 'reach_cm',
      label: 'Reach',
      completed: !!fighter.reach_cm,
      importance: 'optional',
    },
    {
      name: 'stance',
      label: 'Stance',
      completed: !!fighter.stance,
      importance: 'optional',
    },
    {
      name: 'record',
      label: 'Fight Record',
      completed: !!fighter.record,
      importance: 'optional',
    },
    {
      name: 'instagram',
      label: 'Instagram',
      completed: !!fighter.instagram,
      importance: 'optional',
    },
  ];

  const requiredFields = fields.filter(f => f.importance === 'required');
  const recommendedFields = fields.filter(f => f.importance === 'recommended');
  const optionalFields = fields.filter(f => f.importance === 'optional');

  const completedRequired = requiredFields.filter(f => f.completed).length;
  const completedRecommended = recommendedFields.filter(f => f.completed).length;
  const completedOptional = optionalFields.filter(f => f.completed).length;

  // Weighted percentage: required=50%, recommended=35%, optional=15%
  const requiredWeight = 50;
  const recommendedWeight = 35;
  const optionalWeight = 15;

  const requiredPercent = (completedRequired / requiredFields.length) * requiredWeight;
  const recommendedPercent = (completedRecommended / recommendedFields.length) * recommendedWeight;
  const optionalPercent = (completedOptional / optionalFields.length) * optionalWeight;

  const percentage = Math.round(requiredPercent + recommendedPercent + optionalPercent);

  return {
    percentage,
    requiredFields,
    recommendedFields,
    optionalFields,
    allFields: fields,
    isComplete: completedRequired === requiredFields.length,
  };
}

/**
 * Calculate profile completeness for a gym
 */
export function calculateGymCompleteness(gym: Gym | null): ProfileCompletenessResult {
  if (!gym) {
    return {
      percentage: 0,
      requiredFields: [],
      recommendedFields: [],
      optionalFields: [],
      allFields: [],
      isComplete: false,
    };
  }

  const fields: ProfileField[] = [
    // Required fields
    {
      name: 'name',
      label: 'Gym Name',
      completed: !!gym.name,
      importance: 'required',
    },
    {
      name: 'city',
      label: 'City',
      completed: !!gym.city,
      importance: 'required',
    },
    {
      name: 'country',
      label: 'Country',
      completed: !!gym.country,
      importance: 'required',
    },

    // Recommended fields (contact_email is now required during onboarding)
    {
      name: 'description',
      label: 'Description',
      completed: !!gym.description && gym.description.length >= 30,
      importance: 'recommended',
    },
    {
      name: 'address',
      label: 'Full Address',
      // Default is just city name - complete if user provided full address
      completed: !!gym.address && gym.address !== gym.city,
      importance: 'recommended',
    },
    {
      name: 'logo_url',
      label: 'Gym Logo',
      completed: !!gym.logo_url,
      importance: 'recommended',
    },
    {
      name: 'contact_phone',
      label: 'Contact Phone',
      completed: !!gym.contact_phone,
      importance: 'recommended',
    },
    {
      name: 'photos',
      label: 'Gym Photos',
      completed: !!gym.photos && gym.photos.length >= 3,
      importance: 'recommended',
    },

    // Optional fields
    {
      name: 'website',
      label: 'Website',
      completed: !!gym.website,
      importance: 'optional',
    },
    {
      name: 'facilities',
      label: 'Facilities',
      completed: !!gym.facilities && gym.facilities.length >= 3,
      importance: 'optional',
    },
    {
      name: 'instagram',
      label: 'Instagram',
      completed: !!gym.instagram,
      importance: 'optional',
    },
    {
      name: 'facebook',
      label: 'Facebook',
      completed: !!gym.facebook,
      importance: 'optional',
    },
  ];

  const requiredFields = fields.filter(f => f.importance === 'required');
  const recommendedFields = fields.filter(f => f.importance === 'recommended');
  const optionalFields = fields.filter(f => f.importance === 'optional');

  const completedRequired = requiredFields.filter(f => f.completed).length;
  const completedRecommended = recommendedFields.filter(f => f.completed).length;
  const completedOptional = optionalFields.filter(f => f.completed).length;

  // Weighted percentage: required=50%, recommended=35%, optional=15%
  const requiredWeight = 50;
  const recommendedWeight = 35;
  const optionalWeight = 15;

  const requiredPercent = (completedRequired / requiredFields.length) * requiredWeight;
  const recommendedPercent = (completedRecommended / recommendedFields.length) * recommendedWeight;
  const optionalPercent = (completedOptional / optionalFields.length) * optionalWeight;

  const percentage = Math.round(requiredPercent + recommendedPercent + optionalPercent);

  return {
    percentage,
    requiredFields,
    recommendedFields,
    optionalFields,
    allFields: fields,
    isComplete: completedRequired === requiredFields.length,
  };
}

/**
 * Get next recommended action for profile completion
 */
export function getNextProfileAction(result: ProfileCompletenessResult): string | null {
  // First, complete required fields
  const incompleteRequired = result.requiredFields.find(f => !f.completed);
  if (incompleteRequired) {
    return `Add your ${incompleteRequired.label.toLowerCase()}`;
  }

  // Then, complete recommended fields
  const incompleteRecommended = result.recommendedFields.find(f => !f.completed);
  if (incompleteRecommended) {
    return `Add your ${incompleteRecommended.label.toLowerCase()}`;
  }

  // Finally, complete optional fields
  const incompleteOptional = result.optionalFields.find(f => !f.completed);
  if (incompleteOptional) {
    return `Add your ${incompleteOptional.label.toLowerCase()}`;
  }

  return null; // Profile is 100% complete!
}

/**
 * Get color for profile completeness percentage
 */
export function getCompletenessColor(percentage: number): string {
  if (percentage < 40) return '#ef4444'; // red
  if (percentage < 70) return '#f59e0b'; // orange
  if (percentage < 90) return '#eab308'; // yellow
  return '#22c55e'; // green
}
