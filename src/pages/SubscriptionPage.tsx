import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Users, Calendar, Database, AlertCircle, Clock } from 'lucide-react';
import api from '../lib/api';

interface SubscriptionPlan {
  id: number;
  planCode: string;
  planName: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  maxStaffUsers: number;
  maxAppointmentsPerMonth: number;
  maxCustomers: number;
  features: string[];
  displayOrder: number;
  isActive: boolean;
  isRecommended: boolean;
  billingCycle: string;
}

interface TenantInfo {
  id: string;
  name: string;
  currentPlanId: number | null;
  trialEndsAt: string | null;
  subscriptionStatus: string;
  billingCycle: string;
  appointmentsThisPeriod: number;
  staffUsersCount: number;
  customersCount: number;
  subscriptionStartedAt: string | null;
  subscriptionRenewsAt: string | null;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load subscription plans
      const plansResponse = await api.get('/api/whatsapp/config/subscription-plans');
      // Parse features if they come as JSON strings
      const parsedPlans = plansResponse.data.map((plan: any) => ({
        ...plan,
        features: typeof plan.features === 'string' 
          ? JSON.parse(plan.features) 
          : Array.isArray(plan.features) 
            ? plan.features 
            : []
      }));
      setPlans(parsedPlans);

      // Load tenant info from WhatsApp config endpoint
      try {
        await api.get('/api/whatsapp/config');
        // For now, use default values - TODO: Add proper tenant endpoint
        setTenantInfo({
          id: '123',
          name: 'My Clinic',
          currentPlanId: null, // null means in trial
          trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
          subscriptionStatus: 'ACTIVE',
          billingCycle: 'MONTHLY',
          appointmentsThisPeriod: 23,
          staffUsersCount: 2,
          customersCount: 45,
          subscriptionStartedAt: new Date().toISOString(),
          subscriptionRenewsAt: null,
        });
      } catch (err) {
        console.warn('Could not load tenant info, using defaults');
        // Set defaults even if tenant API fails
        setTenantInfo({
          id: '123',
          name: 'My Clinic',
          currentPlanId: null,
          trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionStatus: 'ACTIVE',
          billingCycle: 'MONTHLY',
          appointmentsThisPeriod: 23,
          staffUsersCount: 2,
          customersCount: 45,
          subscriptionStartedAt: new Date().toISOString(),
          subscriptionRenewsAt: null,
        });
      }

    } catch (err: any) {
      console.error('Failed to load subscription data:', err);
      setError(err.response?.data?.message || 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId: number) => {
    // TODO: Implement upgrade flow
    console.log('Upgrade to plan:', planId);
    alert('Upgrade functionality coming soon! This will redirect to payment gateway.');
  };

  const isInTrial = () => {
    if (!tenantInfo || !tenantInfo.trialEndsAt || tenantInfo.currentPlanId) return false;
    return new Date(tenantInfo.trialEndsAt) > new Date();
  };

  const getDaysRemainingInTrial = () => {
    if (!tenantInfo?.trialEndsAt) return 0;
    const diff = new Date(tenantInfo.trialEndsAt).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getCurrentPlan = () => {
    if (!tenantInfo) return null;
    if (isInTrial()) return plans.find(p => p.planCode === 'FREE_TRIAL');
    return plans.find(p => p.id === tenantInfo.currentPlanId);
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (plan.planCode === 'FREE_TRIAL') return 0;
    return selectedBillingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Plans</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const trialDaysRemaining = getDaysRemainingInTrial();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
        <p className="text-gray-600">Manage your Bookzi subscription and view usage statistics</p>
      </div>

      {/* Trial Banner */}
      {isInTrial() && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Free Trial Active</h3>
              <p className="text-gray-700 mb-3">
                You have <span className="font-bold text-blue-600">{trialDaysRemaining} days</span> remaining in your free trial.
                Upgrade anytime to unlock unlimited features.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan & Usage */}
      {currentPlan && tenantInfo && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Plan Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
              {currentPlan.isRecommended && (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Recommended
                </div>
              )}
            </div>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">{currentPlan.planName}</span>
                {currentPlan.planCode !== 'FREE_TRIAL' && (
                  <span className="text-lg text-gray-600">
                    {formatCurrency(getPrice(currentPlan))}/{selectedBillingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                  </span>
                )}
              </div>
              <p className="text-gray-600">{currentPlan.description}</p>
            </div>
            
            {/* Plan Limits */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff Users
                </span>
                <span className="font-medium">
                  {currentPlan.maxStaffUsers === -1 ? 'Unlimited' : currentPlan.maxStaffUsers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointments/Month
                </span>
                <span className="font-medium">
                  {currentPlan.maxAppointmentsPerMonth === -1 ? 'Unlimited' : currentPlan.maxAppointmentsPerMonth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Customers
                </span>
                <span className="font-medium">
                  {currentPlan.maxCustomers === -1 ? 'Unlimited' : currentPlan.maxCustomers}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Usage</h2>
            <div className="space-y-4">
              {/* Staff Users */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Staff Users</span>
                  <span className="text-sm text-gray-600">
                    {tenantInfo.staffUsersCount} / {currentPlan.maxStaffUsers === -1 ? '∞' : currentPlan.maxStaffUsers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: currentPlan.maxStaffUsers === -1
                        ? '30%'
                        : `${Math.min((tenantInfo.staffUsersCount / currentPlan.maxStaffUsers) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Appointments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Appointments This Month</span>
                  <span className="text-sm text-gray-600">
                    {tenantInfo.appointmentsThisPeriod} / {currentPlan.maxAppointmentsPerMonth === -1 ? '∞' : currentPlan.maxAppointmentsPerMonth}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: currentPlan.maxAppointmentsPerMonth === -1
                        ? '20%'
                        : `${Math.min((tenantInfo.appointmentsThisPeriod / currentPlan.maxAppointmentsPerMonth) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Customers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Customer Database</span>
                  <span className="text-sm text-gray-600">
                    {tenantInfo.customersCount} / {currentPlan.maxCustomers === -1 ? '∞' : currentPlan.maxCustomers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: currentPlan.maxCustomers === -1
                        ? '25%'
                        : `${Math.min((tenantInfo.customersCount / currentPlan.maxCustomers) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div id="pricing-plans" className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setSelectedBillingCycle('MONTHLY')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              selectedBillingCycle === 'MONTHLY'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedBillingCycle('ANNUAL')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              selectedBillingCycle === 'ANNUAL'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-2 text-green-600 text-sm">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
          <p className="text-gray-600">Scale your practice with the right features for your needs</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans
            .filter(plan => plan.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id;
              const price = getPrice(plan);
              const isTrial = plan.planCode === 'FREE_TRIAL';

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-xl border-2 p-6 transition-all ${
                    plan.isRecommended
                      ? 'border-blue-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {/* Recommended Badge */}
                  {plan.isRecommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Crown className="h-4 w-4" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        Current
                      </div>
                    </div>
                  )}

                  {/* Plan Name */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.planName}</h3>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {isTrial ? (
                      <div>
                        <span className="text-4xl font-bold text-gray-900">Free</span>
                        <span className="text-gray-600 ml-2">14 days</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-gray-900">{formatCurrency(price)}</span>
                        <span className="text-gray-600">/{selectedBillingCycle === 'MONTHLY' ? 'month' : 'year'}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        {plan.maxStaffUsers === -1 ? 'Unlimited' : plan.maxStaffUsers} staff user{plan.maxStaffUsers !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        {plan.maxAppointmentsPerMonth === -1 ? 'Unlimited' : plan.maxAppointmentsPerMonth} appointments/month
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        {plan.maxCustomers === -1 ? 'Unlimited' : plan.maxCustomers} customer{plan.maxCustomers !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : plan.isRecommended
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : isTrial ? 'Start Free Trial' : 'Upgrade Now'}
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* WhatsApp Pricing Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 rounded-lg p-2">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">WhatsApp Messaging Costs</h3>
            <p className="text-sm text-gray-700 mb-3">
              Bookzi subscription covers platform access and features. WhatsApp conversation costs are charged separately by Meta based on your usage.
            </p>
            <p className="text-sm text-gray-600">
              India WhatsApp rates: Authentication ₹0.33, Utility ₹0.44, Marketing ₹0.88 per conversation. First 1,000 conversations/month are free from Meta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
