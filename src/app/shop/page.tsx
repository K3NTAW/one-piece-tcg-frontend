'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ShopPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please log in to access the shop.</p>
          <Button asChild className="btn-primary">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const shopItems = [
    {
      id: 1,
      name: 'Starter Pack',
      description: 'Perfect for new pirates! Contains 10 random cards.',
      price: 500,
      currency: 'Gold',
      image: '🎁',
      rarity: 'Common',
      color: 'from-green-500 to-green-700'
    },
    {
      id: 2,
      name: 'Grand Line Pack',
      description: 'Advanced pack with higher chance of rare cards.',
      price: 1000,
      currency: 'Gold',
      image: '💎',
      rarity: 'Rare',
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 3,
      name: 'Yonko Pack',
      description: 'Premium pack guaranteed to contain at least one super rare card.',
      price: 2000,
      currency: 'Gold',
      image: '👑',
      rarity: 'Super Rare',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 4,
      name: 'One Piece Pack',
      description: 'Legendary pack with exclusive cards and guaranteed secret rare.',
      price: 5000,
      currency: 'Gold',
      image: '🏴‍☠️',
      rarity: 'Secret Rare',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Card Shop 🛒
            </h1>
            <p className="text-gray-300">
              Purchase card packs and expand your collection
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400 mb-1">2,500</div>
            <div className="text-gray-300 text-sm">Gold Available</div>
          </div>
        </div>

        {/* Shop Categories */}
        <div className="flex gap-4 mb-8">
          <Button className="btn-primary">Card Packs</Button>
          <Button className="btn-secondary">Individual Cards</Button>
          <Button className="btn-secondary">Special Offers</Button>
          <Button className="btn-secondary">Battle Pass</Button>
        </div>

        {/* Featured Items */}
        <Card className="mb-8 bg-gradient-to-r from-straw-hat-red/20 to-straw-hat-blue/20 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-xl">Featured This Week</CardTitle>
            <CardDescription className="text-gray-300">
              Special offers and new arrivals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-4xl">🏆</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">Championship Pack</h3>
                <p className="text-gray-300 text-sm mb-2">Limited time offer! Contains exclusive tournament cards.</p>
                <div className="flex items-center space-x-4">
                  <span className="text-yellow-400 font-bold text-lg">3,000 Gold</span>
                  <span className="text-gray-400 line-through">5,000 Gold</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">40% OFF</span>
                </div>
              </div>
              <Button className="btn-primary">Buy Now</Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shopItems.map((item) => (
            <Card key={item.id} className="bg-white/10 backdrop-blur-sm border-white/20 card-hover">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-lg mx-auto mb-4 flex items-center justify-center`}>
                  <span className="text-3xl">{item.image}</span>
                </div>
                <CardTitle className="text-white text-lg">{item.name}</CardTitle>
                <CardDescription className="text-gray-300 text-sm">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Rarity</span>
                    <span className={`text-sm font-semibold ${
                      item.rarity === 'Common' ? 'text-gray-400' :
                      item.rarity === 'Rare' ? 'text-blue-400' :
                      item.rarity === 'Super Rare' ? 'text-purple-400' :
                      'text-yellow-400'
                    }`}>
                      {item.rarity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Price</span>
                    <span className="text-yellow-400 font-bold">{item.price} {item.currency}</span>
                  </div>
                  <Button 
                    className="w-full btn-primary"
                    disabled={item.price > 2500}
                  >
                    {item.price > 2500 ? 'Not Enough Gold' : 'Purchase'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily Deals */}
        <Card className="mt-8 bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Daily Deals</CardTitle>
            <CardDescription className="text-gray-300">
              Special offers that reset every 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">Gold Bonus</h4>
                  <p className="text-gray-300 text-sm">+50% gold from battles</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">500 Gold</p>
                  <p className="text-gray-400 text-xs">12h left</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">Starter Pack</h4>
                  <p className="text-gray-300 text-sm">50% off first purchase</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">250 Gold</p>
                  <p className="text-gray-400 text-xs">6h left</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold">XP Boost</h4>
                  <p className="text-gray-300 text-sm">Double XP for 24 hours</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">1,000 Gold</p>
                  <p className="text-gray-400 text-xs">18h left</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
