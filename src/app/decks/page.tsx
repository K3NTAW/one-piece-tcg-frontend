'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface DeckCard {
  id: string;
  cardId: string;
  quantity: number;
  card: {
    id: string;
    name: string;
    cardType: string;
    cost?: number;
    power?: number;
    color: string;
    imageUrl?: string;
    smallImageUrl?: string;
  };
}

interface Deck {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  cards: DeckCard[];
  leader?: {
    id: string;
    name: string;
    cardType: string;
    imageUrl?: string;
    smallImageUrl?: string;
  };
}

export default function DecksPage() {
  const { isAuthenticated, user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDecks();
    }
  }, [isAuthenticated]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/decks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDecks(data);
      } else {
        setError('Failed to fetch decks');
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
      setError('Error fetching decks');
    } finally {
      setLoading(false);
    }
  };

  const deleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;

    try {
      const response = await fetch(`http://localhost:3001/decks/${deckId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        setDecks(decks.filter(deck => deck.id !== deckId));
      } else {
        alert('Failed to delete deck');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      alert('Error deleting deck');
    }
  };

  const exportDeck = async (deckId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/decks/export/${deckId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Copy to clipboard
        await navigator.clipboard.writeText(data.deckList);
        alert('Deck list copied to clipboard!');
      } else {
        alert('Failed to export deck');
      }
    } catch (error) {
      console.error('Error exporting deck:', error);
      alert('Error exporting deck');
    }
  };

  const getDeckStats = (deck: Deck) => {
    const totalCards = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0);
    const leaderCards = deck.cards.filter(dc => dc.card.cardType === 'Leader');
    const characterCards = deck.cards.filter(dc => dc.card.cardType === 'Character');
    const eventCards = deck.cards.filter(dc => dc.card.cardType === 'Event');
    const stageCards = deck.cards.filter(dc => dc.card.cardType === 'Stage');

    return {
      totalCards,
      leaderCount: leaderCards.length,
      characterCount: characterCards.reduce((sum, dc) => sum + dc.quantity, 0),
      eventCount: eventCards.reduce((sum, dc) => sum + dc.quantity, 0),
      stageCount: stageCards.reduce((sum, dc) => sum + dc.quantity, 0),
    };
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading decks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button onClick={fetchDecks} className="btn-primary">
            Try Again
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                My Decks ⚔️
              </h1>
              <p className="text-gray-300">
                Create and manage your One Piece TCG decks
              </p>
            </div>
            <Button asChild className="btn-primary">
              <Link href="/deck-builder">+ Create New Deck</Link>
            </Button>
          </div>
        </div>

        {/* Deck Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{decks.length}</div>
              <div className="text-gray-300 text-sm">Total Decks</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-straw-hat-blue mb-2">
                {decks.reduce((sum, deck) => sum + getDeckStats(deck).totalCards, 0)}
              </div>
              <div className="text-gray-300 text-sm">Total Cards</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {decks.filter(deck => deck.isPublic).length}
              </div>
              <div className="text-gray-300 text-sm">Public Decks</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {decks.filter(deck => getDeckStats(deck).leaderCount > 0).length}
              </div>
              <div className="text-gray-300 text-sm">Complete Decks</div>
            </CardContent>
          </Card>
        </div>

        {/* Deck Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => {
            const stats = getDeckStats(deck);
            const leaderCard = deck.cards.find(dc => dc.card.cardType === 'Leader')?.card;
            
            return (
              <Card key={deck.id} className="bg-white/10 backdrop-blur-sm border-white/20 card-hover">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded-lg flex items-center justify-center relative overflow-hidden">
                      {leaderCard ? (
                        <img 
                          src={leaderCard.smallImageUrl || leaderCard.imageUrl} 
                          alt={leaderCard.name}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center" style={{ display: leaderCard ? 'none' : 'flex' }}>
                        <span className="text-lg">⚔️</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{deck.name}</CardTitle>
                      <CardDescription className="text-gray-300 text-sm">
                        {deck.description || 'No description'}
                      </CardDescription>
                      {deck.isPublic && (
                        <span className="text-green-400 text-xs font-semibold">Public</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Total Cards</span>
                      <span className="text-white font-semibold">{stats.totalCards}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Characters</span>
                      <span className="text-white font-semibold">{stats.characterCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Events</span>
                      <span className="text-white font-semibold">{stats.eventCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Leader</span>
                      <span className="text-white font-semibold">
                        {stats.leaderCount > 0 ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" className="btn-primary flex-1">
                        <Link href={`/deck-builder?edit=${deck.id}`}>Edit Deck</Link>
                      </Button>
                      <Button 
                        size="sm" 
                        className="btn-secondary"
                        onClick={() => exportDeck(deck.id)}
                      >
                        📤 Export
                      </Button>
                      <Button 
                        size="sm" 
                        className="btn-danger"
                        onClick={() => deleteDeck(deck.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State for New Users */}
        {decks.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">⚔️</div>
              <h3 className="text-xl font-bold text-white mb-2">No Decks Yet</h3>
              <p className="text-gray-300 mb-6">
                Create your first deck to start battling in the One Piece TCG!
              </p>
              <Button asChild className="btn-primary">
                <Link href="/deck-builder">Create Your First Deck</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
