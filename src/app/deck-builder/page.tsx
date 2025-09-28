'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface OnePieceCard {
  id: string;
  apiId: string;
  name: string;
  rarity: string;
  cardType: string;
  cost?: number;
  power?: number;
  color: string;
  effectText?: string;
  imageUrl?: string;
  smallImageUrl?: string;
  set: {
    id: string;
    name: string;
  };
}

interface DeckCard {
  id: string;
  card: OnePieceCard;
  quantity: number;
}

interface Deck {
  id?: string;
  name: string;
  description: string;
  leader?: OnePieceCard;
  cards: DeckCard[];
  isPublic: boolean;
}

const deckSchema = z.object({
  name: z.string().min(1, 'Deck name is required').max(50, 'Deck name too long'),
  description: z.string().max(200, 'Description too long'),
  isPublic: z.boolean(),
});

// Leader Drop Zone Component
function LeaderDropZone({ leader, onRemove }: { leader?: OnePieceCard; onRemove: () => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'leader-area',
  });

  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[120px] transition-colors ${
        isOver ? 'bg-straw-hat-red/20 border-straw-hat-red' : ''
      }`}
    >
      {leader ? (
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-16 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded flex items-center justify-center relative overflow-hidden">
              <img 
                src={leader.smallImageUrl || leader.imageUrl} 
                alt={leader.name} 
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                <span className="text-lg">⚔️</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-semibold text-sm">{leader.name}</h4>
              <p className="text-gray-400 text-xs">{leader.cardType}</p>
            </div>
            <Button
              type="button"
              onClick={onRemove}
              className="btn-danger text-xs px-2 py-1"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className={`text-center py-8 text-gray-400 border-2 border-dashed rounded-lg transition-colors ${
          isOver 
            ? 'border-straw-hat-red bg-straw-hat-red/10' 
            : 'border-gray-600 hover:border-straw-hat-red'
        }`}>
          <div className="text-4xl mb-2">👑</div>
          <p className="text-sm">No leader selected</p>
          <p className="text-xs">Drag a leader card here</p>
        </div>
      )}
    </div>
  );
}

export default function DeckBuilderPage() {
  const { isAuthenticated } = useAuth();
  const [allCards, setAllCards] = useState<OnePieceCard[]>([]);
  const [deck, setDeck] = useState<Deck>({
    name: '',
    description: '',
    cards: [],
    isPublic: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCard, setActiveCard] = useState<OnePieceCard | null>(null);
  const [filters, setFilters] = useState({
    rarities: [],
    types: [],
    colors: [],
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      name: deck.name,
      description: deck.description,
      isPublic: deck.isPublic,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchCards();
      fetchFilters();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCards();
  }, [searchQuery, selectedRarity, selectedType, selectedColor]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedRarity) params.append('rarity', selectedRarity);
      if (selectedType) params.append('type', selectedType);
      if (selectedColor) params.append('color', selectedColor);

      const response = await fetch(`http://localhost:3001/cards?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAllCards(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const response = await fetch('http://localhost:3001/cards/filters');
      if (response.ok) {
        const data = await response.json();
        setFilters(data);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const addCardToDeck = (card: OnePieceCard) => {
    setDeck(prev => {
      const existingCard = prev.cards.find(dc => dc.card.id === card.id);
      
      if (existingCard) {
        // Increase quantity if card already exists
        return {
          ...prev,
          cards: prev.cards.map(dc => 
            dc.card.id === card.id 
              ? { ...dc, quantity: Math.min(dc.quantity + 1, 4) } // Max 4 copies
              : dc
          )
        };
      } else {
        // Add new card to deck
        return {
          ...prev,
          cards: [...prev.cards, { id: `${card.id}-${Date.now()}`, card, quantity: 1 }]
        };
      }
    });
  };

  const removeCardFromDeck = (deckCardId: string) => {
    setDeck(prev => ({
      ...prev,
      cards: prev.cards.filter(dc => dc.id !== deckCardId)
    }));
  };

  const updateCardQuantity = (deckCardId: string, quantity: number) => {
    if (quantity <= 0) {
      removeCardFromDeck(deckCardId);
      return;
    }

    setDeck(prev => ({
      ...prev,
      cards: prev.cards.map(dc => 
        dc.id === deckCardId 
          ? { ...dc, quantity: Math.min(quantity, 4) }
          : dc
      )
    }));
  };

  const setLeader = (card: OnePieceCard) => {
    if (card.cardType === 'Leader') {
      setDeck(prev => ({ ...prev, leader: card }));
    }
  };

  const getDeckStats = () => {
    const totalCards = deck.cards.reduce((sum, dc) => sum + dc.quantity, 0);
    const colorDistribution = deck.cards.reduce((acc, dc) => {
      acc[dc.card.color] = (acc[dc.card.color] || 0) + dc.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    const costDistribution = deck.cards.reduce((acc, dc) => {
      const cost = dc.card.cost || 0;
      acc[cost] = (acc[cost] || 0) + dc.quantity;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalCards,
      colorDistribution,
      costDistribution,
      isValid: totalCards >= 50 && totalCards <= 60 && deck.leader,
      hasLeader: !!deck.leader,
    };
  };

  const deckStats = getDeckStats();

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id as string;
    const card = allCards.find(c => c.id === cardId);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (over && over.id === 'deck-area') {
      const card = allCards.find(c => c.id === active.id);
      if (card) {
        addCardToDeck(card);
      }
    } else if (over && over.id === 'leader-area') {
      const card = allCards.find(c => c.id === active.id);
      if (card && card.cardType === 'Leader') {
        setLeader(card);
      } else if (card && card.cardType !== 'Leader') {
        // Show feedback that only Leader cards can be dropped here
        alert('Only Leader cards can be set as deck leaders!');
      }
    }
  };

  const onSubmit = async (data: any) => {
    if (!deckStats.isValid) {
      alert('Deck must have 50-60 cards and a leader!');
      return;
    }

    setSaving(true);
    try {
      const deckData = {
        ...data,
        leaderId: deck.leader?.id,
        cards: deck.cards.map(dc => ({
          cardId: dc.card.id,
          quantity: dc.quantity,
        })),
      };

      const response = await fetch('http://localhost:3001/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(deckData),
      });

      if (response.ok) {
        alert('Deck saved successfully!');
        // Reset deck
        setDeck({
          name: '',
          description: '',
          cards: [],
          isPublic: false,
        });
      } else {
        alert('Failed to save deck');
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('Error saving deck');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please log in to build decks.</p>
          <Button asChild className="btn-primary">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Deck Builder ⚔️
            </h1>
            <p className="text-gray-300">
              Create and customize your One Piece TCG decks
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card Browser */}
            <div className="lg:col-span-2">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-white">Card Browser</CardTitle>
                  <CardDescription className="text-gray-300">
                    Search and add cards to your deck
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search and Filters */}
                  <div className="space-y-4 mb-6">
                    <input
                      type="text"
                      placeholder="Search cards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={selectedRarity}
                        onChange={(e) => setSelectedRarity(e.target.value)}
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                      >
                        <option value="">All Rarities</option>
                        {filters.rarities.map((rarity) => (
                          <option key={rarity} value={rarity}>{rarity}</option>
                        ))}
                      </select>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                      >
                        <option value="">All Types</option>
                        {filters.types.map((type) => (
                          <option key={type} value={type}>
                            {type === 'Leader' ? `👑 ${type}` : type}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                      >
                        <option value="">All Colors</option>
                        {filters.colors.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Card Grid */}
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="text-white">Loading cards...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                      {allCards.map((card) => (
                        <div
                          key={card.id}
                          draggable
                          className={`cursor-grab active:cursor-grabbing ${
                            card.cardType === 'Leader' ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
                          }`}
                          onClick={() => {
                            if (card.cardType === 'Leader') {
                              setLeader(card);
                            } else {
                              addCardToDeck(card);
                            }
                          }}
                        >
                          <Card className={`bg-white/10 backdrop-blur-sm border-white/20 card-hover ${
                            card.cardType === 'Leader' ? 'border-yellow-400' : ''
                          }`}>
                            <CardContent className="p-3">
                              <div className="aspect-[3/4] bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                                <img 
                                  src={card.smallImageUrl || card.imageUrl} 
                                  alt={card.name}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded-lg" style={{ display: 'none' }}>
                                  <div className="text-center">
                                    <span className="text-4xl mb-2">⚔️</span>
                                    <p className="text-white text-xs font-semibold">{card.name}</p>
                                  </div>
                                </div>
                              </div>
                              <h3 className="text-white font-semibold text-xs mb-1 truncate">{card.name}</h3>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-gray-400 text-xs">{card.cardType}</p>
                                {card.cardType === 'Leader' && (
                                  <span className="text-yellow-400 text-xs font-bold">👑</span>
                                )}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-bold ${
                                  card.rarity === 'Common' ? 'text-gray-400' :
                                  card.rarity === 'Uncommon' ? 'text-green-400' :
                                  card.rarity === 'Rare' ? 'text-blue-400' :
                                  card.rarity === 'Super Rare' ? 'text-purple-400' :
                                  card.rarity === 'Secret Rare' ? 'text-yellow-400' :
                                  'text-white'
                                }`}>
                                  {card.rarity}
                                </span>
                                <span className="text-white text-xs">{card.color}</span>
                              </div>
                              {card.cost && (
                                <div className="mt-1 text-center">
                                  <span className="text-gray-400 text-xs">Cost: {card.cost}</span>
                                  {card.power && <span className="text-gray-400 text-xs ml-1">Power: {card.power}</span>}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Deck Builder */}
            <div className="lg:col-span-1">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Deck Info */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Deck Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <input
                        {...register('name')}
                        placeholder="Deck name"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                      />
                      {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <textarea
                        {...register('description')}
                        placeholder="Deck description"
                        rows={3}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                      />
                      {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        {...register('isPublic')}
                        type="checkbox"
                        className="rounded"
                      />
                      <label className="text-white text-sm">Make deck public</label>
                    </div>
                  </CardContent>
                </Card>

                {/* Leader */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Leader</CardTitle>
                    <CardDescription className="text-gray-300">
                      Select a leader card (required)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeaderDropZone 
                      leader={deck.leader}
                      onRemove={() => setDeck(prev => ({ ...prev, leader: undefined }))}
                    />
                  </CardContent>
                </Card>

                {/* Deck List */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Deck List</CardTitle>
                    <CardDescription className="text-gray-300">
                      {deckStats.totalCards}/60 cards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SortableContext items={deck.cards.map(dc => dc.id)} strategy={verticalListSortingStrategy}>
                      <div id="deck-area" className="space-y-2 max-h-64 overflow-y-auto">
                        {deck.cards.map((deckCard) => (
                          <div key={deckCard.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                            <div className="w-8 h-10 bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded flex items-center justify-center relative overflow-hidden">
                              <img 
                                src={deckCard.card.smallImageUrl || deckCard.card.imageUrl} 
                                alt={deckCard.card.name} 
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                                <span className="text-xs">⚔️</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-semibold text-xs truncate">{deckCard.card.name}</h4>
                              <p className="text-gray-400 text-xs">{deckCard.card.cardType}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                onClick={() => updateCardQuantity(deckCard.id, deckCard.quantity - 1)}
                                className="btn-secondary text-xs px-2 py-1"
                              >
                                -
                              </Button>
                              <span className="text-white text-sm w-6 text-center">{deckCard.quantity}</span>
                              <Button
                                type="button"
                                onClick={() => updateCardQuantity(deckCard.id, deckCard.quantity + 1)}
                                className="btn-secondary text-xs px-2 py-1"
                              >
                                +
                              </Button>
                              <Button
                                type="button"
                                onClick={() => removeCardFromDeck(deckCard.id)}
                                className="btn-danger text-xs px-2 py-1"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                        {deck.cards.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <div className="text-4xl mb-2">📚</div>
                            <p className="text-sm">No cards in deck</p>
                            <p className="text-xs">Drag cards here or click to add</p>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </CardContent>
                </Card>

                {/* Deck Stats */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Deck Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Total Cards:</span>
                      <span className={`text-sm font-semibold ${deckStats.totalCards >= 50 && deckStats.totalCards <= 60 ? 'text-green-400' : 'text-red-400'}`}>
                        {deckStats.totalCards}/60
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Leader:</span>
                      <span className={`text-sm font-semibold ${deckStats.hasLeader ? 'text-green-400' : 'text-red-400'}`}>
                        {deckStats.hasLeader ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Status:</span>
                      <span className={`text-sm font-semibold ${deckStats.isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {deckStats.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    {Object.keys(deckStats.colorDistribution).length > 0 && (
                      <div>
                        <p className="text-gray-300 text-sm mb-2">Color Distribution:</p>
                        <div className="space-y-1">
                          {Object.entries(deckStats.colorDistribution).map(([color, count]) => (
                            <div key={color} className="flex justify-between text-xs">
                              <span className="text-gray-400">{color}:</span>
                              <span className="text-white">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Save Button */}
                <Button
                  type="submit"
                  disabled={!deckStats.isValid || saving}
                  className="w-full btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Deck'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <Card className="bg-white/20 backdrop-blur-sm border-white/40 card-hover">
            <CardContent className="p-3">
              <div className="aspect-[3/4] bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={activeCard.smallImageUrl || activeCard.imageUrl} 
                  alt={activeCard.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded-lg" style={{ display: 'none' }}>
                  <span className="text-2xl">⚔️</span>
                </div>
              </div>
              <h3 className="text-white font-semibold text-xs mb-1 truncate">{activeCard.name}</h3>
              <p className="text-gray-400 text-xs">{activeCard.cardType}</p>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
