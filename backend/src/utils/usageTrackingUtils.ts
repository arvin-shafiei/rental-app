import { supabaseAdmin } from '../services/supabase';

/**
 * Increment usage for a feature directly (without HTTP call)
 * This is more efficient than making internal API calls
 */
export const incrementFeatureUsage = async (userId: string, feature: string): Promise<boolean> => {
  try {
    if (!userId || !feature) {
      console.error('[Usage Tracking] Missing required parameters');
      return false;
    }

    // Get current usage
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('usage')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Usage Tracking] Error getting profile:', profileError);
      return false;
    }

    const usage = profile.usage || {} as Record<string, number>;
    const currentUsage = usage[feature] || 0;

    // Update usage
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        usage: { ...usage, [feature]: currentUsage + 1 }
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Usage Tracking] Error updating usage:', updateError);
      return false;
    }

    console.log(`[Usage Tracking] Incremented ${feature} usage for user ${userId} to ${currentUsage + 1}`);
    return true;
  } catch (error) {
    console.error('[Usage Tracking] Error incrementing feature usage:', error);
    return false;
  }
}; 