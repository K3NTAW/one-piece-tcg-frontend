'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Deck {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  cards: Array<{
    card: {
      id: string;
      name: string;
      cardType: string;
      imageUrl?: string;
    };
    quantity: number;
  }>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Game {
  id: string;
  status: string;
  player1Id: string;
  player2Id: string;
  currentPlayerId: string;
  turn: number;
  phase: string;
  winnerId?: string;
  createdAt: string;
  updatedAt: string;
  players: Array<{
    id: string;
    username: string;
  }>;
}

export default function BattlePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [decks, setDecks] = useState<Deck[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [creatingGame, setCreatingGame] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDecks();
      fetchGames();
    }
  }, [isAuthenticated]);

  const fetchDecks = async () => {
    try {
      const response = await fetch('http://localhost:3001/decks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDecks(data);
        if (data.length > 0) {
          setSelectedDeck(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch('http://localhost:3001/games', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGames(data);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGame = async () => {
    if (!selectedDeck) {
      alert('Please select a deck');
      return;
    }

    setCreatingGame(true);
    try {
      // For now, create a game against a bot or find a random opponent
      // In a real implementation, you'd have matchmaking
      const response = await fetch('http://localhost:3001/games/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          opponentId: 'bot', // This would be a real opponent ID in production
          deckId: selectedDeck,
          opponentDeckId: selectedDeck, // For now, use same deck
        }),
      });

      if (response.ok) {
        const game = await response.json();
        router.push(`/game/${game.id}`);
      } else {
        alert('Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Error creating game');
    } finally {
      setCreatingGame(false);
    }
  };

  const joinGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please log in to battle.</p>
          <Button asChild className="btn-primary">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-straw-hat-black via-gray-900 to-straw-hat-red">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" className="btn-secondary">
              <Link href="/dashboard">
                ← Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Battle Arena ⚔️
          </h1>
          <p className="text-gray-300">
            Challenge opponents and test your deck building skills
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Game */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Start New Battle</CardTitle>
              <CardDescription className="text-gray-300">
                Create a new game and challenge opponents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {decks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-gray-300 mb-4">No decks available</p>
                  <Button asChild className="btn-primary">
                    <Link href="/deck-builder">Create Your First Deck</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-white font-semibold mb-2 block">Select Deck</label>
                    <select
                      value={selectedDeck}
                      onChange={(e) => setSelectedDeck(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                    >
                      {decks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                          {deck.name} ({deck.cards.reduce((sum, dc) => sum + dc.quantity, 0)} cards)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Button 
                    onClick={createGame}
                    disabled={creatingGame || !selectedDeck}
                    className="w-full btn-primary"
                  >
                    {creatingGame ? 'Creating Game...' : 'Start Battle'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Games */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Active Games</CardTitle>
              <CardDescription className="text-gray-300">
                Continue your ongoing battles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-white">Loading games...</div>
                </div>
              ) : games.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⚔️</div>
                  <p className="text-gray-300">No active games</p>
                  <p className="text-gray-400 text-sm">Create a new game to start battling!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {games.map((game) => (
                    <div key={game.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-semibold">
                          Game #{game.id.slice(-8)}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          game.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                          game.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {game.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-300 mb-3">
                        <p>Turn {game.turn} • Phase: {game.phase.replace('_', ' ')}</p>
                        <p>Players: {game.players.map(p => p.username).join(' vs ')}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => joinGame(game.id)}
                          className="btn-primary text-sm"
                        >
                          {game.status === 'ACTIVE' ? 'Continue' : 'View'}
                        </Button>
                        {game.status === 'ACTIVE' && (
                          <Button 
                            onClick={() => {
                              // Implement concede functionality
                              alert('Concede functionality coming soon!');
                            }}
                            className="btn-danger text-sm"
                          >
                            Concede
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild className="btn-secondary justify-start">
                  <Link href="/deck-builder">
                    <span className="mr-2">⚔️</span>
                    Build New Deck
                  </Link>
                </Button>
                <Button asChild className="btn-secondary justify-start">
                  <Link href="/collection">
                    <span className="mr-2">📚</span>
                    View Collection
                  </Link>
                </Button>
                <Button asChild className="btn-secondary justify-start">
                  <Link href="/dashboard">
                    <span className="mr-2">📊</span>
                    View Stats
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Tips */}
        <div className="mt-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Battle Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-2">Deck Building</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Include a good mix of low and high cost cards</li>
                    <li>• Balance your color distribution</li>
                    <li>• Don't forget to include your leader!</li>
                    <li>• Test your deck against different strategies</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Battle Strategy</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Manage your Don resources carefully</li>
                    <li>• Protect your leader at all costs</li>
                    <li>• Use card effects strategically</li>
                    <li>• Watch your opponent's hand size</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}