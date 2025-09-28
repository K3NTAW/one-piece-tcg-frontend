'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CardEffect {
  id: string;
  effectType: string;
  effectText: string;
  conditions?: string;
  cost?: number;
}

interface EffectModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  effects: CardEffect[];
  onActivateEffect: (effectId: string) => void;
}

export default function EffectModal({ 
  isOpen, 
  onClose, 
  cardName, 
  effects, 
  onActivateEffect 
}: EffectModalProps) {
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivate = () => {
    if (selectedEffect) {
      onActivateEffect(selectedEffect);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Activate Effect - {cardName}</CardTitle>
          <CardDescription className="text-gray-300">
            Choose an effect to activate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {effects.map((effect, index) => (
            <div
              key={effect.id || index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedEffect === (effect.id || index.toString())
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => setSelectedEffect(effect.id || index.toString())}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant={
                        effect.effectType === 'Activate' ? 'default' :
                        effect.effectType === 'Trigger' ? 'secondary' :
                        effect.effectType === 'Counter' ? 'destructive' :
                        'outline'
                      }
                    >
                      {effect.effectType}
                    </Badge>
                    {effect.cost && effect.cost > 0 && (
                      <Badge variant="outline">
                        Cost: {effect.cost}
                      </Badge>
                    )}
                  </div>
                  <p className="text-white mb-2">{effect.effectText}</p>
                  {effect.conditions && (
                    <p className="text-sm text-gray-400">
                      <strong>Conditions:</strong> {effect.conditions}
                    </p>
                  )}
                </div>
                {selectedEffect === (effect.id || index.toString()) && (
                  <div className="text-blue-400 text-2xl">✓</div>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleActivate}
              disabled={!selectedEffect}
              className="btn-primary flex-1"
            >
              Activate Selected Effect
            </Button>
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
