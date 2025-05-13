'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Info, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Fetch user, plans and subscription on load
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get current user
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          // This should never happen as the dashboard layout should handle redirect
          return;
        }
        
        setUser(data.session.user);

        // Fetch available plans
        const plansResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/plans`);
        console.log("Plans fetched:", plansResponse.data);
        setPlans(plansResponse.data || []);

        // Fetch user's subscription
        const subscriptionResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/subscriptions/user/${data.session.user.id}`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`
            }
          }
        );
        setSubscription(subscriptionResponse.data);
      } catch (error: any) {
        console.error('Error fetching billing data:', error);
        setError(error.message || 'Failed to load billing information');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Check for success/canceled messages from URL params
    if (searchParams.get('success') === 'true') {
      alert('Subscription successful! Your plan has been updated.');
    } else if (searchParams.get('canceled') === 'true') {
      alert('Subscription process was canceled.');
    }
  }, [searchParams]);

  // Handle automatic sync when returning from Stripe checkout
  useEffect(() => {
    const shouldSync = searchParams.get('success') === 'true' && searchParams.get('sync') === 'true';
    
    if (shouldSync && user) {
      console.log('Auto-syncing subscription from Stripe redirect...');
      handleSyncSubscription(false);
    }
  }, [user, searchParams]);

  const handleSubscribe = async (priceId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Subscribing to price ID:", priceId);
      // Create a checkout session
      const { data } = await supabase.auth.getSession();
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/create-checkout`,
        {
          userId: user.id,
          priceId
        },
        {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`
          }
        }
      );

      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({
          sessionId: response.data.sessionId
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      setError(error.message || 'Failed to start checkout process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription?.stripe_subscription_id) return;
    
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/cancel-subscription`,
        {
          userId: user.id
        },
        {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`
          }
        }
      );
      
      alert('Your subscription will be canceled at the end of the current billing period.');
      
      // Refresh subscription data
      const subscriptionResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/subscriptions/user/${data.session?.user.id}`,
        {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`
          }
        }
      );
      setSubscription(subscriptionResponse.data);
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      setError(error.message || 'Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSubscription = async (showAlert = true) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await supabase.auth.getSession();
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/sync-subscription/${user.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`
          }
        }
      );
      
      setSubscription(response.data);
      if (showAlert) {
        alert('Subscription synced successfully!');
      }
    } catch (error: any) {
      console.error('Error syncing subscription:', error);
      setError(error.response?.data?.error || error.message || 'Failed to sync subscription');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/create-portal-session`,
        {
          userId: user.id,
          returnUrl: window.location.href
        },
        {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`
          }
        }
      );

      // Redirect to Stripe Customer Portal
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Error creating customer portal session:', error);
      setError(error.message || 'Failed to open customer portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlan = () => {
    if (!subscription) return 'Free';
    
    // If subscription is canceled, return "Free" or "[Plan] (Canceled)"
    if (subscription.status === 'canceled') {
      return `${subscription.plan?.name || 'Unknown'} (Canceled)`;
    }
    
    return subscription.plan?.name || 'Free';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount / 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-800">Loading subscription information...</span>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2 text-gray-900">Billing</h1>
      <p className="text-gray-700 mb-8">Manage your subscription plan and payments</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-start">
          <AlertCircle className="text-red-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Something went wrong</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {subscription?.status === 'canceled' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex items-start">
          <Info className="text-amber-500 h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-800">Subscription Canceled</h3>
            <p className="text-amber-700 text-sm">
              Your subscription has been canceled but will remain active until {formatDate(subscription.current_period_end)}.
              You can resubscribe at any time.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={
              plan.name === currentPlan ? 'border-green-200' : 
              (subscription?.status === 'canceled' && plan.name === subscription.plan?.name ? 'border-amber-200' : '')
            }
          >
            <CardHeader>
              <CardTitle className="text-gray-900">{plan.name}</CardTitle>
              <CardDescription className="text-gray-700">
                {plan.name === 'Free' ? 'Basic features for personal use' : 'Premium features for power users'}
              </CardDescription>
              <p className="text-3xl font-bold mt-2 text-gray-900">
                {formatPrice(plan.amount)}/{plan.interval}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-800">
                {plan.name === 'Free' ? (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Up to {plan.features?.files || 5} files</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Up to {plan.features?.summaries || 3} summaries</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Basic support</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Unlimited files</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Unlimited summaries</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>Advanced features</span>
                    </li>
                  </>
                )}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.name === currentPlan && !currentPlan.includes('Canceled') ? (
                <Button 
                  variant="outline" 
                  className="w-full text-gray-700" 
                  disabled
                >
                  Current Plan
                </Button>
              ) : subscription?.status === 'canceled' && plan.name === subscription.plan?.name ? (
                <Button 
                  variant="outline" 
                  className="w-full text-amber-700 border-amber-300" 
                  disabled
                >
                  Active Until {formatDate(subscription.current_period_end)}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  disabled={loading}
                  onClick={() => handleSubscribe(plan.stripe_price_id)}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {plan.name === 'Free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {subscription && subscription.status !== 'canceled' && subscription.plan?.name !== 'Free' && (
        <div className="mt-8">
          <Button 
            variant="outline" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleCancelSubscription}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Cancel Subscription
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            Your subscription will remain active until the end of your current billing period.
          </p>
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Usage Overview</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-600">Current Plan</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">{currentPlan}</dd>
            </div>
            {subscription?.current_period_end && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Billing Period Ends</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatDate(subscription.current_period_end)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-600">Files Used</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {user?.usage?.files || 0} 
                {!subscription?.plan?.features?.unlimited && (
                  <span className="text-sm text-gray-600 ml-2">/ {subscription?.plan?.features?.files || 5}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Summaries Used</dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {user?.usage?.summaries || 0}
                {!subscription?.plan?.features?.unlimited && (
                  <span className="text-sm text-gray-600 ml-2">/ {subscription?.plan?.features?.summaries || 4}</span>
                )}
              </dd>
            </div>
          </dl>
          
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              className="text-gray-700 mx-2"
              onClick={() => window.location.reload()}
            >
              Refresh Billing Information
            </Button>
            
            <Button
              variant="outline"
              className="text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100 mx-2"
              onClick={() => handleSyncSubscription(true)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sync Subscription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 