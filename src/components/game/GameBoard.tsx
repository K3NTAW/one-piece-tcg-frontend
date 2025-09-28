'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useDroppable
} from '@dnd-kit/core';
import EffectModal from './EffectModal';
import ComplexEffectModal from './ComplexEffectModal';

interface GameCard {
  id: string;
  name: string;
  cost: number;
  power: number;
  counterPower?: number;
  attribute: string;
  color: string;
  cardType: string;
  effectText?: string;
  imageUrl?: string;
  smallImageUrl?: string;
  tapped?: boolean;
  summoningSickness?: boolean;
  attachedDon?: number;
  currentPower?: number;
  effects?: Array<{
    id: string;
    effectType: string;
    effectText: string;
    conditions?: string;
    cost?: number;
  }>;
}

interface GameState {
  phase: string;
  turn: number;
  currentPlayer: string;
  attackState?: {
    attackerId: string;
    targetId: string;
    attackerCardId: string;
    attackerPower: number;
    defenderPower: number;
    phase: 'defense' | 'resolved';
    responses: any[];
  };
  players: {
    [playerId: string]: {
      life: number;
      lifeCards: GameCard[];
      hand: GameCard[];
      deck: GameCard[];
      characters: GameCard[];
      stages: GameCard[];
      donDeck: any[];
      donArea: any[];
      trash: GameCard[];
      leader: GameCard;
      canAttack: boolean;
      hasMulliganed?: boolean;
    };
  };
}

interface GameBoardProps {
  gameState: GameState;
  currentPlayerId: string;
  opponentId: string;
  onPlayCard: (cardId: string, target?: string) => void;
  onAttack: (attackerId: string, targetId?: string) => void;
  onEndTurn: () => void;
  onActivateEffect: (cardId: string, effectId?: string) => void;
  onNextPhase?: () => void;
  onMulligan?: () => void;
  onDefend?: (defenseType: string, cardId?: string, donUsed?: number) => void;
  onResolveAttack?: () => void;
  onAttachDon?: (targetCardId: string, donCount: number) => void;
}

export default function GameBoard({
  gameState,
  currentPlayerId,
  opponentId,
  onPlayCard,
  onAttack,
  onEndTurn,
  onActivateEffect,
  onNextPhase,
  onMulligan,
  onDefend,
  onResolveAttack,
  onAttachDon,
}: GameBoardProps) {
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [showEffectModal, setShowEffectModal] = useState(false);
  const [showComplexEffectModal, setShowComplexEffectModal] = useState(false);
  const [complexEffectData, setComplexEffectData] = useState<any>(null);

  const currentPlayer = gameState.players[currentPlayerId];
  const opponent = gameState.players[opponentId];

  const { setNodeRef: setHandRef } = useDroppable({
    id: 'hand-area',
  });

  const { setNodeRef: setFieldRef } = useDroppable({
    id: 'field-area',
  });

  const { setNodeRef: setOpponentFieldRef } = useDroppable({
    id: 'opponent-field-area',
  });


  const handleCardClick = (card: GameCard) => {
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handleCardDoubleClick = (card: GameCard) => {
    if (card.effects && card.effects.length > 0) {
      setSelectedCard(card);
      
      // Check if any effect is complex (has steps)
      const hasComplexEffect = card.effects.some(effect => 
        effect.effectText.toLowerCase().includes('reveal') ||
        effect.effectText.toLowerCase().includes('search') ||
        effect.effectText.toLowerCase().includes('if that card') ||
        effect.effectText.toLowerCase().includes('give up to')
      );
      
      if (hasComplexEffect) {
        setComplexEffectData({
          cardName: card.name,
          effectText: card.effects[0].effectText,
          steps: parseEffectSteps(card.effects[0].effectText)
        });
        setShowComplexEffectModal(true);
      } else {
        setShowEffectModal(true);
      }
    } else {
      onActivateEffect(card.id);
    }
  };

  const handleActivateEffect = (effectId: string) => {
    if (selectedCard) {
      onActivateEffect(selectedCard.id, effectId); // Pass both card ID and effect ID
    }
  };

  const parseEffectSteps = (effectText: string) => {
    const steps = [];
    const text = effectText.toLowerCase();
    
    // Parse "Reveal X card(s) from the top of your deck"
    if (text.includes('reveal') && text.includes('top of your deck')) {
      const revealMatch = text.match(/reveal (\d+)/);
      steps.push({
        type: 'reveal',
        count: revealMatch ? parseInt(revealMatch[1]) : 1,
        location: 'top_of_deck'
      });
    }
    
    // Parse "If that card's type includes X"
    if (text.includes('if that card') && text.includes('type includes')) {
      const typeMatch = text.match(/type includes "([^"]+)"/);
      if (typeMatch) {
        steps.push({
          type: 'condition',
          condition: 'card_type_includes',
          value: typeMatch[1]
        });
      }
    }
    
    // Parse "give up to X rested DON!! card"
    if (text.includes('give up to') && text.includes('rested don')) {
      const donMatch = text.match(/give up to (\d+)/);
      steps.push({
        type: 'attach_don',
        count: donMatch ? parseInt(donMatch[1]) : 1,
        condition: 'rested_only',
        target: 'character_or_leader'
      });
    }
    
    return steps;
  };

  const handleExecuteStep = (step: any, data?: any) => {
    console.log('Executing step:', step, 'with data:', data);
    // For now, just log the step execution
    // In a full implementation, this would send the step data to the backend
  };

  // Early return if game state is not ready
  if (!currentPlayer || !opponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-straw-hat-black via-gray-900 to-straw-hat-red text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
          <p className="text-gray-400">Preparing your battle!</p>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('GameBoard - Current Player ID:', currentPlayerId);
  console.log('GameBoard - Opponent ID:', opponentId);
  console.log('GameBoard - Current Player:', currentPlayer);
  console.log('GameBoard - Opponent:', opponent);
  console.log('GameBoard - Current Player Hand:', currentPlayer?.hand);
  console.log('GameBoard - Current Player Leader:', currentPlayer?.leader);
  console.log('GameBoard - Current Player Deck Length:', currentPlayer?.deck?.length);
  console.log('GameBoard - Opponent Deck Length:', opponent?.deck?.length);
  console.log('GameBoard - All Player IDs in gameState:', Object.keys(gameState.players));

      const renderCard = (card: GameCard, isInHand = false, isPlayable = true, isAttackable = false) => {
        return (
          <div
            className={`relative cursor-pointer transition-all duration-200 ${
              isInHand ? 'hover:scale-105 hover:z-10' : ''
            } ${selectedCard?.id === card.id ? 'ring-2 ring-blue-400' : ''} ${
              isAttackable ? 'ring-2 ring-red-400' : ''
            }`}
            onClick={() => handleCardClick(card)}
            onDoubleClick={() => handleCardDoubleClick(card)}
          >
        <Card className={`w-24 h-32 bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${
          isPlayable ? 'border-gray-600 hover:border-blue-400' : 'border-gray-500 opacity-75'
        } ${card.tapped ? 'opacity-60' : ''} ${card.summoningSickness ? 'ring-2 ring-orange-400' : ''}`}>
          <CardContent className="p-1 h-full flex flex-col">
            {/* Card Image */}
            <div className="flex-1 bg-gray-700 rounded mb-1 flex items-center justify-center">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.name || 'Card'}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="text-xs text-gray-400 text-center p-1">
                  {card.name || 'Unknown Card'}
                </div>
              )}
            </div>
            
            {/* Card Info */}
            <div className="text-xs space-y-1">
              <div className="font-bold text-white truncate" title={card.name || 'Unknown Card'}>
                {card.name || 'Unknown Card'}
              </div>
              
              {card.cardType === 'Leader' ? (
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">LEADER</Badge>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-blue-400">{card.cost || '?'}</span>
                  <span className="text-red-400">
                    {card.currentPower || card.power || '?'}
                    {(card.attachedDon || 0) > 0 && (
                      <span className="text-yellow-400 text-xs">+{(card.attachedDon || 0) * 1000}</span>
                    )}
                  </span>
                </div>
              )}
              
                  <div className="text-center">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        card.color === 'Red' ? 'border-red-500 text-red-400' :
                        card.color === 'Blue' ? 'border-blue-500 text-blue-400' :
                        card.color === 'Green' ? 'border-green-500 text-green-400' :
                        card.color === 'Purple' ? 'border-purple-500 text-purple-400' :
                        'border-yellow-500 text-yellow-400'
                      }`}
                    >
                      {card.color || 'Unknown'}
                    </Badge>
                    {card.tapped && (
                      <div className="text-xs text-orange-400 mt-1">RESTED</div>
                    )}
                    {!card.tapped && card.cardType !== 'Leader' && (
                      <div className="text-xs text-green-400 mt-1">ACTIVE</div>
                    )}
                  </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-straw-hat-black via-gray-900 to-straw-hat-red text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">One Piece TCG Battle</h1>
          <div className="flex justify-center gap-4 text-sm">
            <Badge variant="outline">Turn {gameState.turn}</Badge>
            <Badge variant="outline">Phase: {gameState.phase.toUpperCase()}</Badge>
            <Badge variant={gameState.currentPlayer === currentPlayerId ? "default" : "secondary"}>
              {gameState.currentPlayer === currentPlayerId ? "Your Turn" : "Opponent's Turn"}
            </Badge>
            {gameState.currentPlayer === currentPlayerId && (
              <Badge variant="outline">
                Available DON!!: {currentPlayer.donArea?.filter((don: any) => !don.tapped).length || 0}
                {gameState.turn === 1 && currentPlayer.isFirstTurn && (
                  <span className="ml-1 text-xs text-yellow-400">(First Turn)</span>
                )}
              </Badge>
            )}
          </div>
          
          {/* Phase Actions */}
          {gameState.currentPlayer === currentPlayerId && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="text-sm text-gray-300 mb-2">
                {gameState.phase === 'main' && (
                  <div>
                    🎮 Main Phase: Play cards, attack, and use effects
                    {gameState.turn === 1 && currentPlayer.isFirstTurn && (
                      <div className="text-xs text-yellow-400 mt-1">
                        (First Turn: You have 1 DON!! and cannot attack this turn)
                      </div>
                    )}
                  </div>
                )}
                {gameState.phase === 'end' && (
                  <div className="flex items-center gap-2">
                    <span>🏁</span>
                    <span>Ending turn...</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {gameState.phase === 'main' && (
                  <Button 
                    onClick={() => onNextPhase?.()}
                    className="btn-primary"
                    size="sm"
                  >
                    End Turn
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Opponent Area */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Opponent (Kenta)</h2>
                <div className="flex gap-2">
                  <Badge variant="destructive">Life: {opponent.life}</Badge>
                  <Badge variant="outline">Deck: {opponent.deck.length}</Badge>
                  <Badge variant="secondary">
                    DON!!: {opponent.donArea?.filter((don: any) => !don.tapped).length || 0}/{opponent.donArea?.length || 0}
                  </Badge>
                </div>
              </div>
            
            {/* Opponent Leader */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Leader</h3>
              <div className="flex justify-center">
                {opponent.leader && renderCard(opponent.leader, false, false, true)}
              </div>
            </div>
            
              {/* Opponent Characters */}
              <div ref={setOpponentFieldRef} className="min-h-32 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 p-4 mb-4">
                <h3 className="text-sm font-semibold mb-2">Characters ({opponent.characters?.length || 0})</h3>
                <div className="flex flex-wrap gap-2">
                  {(opponent.characters || []).map(card => {
                    // Can attack leaders or rested characters
                    const isAttackable = card.cardType === 'Leader' || card.tapped;
                    return renderCard(card, false, false, isAttackable);
                  })}
                </div>
              </div>
            
            {/* Opponent Stages */}
            <div className="min-h-16 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 p-4 mb-4">
              <h3 className="text-sm font-semibold mb-2">Stages ({opponent.stages?.length || 0})</h3>
              <div className="flex flex-wrap gap-2">
                {(opponent.stages || []).map(card => renderCard(card, false, false))}
              </div>
            </div>
            
            {/* Opponent DON!! Area */}
            <div className="min-h-16 bg-yellow-900/30 rounded-lg border-2 border-dashed border-yellow-600 p-4 mb-4">
              <h3 className="text-sm font-semibold mb-2">Opponent DON!! Area ({opponent.donArea?.length || 0}/10)</h3>
              <div className="flex flex-wrap gap-2">
                {(opponent.donArea || []).map((don, index) => (
                  <div 
                    key={index} 
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold ${
                      don.tapped 
                        ? 'bg-yellow-800 border-yellow-600 opacity-50' 
                        : 'bg-yellow-600 border-yellow-400'
                    }`}
                    title={don.tapped ? 'Used' : 'Available'}
                  >
                    DON
                  </div>
                ))}
              </div>
            </div>
            
            {/* Opponent Deck */}
            <div className="min-h-16 bg-blue-900/30 rounded-lg border-2 border-dashed border-blue-600 p-4">
              <h3 className="text-sm font-semibold mb-2">Opponent Deck</h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{opponent.deck.length}</div>
                  <div className="text-xs text-gray-400">Cards Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Player Area */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">You</h2>
              <div className="flex gap-2">
                <Badge variant="destructive">Life: {currentPlayer.life}</Badge>
                <Badge variant="outline">Deck: {currentPlayer.deck.length}</Badge>
              </div>
            </div>
            
            {/* Your Characters */}
            <div ref={setFieldRef} className="min-h-32 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 p-4 mb-4">
              <h3 className="text-sm font-semibold mb-2">Your Characters ({currentPlayer.characters?.length || 0})</h3>
              <div className="flex flex-wrap gap-2">
                {(currentPlayer.characters || []).map(card => renderCard(card, false, true))}
              </div>
            </div>
            
            {/* Your Stages */}
            <div className="min-h-16 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 p-4 mb-4">
              <h3 className="text-sm font-semibold mb-2">Your Stages ({currentPlayer.stages?.length || 0})</h3>
              <div className="flex flex-wrap gap-2">
                {(currentPlayer.stages || []).map(card => renderCard(card, false, true))}
              </div>
            </div>
            
            {/* DON!! Area */}
            <div className="min-h-16 bg-yellow-900/30 rounded-lg border-2 border-dashed border-yellow-600 p-4 mb-4">
              <h3 className="text-sm font-semibold mb-2">DON!! Area ({currentPlayer.donArea?.length || 0}/10)</h3>
              <div className="flex flex-wrap gap-2">
                {(currentPlayer.donArea || []).map((don, index) => (
                  <div 
                    key={index} 
                    className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                      don.tapped 
                        ? 'bg-yellow-800 border-yellow-600 opacity-50' 
                        : 'bg-yellow-600 border-yellow-400 hover:bg-yellow-500'
                    }`}
                    onClick={() => {
                      if (!don.tapped && selectedCard) {
                        onAttachDon?.(selectedCard.id, 1);
                      }
                    }}
                    title={don.tapped ? 'Used' : 'Click to attach to selected card'}
                  >
                    DON
                  </div>
                ))}
              </div>
            </div>
            
            {/* Your Leader */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Your Leader</h3>
              <div className="flex justify-center">
                {currentPlayer.leader && renderCard(currentPlayer.leader, false, true)}
              </div>
            </div>
            
            {/* Your Hand */}
            <div ref={setHandRef} className="min-h-32 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-600 p-4 mb-4">
              <h3 className="text-sm font-semibold mb-2">Your Hand ({currentPlayer.hand.length})</h3>
              <div className="flex flex-wrap gap-2">
                {currentPlayer.hand.map(card => renderCard(card, true, true))}
              </div>
            </div>
            
            {/* Your Deck */}
            <div className="min-h-16 bg-blue-900/30 rounded-lg border-2 border-dashed border-blue-600 p-4">
              <h3 className="text-sm font-semibold mb-2">Your Deck</h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{currentPlayer.deck.length}</div>
                  <div className="text-xs text-gray-400">Cards Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attack/Defense Interface */}
          {gameState.attackState && gameState.attackState.phase === 'defense' && (
            <div className="mt-8 p-6 bg-red-900/30 rounded-lg border-2 border-red-600">
              <h3 className="text-xl font-bold text-center mb-4 text-red-400">
                🛡️ DEFEND AGAINST ATTACK!
              </h3>
              <div className="text-center mb-4">
                <p className="text-white">
                  Opponent is attacking with <strong>{gameState.attackState.attackerPower}</strong> power!
                </p>
                <p className="text-gray-300 text-sm">
                  Choose your defense:
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Counter with DON!! */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-400">Counter with DON!!</h4>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min="0" 
                      max={currentPlayer.donArea?.filter((don: any) => !don.tapped).length || 0}
                      placeholder="DON!! to use"
                      className="flex-1 p-2 rounded bg-gray-800 text-white"
                      id="donCounter"
                    />
                    <Button 
                      onClick={() => {
                        const donUsed = parseInt((document.getElementById('donCounter') as HTMLInputElement)?.value || '0');
                        onDefend?.('counter', undefined, donUsed);
                      }}
                      className="btn-secondary"
                      size="sm"
                    >
                      Counter
                    </Button>
                  </div>
                </div>
                
                {/* Use Blocker Character */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-400">Use Blocker Character</h4>
                  <Button 
                    onClick={() => selectedCard && onDefend?.('blocker', selectedCard.id)}
                    disabled={!selectedCard || !currentPlayer.characters?.find(c => c.id === selectedCard.id)}
                    className="btn-secondary w-full"
                    size="sm"
                  >
                    Block with Selected
                  </Button>
                </div>
                
                {/* Use Effect Card */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-400">Use Effect Card</h4>
                  <Button 
                    onClick={() => selectedCard && onDefend?.('effect', selectedCard.id)}
                    disabled={!selectedCard || !currentPlayer.hand?.find(c => c.id === selectedCard.id)}
                    className="btn-secondary w-full"
                    size="sm"
                  >
                    Use Effect Card
                  </Button>
                </div>
                
                {/* Use Character Effect */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-400">Use Character Effect</h4>
                  <Button 
                    onClick={() => selectedCard && onDefend?.('character_effect', selectedCard.id)}
                    disabled={!selectedCard || !currentPlayer.characters?.find(c => c.id === selectedCard.id)}
                    className="btn-secondary w-full"
                    size="sm"
                  >
                    Use Character Effect
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Button 
                  onClick={() => onResolveAttack?.()}
                  className="btn-danger"
                >
                  No Defense - Take Damage
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4">
            <Button 
              onClick={() => selectedCard && onPlayCard(selectedCard.id)}
              disabled={
                !selectedCard || 
                gameState.currentPlayer !== currentPlayerId || 
                gameState.attackState ||
                gameState.phase !== 'main' ||
                (selectedCard.cost > 0 && (currentPlayer.donArea?.filter((don: any) => !don.tapped).length || 0) < selectedCard.cost)
              }
              className="btn-primary"
            >
              Play Selected Card
              {selectedCard && selectedCard.cost > 0 && (
                <span className="ml-2 text-xs">
                  (Cost: {selectedCard.cost} DON!!)
                </span>
              )}
            </Button>
            <Button 
              onClick={() => selectedCard && onAttack(selectedCard.id)}
              disabled={
                !selectedCard || 
                gameState.currentPlayer !== currentPlayerId || 
                !currentPlayer.canAttack || 
                gameState.attackState ||
                !currentPlayer.characters?.find(c => c.id === selectedCard.id) || // Only field characters can attack
                selectedCard.tapped // Cannot attack if already rested
              }
              className="btn-secondary"
            >
              Attack with Selected
              {selectedCard && !currentPlayer.characters?.find(c => c.id === selectedCard.id) && (
                <span className="ml-1 text-xs">(Must be in field)</span>
              )}
              {selectedCard && selectedCard.tapped && (
                <span className="ml-1 text-xs">(Already attacked)</span>
              )}
            </Button>
            <Button 
              onClick={() => {
                if (selectedCard && selectedCard.effects && selectedCard.effects.length > 0) {
                  setShowEffectModal(true);
                } else {
                  selectedCard && onActivateEffect(selectedCard.id);
                }
              }}
              disabled={!selectedCard || gameState.currentPlayer !== currentPlayerId || gameState.attackState}
              className="btn-secondary"
            >
              Activate Effect
              {selectedCard && selectedCard.effects && selectedCard.effects.length > 0 && (
                <span className="ml-1 text-xs">({selectedCard.effects.length})</span>
              )}
            </Button>
          </div>

          {/* Selected Card Info */}
          {selectedCard && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-bold mb-2">Selected Card: {selectedCard.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Type:</strong> {selectedCard.cardType}</p>
                  <p><strong>Cost:</strong> {selectedCard.cost}</p>
                  <p><strong>Power:</strong> {selectedCard.power}</p>
                </div>
                <div>
                  <p><strong>Color:</strong> {selectedCard.color}</p>
                  <p><strong>Attribute:</strong> {selectedCard.attribute}</p>
                  {selectedCard.effectText && (
                    <p><strong>Effect:</strong> {selectedCard.effectText}</p>
                  )}
                  {selectedCard.effects && selectedCard.effects.length > 0 && (
                    <div>
                      <p><strong>Effects:</strong></p>
                      {selectedCard.effects.map((effect, index) => (
                        <div key={index} className="text-xs mb-1 p-2 bg-gray-700 rounded">
                          <div className="font-semibold">{effect.effectType}</div>
                          <div>{effect.effectText}</div>
                          {effect.conditions && (
                            <div className="text-gray-400">({effect.conditions})</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

            {/* Effect Modal */}
            {selectedCard && (
              <EffectModal
                isOpen={showEffectModal}
                onClose={() => setShowEffectModal(false)}
                cardName={selectedCard.name}
                effects={selectedCard.effects || []}
                onActivateEffect={handleActivateEffect}
              />
            )}

            {/* Complex Effect Modal */}
            {complexEffectData && (
              <ComplexEffectModal
                isOpen={showComplexEffectModal}
                onClose={() => {
                  setShowComplexEffectModal(false);
                  setComplexEffectData(null);
                }}
                cardName={complexEffectData.cardName}
                effectText={complexEffectData.effectText}
                steps={complexEffectData.steps}
                onExecuteStep={handleExecuteStep}
                gameState={gameState}
                currentPlayerId={currentPlayerId}
              />
            )}
        </div>
      </div>
    </div>
  );
}
