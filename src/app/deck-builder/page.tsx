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
import { useSearchParams, useRouter } from 'next/navigation';
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
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'flex';
                  }
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
          <p className="text-xs">Click a leader card to select</p>
        </div>
      )}
    </div>
  );
}

export default function DeckBuilderPage() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const editDeckId = searchParams.get('edit');
  
  const [allCards, setAllCards] = useState<OnePieceCard[]>([]);
  const [deck, setDeck] = useState<Deck>({
    id: undefined,
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
  const [isEditing, setIsEditing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importName, setImportName] = useState('');

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
      if (editDeckId) {
        fetchDeckForEdit(editDeckId);
      }
    }
  }, [isAuthenticated, editDeckId]);

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

  const fetchDeckForEdit = async (deckId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3001/decks/${deckId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const deckData = await response.json();
        setIsEditing(true);
        
        // Transform the deck data to match our interface
        const transformedDeck: Deck = {
          id: deckData.id,
          name: deckData.name,
          description: deckData.description || '',
          isPublic: deckData.isPublic,
          cards: deckData.cards.map((dc: any) => ({
            id: dc.id,
            card: {
              id: dc.card.id,
              apiId: dc.card.apiId || dc.card.id,
              name: dc.card.name,
              rarity: dc.card.rarity,
              cardType: dc.card.cardType,
              cost: dc.card.cost,
              power: dc.card.power,
              color: dc.card.color,
              effectText: dc.card.effectText,
              imageUrl: dc.card.imageUrl,
              smallImageUrl: dc.card.smallImageUrl,
              set: {
                id: dc.card.setName || 'Unknown',
                name: dc.card.setName || 'Unknown Set'
              }
            },
            quantity: dc.quantity
          })),
          leader: deckData.leader ? {
            id: deckData.leader.id,
            apiId: deckData.leader.apiId || deckData.leader.id,
            name: deckData.leader.name,
            rarity: deckData.leader.rarity,
            cardType: deckData.leader.cardType,
            cost: deckData.leader.cost,
            power: deckData.leader.power,
            color: deckData.leader.color,
            effectText: deckData.leader.effectText,
            imageUrl: deckData.leader.imageUrl,
            smallImageUrl: deckData.leader.smallImageUrl,
            set: {
              id: deckData.leader.setName || 'Unknown',
              name: deckData.leader.setName || 'Unknown Set'
            }
          } : undefined
        };

        setDeck(transformedDeck);
        
        // Update form values
        setValue('name', transformedDeck.name);
        setValue('description', transformedDeck.description);
        setValue('isPublic', transformedDeck.isPublic);
      } else {
        console.error('Failed to fetch deck for editing');
      }
    } catch (error) {
      console.error('Error fetching deck for editing:', error);
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

      const url = isEditing && deck.id 
        ? `http://localhost:3001/decks/${deck.id}`
        : 'http://localhost:3001/decks';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(deckData),
      });

      if (response.ok) {
        alert(isEditing ? 'Deck updated successfully!' : 'Deck saved successfully!');
        // Redirect to decks page after successful save/update
        router.push('/decks');
      } else {
        alert(isEditing ? 'Failed to update deck' : 'Failed to save deck');
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      alert('Error saving deck');
    } finally {
      setSaving(false);
    }
  };

  const handleExportDeck = async () => {
    if (!deck.id) {
      alert('Please save the deck first before exporting');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3001/decks/export/${deck.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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

  const handleImportDeck = async () => {
    if (!importText.trim()) {
      alert('Please paste a deck list');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/decks/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          deckList: importText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set the deck name (use parsed name or custom name)
        const deckName = importName || data.deckName || 'Imported Deck';
        setDeck(prev => ({ ...prev, name: deckName }));
        
        // Set the leader
        if (data.leader) {
          setDeck(prev => ({ ...prev, leader: data.leader }));
        }
        
        // Set the cards
        const deckCards = data.cards.map((dc: any, index: number) => ({
          id: `imported-${index}`, // Generate temporary ID
          card: dc.card,
          quantity: dc.quantity
        }));
        
        setDeck(prev => ({ ...prev, cards: deckCards }));
        
        alert(`Deck parsed successfully! Found ${data.foundCards} cards, ${data.notFoundCards} cards not found. You can now review and save the deck.`);
        
        setShowImportModal(false);
        setImportText('');
        setImportName('');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to parse deck list');
      }
    } catch (error) {
      console.error('Error importing deck:', error);
      alert('Error importing deck');
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
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" className="btn-secondary">
                <Link href={isEditing ? "/decks" : "/dashboard"}>
                  ← Back to {isEditing ? "My Decks" : "Dashboard"}
                </Link>
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {isEditing ? 'Edit Deck' : 'Deck Builder'} ⚔️
            </h1>
            <p className="text-gray-300">
              {isEditing ? `Editing "${deck.name}"` : 'Create and customize your One Piece TCG decks'}
            </p>
          </div>

          {/* Import/Export Section */}
          <div className="mb-6 flex gap-4">
            <Button
              type="button"
              onClick={handleExportDeck}
              disabled={!deck.leader || deck.cards.length === 0}
              className="btn-secondary"
            >
              📤 Export Deck List
            </Button>
            <Button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="btn-secondary"
            >
              📥 Import Deck List
            </Button>
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
                              {card.cardType === 'Leader' ? (
                                <div className="mt-1 text-center">
                                  <span className="text-yellow-400 text-xs font-bold">LEADER CARD</span>
                                </div>
                              ) : card.cost && (
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
                <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${!deck.leader ? 'border-yellow-400/50 bg-yellow-400/5' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      👑 Leader Card
                      {!deck.leader && <span className="text-yellow-400 text-sm">(Required)</span>}
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      {deck.leader ? 'Leader card selected' : 'Click a leader card to select - this is required for your deck'}
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
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>Deck Cards</span>
                      <span className={`text-lg font-bold ${deckStats.totalCards >= 50 && deckStats.totalCards <= 60 ? 'text-green-400' : 'text-red-400'}`}>
                        {deckStats.totalCards}/50
                      </span>
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      {deckStats.totalCards < 50 ? `Need ${50 - deckStats.totalCards} more cards` : 
                       deckStats.totalCards > 60 ? `Remove ${deckStats.totalCards - 60} cards` :
                       'Deck size is valid'}
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
                            <p className="text-sm font-medium">No cards in deck</p>
                            <p className="text-xs">Drag cards here or click to add (need 50 total)</p>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </CardContent>
                </Card>

                {/* Deck Stats */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Deck Requirements</CardTitle>
                    <CardDescription className="text-gray-300 text-sm">
                      Build a deck with exactly 50 cards + 1 leader
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Card Count */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm font-medium">Cards (50 required):</span>
                        <span className={`text-lg font-bold ${deckStats.totalCards >= 50 && deckStats.totalCards <= 60 ? 'text-green-400' : 'text-red-400'}`}>
                          {deckStats.totalCards}/50
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            deckStats.totalCards >= 50 ? 'bg-green-400' : 
                            deckStats.totalCards >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min((deckStats.totalCards / 50) * 100, 100)}%` }}
                        ></div>
                      </div>
                      {deckStats.totalCards < 50 && (
                        <p className="text-red-400 text-xs">
                          Need {50 - deckStats.totalCards} more cards
                        </p>
                      )}
                      {deckStats.totalCards > 60 && (
                        <p className="text-red-400 text-xs">
                          Too many cards! Remove {deckStats.totalCards - 60} cards
                        </p>
                      )}
                    </div>

                    {/* Leader Requirement */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm font-medium">Leader (1 required):</span>
                        <span className={`text-lg font-bold ${deckStats.hasLeader ? 'text-green-400' : 'text-red-400'}`}>
                          {deckStats.hasLeader ? '✓' : '✗'}
                        </span>
                      </div>
                      {!deckStats.hasLeader && (
                        <p className="text-red-400 text-xs">
                          Click a leader card to select it
                        </p>
                      )}
                    </div>

                    {/* Overall Status */}
                    <div className="pt-2 border-t border-white/20">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm font-medium">Deck Status:</span>
                        <span className={`text-lg font-bold ${deckStats.isValid ? 'text-green-400' : 'text-red-400'}`}>
                          {deckStats.isValid ? 'Ready to Save!' : 'Not Ready'}
                        </span>
                      </div>
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
                  {saving ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Deck' : 'Save Deck')}
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Import Deck List</CardTitle>
              <CardDescription className="text-gray-300">
                Paste a deck list in the format below to import a deck
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Deck Name (Optional)
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="Enter custom deck name"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Deck List
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste deck list here..."
                  rows={15}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-straw-hat-red font-mono text-sm"
                />
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <p className="text-gray-300 text-sm mb-2">Expected format:</p>
                <pre className="text-gray-400 text-xs whitespace-pre-wrap">
{`****** One Piece TCG Deck List ******

Deck Name: My Deck
Description: A great deck

##Leader - 1

* 1 Monkey.D.Luffy OP-01 001

##Characters - 20

* 4 Roronoa Zoro OP-01 002
* 3 Nami OP-01 003
...`}
                </pre>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleImportDeck}
                  disabled={!importText.trim()}
                  className="btn-primary flex-1"
                >
                  Import Deck
                </Button>
                <Button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText('');
                    setImportName('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DndContext>
  );
}
