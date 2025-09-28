'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EffectStep {
  type: string;
  count?: number;
  location?: string;
  condition?: string;
  value?: string;
  target?: string;
}

interface ComplexEffectModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  effectText: string;
  steps: EffectStep[];
  onExecuteStep: (step: EffectStep, data?: any) => void;
  gameState?: any;
  currentPlayerId?: string;
}

export default function ComplexEffectModal({ 
  isOpen, 
  onClose, 
  cardName, 
  effectText, 
  steps,
  onExecuteStep,
  gameState,
  currentPlayerId
}: ComplexEffectModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [revealedCards, setRevealedCards] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [stepData, setStepData] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setRevealedCards([]);
      setSelectedTarget(null);
      setStepData({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const player = gameState?.players?.[currentPlayerId];

  const handleNextStep = () => {
    if (currentStep) {
      onExecuteStep(currentStep, stepData);
    }
    
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
      setStepData({});
    }
  };

  const handleRevealCard = () => {
    if (player?.deck && player.deck.length > 0) {
      const revealedCard = player.deck[0];
      setRevealedCards([revealedCard]);
      setStepData({ ...stepData, revealedCard });
    }
  };

  const handleSelectTarget = (targetId: string) => {
    setSelectedTarget(targetId);
    setStepData({ ...stepData, targetId });
  };

  const renderStepContent = () => {
    if (!currentStep) return null;

    switch (currentStep.type) {
      case 'reveal':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reveal Card from Deck</h3>
            <p className="text-gray-300">
              Reveal {currentStep.count} card{currentStep.count > 1 ? 's' : ''} from the top of your deck.
            </p>
            
            {revealedCards.length === 0 ? (
              <Button onClick={handleRevealCard} className="btn-primary">
                Reveal Card
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-green-400">Revealed Card:</p>
                <div className="p-3 bg-gray-800 rounded border">
                  <div className="font-semibold">{revealedCards[0].name}</div>
                  <div className="text-sm text-gray-400">
                    {revealedCards[0].cardType} • {revealedCards[0].color}
                  </div>
                </div>
                <Button onClick={handleNextStep} className="btn-primary">
                  Continue
                </Button>
              </div>
            )}
          </div>
        );

      case 'condition':
        if (currentStep.condition === 'card_type_includes') {
          const revealedCard = stepData.revealedCard;
          const matchesCondition = revealedCard?.cardType?.includes(currentStep.value) || 
                                 revealedCard?.attribute?.includes(currentStep.value) ||
                                 revealedCard?.name?.includes(currentStep.value);
          
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Check Condition</h3>
              <p className="text-gray-300">
                Does the revealed card's type include "{currentStep.value}"?
              </p>
              
              {revealedCard && (
                <div className="p-3 bg-gray-800 rounded border">
                  <div className="font-semibold">{revealedCard.name}</div>
                  <div className="text-sm text-gray-400">
                    Type: {revealedCard.cardType} • Attribute: {revealedCard.attribute}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setStepData({ ...stepData, conditionMet: true });
                    handleNextStep();
                  }}
                  className={matchesCondition ? "btn-primary" : "btn-secondary"}
                  disabled={!revealedCard}
                >
                  {matchesCondition ? "Yes - Continue" : "Yes - Continue"}
                </Button>
                <Button 
                  onClick={() => {
                    setStepData({ ...stepData, conditionMet: false });
                    handleNextStep();
                  }}
                  variant="outline"
                  disabled={!revealedCard}
                >
                  No - Skip Effect
                </Button>
              </div>
            </div>
          );
        }
        break;

      case 'attach_don':
        const availableTargets = [
          ...(player?.characters || []).map((char: any) => ({ id: char.id, name: char.name, type: 'Character' })),
          ...(player?.leader ? [{ id: player.leader.id, name: player.leader.name, type: 'Leader' }] : [])
        ];

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Attach DON!!</h3>
            <p className="text-gray-300">
              Choose a character or leader to attach {currentStep.count} DON!! to.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {availableTargets.map(target => (
                <div
                  key={target.id}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    selectedTarget === target.id
                      ? 'border-blue-400 bg-blue-500/20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                  onClick={() => handleSelectTarget(target.id)}
                >
                  <div className="font-semibold">{target.name}</div>
                  <div className="text-sm text-gray-400">{target.type}</div>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleNextStep}
              disabled={!selectedTarget}
              className="btn-primary"
            >
              Attach DON!!
            </Button>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Search Deck</h3>
            <p className="text-gray-300">
              Search your deck for a card.
            </p>
            <Button onClick={handleNextStep} className="btn-primary">
              Search Deck
            </Button>
          </div>
        );

      case 'discard':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Discard Cards</h3>
            <p className="text-gray-300">
              Discard {currentStep.count} card{currentStep.count > 1 ? 's' : ''} from your hand.
            </p>
            <Button onClick={handleNextStep} className="btn-primary">
              Discard Cards
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Execute Effect</h3>
            <p className="text-gray-300">{effectText}</p>
            <Button onClick={handleNextStep} className="btn-primary">
              Execute
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            {cardName} - Complex Effect
          </CardTitle>
          <CardDescription className="text-gray-300">
            Step {currentStepIndex + 1} of {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-800 rounded border">
            <p className="text-sm text-gray-300">{effectText}</p>
          </div>
          
          {renderStepContent()}
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={onClose}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
