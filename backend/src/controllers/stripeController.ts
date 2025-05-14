import { Request, Response } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../services/supabase';

// Initialize Stripe with API key - use a compatible API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any, // Type assertion to avoid version errors
});

/**
 * Sync Stripe products and prices with our database
 * This should be called when the server starts or via an admin endpoint
 */
export const syncStripePlans = async () => {
  try {
    console.log('Starting Stripe plan sync...');
    
    // Fetch all active products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });
    
    console.log(`Found ${products.data.length} active products`);
    
    // Add free plan if it doesn't exist in Stripe
    let freePlanExists = false;
    
    // Process each product and its default price
    for (const product of products.data) {
      const defaultPrice = product.default_price as Stripe.Price;
      
      // Skip products without a default price
      if (!defaultPrice) {
        console.log(`Product ${product.id} (${product.name}) has no default price, skipping`);
        continue;
      }
      
      // Check if this is a free plan
      if (defaultPrice.unit_amount === 0) {
        freePlanExists = true;
      }
      
      const planData = {
        name: product.name,
        stripe_price_id: defaultPrice.id,
        amount: defaultPrice.unit_amount || 0,
        currency: defaultPrice.currency || 'usd',
        interval: defaultPrice.recurring ? defaultPrice.recurring.interval : 'one-time',
        features: product.metadata.features ? JSON.parse(product.metadata.features) : {}
      };
      
      console.log(`Processing plan: ${planData.name}, price: ${planData.stripe_price_id}`);
      
      // Check if plan exists by stripe_price_id
      const { data: existingPlan, error: lookupError } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('stripe_price_id', planData.stripe_price_id)
        .single();
      
      if (lookupError && lookupError.code !== 'PGRST116') {
        throw lookupError;
      }
      
      if (existingPlan) {
        // Update existing plan
        const { error: updateError } = await supabaseAdmin
          .from('plans')
          .update(planData)
          .eq('id', existingPlan.id);
        
        if (updateError) throw updateError;
        console.log(`Updated plan: ${planData.name}`);
      } else {
        // Insert new plan
        const { error: insertError } = await supabaseAdmin
          .from('plans')
          .insert(planData);
        
        if (insertError) throw insertError;
        console.log(`Created new plan: ${planData.name}`);
      }
    }
    
    // Add a free plan if none exists in Stripe
    if (!freePlanExists) {
      const { data: existingFreePlan, error: freePlanError } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('name', 'Free')
        .eq('amount', 0)
        .single();
      
      if (freePlanError && freePlanError.code !== 'PGRST116') throw freePlanError;
      
      if (!existingFreePlan) {
        const { error: insertError } = await supabaseAdmin
          .from('plans')
          .insert({
            name: 'Free',
            stripe_price_id: 'price_free',
            amount: 0,
            currency: 'usd',
            interval: 'month',
            features: { files: 5, summaries: 3 }
          });
        
        if (insertError) throw insertError;
        console.log('Created free plan');
      }
    }
    
    console.log('Stripe plan sync completed successfully');
    return { success: true, message: 'Plans synced successfully' };
  } catch (error) {
    console.error('Error syncing Stripe plans:', error);
    return { success: false, error };
  }
};

/**
 * Admin endpoint to trigger Stripe plan sync
 */
export const syncPlans = async (req: Request, res: Response) => {
  try {
    const result = await syncStripePlans();
    
    if (result.success) {
      res.status(200).json({ message: 'Plans synced successfully' });
    } else {
      res.status(500).json({ error: 'Failed to sync plans' });
    }
  } catch (error) {
    console.error('Error syncing plans:', error);
    res.status(500).json({ error: 'Failed to sync plans' });
  }
};

/**
 * Get all available subscription plans
 */
export const getPlans = async (req: Request, res: Response) => {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .order('amount', { ascending: true });

    if (error) throw error;

    res.status(200).json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

/**
 * Get user's current subscription
 */
export const getUserSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // Fetch user's subscription with plan details
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the error when no rows returned
      throw error;
    }

    // If user has no subscription, return the default free plan
    if (!subscription) {
      const { data: freePlan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('name', 'Free')
        .single();

      if (planError) throw planError;

      return res.status(200).json({
        status: 'active',
        plan: freePlan
      });
    }

    res.status(200).json(subscription);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch user subscription' });
  }
};

/**
 * Create a checkout session for subscribing to a plan
 */
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { userId, priceId } = req.body;

    if (!userId || !priceId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get user data from Supabase
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Check if user already has a subscription
    const { data: subscriptionData, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subError && subError.code !== 'PGRST116') throw subError;

    // Create or get Stripe customer
    let customerId = subscriptionData?.stripe_customer_id;
    if (!customerId) {
      // Get user email from auth
      const { data: { user } = {} } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      const customer = await stripe.customers.create({
        email: user?.email || userData.email,
        name: userData.display_name || user?.email,
        metadata: {
          userId
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard/settings/billing?success=true&sync=true&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/settings/billing?canceled=true`,
      metadata: {
        userId
      }
    });

    res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

/**
 * Handle Stripe webhook events
 */
export const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
};

/**
 * Handle checkout.session.completed event
 */
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in session metadata');
    return;
  }

  // Get the price ID from the line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0]?.price?.id;

  if (!priceId) {
    console.error('No price ID found in checkout session');
    return;
  }

  // Get plan details from Supabase
  const { data: planData, error: planError } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single();

  if (planError) throw planError;

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
  const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();
  
  // Check if the user already has a subscription
  const { data: existingSubscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (subError && subError.code !== 'PGRST116') throw subError;

  if (existingSubscription) {
    // Update existing subscription
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_id: planData.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        status: subscription.status,
        current_period_end: periodEnd
      })
      .eq('id', existingSubscription.id);

    if (updateError) throw updateError;
  } else {
    // Create new subscription
    const { data: newSubscription, error: createError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planData.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        status: subscription.status,
        current_period_end: periodEnd
      })
      .select('id')
      .single();

    if (createError) throw createError;

    // Update user profile with subscription id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ subscription_id: newSubscription.id })
      .eq('id', userId);

    if (profileError) throw profileError;
  }
};

/**
 * Handle invoice.paid event
 */
const handleInvoicePaid = async (invoice: Stripe.Invoice) => {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

  // Update subscription in database
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: periodEnd
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) throw error;
};

/**
 * Handle customer.subscription.updated and customer.subscription.deleted events
 */
const handleSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
  // Update subscription in database
  const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();
  
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: periodEnd
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) throw error;
};

/**
 * Cancel a subscription
 */
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get user's subscription
    const { data: subscriptionData, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (subError) throw subError;

    if (!subscriptionData?.stripe_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription at period end
    await stripe.subscriptions.update(subscriptionData.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    res.status(200).json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * Check feature limits for a user
 */
export const checkFeatureLimits = async (req: Request, res: Response) => {
  try {
    const { userId, feature } = req.body;

    if (!userId || !feature) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`Checking limits for user ${userId}, feature: ${feature}`);

    // First, always get the user's profile to get usage data
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('usage')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    console.log('User profile data:', userProfile?.usage ? JSON.stringify(userProfile.usage) : 'No usage data');

    // If profile doesn't exist at all, create an empty usage object
    const usage = userProfile?.usage || {} as Record<string, number>;
    const currentUsage = usage[feature] || 0;

    console.log(`Current usage for ${feature}:`, currentUsage);

    // Try to get the user's subscription with plan details
    const { data: subscriptionData, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    // If no active subscription found or error, use Free plan
    if (subError || !subscriptionData) {
      console.log(`No active subscription found for user ${userId}, using Free plan`);
      
      const { data: freePlan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('features, name')
        .eq('name', 'Free')
        .single();

      if (planError) throw planError;
      
      const limits = freePlan.features;
      const featureLimit = limits[feature];
      
      // Check if feature is unlimited (-1)
      if (featureLimit === -1) {
        return res.status(200).json({
          allowed: true,
          currentUsage,
          limit: 'unlimited',
          plan: 'Free'
        });
      }

      return res.status(200).json({
        allowed: currentUsage < featureLimit,
        currentUsage,
        limit: featureLimit,
        plan: 'Free'
      });
    }

    // Access plan details - use type assertion to handle subscription.plan
    const plan = (subscriptionData.plan as any);
    
    // Check if user is on a plan with unlimited usage
    if (plan.features.unlimited) {
      return res.status(200).json({
        allowed: true,
        currentUsage,
        limit: 'unlimited',
        plan: plan.name
      });
    }

    // Check against limits
    const limits = plan.features;
    
    // Check if this specific feature is unlimited (value of -1)
    if (limits[feature] === -1) {
      return res.status(200).json({
        allowed: true,
        currentUsage,
        limit: 'unlimited',
        plan: plan.name
      });
    }

    res.status(200).json({
      allowed: currentUsage < limits[feature],
      currentUsage,
      limit: limits[feature],
      plan: plan.name
    });
  } catch (error) {
    console.error('Error checking feature limits:', error);
    res.status(500).json({ error: 'Failed to check feature limits' });
  }
};

/**
 * Increment usage for a feature
 */
export const incrementFeatureUsage = async (req: Request, res: Response) => {
  try {
    const { userId, feature } = req.body;

    if (!userId || !feature) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get current usage
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('usage')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const usage = profile.usage || {} as Record<string, number>;
    const currentUsage = usage[feature] || 0;

    // Update usage
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        usage: { ...usage, [feature]: currentUsage + 1 }
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.status(200).json({
      feature,
      newUsage: currentUsage + 1
    });
  } catch (error) {
    console.error('Error incrementing feature usage:', error);
    res.status(500).json({ error: 'Failed to increment feature usage' });
  }
};

/**
 * Create a Stripe Customer Portal session
 */
export const createPortalSession = async (req: Request, res: Response) => {
  try {
    const { userId, returnUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    // Get customer ID from subscriptions table
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found for this user' });
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/dashboard/settings/billing`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create customer portal session' });
  }
};

/**
 * Manually sync a user's subscription from Stripe to Supabase
 * This is useful if webhooks are not being received correctly
 */
export const syncUserSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    // Get user profile from Supabase
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user profile:', userError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    // Get subscriptions for this user from Stripe
    const { data: existingSubData, error: existingSubError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    // If we don't have a Stripe customer ID for this user, we can't sync
    if (!existingSubData?.stripe_customer_id && existingSubError?.code !== 'PGRST116') {
      console.error('Error fetching existing subscription:', existingSubError);
      return res.status(404).json({ error: 'No Stripe customer ID found for this user' });
    }

    let customerId = existingSubData?.stripe_customer_id;
    
    // If we don't have a customer ID, try to find one by user email
    if (!customerId) {
      // Get user email from auth
      const { data: { user } = {} } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (!user?.email) {
        return res.status(404).json({ error: 'No user email found' });
      }

      // Try to find customer by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length === 0) {
        return res.status(404).json({ error: 'No Stripe customer found for this user' });
      }

      customerId = customers.data[0].id;
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No subscription found for this user' });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

    // Get plan details from Supabase
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('stripe_price_id', priceId)
      .single();

    if (planError) {
      console.error('Error fetching plan:', planError);
      return res.status(500).json({ error: 'Failed to fetch plan details' });
    }

    // Check if we have an existing subscription record
    const { data: existingSubscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error checking for existing subscription:', subError);
      return res.status(500).json({ error: 'Failed to check for existing subscription' });
    }

    // Insert or update subscription
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_id: planData.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          status: subscription.status,
          current_period_end: periodEnd
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }
    } else {
      // Create new subscription
      const { data: newSubscription, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planData.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          status: subscription.status,
          current_period_end: periodEnd
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating subscription:', createError);
        return res.status(500).json({ error: 'Failed to create subscription' });
      }

      // Update user profile with subscription id
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ subscription_id: newSubscription.id })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        return res.status(500).json({ error: 'Failed to update user profile with subscription' });
      }
    }

    // Fetch the updated subscription to return
    const { data: updatedSubscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated subscription:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch updated subscription' });
    }

    res.status(200).json(updatedSubscription);
  } catch (error: any) {
    console.error('Error syncing user subscription:', error);
    res.status(500).json({ error: 'Failed to sync user subscription: ' + error.message });
  }
}; 