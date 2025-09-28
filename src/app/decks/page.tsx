'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DecksPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please log in to view your decks.</p>
          <Button asChild className="btn-primary">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sampleDecks = [
    {
      id: 1,
      name: 'Straw Hat Pirates',
      description: 'A balanced deck featuring the main crew',
      winRate: 75,
      gamesPlayed: 24,
      lastPlayed: '2 hours ago',
      color: 'from-straw-hat-red to-straw-hat-blue',
      icon: '🏴‍☠️'
    },
    {
      id: 2,
      name: 'Marine Forces',
      description: 'Control deck with strong defensive cards',
      winRate: 68,
      gamesPlayed: 18,
      lastPlayed: '1 day ago',
      color: 'from-blue-600 to-blue-800',
      icon: '⚓'
    },
    {
      id: 3,
      name: 'Revolutionary Army',
      description: 'Aggressive deck with high attack power',
      winRate: 82,
      gamesPlayed: 15,
      lastPlayed: '3 days ago',
      color: 'from-red-600 to-orange-600',
      icon: '🔥'
    }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Deck Builder ⚔️
            </h1>
            <p className="text-gray-300">
              Create and manage your One Piece TCG decks
            </p>
          </div>
          <Button asChild className="btn-primary">
            <Link href="/deck-builder">+ Create New Deck</Link>
          </Button>
        </div>

        {/* Deck Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{sampleDecks.length}</div>
              <div className="text-gray-300 text-sm">Total Decks</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">75%</div>
              <div className="text-gray-300 text-sm">Average Win Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-straw-hat-blue mb-2">57</div>
              <div className="text-gray-300 text-sm">Games Played</div>
            </CardContent>
          </Card>
        </div>

        {/* Deck Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleDecks.map((deck) => (
            <Card key={deck.id} className="bg-white/10 backdrop-blur-sm border-white/20 card-hover">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${deck.color} rounded-lg flex items-center justify-center`}>
                    <span className="text-2xl">{deck.icon}</span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{deck.name}</CardTitle>
                    <CardDescription className="text-gray-300 text-sm">
                      {deck.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Win Rate</span>
                    <span className="text-white font-semibold">{deck.winRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Games Played</span>
                    <span className="text-white font-semibold">{deck.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Last Played</span>
                    <span className="text-gray-400 text-sm">{deck.lastPlayed}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="btn-primary flex-1">
                      <Link href={`/decks/${deck.id}`}>Edit Deck</Link>
                    </Button>
                    <Button size="sm" className="btn-secondary">Play</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State for New Users */}
        {sampleDecks.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">⚔️</div>
              <h3 className="text-xl font-bold text-white mb-2">No Decks Yet</h3>
              <p className="text-gray-300 mb-6">
                Create your first deck to start battling in the One Piece TCG!
              </p>
              <Button className="btn-primary">Create Your First Deck</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
