'use client';

import { useState } from 'react';
import { 
  CurrencyDollarIcon, 
  CalculatorIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ClockIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  useCurrentGoldRates, 
  useGoldRateHistory, 
  usePriceCalculator, 
  useMakingCharges 
} from '@/lib/hooks/usePricing';
import { format } from 'date-fns';

export default function PricingPage() {
  const [calculatorData, setCalculatorData] = useState({
    weight: '',
    purity: '22K',
    making_charge_percentage: '12',
    wastage_percentage: '2',
    category: 'rings'
  });

  const { data: goldRates, isLoading: goldRatesLoading, error: goldRatesError } = useCurrentGoldRates();
  const { data: rateHistory, isLoading: historyLoading } = useGoldRateHistory(7);
  const { data: makingCharges, isLoading: makingChargesLoading } = useMakingCharges();
  const { calculate: calculatePrice, calculation: calculatedPrice, isCalculating: calculating } = usePriceCalculator();

  const handleCalculate = () => {
    if (!calculatorData.weight) return;
    
    calculatePrice({
      weight: parseFloat(calculatorData.weight),
      purity: calculatorData.purity as '22K' | '18K' | '14K',
      making_charge_percentage: parseFloat(calculatorData.making_charge_percentage),
      wastage_percentage: parseFloat(calculatorData.wastage_percentage),
      category: calculatorData.category
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPurityColor = (purity: string) => {
    switch (purity) {
      case '22K': return 'from-yellow-400 to-yellow-600';
      case '18K': return 'from-yellow-300 to-yellow-500';
      case '14K': return 'from-yellow-200 to-yellow-400';
      default: return 'from-gray-300 to-gray-500';
    }
  };

  const getRateChange = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(2),
      direction: change >= 0 ? 'up' : 'down',
      amount: Math.abs(current - previous)
    };
  };

  if (goldRatesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <InformationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to fetch gold rates</h3>
          <p className="mt-1 text-sm text-gray-500">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate font-display">
            Pricing & Gold Rates
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Live gold rates from Azure backend • Updates every 5 minutes
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button 
            onClick={() => window.location.reload()}
            disabled={goldRatesLoading}
            className="btn-secondary"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${goldRatesLoading ? 'animate-spin' : ''}`} />
            Refresh Rates
          </button>
          <button className="btn-primary">
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Configure Charges
          </button>
        </div>
      </div>

      {/* Live Connection Status */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Connected to Azure Backend
            </h3>
            <div className="mt-1 text-sm text-green-700">
              <p>Real-time data from http://4.236.132.147 • Last updated: {goldRates?.last_updated && format(new Date(goldRates.last_updated), 'PPp')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Gold Rates - Live from Azure */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Live Gold Rates from Azure Backend</h3>
          {goldRates?.last_updated && (
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              Updated: {format(new Date(goldRates.last_updated), 'PPp')}
            </div>
          )}
        </div>

        {goldRatesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 rounded-lg border">
                <div className="skeleton h-6 w-16 mb-2"></div>
                <div className="skeleton h-8 w-24 mb-2"></div>
                <div className="skeleton h-4 w-20"></div>
              </div>
            ))}
          </div>
        ) : goldRates ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Object.entries(goldRates).map(([purity, rate]) => {
              if (purity === 'last_updated' || purity === 'source') return null;
              
              // Calculate change from historical data
              const previousRate = Array.isArray(rateHistory) && rateHistory.length > 0 ? 
                rateHistory[1]?.[purity as keyof typeof rateHistory[1]] as number : undefined;
              const change = previousRate ? getRateChange(rate as number, previousRate) : null;
              
              return (
                <div key={purity} className={`p-6 rounded-lg bg-gradient-to-br ${getPurityColor(purity)} text-white relative overflow-hidden`}>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-medium">{purity} Gold</h4>
                      {change && (
                        <div className={`flex items-center text-sm ${change.direction === 'up' ? 'text-green-200' : 'text-red-200'}`}>
                          {change.direction === 'up' ? 
                            <TrendingUpIcon className="h-4 w-4 mr-1" /> : 
                            <TrendingDownIcon className="h-4 w-4 mr-1" />
                          }
                          {change.percentage}%
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold font-display mb-1">
                      {formatCurrency(rate as number)}
                    </div>
                    <div className="text-sm opacity-90">per gram</div>
                    {change && (
                      <div className="text-xs opacity-75 mt-1">
                        {change.direction === 'up' ? '+' : '-'}{formatCurrency(change.amount)} vs yesterday
                      </div>
                    )}
                  </div>
                  <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4">
                    <CurrencyDollarIcon className="h-24 w-24 opacity-20" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rate data available</h3>
            <p className="mt-1 text-sm text-gray-500">Try refreshing to fetch the latest rates.</p>
          </div>
        )}
      </div>

      {/* Price Calculator & Rate History Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Real-time Price Calculator */}
        <div className="card">
          <div className="flex items-center mb-6">
            <CalculatorIcon className="h-6 w-6 text-gold-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Real-time Price Calculator</h3>
          </div>

          <div className="space-y-4">
            {/* Weight Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Enter weight in grams"
                className="input-field"
                value={calculatorData.weight}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, weight: e.target.value }))}
              />
            </div>

            {/* Purity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gold Purity</label>
              <select 
                className="input-field"
                value={calculatorData.purity}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, purity: e.target.value }))}
              >
                <option value="22K">22K Gold</option>
                <option value="18K">18K Gold</option>
                <option value="14K">14K Gold</option>
              </select>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="input-field"
                value={calculatorData.category}
                onChange={(e) => setCalculatorData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="rings">Rings</option>
                <option value="necklaces">Necklaces</option>
                <option value="earrings">Earrings</option>
                <option value="bracelets">Bracelets</option>
                <option value="bangles">Bangles</option>
              </select>
            </div>

            {/* Making Charges */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Making Charges (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={calculatorData.making_charge_percentage}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, making_charge_percentage: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wastage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={calculatorData.wastage_percentage}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, wastage_percentage: e.target.value }))}
                />
              </div>
            </div>

            {/* Calculate Button */}
            <button 
              onClick={handleCalculate}
              disabled={!calculatorData.weight || calculating || goldRatesLoading}
              className="btn-primary w-full"
            >
              {calculating ? 'Calculating...' : 'Calculate Price with Live Rates'}
            </button>

            {/* Price Breakdown */}
            {calculatedPrice && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Price Breakdown (Using Live Gold Rates)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gold Value:</span>
                    <span className="font-medium">{formatCurrency(calculatedPrice.gold_value || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Making Charges:</span>
                    <span className="font-medium">{formatCurrency(calculatedPrice.making_charges || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wastage:</span>
                    <span className="font-medium">{formatCurrency(calculatedPrice.wastage_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(calculatedPrice.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">{formatCurrency(calculatedPrice.gst_amount || 0)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-lg text-green-600">{formatCurrency(calculatedPrice.total_price || 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rate History Chart */}
        <div className="card">
          <div className="flex items-center mb-6">
            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">7-Day Rate History</h3>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="skeleton h-4 w-20"></div>
                  <div className="skeleton h-4 w-24"></div>
                  <div className="skeleton h-4 w-16"></div>
                </div>
              ))}
            </div>
          ) : rateHistory && Array.isArray(rateHistory) ? (
            <div className="space-y-3">
              {rateHistory.slice(0, 7).map((rate, index) => {
                const change = index < rateHistory.length - 1 ? 
                  getRateChange(rate['22K'], rateHistory[index + 1]['22K']) : null;
                
                return (
                  <div key={rate.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(rate.date), 'MMM d')}
                      </div>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        22K Gold
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(rate['22K'])}
                    </div>
                    <div className="flex items-center">
                      {change && (
                        <div className={`flex items-center text-xs ${change.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {change.direction === 'up' ? 
                            <TrendingUpIcon className="h-3 w-3 mr-1" /> : 
                            <TrendingDownIcon className="h-3 w-3 mr-1" />
                          }
                          {change.percentage}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No historical data</h3>
              <p className="mt-1 text-sm text-gray-500">Rate history will appear here once available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Making Charges Configuration */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Making Charges Configuration</h3>
          <button className="btn-secondary">
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Edit Charges
          </button>
        </div>

        {makingChargesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="skeleton h-5 w-20 mb-2"></div>
                <div className="skeleton h-6 w-16 mb-1"></div>
                <div className="skeleton h-4 w-24"></div>
              </div>
            ))}
          </div>
        ) : makingCharges && Array.isArray(makingCharges) ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {makingCharges.map((charge) => (
              <div key={charge.id} className="p-4 border border-gray-200 rounded-lg hover:border-gold-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 capitalize">{charge.category}</h4>
                  <span className="text-xs text-gray-500">{charge.charge_type}</span>
                </div>
                <div className="text-lg font-semibold text-gold-600 mb-1">
                  {charge.charge_type === 'percentage' ? `${charge.rate_value}%` : `₹${charge.rate_value}/g`}
                </div>
                <div className="text-xs text-gray-500">
                  {charge.purity} • {charge.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No configuration data</h3>
            <p className="mt-1 text-sm text-gray-500">Set up making charges for different jewelry categories.</p>
          </div>
        )}
      </div>
    </div>
  );
}