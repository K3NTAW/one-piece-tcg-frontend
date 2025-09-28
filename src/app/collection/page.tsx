'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface OnePieceCard {
  id: string;
  name: string;
  rarity: string;
  cardType: string;
  cost?: number;
  power?: number;
  color: string;
  effectText?: string;
  imageUrl?: string;
  smallImageUrl?: string;
  largeImageUrl?: string;
  setName: string;
}

interface ApiResponse {
  data: OnePieceCard[];
  count: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function CollectionPage() {
  const { isAuthenticated } = useAuth();
  const [cards, setCards] = useState<OnePieceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [filters, setFilters] = useState({
    rarities: [],
    types: [],
    colors: [],
    sets: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchCards();
      fetchFilters();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCards();
    }
  }, [searchQuery, selectedRarity, selectedType, pagination.page]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '24'
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedRarity) params.append('rarity', selectedRarity);
      if (selectedType) params.append('type', selectedType);

      const response = await fetch(`http://localhost:3001/cards?${params}`);
      if (response.ok) {
        const data: ApiResponse = await response.json();
        setCards(data.data);
        setPagination(prev => ({
          ...prev,
          totalPages: data.totalPages,
          totalCount: data.totalCount
        }));
      } else {
        console.error('Failed to fetch cards');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'rarity') {
      setSelectedRarity(value);
    } else if (filterType === 'type') {
      setSelectedType(value);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRarity('');
    setSelectedType('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please log in to view your collection.</p>
          <Button asChild className="btn-primary">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
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
            Your Card Collection 📚
          </h1>
          <p className="text-gray-300">
            Browse and manage your One Piece TCG cards
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedRarity}
                  onChange={(e) => handleFilterChange('rarity', e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                >
                  <option value="">All Rarities</option>
                  {filters.rarities.map((rarity) => (
                    <option key={rarity} value={rarity}>{rarity}</option>
                  ))}
                </select>
                <select 
                  value={selectedType}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-straw-hat-red"
                >
                  <option value="">All Types</option>
                  {filters.types.map((type) => (
                    <option key={type} value={type}>
                      {type === 'Leader' ? `👑 ${type}` : type}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={clearFilters} className="btn-secondary">
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Collection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{pagination.totalCount}</div>
              <div className="text-gray-300 text-sm">Total Cards</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-straw-hat-red mb-2">
                {cards.filter(card => card.rarity === 'Rare' || card.rarity === 'Super Rare' || card.rarity === 'Secret Rare').length}
              </div>
              <div className="text-gray-300 text-sm">Rare Cards</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-straw-hat-blue mb-2">
                {cards.filter(card => card.cardType === 'Leader').length}
              </div>
              <div className="text-gray-300 text-sm">Leaders</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {filters.rarities.length > 0 ? Math.round((cards.length / pagination.totalCount) * 100) : 0}%
              </div>
              <div className="text-gray-300 text-sm">Collection Complete</div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-white text-xl">Loading cards...</div>
          </div>
        )}

        {/* Card Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {cards.map((card) => (
              <Card key={card.id} className={`bg-white/10 backdrop-blur-sm border-white/20 card-hover ${
                card.cardType === 'Leader' ? 'border-yellow-400' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="aspect-[3/4] bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={card.smallImageUrl || card.imageUrl} 
                      alt={card.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-straw-hat-red to-straw-hat-blue rounded-lg" style={{ display: 'none' }}>
                      <div className="text-center">
                        <span className="text-4xl mb-2">⚔️</span>
                        <p className="text-white text-xs font-semibold">{card.name}</p>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 truncate">{card.name}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-xs">{card.cardType} • {card.setName || 'Unknown Set'}</p>
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
                    <div className="mt-2 text-center">
                      <span className="text-yellow-400 text-xs font-bold">LEADER CARD</span>
                    </div>
                  ) : card.cost && (
                    <div className="mt-2 text-center">
                      <span className="text-gray-400 text-xs">Cost: {card.cost}</span>
                      {card.power && <span className="text-gray-400 text-xs ml-2">Power: {card.power}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Cards State */}
        {!loading && cards.length === 0 && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-white mb-2">No Cards Found</h3>
              <p className="text-gray-300 mb-6">
                {searchQuery || selectedRarity || selectedType 
                  ? 'Try adjusting your search or filters.'
                  : 'No cards available at the moment.'
                }
              </p>
              {(searchQuery || selectedRarity || selectedType) && (
                <Button onClick={clearFilters} className="btn-primary">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {!loading && cards.length > 0 && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn-secondary"
            >
              Previous
            </Button>
            <span className="text-white">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="btn-secondary"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
