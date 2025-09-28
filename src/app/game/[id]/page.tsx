'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface GameCard {
  id: string;
  cardId: string;
  name: string;
  cardType: string;
  cost?: number;
  power?: number;
  counterPower?: number;
  color: string;
  effectText?: string;
  isActive: boolean;
  isResting: boolean;
  position: 'field' | 'hand' | 'deck' | 'trash';
}

interface Player {
  id: string;
  userId: string;
  username: string;
  leader: GameCard;
  hand: GameCard[];
  deck: GameCard[];
  trash: GameCard[];
  field: GameCard[];
  life: number;
  don: number;
  maxDon: number;
  isActive: boolean;
  isWinner: boolean;
}

interface GameState {
  id: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentPlayer: string;
  turn: number;
  phase: 'DON_PHASE' | 'MAIN_PHASE' | 'BATTLE_PHASE' | 'END_PHASE';
  players: Player[];
  winner?: string;
  createdAt: string;
  updatedAt: string;
}

export default function GamePage() {
  const { isAuthenticated, user } = useAuth();
  const params = useParams();
  const gameId = params.id as string;
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);

  useEffect(() => {
    if (isAuthenticated && gameId) {
      fetchGameState();
    }
  }, [isAuthenticated, gameId]);

  const fetchGameState = async () => {
    try {
      const response = await fetch(`http://localhost:3001/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      } else {
        setError('Failed to load game');
      }
    } catch (error) {
      console.error('Error fetching game state:', error);
      setError('Error loading game');
    } finally {
      setLoading(false);
    }
  };

  const processAction = async (action: any) => {
    try {
      const response = await fetch(`http://localhost:3001/games/${gameId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(action),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      } else {
        setError('Failed to process action');
      }
    } catch (error) {
      console.error('Error processing action:', error);
      setError('Error processing action');
    }
  };

  const playCard = (card: GameCard) => {
    if (gameState?.currentPlayer !== user?.id) return;
    
    processAction({
      type: 'PLAY_CARD',
      playerId: user?.id,
      cardId: card.id,
    });
  };

  const attack = (attacker: GameCard, target?: GameCard) => {
    if (gameState?.currentPlayer !== user?.id) return;
    
    processAction({
      type: 'ATTACK',
      playerId: user?.id,
      cardId: attacker.id,
      targetId: target?.id,
    });
  };

  const endTurn = () => {
    if (gameState?.currentPlayer !== user?.id) return;
    
    processAction({
      type: 'END_TURN',
      playerId: user?.id,
    });
  };

  const concede = () => {
    if (gameState?.currentPlayer !== user?.id) return;
    
    processAction({
      type: 'CONCEDE',
      playerId: user?.id,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please log in to play games.</p>
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
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Game Error</h1>
          <p className="text-gray-300 mb-6">{error || 'Game not found'}</p>
          <Button asChild className="btn-primary">
            <Link href="/battle">Back to Battle</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  const opponent = gameState.players.find(p => p.id !== gameState.currentPlayer);
  const isMyTurn = gameState.currentPlayer === user?.id;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-straw-hat-black via-gray-900 to-straw-hat-red">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="outline" className="btn-secondary">
              <Link href="/battle">
                ← Back to Battle
              </Link>
            </Button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-white">One Piece TCG Battle</h1>
            <div className="flex gap-2">
              <Button onClick={endTurn} disabled={!isMyTurn} className="btn-primary">
                End Turn
              </Button>
              <Button onClick={concede} disabled={!isMyTurn} className="btn-danger">
                Concede
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-white">
            <div>
              <p className="text-lg font-semibold">Turn {gameState.turn}</p>
              <p className="text-sm text-gray-300">Phase: {gameState.phase.replace('_', ' ')}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {currentPlayer?.username}'s Turn
              </p>
              <p className="text-sm text-gray-300">
                {isMyTurn ? 'Your turn' : 'Waiting for opponent'}
              </p>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="space-y-8">
          {/* Opponent Area */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex justify-between items-center">
                <span>{opponent?.username}</span>
                <div className="flex gap-4 text-sm">
                  <span>Life: {opponent?.life}</span>
                  <span>Don: {opponent?.don}/{opponent?.maxDon}</span>
                  <span>Hand: {opponent?.hand.length}</span>
                  <span>Deck: {opponent?.deck.length}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Opponent Leader */}
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Leader</h3>
                {opponent?.leader && (
                  <div className="inline-block">
                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-3">
                        <div className="w-16 h-20 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded flex items-center justify-center">
                          <span className="text-2xl">👑</span>
                        </div>
                        <h4 className="text-white font-semibold text-xs mt-1">{opponent.leader.name}</h4>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Opponent Field */}
              <div>
                <h3 className="text-white font-semibold mb-2">Field</h3>
                <div className="flex gap-2 flex-wrap">
                  {opponent?.field.map((card) => (
                    <Card key={card.id} className="bg-white/5 border-white/20">
                      <CardContent className="p-2">
                        <div className="w-12 h-16 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded flex items-center justify-center">
                          <span className="text-lg">⚔️</span>
                        </div>
                        <h4 className="text-white font-semibold text-xs mt-1 truncate">{card.name}</h4>
                        <div className="text-xs text-gray-400">
                          {card.power && `P: ${card.power}`}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Area */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex justify-between items-center">
                <span>{user?.username}</span>
                <div className="flex gap-4 text-sm">
                  <span>Life: {currentPlayer?.life}</span>
                  <span>Don: {currentPlayer?.don}/{currentPlayer?.maxDon}</span>
                  <span>Hand: {currentPlayer?.hand.length}</span>
                  <span>Deck: {currentPlayer?.deck.length}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* My Leader */}
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Leader</h3>
                {currentPlayer?.leader && (
                  <div className="inline-block">
                    <Card className="bg-white/5 border-white/20">
                      <CardContent className="p-3">
                        <div className="w-16 h-20 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded flex items-center justify-center">
                          <span className="text-2xl">👑</span>
                        </div>
                        <h4 className="text-white font-semibold text-xs mt-1">{currentPlayer.leader.name}</h4>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* My Field */}
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Field</h3>
                <div className="flex gap-2 flex-wrap">
                  {currentPlayer?.field.map((card) => (
                    <Card 
                      key={card.id} 
                      className={`bg-white/5 border-white/20 cursor-pointer hover:bg-white/10 ${
                        selectedCard?.id === card.id ? 'ring-2 ring-straw-hat-red' : ''
                      }`}
                      onClick={() => setSelectedCard(card)}
                    >
                      <CardContent className="p-2">
                        <div className="w-12 h-16 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded flex items-center justify-center">
                          <span className="text-lg">⚔️</span>
                        </div>
                        <h4 className="text-white font-semibold text-xs mt-1 truncate">{card.name}</h4>
                        <div className="text-xs text-gray-400">
                          {card.power && `P: ${card.power}`}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* My Hand */}
              <div>
                <h3 className="text-white font-semibold mb-2">Hand</h3>
                <div className="flex gap-2 flex-wrap">
                  {currentPlayer?.hand.map((card) => (
                    <Card 
                      key={card.id} 
                      className={`bg-white/5 border-white/20 cursor-pointer hover:bg-white/10 ${
                        selectedCard?.id === card.id ? 'ring-2 ring-straw-hat-red' : ''
                      }`}
                      onClick={() => setSelectedCard(card)}
                    >
                      <CardContent className="p-2">
                        <div className="w-12 h-16 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded flex items-center justify-center">
                          <span className="text-lg">⚔️</span>
                        </div>
                        <h4 className="text-white font-semibold text-xs mt-1 truncate">{card.name}</h4>
                        <div className="text-xs text-gray-400">
                          {card.cost && `Cost: ${card.cost}`}
                          {card.power && ` | P: ${card.power}`}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        {selectedCard && isMyTurn && (
          <Card className="mt-6 bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Selected Card: {selectedCard.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {selectedCard.position === 'hand' && (
                  <Button 
                    onClick={() => playCard(selectedCard)}
                    className="btn-primary"
                  >
                    Play Card
                  </Button>
                )}
                {selectedCard.position === 'field' && (
                  <Button 
                    onClick={() => attack(selectedCard)}
                    className="btn-warning"
                  >
                    Attack
                  </Button>
                )}
                <Button 
                  onClick={() => setSelectedCard(null)}
                  className="btn-secondary"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Status */}
        {gameState.status === 'COMPLETED' && (
          <Card className="mt-6 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                {gameState.winner === user?.id ? 'Victory!' : 'Defeat!'}
              </h2>
              <p className="text-gray-300 mb-4">
                {gameState.winner === user?.id 
                  ? 'Congratulations! You won the battle!' 
                  : 'Better luck next time!'
                }
              </p>
              <Button asChild className="btn-primary">
                <Link href="/battle">Back to Battle</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
