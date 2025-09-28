'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface UserStats {
  totalCards: number;
  totalDecks: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  rank: string;
  level: number;
  experience: number;
  nextLevelExp: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserStats();
    }
  }, [isAuthenticated]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Mock data for now
        setStats({
          totalCards: 156,
          totalDecks: 8,
          gamesPlayed: 42,
          gamesWon: 28,
          winRate: 66.7,
          rank: 'Grand Line',
          level: 15,
          experience: 1250,
          nextLevelExp: 1500,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Mock data for now
      setStats({
        totalCards: 156,
        totalDecks: 8,
        gamesPlayed: 42,
        gamesWon: 28,
        winRate: 66.7,
        rank: 'Grand Line',
        level: 15,
        experience: 1250,
        nextLevelExp: 1500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please log in to access your dashboard.</p>
          <Button asChild className="btn-primary">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const experienceProgress = stats ? (stats.experience / stats.nextLevelExp) * 100 : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.username}! 🏴‍☠️
          </h1>
          <p className="text-gray-300">
            Ready to set sail on your next adventure?
          </p>
        </div>

        {/* Level Progress */}
        {stats && (
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Level {stats.level}</h3>
                  <p className="text-gray-300">Grand Line Pirate</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{stats.experience} / {stats.nextLevelExp} XP</p>
                  <p className="text-sm text-gray-300">{stats.nextLevelExp - stats.experience} XP to next level</p>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-straw-hat-red to-straw-hat-blue h-3 rounded-full transition-all duration-500"
                  style={{ width: `${experienceProgress}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-straw-hat-red text-sm font-medium">Total Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalCards || 0}</div>
              <p className="text-xs text-gray-400">In collection</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-straw-hat-blue text-sm font-medium">Decks Built</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalDecks || 0}</div>
              <p className="text-xs text-gray-400">Custom decks</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-400 text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.winRate || 0}%</div>
              <p className="text-xs text-gray-400">{stats?.gamesWon || 0} / {stats?.gamesPlayed || 0} games</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-400 text-sm font-medium">Current Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.rank || 'Rookie'}</div>
              <p className="text-xs text-gray-400">Pirate rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-300">
                Jump into your favorite activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full btn-primary justify-start">
                <Link href="/deck-builder">
                  <span className="mr-2">⚔️</span>
                  Build New Deck
                </Link>
              </Button>
              <Button asChild className="w-full btn-secondary justify-start">
                <Link href="/battle">
                  <span className="mr-2">⚔️</span>
                  Start Battle
                </Link>
              </Button>
              <Button asChild className="w-full btn-secondary justify-start">
                <Link href="/collection">
                  <span className="mr-2">📚</span>
                  View Collection
                </Link>
              </Button>
              <Button asChild className="w-full btn-success justify-start">
                <Link href="/battle">
                  <span className="mr-2">⚡</span>
                  Quick Battle
                </Link>
              </Button>
              <Button asChild className="w-full btn-warning justify-start">
                <Link href="/shop">
                  <span className="mr-2">🛒</span>
                  Card Shop
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-gray-300">
                Your latest adventures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Won battle against ZoroFan123</p>
                    <p className="text-gray-400 text-xs">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Created new deck "Straw Hat Pirates"</p>
                    <p className="text-gray-400 text-xs">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Unlocked new card: Monkey D. Luffy</p>
                    <p className="text-gray-400 text-xs">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Featured Deck</CardTitle>
              <CardDescription className="text-gray-300">
                Your most successful deck
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">⚔️</span>
                </div>
                <h4 className="text-white font-semibold mb-1">Straw Hat Pirates</h4>
                <p className="text-gray-400 text-sm mb-3">Win Rate: 75%</p>
                <Button asChild size="sm" className="btn-primary">
                  <Link href="/decks/straw-hat-pirates">View Deck</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Daily Mission</CardTitle>
              <CardDescription className="text-gray-300">
                Complete for rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Win 3 battles</span>
                  <span className="text-yellow-400 text-sm">2/3</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
                <p className="text-gray-400 text-xs">Reward: 100 XP + 50 Gold</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Leaderboard</CardTitle>
              <CardDescription className="text-gray-300">
                Top pirates this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">1. GolDRoger</span>
                  <span className="text-yellow-400 text-sm">2,847 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">2. Whitebeard</span>
                  <span className="text-gray-400 text-sm">2,654 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">3. Shanks</span>
                  <span className="text-gray-400 text-sm">2,421 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-straw-hat-red text-sm">You: {user?.username}</span>
                  <span className="text-straw-hat-red text-sm">1,250 pts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
