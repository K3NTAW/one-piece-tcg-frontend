'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import GameBoard from '@/components/game/GameBoard';

interface Deck {
  id: string;
  name: string;
  description?: string;
  leader?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  cardCount: number;
}

interface GameState {
  phase: string;
  turn: number;
  currentPlayer: string;
  players: {
    [playerId: string]: {
      life: number;
      hand: any[];
      deck: any[];
      field: any[];
      trash: any[];
      leader: any;
    };
  };
}

export default function MultiplayerPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [message, setMessage] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<{ id: string; username: string } | null>(null);

  // Fetch user's decks
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:3001/decks', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setDecks(data);
          if (data.length > 0) {
            setSelectedDeckId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching decks:', error);
        setMessage('Failed to load decks');
      }
    };

    if (isAuthenticated) {
      fetchDecks();
    }
  }, [isAuthenticated]);

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setMessage('Please log in to access multiplayer.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setMessage('Authentication token not found.');
      return;
    }

    const newSocket = io('http://localhost:3001', {
      query: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setMessage('Connected to multiplayer server.');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setMessage('Disconnected from multiplayer server.');
      setIsInQueue(false);
      setGameStarted(false);
      setGameState(null);
      setCurrentRoomId(null);
      setOpponent(null);
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('WebSocket error:', data);
      setMessage(`Error: ${data.message}`);
    });

    newSocket.on('matchmakingJoined', (data: { position: number; totalPlayers: number; estimatedWaitTime: number }) => {
      setIsInQueue(true);
      setQueuePosition(data.position);
      setTotalPlayers(data.totalPlayers);
      setEstimatedWaitTime(data.estimatedWaitTime);
      setMessage(`Joined matchmaking queue! Position: ${data.position}, Estimated wait: ${data.estimatedWaitTime}s`);
    });

    newSocket.on('matchmakingLeft', (data: { message: string }) => {
      setIsInQueue(false);
      setQueuePosition(0);
      setTotalPlayers(0);
      setEstimatedWaitTime(0);
      setMessage(data.message);
    });

    newSocket.on('queueStatus', (data: { position: number; totalPlayers: number; estimatedWaitTime: number }) => {
      setQueuePosition(data.position);
      setTotalPlayers(data.totalPlayers);
      setEstimatedWaitTime(data.estimatedWaitTime);
    });

    newSocket.on('matchFound', (data: { gameId: string; roomId: string; opponent: { id: string; username: string }; gameState: GameState }) => {
      setIsInQueue(false);
      setCurrentRoomId(data.roomId);
      setOpponent(data.opponent);
      setGameState(data.gameState);
      setMessage(`Match found! Playing against ${data.opponent.username}`);
    });

    newSocket.on('gameStarted', (data: { gameId: string; gameState: GameState; players: any[] }) => {
      setGameStarted(true);
      setGameState(data.gameState);
      setMessage(`Game started! Current player: ${data.gameState.currentPlayer}`);
    });

    newSocket.on('gameUpdate', (data: { action: any; result: any }) => {
      setGameState(data.result.gameState);
      setMessage(`Game updated: ${data.action.type}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  const handleJoinQueue = () => {
    console.log('Join queue clicked');
    console.log('Socket:', socket);
    console.log('Selected deck ID:', selectedDeckId);
    
    if (socket && selectedDeckId) {
      console.log('Emitting joinMatchmaking event');
      socket.emit('joinMatchmaking', { deckId: selectedDeckId });
      setMessage('Joining matchmaking queue...');
    } else {
      const errorMsg = !socket ? 'Not connected to server' : 'Please select a deck';
      console.log('Error:', errorMsg);
      setMessage(errorMsg);
    }
  };

  const handleLeaveQueue = () => {
    if (socket) {
      socket.emit('leaveMatchmaking');
    }
  };

  const handleGetQueueStatus = () => {
    if (socket) {
      socket.emit('getQueueStatus');
    }
  };

  const handleGameAction = (actionType: string) => {
    if (socket && currentRoomId && gameStarted && user) {
      const action = { type: actionType, playerId: user.id, cardId: 'someCardId', target: 'someTarget' };
      socket.emit('gameAction', { roomId: currentRoomId, action });
    } else {
      setMessage('Cannot perform action: not in an active game or not logged in.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Multiplayer Access Denied</h1>
          <p className="mb-6">Please log in to access multiplayer features.</p>
          <Button asChild className="btn-primary">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-straw-hat-black via-gray-900 to-straw-hat-red text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Multiplayer Matchmaking 🌊</h1>
            <p className="text-gray-300">
              Queue up with your deck and battle other players!
            </p>
          </div>
          <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="text-gray-300">Status: {isConnected ? <Badge variant="success">Connected</Badge> : <Badge variant="destructive">Disconnected</Badge>}</div>
          {isInQueue && (
            <div className="text-gray-300">
              Queue Position: <Badge variant="secondary">{queuePosition}</Badge> | 
              Total Players: <Badge variant="secondary">{totalPlayers}</Badge> | 
              Est. Wait: <Badge variant="secondary">{estimatedWaitTime}s</Badge>
            </div>
          )}
        </div>

        <p className="text-gray-300 mb-6">Message: {message}</p>

        {!gameStarted ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Deck Selection */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Select Your Deck</CardTitle>
                <CardDescription className="text-gray-300">
                  Choose a deck to battle with
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {decks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No decks found</p>
                    <Button asChild className="btn-primary">
                      <Link href="/deck-builder">Create Your First Deck</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {decks.map((deck) => (
                      <div
                        key={deck.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedDeckId === deck.id
                            ? 'border-blue-400 bg-blue-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedDeckId(deck.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{deck.name}</h3>
                            <p className="text-sm text-gray-400">
                              {deck.cardCount} cards
                              {deck.leader && ` • Leader: ${deck.leader.name}`}
                            </p>
                          </div>
                          {selectedDeckId === deck.id && (
                            <Badge variant="success">Selected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Matchmaking Controls */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Matchmaking</CardTitle>
                <CardDescription className="text-gray-300">
                  {isInQueue ? 'You are in the matchmaking queue' : 'Join the matchmaking queue to find opponents'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isInQueue ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-2">Searching for Match...</div>
                      <div className="text-sm text-gray-400">
                        Position in queue: {queuePosition} of {totalPlayers}
                      </div>
                      <div className="text-sm text-gray-400">
                        Estimated wait time: {estimatedWaitTime} seconds
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleLeaveQueue} className="flex-1 btn-danger">
                        Leave Queue
                      </Button>
                      <Button onClick={handleGetQueueStatus} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        Refresh Status
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={handleJoinQueue} 
                      disabled={!selectedDeckId || !isConnected}
                      className="w-full btn-primary"
                    >
                      {!selectedDeckId ? 'Select a Deck First' : 'Join Matchmaking Queue'}
                    </Button>
                    <p className="text-sm text-gray-400 text-center">
                      You'll be matched with another player automatically
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Game Board View
          gameState && user && opponent ? (
            <GameBoard
              gameState={gameState}
              currentPlayerId={user.id}
              opponentId={opponent.id}
              onPlayCard={(cardId: string, target?: string) => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { type: 'playCard', cardId, target, playerId: user.id } 
                  });
                }
              }}
              onAttack={(attackerId: string, targetId?: string) => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { type: 'attack', attackerId, targetId, playerId: user.id } 
                  });
                }
              }}
              onEndTurn={() => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { type: 'endTurn', playerId: user.id } 
                  });
                }
              }}
              onActivateEffect={(cardId: string) => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { type: 'activateEffect', cardId, playerId: user.id } 
                  });
                }
              }}
              onNextPhase={() => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { type: 'nextPhase', playerId: user.id } 
                  });
                }
              }}
              onMulligan={() => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { type: 'mulligan', playerId: user.id } 
                  });
                }
              }}
              onDefend={(defenseType: string, cardId?: string, donUsed?: number) => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { 
                      type: 'defend', 
                      playerId: user.id,
                      defenseType,
                      cardId,
                      donUsed
                    } 
                  });
                }
              }}
              onResolveAttack={() => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { type: 'resolveAttack', playerId: user.id } 
                  });
                }
              }}
              onAttachDon={(targetCardId: string, donCount: number) => {
                if (socket && currentRoomId) {
                  socket.emit('gameAction', { 
                    roomId: currentRoomId, 
                    action: { 
                      type: 'attachDon', 
                      playerId: user.id,
                      targetCardId,
                      donCount
                    } 
                  });
                }
              }}
            />
          ) : (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-bold mb-4">Loading Game...</h2>
                <p className="text-gray-400">Preparing your battle!</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}